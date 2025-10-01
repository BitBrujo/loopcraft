// Database table types for LoopCraft

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreate {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Prompt {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface PromptCreate {
  title: string;
  content: string;
}

export interface PromptUpdate {
  title?: string;
  content?: string;
}

export interface Setting {
  id: number;
  user_id: number;
  key: string;
  value: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SettingCreate {
  key: string;
  value: string;
}

export interface MCPServer {
  id: number;
  user_id: number;
  name: string;
  type: 'stdio' | 'sse';
  config: MCPServerConfig;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MCPServerConfig {
  command?: string[];
  url?: string;
  env?: Record<string, string>;
  args?: string[];
}

export interface MCPServerCreate {
  name: string;
  type: 'stdio' | 'sse';
  config: MCPServerConfig;
  enabled?: boolean;
}

export interface MCPServerUpdate {
  name?: string;
  type?: 'stdio' | 'sse';
  config?: MCPServerConfig;
  enabled?: boolean;
}

export interface JWTPayload {
  userId: number;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface UITemplate {
  id: number;
  user_id: number;
  name: string;
  category: string;
  resource_data: string; // JSON string
  created_at: Date;
  updated_at: Date;
}

export interface UITemplateWithParsed extends Omit<UITemplate, 'resource_data'> {
  resource_data: Record<string, unknown>;
}

export interface UITemplateCreate {
  name: string;
  category: string;
  resource_data: Record<string, unknown>;
}

export interface UITemplateUpdate {
  name?: string;
  category?: string;
  resource_data?: Record<string, unknown>;
}
