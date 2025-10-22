'use client';

import { ArrowDown, Server, Layers, Globe } from 'lucide-react';

interface CompanionFlowDiagramProps {
  targetServerName: string | null;
}

export function CompanionFlowDiagram({ targetServerName }: CompanionFlowDiagramProps) {
  return (
    <div className="relative p-4 md:p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/10 dark:to-amber-950/10 rounded-lg border">
      {/* Top Row: Two Servers */}
      <div className="flex justify-center gap-4 md:gap-8 mb-4 md:mb-8">
        {/* Companion Server */}
        <div className="flex flex-col items-center space-y-1 md:space-y-2">
          <div className="w-24 h-16 md:w-32 md:h-20 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-2 border-orange-500 flex flex-col items-center justify-center p-2 md:p-3 shadow-md">
            <Server className="h-4 w-4 md:h-6 md:w-6 text-orange-600 mb-0.5 md:mb-1" />
            <span className="text-[10px] md:text-xs font-semibold text-center">{targetServerName}-ui</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground text-center max-w-[100px] md:max-w-[140px]">
            Companion UI Server
            <br />
            (serves HTML with UI)
          </span>
        </div>

        {/* Target Server */}
        <div className="flex flex-col items-center space-y-1 md:space-y-2">
          <div className="w-24 h-16 md:w-32 md:h-20 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-2 border-orange-500 flex flex-col items-center justify-center p-2 md:p-3 shadow-md">
            <Server className="h-4 w-4 md:h-6 md:w-6 text-orange-600 mb-0.5 md:mb-1" />
            <span className="text-[10px] md:text-xs font-semibold text-center">{targetServerName}</span>
          </div>
          <span className="text-[10px] md:text-xs text-muted-foreground text-center max-w-[100px] md:max-w-[140px]">
            Target Server
            <br />
            (has tools)
          </span>
        </div>
      </div>

      {/* Arrows Down */}
      <div className="flex justify-center gap-4 md:gap-8 mb-3 md:mb-6">
        <ArrowDown className="h-4 w-4 md:h-6 md:w-6 text-orange-500" />
        <ArrowDown className="h-4 w-4 md:h-6 md:w-6 text-orange-500" />
      </div>

      {/* Middle: MCP Client */}
      <div className="flex justify-center mb-3 md:mb-6">
        <div className="flex flex-col items-center space-y-1 md:space-y-2">
          <div className="w-48 h-20 md:w-64 md:h-24 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-2 border-orange-500 flex flex-col items-center justify-center p-2 md:p-3 shadow-lg">
            <Layers className="h-4 w-4 md:h-6 md:w-6 text-orange-600 mb-0.5 md:mb-1" />
            <span className="text-xs md:text-sm font-semibold">MCP Client</span>
            <span className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">connects both servers</span>
          </div>
        </div>
      </div>

      {/* Arrow Down */}
      <div className="flex justify-center mb-3 md:mb-6">
        <ArrowDown className="h-4 w-4 md:h-6 md:w-6 text-orange-500" />
      </div>

      {/* Routing Box */}
      <div className="flex justify-center mb-3 md:mb-6">
        <div className="w-48 h-14 md:w-64 md:h-16 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-500 flex flex-col items-center justify-center p-2 md:p-3 shadow-md">
          <span className="text-[10px] md:text-xs font-semibold">Routes by tool prefix</span>
          <code className="text-[10px] md:text-xs text-green-700 dark:text-green-400 mt-0.5 md:mt-1">
            mcp_{targetServerName}_toolname
          </code>
        </div>
      </div>

      {/* Arrow Down */}
      <div className="flex justify-center mb-3 md:mb-6">
        <ArrowDown className="h-4 w-4 md:h-6 md:w-6 text-orange-500" />
      </div>

      {/* Bottom: App/Chat */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center space-y-1 md:space-y-2">
          <div className="w-40 h-14 md:w-48 md:h-16 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg border-2 border-orange-500 flex items-center justify-center p-2 md:p-3 shadow-lg">
            <Globe className="h-4 w-4 md:h-5 md:w-5 text-orange-600 mr-1 md:mr-2" />
            <span className="text-xs md:text-sm font-semibold">Your App / Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
