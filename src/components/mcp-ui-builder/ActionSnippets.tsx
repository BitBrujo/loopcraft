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
}

export function ActionSnippets({ onInsert }: ActionSnippetsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('tool');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
