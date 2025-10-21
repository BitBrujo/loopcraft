'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  Code,
  ChevronDown,
  ChevronRight,
  Search,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { categoryMetadata, getSnippetsByCategory } from '@/lib/action-snippets';
import type { ActionSnippet } from '@/lib/action-snippets';
import { copyToClipboard } from '@/lib/utils';
import { ToolSelector } from './ToolSelector';
import type { ToolCallSnippet } from '@/types/tool-selector';
import { ActionConfigForm } from './ActionConfigForm';

interface ActionSnippetsProps {
  onInsert?: (code: string) => void;
  targetServerName?: string | null;
  selectedTools?: string[];
}

// Helper function to generate companion tool snippet
function generateCompanionToolSnippet(toolName: string, serverName: string): string {
  return `<!-- Call ${toolName} from ${serverName} -->
<button
  onclick="call_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}()"
  class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
>
  Execute ${toolName}
</button>

<script>
  function call_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}() {
    window.parent.postMessage({
      type: 'tool',
      payload: {
        toolName: 'mcp_${serverName}_${toolName}',
        params: {
          // Add tool parameters here based on the tool's schema
        }
      }
    }, '*');
  }
</script>`;
}

export function ActionSnippets({ onInsert, targetServerName, selectedTools }: ActionSnippetsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showToolSelector, setShowToolSelector] = useState(false);

  const handleCopy = async (code: string, id: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      console.error('Failed to copy snippet to clipboard');
    }
  };

  // Generate companion tool snippets for selected tools from target server
  const companionSnippets: ActionSnippet[] = [];
  if (targetServerName && selectedTools && selectedTools.length > 0) {
    selectedTools.forEach(toolName => {
      companionSnippets.push({
        id: `companion-${toolName}`,
        name: `Call ${toolName}`,
        category: 'notify', // Dummy category for type compatibility
        description: `Execute ${toolName} from ${targetServerName} server`,
        code: generateCompanionToolSnippet(toolName, targetServerName)
      });
    });
  }

  // Handle tool selection from ToolSelector
  const handleToolSelect = (snippet: ToolCallSnippet) => {
    if (onInsert) {
      onInsert(snippet.fullCode);
    }
  };

  const categories = Object.keys(categoryMetadata) as Array<keyof typeof categoryMetadata>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Code className="h-4 w-4" />
            MCP-UI Actions
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setShowToolSelector(true)}
                >
                  <Search className="h-3 w-3 mr-1" />
                  Browse Tools
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Find valid MCP tools from connected servers</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-xs text-muted-foreground">
          Ready-to-use code snippets for interactive UIs
        </p>
      </div>

      {/* Tool Selector Modal */}
      <ToolSelector
        isOpen={showToolSelector}
        onClose={() => setShowToolSelector(false)}
        onToolSelect={handleToolSelect}
      />

      <ScrollArea className="flex-1 h-0">
        <div className="p-3 space-y-2">
          {/* Companion Tools Category - Only show if companion snippets exist */}
          {companionSnippets.length > 0 && (
            <Collapsible
              open={expandedCategory === 'companion'}
              onOpenChange={(open) => setExpandedCategory(open ? 'companion' : null)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto border-2 border-orange-500/30 bg-orange-50/30 dark:bg-orange-950/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🧩</span>
                    <div className="text-left">
                      <div className="font-medium text-sm text-orange-600 dark:text-orange-400">
                        Companion Tools
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tools from {targetServerName} ({companionSnippets.length} selected)
                      </div>
                    </div>
                  </div>
                  {expandedCategory === 'companion' ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 space-y-2">
                {companionSnippets.map((snippet) => (
                  <SnippetCard
                    key={snippet.id}
                    snippet={snippet}
                    isCopied={copiedId === snippet.id}
                    onCopy={(code) => handleCopy(code, snippet.id)}
                    onInsert={onInsert}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Regular Action Categories */}
          {categories.map((category) => {
            const meta = categoryMetadata[category];
            const snippets = getSnippetsByCategory(category);
            const isExpanded = expandedCategory === category;

            return (
              <Collapsible
                key={category}
                open={isExpanded}
                onOpenChange={(open) => setExpandedCategory(open ? category : null)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 h-auto"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{meta.icon}</span>
                      <div className="text-left">
                        <div className="font-medium text-sm">{meta.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {meta.description}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-2 space-y-2">
                  {snippets.map((snippet) => (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      isCopied={copiedId === snippet.id}
                      onCopy={(code) => handleCopy(code, snippet.id)}
                      onInsert={onInsert}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-muted/30">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> Click &quot;Insert Code&quot; to add snippets in the correct location
        </p>
      </div>
    </div>
  );
}

interface SnippetCardProps {
  snippet: ActionSnippet;
  isCopied: boolean;
  onCopy: (code: string) => void;
  onInsert?: (code: string) => void;
}

function SnippetCard({ snippet, isCopied, onCopy, onInsert }: SnippetCardProps) {
  const [showCode, setShowCode] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Validation status for tool snippets
  const requiresServer = snippet.requiresServer === true;
  const hasValidationNotes = snippet.validationNotes !== undefined;

  // Check if this snippet supports configuration
  const supportsConfig = snippet.category === 'prompt' || snippet.category === 'link' || snippet.category === 'notify';

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm">{snippet.name}</h4>
            <Badge variant="outline" className="text-xs">
              {snippet.category}
            </Badge>
            {requiresServer && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="text-xs flex items-center gap-1">
                      <Server className="h-3 w-3" />
                      MCP
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Requires connected MCP server</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {snippet.description}
          </p>
          {/* Validation Notes */}
          {hasValidationNotes && (
            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
              <div className="flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Validation Required
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    {snippet.validationNotes}
                  </p>
                  {snippet.exampleToolName && (
                    <p className="text-amber-600 dark:text-amber-400 mt-1 font-mono">
                      Example: {snippet.exampleToolName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Form (for prompt, link, notify) */}
      {supportsConfig && showConfig && onInsert && (
        <div className="mt-2 mb-3">
          <ActionConfigForm
            snippet={snippet}
            onInsert={(configuredCode) => {
              onInsert(configuredCode);
              setShowConfig(false);
            }}
          />
        </div>
      )}

      {showCode && (
        <div className="mt-2 mb-3">
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
            <code>{snippet.code}</code>
          </pre>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowCode(!showCode)}
          className="text-xs h-7"
        >
          <Code className="h-3 w-3 mr-1" />
          {showCode ? 'Hide' : 'View'} Code
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onCopy(snippet.code)}
          className="text-xs h-7"
        >
          {isCopied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>

        {onInsert && supportsConfig && (
          <Button
            size="sm"
            variant={showConfig ? 'secondary' : 'default'}
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs h-7 ml-auto"
          >
            {showConfig ? 'Cancel' : 'Configure & Insert'}
          </Button>
        )}

        {onInsert && !supportsConfig && (
          <Button
            size="sm"
            onClick={() => onInsert(snippet.code)}
            className="text-xs h-7 ml-auto"
          >
            Insert Code
          </Button>
        )}
      </div>
    </Card>
  );
}
