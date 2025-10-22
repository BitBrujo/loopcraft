'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { ToolSchema } from '@/types/ui-builder';
import { CompanionFlowDiagram } from './CompanionFlowDiagram';

interface MCPServer {
  id: number;
  name: string;
  enabled: boolean;
}

interface CompanionWizardProps {
  targetServerName: string | null;
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Left Column: Steps 1 and 2 */}
      <div className="space-y-4 md:space-y-6">
        {/* Step 1: Select Target Server */}
        <Card className={isStep1Complete ? 'border-orange-500/50' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 border-2 border-primary text-primary bg-transparent">
                  1
                </span>
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
            <div>
              <label className="text-sm font-medium block mb-4">Target MCP Server</label>
              <Select value={targetServerName ?? undefined} onValueChange={onTargetServerChange}>
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
          </CardContent>
        </Card>

        {/* Step 2: Select Tools */}
        <Card className={isStep2Complete ? 'border-orange-500/50' : ''} style={{ opacity: isStep1Complete ? 1 : 0.5 }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 border-2 border-primary text-primary bg-transparent">
                  2
                </span>
                <CardTitle>Which tools should be accessible from the UI?</CardTitle>
              </div>
              {isStep2Complete && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-500/30">
                    {selectedTools.length} selected
                  </Badge>
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
      </div>

      {/* Right Column: Step 3 */}
      <div className="space-y-4 md:space-y-6">
        {/* Step 3: Understand the Pattern */}
        <Card style={{ opacity: isStep2Complete ? 1 : 0.5 }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 border-2 border-primary text-primary bg-transparent">
                3
              </span>
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Next Button */}
        {isStep2Complete && (
          <div className="flex justify-center md:justify-end">
            <Button
              className="gap-2"
            >
              Next: Continue to Design
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
