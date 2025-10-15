'use client';

import { useState } from 'react';
import { Copy, Check, Code, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { actionSnippets, categoryMetadata, getSnippetsByCategory } from '@/lib/action-snippets';
import type { ActionSnippet } from '@/lib/action-snippets';

interface ActionSnippetsProps {
  onInsert?: (code: string) => void;
  companionMode?: 'disabled' | 'enabled';
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

export function ActionSnippets({ onInsert, companionMode, targetServerName, selectedTools }: ActionSnippetsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('tool');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate companion snippets if in companion mode
  const companionSnippets: ActionSnippet[] = [];
  if (companionMode === 'enabled' && selectedTools && selectedTools.length > 0 && targetServerName) {
    selectedTools.forEach(toolName => {
      companionSnippets.push({
        id: `companion-${toolName}`,
        name: `Call ${toolName}`,
        category: 'tool',
        description: `Execute ${toolName} from ${targetServerName} server`,
        code: generateCompanionToolSnippet(toolName, targetServerName)
      });
    });
  }

  // Merge companion snippets with regular snippets
  const allSnippets = [...companionSnippets, ...actionSnippets];

  const categories = Object.keys(categoryMetadata) as Array<keyof typeof categoryMetadata>;

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b bg-muted/30">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Code className="h-4 w-4" />
          MCP-UI Actions
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ready-to-use code snippets for interactive UIs
        </p>
      </div>

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
          💡 <strong>Tip:</strong> Click &quot;Insert&quot; to add code at cursor position
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

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{snippet.name}</h4>
            <Badge variant="outline" className="text-xs">
              {snippet.category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {snippet.description}
          </p>
        </div>
      </div>

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

        {onInsert && (
          <Button
            size="sm"
            onClick={() => onInsert(snippet.code)}
            className="text-xs h-7 ml-auto"
          >
            Insert at Cursor
          </Button>
        )}
      </div>
    </Card>
  );
}
