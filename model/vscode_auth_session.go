package model

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/songquanpeng/one-api/common/logger"
)

// VSCodeAuthSession represents a VSCode authentication session
type VSCodeAuthSession struct {
	ID            string `json:"id" redis:"id"`
	Status        string `json:"status" redis:"status"` // pending, completed, expired
	APIToken      string `json:"api_token,omitempty" redis:"api_token"`
	TokenName     string `json:"token_name,omitempty" redis:"token_name"`
	UserID        int    `json:"user_id,omitempty" redis:"user_id"`
	Username      string `json:"username,omitempty" redis:"username"`
	DisplayName   string `json:"display_name,omitempty" redis:"display_name"`
	ClientName    string `json:"client_name" redis:"client_name"`
	Version       string `json:"version" redis:"version"`
	CreatedTime   int64  `json:"created_time" redis:"created_time"`
	ExpiresAt     int64  `json:"expires_at" redis:"expires_at"`
	// External OAuth2 provider support
	Provider      string `json:"provider,omitempty" redis:"provider"`           // "local", "coder", "github", etc.
	ProviderURL   string `json:"provider_url,omitempty" redis:"provider_url"`   // External provider base URL
	ExternalToken string `json:"external_token,omitempty" redis:"external_token"` // Token from external provider
	ExternalUser  string `json:"external_user,omitempty" redis:"external_user"`   // External user info (JSON)
}

// In-memory session storage (fallback when Redis is not available)
var (
	vscodeAuthSessions = make(map[string]*VSCodeAuthSession)
	sessionMutex       sync.RWMutex
)

// StoreVSCodeAuthSession stores a VSCode authentication session
func StoreVSCodeAuthSession(session *VSCodeAuthSession) error {
	if session == nil || session.ID == "" {
		return errors.New("invalid session or session ID")
	}

	// For now, use in-memory storage. This can be extended to use Redis later
	sessionMutex.Lock()
	defer sessionMutex.Unlock()
	
	vscodeAuthSessions[session.ID] = session
	logger.SysLog(fmt.Sprintf("Stored VSCode auth session: %s", session.ID))
	return nil
}

// GetVSCodeAuthSession retrieves a VSCode authentication session
func GetVSCodeAuthSession(sessionID string) (*VSCodeAuthSession, error) {
	if sessionID == "" {
		return nil, errors.New("session ID is empty")
	}

	sessionMutex.RLock()
	defer sessionMutex.RUnlock()

	session, exists := vscodeAuthSessions[sessionID]
	if !exists {
		return nil, errors.New("session not found")
	}

	// Check if session has expired
	if time.Now().Unix() > session.ExpiresAt {
		// Clean up expired session
		go func() {
			sessionMutex.Lock()
			defer sessionMutex.Unlock()
			delete(vscodeAuthSessions, sessionID)
		}()
		return nil, errors.New("session expired")
	}

	return session, nil
}

// DeleteVSCodeAuthSession deletes a VSCode authentication session
func DeleteVSCodeAuthSession(sessionID string) error {
	if sessionID == "" {
		return errors.New("session ID is empty")
	}

	sessionMutex.Lock()
	defer sessionMutex.Unlock()

	delete(vscodeAuthSessions, sessionID)
	logger.SysLog(fmt.Sprintf("Deleted VSCode auth session: %s", sessionID))
	return nil
}

// GenerateVSCodeSessionID generates a cryptographically secure session ID
func GenerateVSCodeSessionID() string {
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		// Fallback to timestamp-based ID if crypto rand fails
		return fmt.Sprintf("vscode_auth_%d", time.Now().UnixNano())
	}
	return "vscode_auth_" + hex.EncodeToString(bytes)
}

// CleanupExpiredVSCodeSessions removes expired sessions from memory
func CleanupExpiredVSCodeSessions() {
	sessionMutex.Lock()
	defer sessionMutex.Unlock()

	now := time.Now().Unix()
	expiredSessions := make([]string, 0)

	for sessionID, session := range vscodeAuthSessions {
		if now > session.ExpiresAt {
			expiredSessions = append(expiredSessions, sessionID)
		}
	}

	for _, sessionID := range expiredSessions {
		delete(vscodeAuthSessions, sessionID)
		logger.SysLog(fmt.Sprintf("Cleaned up expired VSCode auth session: %s", sessionID))
	}

	if len(expiredSessions) > 0 {
		logger.SysLog(fmt.Sprintf("Cleaned up %d expired VSCode auth sessions", len(expiredSessions)))
	}
}

// GetOrCreateUserDefaultToken gets or creates a user's default API token for VSCode integration
func GetOrCreateUserDefaultToken(userID int, tokenName string) (*Token, error) {
	if userID == 0 {
		return nil, errors.New("user ID is empty")
	}

	// First, try to find an existing default token
	var tokens []*Token
	err := DB.Where("user_id = ? AND name = ?", userID, "default").Find(&tokens).Error
	if err != nil {
		return nil, fmt.Errorf("failed to query user tokens: %v", err)
	}

	// If we found a default token, return it
	if len(tokens) > 0 {
		token := tokens[0]
		// Update the token name if it's different
		if token.Name != tokenName {
			token.Name = tokenName
			err = token.Update()
			if err != nil {
				logger.SysError(fmt.Sprintf("failed to update token name: %v", err))
			}
		}
		return token, nil
	}

	// If no default token exists, try to find any existing token for the user
	err = DB.Where("user_id = ?", userID).First(&tokens).Error
	if err == nil && len(tokens) > 0 {
		// Return the first available token
		return tokens[0], nil
	}

	// No tokens exist, this shouldn't happen as tokens are created during user registration
	// But let's handle it gracefully by returning an error
	return nil, errors.New("no API tokens found for user - this should not happen")
}

// StartVSCodeSessionCleanupRoutine starts a background routine to clean up expired sessions
func StartVSCodeSessionCleanupRoutine() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute) // Clean up every 5 minutes
		defer ticker.Stop()

		for range ticker.C {
			CleanupExpiredVSCodeSessions()
		}
	}()
	logger.SysLog("Started VSCode session cleanup routine")
}

// UpdateVSCodeAuthSession updates an existing VSCode authentication session
func UpdateVSCodeAuthSession(sessionID string, updates map[string]interface{}) error {
	if sessionID == "" {
		return errors.New("session ID is empty")
	}

	sessionMutex.Lock()
	defer sessionMutex.Unlock()

	session, exists := vscodeAuthSessions[sessionID]
	if !exists {
		return errors.New("session not found")
	}

	// Check if session has expired
	if time.Now().Unix() > session.ExpiresAt {
		delete(vscodeAuthSessions, sessionID)
		return errors.New("session expired")
	}

	// Apply updates
	for key, value := range updates {
		switch key {
		case "status":
			if status, ok := value.(string); ok {
				session.Status = status
			}
		case "api_token":
			if token, ok := value.(string); ok {
				session.APIToken = token
			}
		case "token_name":
			if name, ok := value.(string); ok {
				session.TokenName = name
			}
		case "user_id":
			if userID, ok := value.(int); ok {
				session.UserID = userID
			}
		case "username":
			if username, ok := value.(string); ok {
				session.Username = username
			}
		case "display_name":
			if displayName, ok := value.(string); ok {
				session.DisplayName = displayName
			}
		case "provider":
			if provider, ok := value.(string); ok {
				session.Provider = provider
			}
		case "provider_url":
			if providerURL, ok := value.(string); ok {
				session.ProviderURL = providerURL
			}
		case "external_token":
			if externalToken, ok := value.(string); ok {
				session.ExternalToken = externalToken
			}
		case "external_user":
			if externalUser, ok := value.(string); ok {
				session.ExternalUser = externalUser
			}
		}
	}

	vscodeAuthSessions[sessionID] = session
	logger.SysLog(fmt.Sprintf("Updated VSCode auth session: %s", sessionID))
	return nil
}

// CreateExternalProviderSession creates a VSCode auth session for external OAuth2 provider
func CreateExternalProviderSession(clientName, version, provider, providerURL string) (*VSCodeAuthSession, error) {
	if provider == "" {
		return nil, errors.New("provider is required")
	}

	sessionID := GenerateVSCodeSessionID()
	
	session := &VSCodeAuthSession{
		ID:          sessionID,
		Status:      "pending",
		ClientName:  clientName,
		Version:     version,
		Provider:    provider,
		ProviderURL: providerURL,
		CreatedTime: time.Now().Unix(),
		ExpiresAt:   time.Now().Add(10 * time.Minute).Unix(),
	}

	if clientName == "" {
		session.ClientName = "VSCode Extension"
	}
	if version == "" {
		session.Version = "1.0.0"
	}

	err := StoreVSCodeAuthSession(session)
	if err != nil {
		return nil, fmt.Errorf("failed to store session: %v", err)
	}

	logger.SysLog(fmt.Sprintf("Created external provider VSCode auth session: %s for provider: %s", sessionID, provider))
	return session, nil
}