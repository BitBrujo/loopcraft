// UI Builder types for MCP-UI resource creation

export type ContentType = 'rawHtml' | 'externalUrl' | 'remoteDom';

export type ActionType = 'tool' | 'prompt' | 'link' | 'intent' | 'notify';

export interface FrameSize {
  width: number;
  height: number;
}

export interface ToolAction {
  type: 'tool';
  toolName: string;
  parameters: Record<string, unknown>;
}

export interface PromptAction {
  type: 'prompt';
  template: string;
  variables?: string[];
}

export interface LinkAction {
  type: 'link';
  urlPattern: string;
  target: '_blank' | '_self' | '_parent' | '_top';
}

export interface IntentAction {
  type: 'intent';
  intentName: string;
  parameters?: Record<string, unknown>;
}

export interface NotifyAction {
  type: 'notify';
  messageTemplate: string;
  notificationType: 'info' | 'warning' | 'error' | 'success';
}

export type ActionConfig = ToolAction | PromptAction | LinkAction | IntentAction | NotifyAction;

export interface UIResource {
  uri: string;
  contentType: ContentType;
  content: string;
  title?: string;
  description?: string;
  preferredSize: FrameSize;
  initialData?: Record<string, unknown>;
  actions?: ActionConfig[];
  metadata?: Record<string, unknown>;
  templatePlaceholders?: string[]; // Agent-fillable slots like {{agent.name}}
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  resource: UIResource;
  thumbnail?: string;
}

export interface UIBuilderState {
  currentResource: UIResource | null;
  savedTemplates: Template[];
  previewKey: number;
  showPreview: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ExportFormat {
  language: 'typescript' | 'json' | 'curl';
  code: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type TabId = 'design' | 'actions' | 'generate' | 'test';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: object;
  serverName: string;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required: boolean;
  default?: unknown;
}

export interface CustomTool {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
}

export interface MCPServer {
  name: string;
  type: 'stdio' | 'sse';
  status: 'connected' | 'disconnected';
}

export interface MCPContext {
  selectedServers: string[];
  selectedTools: MCPTool[];
  purpose: string;
}

export type ParameterSourceType = 'static' | 'form' | 'agent' | 'tool';

export interface ParameterSource {
  sourceType: ParameterSourceType;
  sourceValue: string; // Static value, form field name, placeholder name, or tool result path
}

export interface ActionMapping {
  id: string;
  uiElementId: string;
  uiElementType: 'button' | 'form' | 'link' | 'input' | 'select' | 'textarea' | 'custom';
  toolName: string;
  serverName: string;
  parameterBindings: Record<string, string>; // Legacy: string values (deprecated)
  parameterSources?: Record<string, ParameterSource>; // New: typed parameter sources (optional for backward compatibility)
  responseHandler: 'update-ui' | 'show-notification' | 'custom';
  customHandlerCode?: string;
}

export interface MockResponse {
  toolName: string;
  serverName: string;
  response: unknown;
}

export interface TestResult {
  id: string;
  mappingId: string;
  timestamp: Date;
  status: 'passed' | 'failed';
  error?: string;
  executionTime: number;
}

export interface TestConfig {
  mockResponses: MockResponse[];
  testHistory: TestResult[];
  useMockData: boolean;
}

export interface TypeMismatch {
  field: string;
  expected: string;
  actual: string;
}

export interface ValidationStatus {
  missingMappings: string[];
  typeMismatches: TypeMismatch[];
  warnings: string[];
}

export interface FlowNode {
  id: string;
  type: 'server' | 'tool' | 'ui' | 'action' | 'handler';
  data: {
    label: string;
    description?: string;
    metadata?: Record<string, unknown>;
  };
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}
