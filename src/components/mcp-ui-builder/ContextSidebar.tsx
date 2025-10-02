"use client";

import { useEffect, useState } from "react";
import { Server, Wrench, AlertCircle, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";

interface ServerStatus {
  name: string;
  type: 'stdio' | 'sse';
  status: 'connected' | 'disconnected';
}

export function ContextSidebar() {
  const {
    mcpContext,
    actionMappings,
    validationStatus,
    setActiveTab,
  } = useUIBuilderStore();

  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [showServers, setShowServers] = useState(true);
  const [showTools, setShowTools] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [showStatus, setShowStatus] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      const response = await fetch('/api/mcp/servers');
      if (response.ok) {
        const data = await response.json();
        setServers(data.servers);
      }
    };
    fetchServers();
  }, []);

  const connectedServers = servers.filter((s) => s.status === 'connected');
  const selectedToolsCount = mcpContext.selectedTools.length;
  const actionMappingsCount = actionMappings.length;
  const warningsCount = validationStatus.warnings.length;
  const errorsCount = validationStatus.missingMappings.length + validationStatus.typeMismatches.length;

  return (
    <div className="w-64 border-r bg-card overflow-y-auto flex flex-col h-full">
      <div className="sticky top-0 bg-card border-b p-3 z-10">
        <h3 className="font-semibold text-sm">Context</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Build status and resources
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Servers Section */}
        <div className="border-b">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-left"
            onClick={() => setShowServers(!showServers)}
          >
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="text-sm font-medium">Servers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {connectedServers.length}/{servers.length}
              </span>
              {showServers ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </button>
          {showServers && (
            <div className="p-3 pt-0 space-y-2">
              {servers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No servers configured</p>
              ) : (
                servers.map((server) => (
                  <div
                    key={server.name}
                    className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded"
                  >
                    <span className="font-mono">{server.name}</span>
                    <div className="flex items-center gap-1">
                      {server.status === 'connected' ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Tools Section */}
        <div className="border-b">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-left"
            onClick={() => setShowTools(!showTools)}
          >
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span className="text-sm font-medium">Selected Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedToolsCount}
              </span>
              {showTools ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </button>
          {showTools && (
            <div className="p-3 pt-0 space-y-2">
              {selectedToolsCount === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No tools selected yet
                </p>
              ) : (
                mcpContext.selectedTools.map((tool) => (
                  <div
                    key={`${tool.serverName}-${tool.name}`}
                    className="text-xs p-2 bg-muted/30 rounded"
                  >
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-muted-foreground text-[10px]">
                      from {tool.serverName}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Mappings Section */}
        <div className="border-b">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-left"
            onClick={() => setShowActions(!showActions)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Action Mappings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {actionMappingsCount}
              </span>
              {showActions ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </button>
          {showActions && (
            <div className="p-3 pt-0 space-y-2">
              {actionMappingsCount === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No actions configured
                </p>
              ) : (
                actionMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className="text-xs p-2 bg-muted/30 rounded"
                  >
                    <div className="font-medium">{mapping.uiElementId}</div>
                    <div className="text-muted-foreground text-[10px]">
                      → {mapping.toolName}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Validation Status Section */}
        <div className="border-b">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/30 text-left"
            onClick={() => setShowStatus(!showStatus)}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <div className="flex items-center gap-2">
              {errorsCount > 0 && (
                <span className="text-xs text-red-500">{errorsCount}</span>
              )}
              {warningsCount > 0 && (
                <span className="text-xs text-yellow-500">{warningsCount}</span>
              )}
              {showStatus ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          </button>
          {showStatus && (
            <div className="p-3 pt-0 space-y-2">
              {errorsCount === 0 && warningsCount === 0 ? (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>All checks passed</span>
                </div>
              ) : (
                <>
                  {validationStatus.missingMappings.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-red-600">
                        Missing Mappings:
                      </div>
                      {validationStatus.missingMappings.map((msg, i) => (
                        <div
                          key={i}
                          className="text-xs text-red-500 pl-2 cursor-pointer hover:underline"
                          onClick={() => setActiveTab('actions')}
                        >
                          • {msg}
                        </div>
                      ))}
                    </div>
                  )}
                  {validationStatus.typeMismatches.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-red-600">
                        Type Mismatches:
                      </div>
                      {validationStatus.typeMismatches.map((mismatch, i) => (
                        <div
                          key={i}
                          className="text-xs text-red-500 pl-2 cursor-pointer hover:underline"
                          onClick={() => setActiveTab('actions')}
                        >
                          • {mismatch.field}: expected {mismatch.expected}, got {mismatch.actual}
                        </div>
                      ))}
                    </div>
                  )}
                  {validationStatus.warnings.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-yellow-600">
                        Warnings:
                      </div>
                      {validationStatus.warnings.map((warning, i) => (
                        <div key={i} className="text-xs text-yellow-600 pl-2">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Purpose Section */}
        {mcpContext.purpose && (
          <div className="p-3">
            <div className="text-xs font-medium mb-2">Purpose:</div>
            <p className="text-xs text-muted-foreground">{mcpContext.purpose}</p>
          </div>
        )}
      </div>
    </div>
  );
}
