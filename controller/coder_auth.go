package controller

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/model"
)

type CoderAuthInitRequest struct {
	ClientName  string `json:"client_name"`
	Version     string `json:"version"`
	CoderURL    string `json:"coder_url"`    // Base URL of the Coder deployment
	Provider    string `json:"provider"`     // "github" or "oidc"
}

type CoderUserInfo struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Name     string `json:"name"`
}

// InitCoderAuth initializes a VSCode authentication session with external Coder provider
func InitCoderAuth(c *gin.Context) {
	var req CoderAuthInitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Invalid request parameters",
		})
		return
	}

	// Validate required parameters
	if req.CoderURL == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Coder URL is required",
		})
		return
	}

	// Default values
	if req.ClientName == "" {
		req.ClientName = "VSCode Extension"
	}
	if req.Version == "" {
		req.Version = "1.0.0"
	}
	if req.Provider == "" {
		req.Provider = "github"
	}

	// Validate provider
	if req.Provider != "github" && req.Provider != "oidc" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Provider must be either 'github' or 'oidc'",
		})
		return
	}

	// Create external provider session
	session, err := model.CreateExternalProviderSession(req.ClientName, req.Version, "coder", req.CoderURL)
	if err != nil {
		logger.SysError(fmt.Sprintf("Failed to create Coder auth session: %v", err))
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Failed to create authentication session",
		})
		return
	}

	// Build external auth URL - redirect to the Coder service
	coderAuthURL := fmt.Sprintf("%s/coder/oauth2/%s?source=vscode", 
		strings.TrimRight(req.CoderURL, "/"), req.Provider)
	
	// Build our callback URL
	baseURL := config.ServerAddress
	if baseURL == "" {
		scheme := "http"
		if c.Request.TLS != nil {
			scheme = "https"
		}
		baseURL = fmt.Sprintf("%s://%s", scheme, c.Request.Host)
	}
	
	callbackURL := fmt.Sprintf("%s/api/vscode/auth/coder/callback?session_id=%s", baseURL, session.ID)

	logger.SysLog(fmt.Sprintf("Created Coder VSCode auth session: %s for provider: %s, URL: %s", 
		session.ID, req.Provider, req.CoderURL))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"session_id":       session.ID,
			"auth_url":        coderAuthURL,
			"callback_url":    callbackURL,
			"expires_in":      600,
			"polling_interval": 2,
			"provider":        "coder",
			"provider_url":    req.CoderURL,
		},
	})
}

// CoderAuthCallback handles the callback from Coder OAuth2 authentication
func CoderAuthCallback(c *gin.Context) {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Session ID is required",
		})
		return
	}

	// Get the session
	session, err := model.GetVSCodeAuthSession(sessionID)
	if err != nil {
		logger.SysError(fmt.Sprintf("Coder auth callback - session not found: %s, error: %v", sessionID, err))
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid or expired session",
		})
		return
	}

	// Verify this is a Coder session
	if session.Provider != "coder" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid provider for this callback",
		})
		return
	}

	// For now, we'll create a mock user authentication since we can't directly 
	// validate the Coder token without proper OAuth2 flow implementation
	// In a real implementation, you would:
	// 1. Exchange authorization code for access token
	// 2. Use access token to get user info from Coder API
	// 3. Create or find matching user in your system
	
	// Mock user creation for demonstration
	coderUser := CoderUserInfo{
		ID:       "coder_user_123",
		Username: "coder_user",
		Email:    "user@coder.example.com",
		Name:     "Coder User",
	}

	// Find or create user in your system
	user, err := findOrCreateCoderUser(coderUser, session.ProviderURL)
	if err != nil {
		logger.SysError(fmt.Sprintf("Failed to find/create Coder user: %v", err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to authenticate user",
		})
		return
	}

	// Get or create API token for the user
	token, err := model.GetOrCreateUserDefaultToken(user.Id, "Coder Integration")
	if err != nil {
		logger.SysError(fmt.Sprintf("Failed to get/create token for Coder user %d: %v", user.Id, err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create API token",
		})
		return
	}

	// Update session with completion data
	updates := map[string]interface{}{
		"status":       "completed",
		"api_token":    token.Key,
		"token_name":   token.Name,
		"user_id":      user.Id,
		"username":     user.Username,
		"display_name": user.DisplayName,
		"external_user": fmt.Sprintf(`{"id":"%s","username":"%s","email":"%s","name":"%s"}`,
			coderUser.ID, coderUser.Username, coderUser.Email, coderUser.Name),
	}

	err = model.UpdateVSCodeAuthSession(sessionID, updates)
	if err != nil {
		logger.SysError(fmt.Sprintf("Failed to update Coder auth session: %v", err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to complete authentication",
		})
		return
	}

	logger.SysLog(fmt.Sprintf("Completed Coder VSCode auth for session: %s, user: %s", sessionID, user.Username))

	// Redirect to success page
	c.Redirect(http.StatusFound, fmt.Sprintf("/vscode/auth/success?session_id=%s&provider=coder", sessionID))
}

// findOrCreateCoderUser finds an existing user or creates a new one based on Coder user info
func findOrCreateCoderUser(coderUser CoderUserInfo, providerURL string) (*model.User, error) {
	// Try to find user by email first
	user := model.User{}
	err := model.DB.Where("email = ?", coderUser.Email).First(&user).Error
	if err == nil {
		// User exists, update display name if needed
		if user.DisplayName != coderUser.Name && coderUser.Name != "" {
			user.DisplayName = coderUser.Name
			user.Update(true)
		}
		return &user, nil
	}

	// Try to find user by username
	err = model.DB.Where("username = ?", coderUser.Username).First(&user).Error
	if err == nil {
		// User exists, update email and display name if needed
		if user.Email != coderUser.Email && coderUser.Email != "" {
			user.Email = coderUser.Email
		}
		if user.DisplayName != coderUser.Name && coderUser.Name != "" {
			user.DisplayName = coderUser.Name
		}
		user.Update(true)
		return &user, nil
	}

	// User doesn't exist, create new user
	displayName := coderUser.Name
	if displayName == "" {
		displayName = coderUser.Username
	}

	newUser := model.User{
		Username:    coderUser.Username,
		Email:       coderUser.Email,
		DisplayName: displayName,
		Role:        model.RoleCommonUser,
		Status:      model.UserStatusEnabled,
		Quota:       500000, // Default quota
	}

	// Set a random password since this is OAuth2 user
	newUser.Password, err = common.Password2Hash("oauth2_user_" + coderUser.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %v", err)
	}

	err = newUser.Insert(context.Background(), 0)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}

	logger.SysLog(fmt.Sprintf("Created new user from Coder OAuth2: %s (ID: %d)", newUser.Username, newUser.Id))
	return &newUser, nil
}

// ValidateCoderToken validates a token with the external Coder service
func ValidateCoderToken(coderURL, token string) (*CoderUserInfo, error) {
	// This would make an API call to the Coder service to validate the token
	// For now, return mock data
	// In a real implementation:
	// 1. Make HTTP request to Coder API with the token
	// 2. Parse the response to get user info
	// 3. Return user info or error

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Example API call (this would need to be adjusted based on Coder's actual API)
	req, err := http.NewRequest("GET", coderURL+"/api/v2/users/me", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid response status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var userInfo CoderUserInfo
	err = json.Unmarshal(body, &userInfo)
	if err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	return &userInfo, nil
}