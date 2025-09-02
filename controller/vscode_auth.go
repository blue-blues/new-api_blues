package controller

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/model"
)

type VSCodeAuthInitRequest struct {
	ClientName string `json:"client_name"`
	Version    string `json:"version"`
	Provider   string `json:"provider,omitempty"`   // "local", "coder", etc.
	CoderURL   string `json:"coder_url,omitempty"`  // Required if provider is "coder"
}

// InitVSCodeAuth initializes a VSCode authentication session
func InitVSCodeAuth(c *gin.Context) {
	var req VSCodeAuthInitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Invalid request parameters",
		})
		return
	}

	// Validate client name and version
	if req.ClientName == "" {
		req.ClientName = "VSCode Extension"
	}
	if req.Version == "" {
		req.Version = "1.0.0"
	}

	// Default to local provider if not specified
	if req.Provider == "" {
		req.Provider = "local"
	}

	// Handle external provider (Coder)
	if req.Provider == "coder" {
		if req.CoderURL == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "Coder URL is required for Coder provider",
			})
			return
		}
		
		// Delegate to Coder auth handler
		c.Set("coder_url", req.CoderURL)
		InitCoderAuth(c)
		return
	}

	// Handle local provider (existing flow)
	if req.Provider != "local" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Unsupported provider: " + req.Provider,
		})
		return
	}

	// Generate unique session ID
	sessionID := model.GenerateVSCodeSessionID()
	
	// Create auth session
	session := &model.VSCodeAuthSession{
		ID:          sessionID,
		Status:      "pending",
		ClientName:  req.ClientName,
		Version:     req.Version,
		Provider:    "local",
		CreatedTime: time.Now().Unix(),
		ExpiresAt:   time.Now().Add(10 * time.Minute).Unix(),
	}

	// Store session
	if err := model.StoreVSCodeAuthSession(session); err != nil {
		logger.SysError(fmt.Sprintf("Failed to store VSCode auth session: %v", err))
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Failed to create authentication session",
		})
		return
	}

	// Build auth URL - use the base server address from config
	baseURL := config.ServerAddress
	if baseURL == "" {
		// Fallback to request host if not configured
		scheme := "http"
		if c.Request.TLS != nil {
			scheme = "https"
		}
		baseURL = fmt.Sprintf("%s://%s", scheme, c.Request.Host)
	}
	
	authURL := fmt.Sprintf("%s/login?source=vscode&session_id=%s", baseURL, sessionID)

	logger.SysLog(fmt.Sprintf("Created VSCode auth session: %s for client: %s v%s", sessionID, req.ClientName, req.Version))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"session_id":       sessionID,
			"auth_url":        authURL,
			"expires_in":      600,
			"polling_interval": 2,
		},
	})
}

// GetVSCodeAuthStatus retrieves the status of a VSCode authentication session
func GetVSCodeAuthStatus(c *gin.Context) {
	sessionID := c.Param("session_id")
	
	if sessionID == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Session ID is required",
			"error":   "missing_session_id",
		})
		return
	}
	
	session, err := model.GetVSCodeAuthSession(sessionID)
	if err != nil {
		logger.SysLog(fmt.Sprintf("VSCode auth session lookup failed for %s: %v", sessionID, err))
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Invalid or expired session",
			"error":   "session_not_found",
		})
		return
	}

	// Check if expired (additional safety check)
	if time.Now().Unix() > session.ExpiresAt {
		model.DeleteVSCodeAuthSession(sessionID)
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Authentication session expired",
			"error":   "session_expired",
		})
		return
	}

	if session.Status == "pending" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"status":  "pending",
				"message": "Waiting for user authentication",
			},
		})
		return
	}

	if session.Status == "completed" {
		// Return token and clean up session
		response := gin.H{
			"success": true,
			"data": gin.H{
				"status":     "completed",
				"api_token":  session.APIToken,
				"token_name": session.TokenName,
				"user": gin.H{
					"id":           session.UserID,
					"username":     session.Username,
					"display_name": session.DisplayName,
				},
			},
		}

		// Clean up session after returning token (single-use)
		go func() {
			err := model.DeleteVSCodeAuthSession(sessionID)
			if err != nil {
				logger.SysError(fmt.Sprintf("Failed to cleanup VSCode auth session %s: %v", sessionID, err))
			} else {
				logger.SysLog(fmt.Sprintf("Cleaned up completed VSCode auth session: %s", sessionID))
			}
		}()
		
		logger.SysLog(fmt.Sprintf("VSCode auth completed for session %s, user: %s", sessionID, session.Username))
		c.JSON(http.StatusOK, response)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": false,
		"message": "Unknown session status",
	})
}