// MCP Server Builder types for creating functional MCP servers

export type ToolCategory =
  | 'forms'
  | 'search'
  | 'save'
  | 'show'
  | 'process'
  | 'messages'
  | 'security'
  | 'payments'
  | 'files'
  | 'external';

export type ToolParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface ToolParameter {
  name: string;
  type: ToolParameterType;
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  parameters: ToolParameter[];
  returnType: string;
  returnDescription: string;
  exampleInput?: Record<string, unknown>;
  exampleOutput?: unknown;
}

export interface ToolTemplate {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  userEnters: string; // Plain language: what user provides
  userSees: string; // Plain language: what user experiences
  tool: ToolDefinition;
}

export interface ServerConfig {
  name: string;
  description: string;
  tools: ToolDefinition[];
  transportType: 'stdio' | 'sse';
  port?: number; // For SSE servers
}

export type TabId = 'templates' | 'customize' | 'test';

export interface TestResult {
  id: string;
  toolName: string;
  timestamp: Date;
  status: 'passed' | 'failed';
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  executionTime: number;
}

export interface ServerBuilderState {
  // Current server configuration
  serverConfig: ServerConfig | null;

  // Active tool being edited
  activeTool: ToolDefinition | null;

  // Tab navigation
  activeTab: TabId;

  // Test state
  testResults: TestResult[];
  isTestServerActive: boolean;
  testServerName: string | null;
  testServerId: number | null;
  testServerFile: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;
}
