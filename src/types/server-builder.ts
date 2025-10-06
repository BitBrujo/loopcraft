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

// Resource types for MCP resources
export type ResourceVariableType = 'string' | 'number' | 'boolean';

export interface ResourceVariable {
  name: string;
  type: ResourceVariableType;
  description: string;
  required: boolean;
}

export interface ResourceDefinition {
  id: string;
  uri: string; // e.g., "calendar://events/2024" or "products://{category}/{id}"
  name: string;
  description: string;
  category: ToolCategory;
  mimeType: string; // e.g., "application/json", "text/plain", "text/html"
  isTemplate: boolean; // true if URI has variables like {category}
  uriVariables?: ResourceVariable[]; // For template resources
  exampleData?: unknown; // Example resource content
}

export interface ResourceTemplate {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  userProvides: string; // Plain language: what data this resource contains
  aiSees: string; // Plain language: how AI can use this resource
  resource: ResourceDefinition;
}

export interface ServerConfig {
  name: string;
  description: string;
  tools: ToolDefinition[];
  resources: ResourceDefinition[]; // MCP resources
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

// Component Relationship Mapper types
export type RelationshipType = 'tool-resource' | 'resource-tool' | 'tool-ui' | 'complementary-tool' | 'complementary-resource';

export interface RelationshipSuggestion {
  id: string; // Template ID
  name: string;
  description: string;
  category: ToolCategory;
  reason: string; // AI-generated or rule-based explanation
  confidence: number; // 0-1 score
  type: 'tool' | 'resource';
}

export interface ComponentRelationship {
  type: RelationshipType;
  sourceId: string; // ID of the tool/resource that triggered this relationship
  sourceName: string;
  suggestions: RelationshipSuggestion[];
  analysisMethod: 'ai' | 'rule-based';
  timestamp: Date;
}

export interface AnalysisContext {
  existingTools: ToolDefinition[];
  existingResources: ResourceDefinition[];
  recentlyAdded?: { type: 'tool' | 'resource'; id: string };
}

export interface DependencyWarning {
  type: 'missing-tool' | 'missing-resource' | 'incomplete-pattern';
  severity: 'warning' | 'info';
  message: string;
  suggestion?: RelationshipSuggestion;
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
