// Type definitions for database models

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications_enabled: boolean;
  ai_model_preference?: string;
  custom_settings?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  model?: string;
  system_prompt?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content?: string;
  tool_calls?: Record<string, any>;
  tool_results?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface MCPServer {
  id: string;
  user_id: string;
  name: string;
  command: string[];
  type: 'stdio' | 'sse' | 'http';
  env?: Record<string, string>;
  enabled: boolean;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FileUpload {
  id: string;
  user_id: string;
  conversation_id?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  is_temporary: boolean;
  expires_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
}

// Input types for creating records (without auto-generated fields)
export type CreateUserProfile = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type CreateUserSettings = Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>;
export type CreateConversation = Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
export type CreateMessage = Omit<Message, 'id' | 'created_at'>;
export type CreateMCPServer = Omit<MCPServer, 'id' | 'created_at' | 'updated_at'>;
export type CreateFileUpload = Omit<FileUpload, 'id' | 'created_at'>;

// Update types (partial updates allowed)
export type UpdateUserProfile = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
export type UpdateUserSettings = Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateConversation = Partial<Omit<Conversation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type UpdateMCPServer = Partial<Omit<MCPServer, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;