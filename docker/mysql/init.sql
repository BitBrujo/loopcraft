-- LoopCraft Database Schema
-- MySQL 8.0+ compatible

-- Create database if not exists (handled by Docker env vars)
-- USE loopcraft;

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================================
-- Table: user_profiles
-- Extended user profile information
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: user_settings
-- Per-user application settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL UNIQUE,
    theme VARCHAR(50) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    ai_model_preference VARCHAR(255),
    custom_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: conversations
-- Chat conversation threads
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    title VARCHAR(500),
    model VARCHAR(255),
    system_prompt TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: messages
-- Individual chat messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT,
    tool_calls JSON,
    tool_results JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_created (conversation_id, created_at ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: mcp_servers
-- User-configured MCP server definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS mcp_servers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    command JSON NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('stdio', 'sse', 'http')),
    env JSON,
    enabled BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_server (user_id, name),
    INDEX idx_user_enabled (user_id, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: file_uploads
-- File upload tracking with temporary file support
-- ============================================================================
CREATE TABLE IF NOT EXISTS file_uploads (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    conversation_id CHAR(36),
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255),
    is_temporary BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Triggers for automatic timestamp updates
-- ============================================================================

-- Trigger: Update user_profiles updated_at
DELIMITER $$
CREATE TRIGGER update_user_profiles_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- ============================================================================
-- Function: Delete expired temporary files
-- ============================================================================
DELIMITER $$
CREATE EVENT IF NOT EXISTS delete_expired_files
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM file_uploads
    WHERE is_temporary = TRUE
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END$$
DELIMITER ;

-- ============================================================================
-- Initial Data: Create default admin user
-- Password: admin123 (bcrypt hash with salt rounds=10)
-- ============================================================================
INSERT INTO user_profiles (id, username, email, password_hash, display_name, bio)
VALUES (
    UUID(),
    'admin',
    'admin@loopcraft.local',
    '$2b$10$rKz3YjV0pXN2nLZ5YZ5wZeHzKQxXN5bKQXZ5YZ5wZeHzKQxXN5bKQ',
    'Administrator',
    'Default administrator account for LoopCraft'
)
ON DUPLICATE KEY UPDATE id=id;

-- Insert default settings for admin user
INSERT INTO user_settings (user_id, theme, ai_model_preference)
SELECT id, 'dark', 'llama3.2:latest'
FROM user_profiles
WHERE username = 'admin'
ON DUPLICATE KEY UPDATE id=id;

-- ============================================================================
-- Sample Data: Example conversation and messages
-- ============================================================================
INSERT INTO conversations (id, user_id, title, model, system_prompt)
SELECT
    UUID(),
    id,
    'Welcome to LoopCraft',
    'llama3.2:latest',
    'You are a helpful AI assistant in LoopCraft, a modern AI chat application.'
FROM user_profiles
WHERE username = 'admin'
LIMIT 1
ON DUPLICATE KEY UPDATE id=id;

-- ============================================================================
-- Views: Useful queries
-- ============================================================================

-- View: Active conversations with message count
CREATE OR REPLACE VIEW active_conversations AS
SELECT
    c.id,
    c.user_id,
    c.title,
    c.model,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_message_at,
    c.created_at,
    c.updated_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.user_id, c.title, c.model, c.created_at, c.updated_at;

-- ============================================================================
-- Database Information
-- ============================================================================
SELECT
    'LoopCraft Database Initialized' as Status,
    DATABASE() as DatabaseName,
    NOW() as InitializedAt;

-- Show created tables
SHOW TABLES;