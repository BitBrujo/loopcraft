'use client';

import { ArrowRight, Server, Layers, Globe } from 'lucide-react';

interface CompanionFlowDiagramProps {
  targetServerName: string | null;
}

export function CompanionFlowDiagram({ targetServerName }: CompanionFlowDiagramProps) {
  return (
    <div className="relative p-4 md:p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/10 dark:to-amber-950/10 rounded-lg border">
      {/* Horizontal Flow */}
      <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
        {/* Servers Group */}
        <div className="flex flex-col gap-2">
          {/* Companion Server */}
          <div className="flex items-center gap-2">
            <div className="w-28 h-12 md:w-36 md:h-14 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-2 border-orange-500 flex flex-col items-center justify-center p-1.5 md:p-2 shadow-md">
              <Server className="h-3 w-3 md:h-4 md:w-4 text-orange-600 mb-0.5" />
              <span className="text-[8px] md:text-[10px] font-semibold text-center">{targetServerName}-ui</span>
            </div>
            <span className="text-[8px] md:text-[10px] text-muted-foreground max-w-[60px] md:max-w-[80px]">UI Server</span>
          </div>
          {/* Target Server */}
          <div className="flex items-center gap-2">
            <div className="w-28 h-12 md:w-36 md:h-14 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-2 border-orange-500 flex flex-col items-center justify-center p-1.5 md:p-2 shadow-md">
              <Server className="h-3 w-3 md:h-4 md:w-4 text-orange-600 mb-0.5" />
              <span className="text-[8px] md:text-[10px] font-semibold text-center">{targetServerName}</span>
            </div>
            <span className="text-[8px] md:text-[10px] text-muted-foreground max-w-[60px] md:max-w-[80px]">MCP Server</span>
          </div>
        </div>

        {/* Arrow Right */}
        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-orange-500 flex-shrink-0" />

        {/* MCP Client */}
        <div className="flex items-center gap-2">
          <div className="w-28 h-14 md:w-36 md:h-16 bg-orange-100 dark:bg-orange-900/30 rounded-lg border-2 border-orange-500 flex flex-col items-center justify-center p-2 shadow-lg">
            <Layers className="h-3 w-3 md:h-4 md:w-4 text-orange-600 mb-0.5" />
            <span className="text-[9px] md:text-xs font-semibold">MCP Client</span>
            <span className="text-[7px] md:text-[9px] text-muted-foreground mt-0.5">connects both</span>
          </div>
        </div>

        {/* Arrow Right */}
        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-orange-500 flex-shrink-0" />

        {/* Routing Box */}
        <div className="flex items-center gap-2">
          <div className="w-32 h-14 md:w-40 md:h-16 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-500 flex flex-col items-center justify-center p-2 shadow-md">
            <span className="text-[8px] md:text-[10px] font-semibold">Routes by prefix</span>
            <code className="text-[7px] md:text-[9px] text-green-700 dark:text-green-400 mt-0.5 break-all text-center px-1">
              mcp_{targetServerName}_*
            </code>
          </div>
        </div>

        {/* Arrow Right */}
        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-orange-500 flex-shrink-0" />

        {/* App/Chat */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-14 md:w-32 md:h-16 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg border-2 border-orange-500 flex items-center justify-center p-2 shadow-lg">
            <Globe className="h-3 w-3 md:h-4 md:w-4 text-orange-600 mr-1" />
            <span className="text-[9px] md:text-xs font-semibold">Your App</span>
          </div>
        </div>
      </div>
    </div>
  );
}
