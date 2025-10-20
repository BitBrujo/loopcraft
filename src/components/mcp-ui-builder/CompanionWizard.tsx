'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Puzzle, Info, CheckCircle2 } from 'lucide-react';
import { ToolSchema } from '@/types/ui-builder';
import { CompanionFlowDiagram } from './CompanionFlowDiagram';

interface MCPServer {
  id: number;
  name: string;
  enabled: boolean;
}

interface CompanionWizardProps {
  targetServerName: string;
  availableTools: ToolSchema[];
  selectedTools: string[];
  enabledServers: MCPServer[];
  onTargetServerChange: (serverName: string) => void;
  onToolToggle: (toolName: string) => void;
}

export function CompanionWizard({
  targetServerName,
  availableTools,
  selectedTools,
  enabledServers,
  onTargetServerChange,
  onToolToggle,
}: CompanionWizardProps) {
  const isStep1Complete = targetServerName !== '';
  const isStep2Complete = selectedTools.length > 0;

  return (
    <div className="space-y-6">
      {/* Step 1: Select Target Server */}
      <Card className={isStep1Complete ? 'border-green-500/50' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 font-semibold">
                1
              </div>
              <CardTitle>Which server will this UI companion?</CardTitle>
            </div>
            {isStep1Complete && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
          </div>
          <CardDescription>
            Your companion UI server will run alongside {targetServerName || 'the target server'}, both connecting to the same MCP client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target MCP Server</label>
            <Select value={targetServerName} onValueChange={onTargetServerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a server..." />
              </SelectTrigger>
              <SelectContent>
                {enabledServers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No enabled servers found. Add servers in Settings.
                  </div>
                ) : (
                  enabledServers.map((server) => (
                    <SelectItem key={server.id} value={server.name}>
                      {server.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {targetServerName && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This will create a new companion server named <strong>{targetServerName}-ui</strong> that provides visual interfaces for {targetServerName} tools.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Tools */}
      <Card className={isStep2Complete ? 'border-green-500/50' : ''} style={{ opacity: isStep1Complete ? 1 : 0.5 }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 font-semibold">
                2
              </div>
              <CardTitle>Which tools should be accessible from the UI?</CardTitle>
            </div>
            {isStep2Complete && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedTools.length} selected</Badge>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            )}
          </div>
          <CardDescription>
            These tools will have auto-generated code snippets in the Design tab
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isStep1Complete ? (
            <p className="text-sm text-muted-foreground">Select a target server first</p>
          ) : availableTools.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No tools available from {targetServerName}. Make sure the server is running and connected.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {availableTools.map((tool) => (
                <div key={tool.name} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <Checkbox
                    id={tool.name}
                    checked={selectedTools.includes(tool.name)}
                    onCheckedChange={() => onToolToggle(tool.name)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={tool.name}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {tool.name}
                    </label>
                    {tool.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {tool.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Understand the Pattern */}
      <Card style={{ opacity: isStep2Complete ? 1 : 0.5 }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 font-semibold">
              3
            </div>
            <CardTitle>How the Companion Pattern Works</CardTitle>
          </div>
          <CardDescription>
            Understanding the architecture of portable companion servers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isStep2Complete ? (
            <p className="text-sm text-muted-foreground">Select tools first</p>
          ) : (
            <>
              {/* Visual Diagram */}
              <CompanionFlowDiagram targetServerName={targetServerName} />

              {/* Key Points */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Puzzle className="h-4 w-4 text-orange-600" />
                  Key Points
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Both servers run independently as separate processes</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Both connect to the same MCP client (LoopCraft, Claude Desktop, etc.)</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>MCP client routes tools by prefix: <code className="text-xs bg-muted px-1 py-0.5 rounded">mcp_{targetServerName}_toolname</code></span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Portable: Works with any MCP client, not just LoopCraft</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>No changes to {targetServerName} needed - standard MCP pattern</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ready to continue?</strong> Head to the Design tab to customize your UI, then deploy in the Export tab.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
