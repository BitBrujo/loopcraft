"use client";

import { useState } from "react";
import { ArrowRight, Copy, Check, FileCode, Server, BookOpen, Sparkles } from "lucide-react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generateTypeScriptCode,
  generateServerCode,
  generateUIToolCode,
  generateQuickStartGuide,
} from "@/lib/code-generation";

export function GenerateTab() {
  const { currentResource, actionMappings, setActiveTab } = useUIBuilderStore();
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // Calculate statistics
  const agentSlots = currentResource?.templatePlaceholders?.length || 0;
  const userActions = actionMappings.length;
  const tools = new Set(actionMappings.map(m => `${m.serverName}:${m.toolName}`)).size;

  // Generate code using utilities
  const tsCode = currentResource ? generateTypeScriptCode(currentResource) : '// No resource';
  const serverCode = currentResource ? generateServerCode(currentResource) : '// No resource';
  const uiToolCode = currentResource ? generateUIToolCode(currentResource) : '// No resource';
  const quickStartGuide = generateQuickStartGuide(agentSlots, userActions, tools);

  const handleCopy = (content: string, tab: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary Panel */}
      <div className="border-b bg-card p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Integration Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {agentSlots}
            </div>
            <div className="text-sm text-muted-foreground">Agent-Fillable Slots</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {userActions}
            </div>
            <div className="text-sm text-muted-foreground">User Interactions</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {tools}
            </div>
            <div className="text-sm text-muted-foreground">MCP Tools</div>
          </div>
        </div>
      </div>

      {/* Code Export Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="typescript" className="flex flex-col h-full">
          <div className="border-b px-4 pt-2">
            <TabsList>
              <TabsTrigger value="typescript">
                <FileCode className="h-4 w-4 mr-2" />
                TypeScript
              </TabsTrigger>
              <TabsTrigger value="server">
                <Server className="h-4 w-4 mr-2" />
                Server
              </TabsTrigger>
              <TabsTrigger value="ui-tool">
                <FileCode className="h-4 w-4 mr-2" />
                UI Tool
              </TabsTrigger>
              <TabsTrigger value="quickstart">
                <BookOpen className="h-4 w-4 mr-2" />
                Quick Start
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="typescript" className="h-full m-0 p-4 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">TypeScript UIResource Code</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(tsCode, "typescript")}
                >
                  {copiedTab === "typescript" ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                <code>{tsCode}</code>
              </pre>
            </TabsContent>

            <TabsContent value="server" className="h-full m-0 p-4 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Complete MCP Server</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(serverCode, "server")}
                >
                  {copiedTab === "server" ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                <code>{serverCode}</code>
              </pre>
            </TabsContent>

            <TabsContent value="ui-tool" className="h-full m-0 p-4 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">UI Tool for Existing Server</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(uiToolCode, "ui-tool")}
                >
                  {copiedTab === "ui-tool" ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                <code>{uiToolCode}</code>
              </pre>
            </TabsContent>

            <TabsContent value="quickstart" className="h-full m-0 p-4 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Quick Start Guide</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(quickStartGuide, "quickstart")}
                >
                  {copiedTab === "quickstart" ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap">
                {quickStartGuide}
              </pre>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to export your MCP-UI integration
          </div>
          <Button
            onClick={() => setActiveTab('test')}
            className="gap-2"
          >
            Next: Test Integration
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
