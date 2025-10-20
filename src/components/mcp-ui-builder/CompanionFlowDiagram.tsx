'use client';

import { ArrowDown, Server, Layers, Globe } from 'lucide-react';

interface CompanionFlowDiagramProps {
  targetServerName: string | null;
}

export function CompanionFlowDiagram({ targetServerName }: CompanionFlowDiagramProps) {
  return (
    <div className="relative p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/10 dark:to-amber-950/10 rounded-lg border">
      {/* Top Row: Two Servers */}
      <div className="flex justify-center gap-8 mb-8">
        {/* Companion Server */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-32 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-2 border-orange-500 flex flex-col items-center justify-center p-3 shadow-md">
            <Server className="h-6 w-6 text-orange-600 mb-1" />
            <span className="text-xs font-semibold text-center">{targetServerName}-ui</span>
          </div>
          <span className="text-xs text-muted-foreground text-center max-w-[140px]">
            Companion UI Server
            <br />
            (serves HTML with UI)
          </span>
        </div>

        {/* Target Server */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-32 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-2 border-blue-500 flex flex-col items-center justify-center p-3 shadow-md">
            <Server className="h-6 w-6 text-blue-600 mb-1" />
            <span className="text-xs font-semibold text-center">{targetServerName}</span>
          </div>
          <span className="text-xs text-muted-foreground text-center max-w-[140px]">
            Target Server
            <br />
            (has tools)
          </span>
        </div>
      </div>

      {/* Arrows Down */}
      <div className="flex justify-center gap-8 mb-6">
        <ArrowDown className="h-6 w-6 text-muted-foreground" />
        <ArrowDown className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Middle: MCP Client */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-64 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-lg border-2 border-purple-500 flex flex-col items-center justify-center p-3 shadow-lg">
            <Layers className="h-6 w-6 text-purple-600 mb-1" />
            <span className="text-sm font-semibold">MCP Client</span>
            <span className="text-xs text-muted-foreground mt-1">connects both servers</span>
          </div>
        </div>
      </div>

      {/* Arrow Down */}
      <div className="flex justify-center mb-6">
        <ArrowDown className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Routing Box */}
      <div className="flex justify-center mb-6">
        <div className="w-64 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-500 flex flex-col items-center justify-center p-3 shadow-md">
          <span className="text-xs font-semibold">Routes by tool prefix</span>
          <code className="text-xs text-green-700 dark:text-green-400 mt-1">
            mcp_{targetServerName}_toolname
          </code>
        </div>
      </div>

      {/* Arrow Down */}
      <div className="flex justify-center mb-6">
        <ArrowDown className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Bottom: App/Chat */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-48 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border-2 border-indigo-500 flex items-center justify-center p-3 shadow-lg">
            <Globe className="h-5 w-5 text-indigo-600 mr-2" />
            <span className="text-sm font-semibold">Your App / Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
