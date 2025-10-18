"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Copy,
  Check,
  Server,
  Wrench,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { ToolInfo, ToolSelectorProps, ServerGroup } from '@/types/tool-selector';
import { generateValidatedSnippet } from '@/lib/tool-validation';
import { toast } from '@/lib/hooks/use-toast';

export function ToolSelector({ isOpen, onClose, onToolSelect, preselectedServer }: ToolSelectorProps) {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSnippetType, setSelectedSnippetType] = useState<'button' | 'form' | 'async'>('button');
  const [copiedTool, setCopiedTool] = useState<string | null>(null);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());

  // Fetch available tools from API
  useEffect(() => {
    if (!isOpen) return;

    const fetchTools = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/mcp/tools', { headers });

        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }

        const data = await response.json();
        setTools(data.tools || []);

        // Expand all servers by default
        const serverNames = new Set(data.tools.map((t: ToolInfo) => t.serverName));
        setExpandedServers(serverNames);
      } catch (err) {
        console.error('Error fetching tools:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tools');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, [isOpen]);

  // Group tools by server
  const serverGroups = useMemo((): ServerGroup[] => {
    const grouped = new Map<string, ToolInfo[]>();

    for (const tool of tools) {
      const serverName = tool.serverName;
      if (!grouped.has(serverName)) {
        grouped.set(serverName, []);
      }
      grouped.get(serverName)!.push(tool);
    }

    return Array.from(grouped.entries()).map(([serverName, serverTools]) => ({
      serverName,
      tools: serverTools,
      isConnected: true,
      hasUIResources: false, // Could enhance this later
    }));
  }, [tools]);

  // Filter tools by search query
  const filteredGroups = useMemo((): ServerGroup[] => {
    if (!searchQuery) {
      return preselectedServer
        ? serverGroups.filter(g => g.serverName === preselectedServer)
        : serverGroups;
    }

    const query = searchQuery.toLowerCase();

    return serverGroups
      .map(group => ({
        ...group,
        tools: group.tools.filter(tool =>
          tool.name.toLowerCase().includes(query) ||
          tool.description?.toLowerCase().includes(query)
        ),
      }))
      .filter(group => group.tools.length > 0);
  }, [serverGroups, searchQuery, preselectedServer]);

  // Handle tool selection
  const handleToolSelect = (tool: ToolInfo) => {
    const snippet = generateValidatedSnippet(tool, selectedSnippetType);
    onToolSelect(snippet);
    onClose();
  };

  // Handle copy to clipboard
  const handleCopy = async (tool: ToolInfo) => {
    const snippet = generateValidatedSnippet(tool, selectedSnippetType);

    try {
      await navigator.clipboard.writeText(snippet.fullCode);
      setCopiedTool(tool.name);

      toast({
        message: `Copied ${tool.name} snippet to clipboard!`,
        variant: 'success',
      });

      setTimeout(() => setCopiedTool(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast({
        message: 'Failed to copy to clipboard',
        variant: 'error',
      });
    }
  };

  // Toggle server expansion
  const toggleServer = (serverName: string) => {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverName)) {
      newExpanded.delete(serverName);
    } else {
      newExpanded.add(serverName);
    }
    setExpandedServers(newExpanded);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Browse MCP Tools</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select a tool to generate validated code snippets
          </p>
        </DialogHeader>

        {/* Snippet Type Selector */}
        <div className="flex gap-2 border-b pb-3">
          <Button
            variant={selectedSnippetType === 'button' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSnippetType('button')}
          >
            Button
          </Button>
          <Button
            variant={selectedSnippetType === 'form' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSnippetType('form')}
          >
            Form
          </Button>
          <Button
            variant={selectedSnippetType === 'async' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSnippetType('async')}
          >
            Async with Response
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools by name or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tool List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading tools...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12 text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-3" />
              <p className="text-lg font-medium">No tools found</p>
              <p className="text-sm">
                {searchQuery
                  ? 'Try a different search query'
                  : 'Connect MCP servers in Settings to see available tools'}
              </p>
            </div>
          )}

          {!isLoading && !error && filteredGroups.length > 0 && (
            <div className="space-y-4">
              {filteredGroups.map(group => (
                <div key={group.serverName} className="border rounded-lg overflow-hidden">
                  {/* Server Header */}
                  <button
                    onClick={() => toggleServer(group.serverName)}
                    className="w-full flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {expandedServers.has(group.serverName) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Server className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{group.serverName}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {group.tools.length} {group.tools.length === 1 ? 'tool' : 'tools'}
                    </Badge>
                  </button>

                  {/* Tools */}
                  {expandedServers.has(group.serverName) && (
                    <div className="divide-y">
                      {group.tools.map(tool => (
                        <div key={tool.name} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start gap-3">
                            <Wrench className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono font-medium">
                                  {tool.name}
                                </code>
                              </div>
                              {tool.description && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {tool.description}
                                </p>
                              )}

                              {/* Parameters */}
                              {tool.inputSchema?.properties && (
                                <div className="text-xs space-y-1 mb-3">
                                  <p className="font-medium text-muted-foreground">Parameters:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(tool.inputSchema.properties).map(([paramName, paramSchema]) => {
                                      const isRequired = tool.inputSchema?.required?.includes(paramName);
                                      return (
                                        <Badge
                                          key={paramName}
                                          variant="outline"
                                          className="font-mono text-xs"
                                        >
                                          {paramName}
                                          <span className="text-muted-foreground ml-1">
                                            : {paramSchema.type}
                                          </span>
                                          {isRequired && (
                                            <span className="text-destructive ml-1">*</span>
                                          )}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleToolSelect(tool)}
                                >
                                  Insert Code
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopy(tool)}
                                >
                                  {copiedTool === tool.name ? (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4 mr-1" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
