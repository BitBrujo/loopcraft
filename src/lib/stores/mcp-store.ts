import { create } from 'zustand';

export interface MCPServer {
  id: string;
  name: string;
  command: string[];
  type: 'stdio' | 'sse';
  env?: Record<string, string>;
  enabled: boolean;
  description?: string;
  connected: boolean;
  lastError?: string;
}

export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  serverName: string;
  content?: string;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: object;
  serverName: string;
}

interface MCPState {
  // Servers
  servers: MCPServer[];
  setServers: (servers: MCPServer[]) => void;
  addServer: (server: MCPServer) => void;
  updateServer: (id: string, updates: Partial<MCPServer>) => void;
  removeServer: (id: string) => void;
  toggleServer: (id: string) => void;

  // Resources
  resources: MCPResource[];
  setResources: (resources: MCPResource[]) => void;
  addResource: (resource: MCPResource) => void;
  loadingResources: boolean;
  setLoadingResources: (loading: boolean) => void;

  // Tools
  tools: MCPTool[];
  setTools: (tools: MCPTool[]) => void;
  loadingTools: boolean;
  setLoadingTools: (loading: boolean) => void;

  // Connection status
  isConnecting: boolean;
  setIsConnecting: (connecting: boolean) => void;

  // Selected server for config editing
  selectedServerId: string | null;
  setSelectedServerId: (id: string | null) => void;
}

export const useMCPStore = create<MCPState>((set) => ({
  servers: [],
  setServers: (servers) => set({ servers }),
  addServer: (server) => set((state) => ({
    servers: [...state.servers, server]
  })),
  updateServer: (id, updates) => set((state) => ({
    servers: state.servers.map(server =>
      server.id === id ? { ...server, ...updates } : server
    )
  })),
  removeServer: (id) => set((state) => ({
    servers: state.servers.filter(server => server.id !== id)
  })),
  toggleServer: (id) => set((state) => ({
    servers: state.servers.map(server =>
      server.id === id ? { ...server, enabled: !server.enabled } : server
    )
  })),

  resources: [],
  setResources: (resources) => set({ resources }),
  addResource: (resource) => set((state) => ({
    resources: [...state.resources, resource]
  })),
  loadingResources: false,
  setLoadingResources: (loading) => set({ loadingResources: loading }),

  tools: [],
  setTools: (tools) => set({ tools }),
  loadingTools: false,
  setLoadingTools: (loading) => set({ loadingTools: loading }),

  isConnecting: false,
  setIsConnecting: (connecting) => set({ isConnecting: connecting }),

  selectedServerId: null,
  setSelectedServerId: (id) => set({ selectedServerId: id }),
}));