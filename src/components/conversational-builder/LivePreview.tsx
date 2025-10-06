'use client';

import { ServerConfig } from '@/types/server-builder';
import { UIResource } from '@/types/ui-builder';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LivePreviewProps {
  serverConfig: ServerConfig;
  uiResource?: UIResource;
}

export function LivePreview({ serverConfig, uiResource }: LivePreviewProps) {
  const hasTools = serverConfig.tools.length > 0;
  const hasResources = serverConfig.resources.length > 0;
  const hasUI = !!uiResource;

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Live Preview</h2>
        <p className="text-sm text-muted-foreground">
          {serverConfig.name || 'Untitled Server'}
        </p>
      </div>

      {/* Preview Content */}
      <ScrollArea className="flex-1 h-0">
        {!hasTools && !hasResources && !hasUI ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>Your server configuration will appear here as we build it together.</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="w-full justify-start border-b rounded-none px-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tools" disabled={!hasTools}>
                Tools {hasTools && `(${serverConfig.tools.length})`}
              </TabsTrigger>
              <TabsTrigger value="resources" disabled={!hasResources}>
                Resources {hasResources && `(${serverConfig.resources.length})`}
              </TabsTrigger>
              {hasUI && <TabsTrigger value="ui">UI</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="p-4 space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Server Information</h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Name:</dt>
                    <dd className="font-mono">{serverConfig.name || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Description:</dt>
                    <dd>{serverConfig.description || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Transport:</dt>
                    <dd className="font-mono">{serverConfig.transportType || 'stdio'}</dd>
                  </div>
                </dl>
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">Capabilities</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Tools</span>
                    <Badge variant={hasTools ? 'default' : 'secondary'}>
                      {serverConfig.tools.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Resources</span>
                    <Badge variant={hasResources ? 'default' : 'secondary'}>
                      {serverConfig.resources.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>User Interface</span>
                    <Badge variant={hasUI ? 'default' : 'secondary'}>
                      {hasUI ? 'Configured' : 'None'}
                    </Badge>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="p-4 space-y-3">
              {serverConfig.tools.map((tool) => (
                <Card key={tool.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{tool.name}</h4>
                    <Badge variant="outline">{tool.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                  {tool.parameters && tool.parameters.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Parameters:</p>
                      {tool.parameters.map((param) => (
                        <div key={param.name} className="text-xs flex items-center gap-2">
                          <code className="bg-muted px-1 rounded">{param.name}</code>
                          <span className="text-muted-foreground">
                            {param.type}
                            {param.required && ' (required)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="resources" className="p-4 space-y-3">
              {serverConfig.resources.map((resource) => (
                <Card key={resource.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{resource.name}</h4>
                    <Badge variant="outline">{resource.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-muted-foreground">URI: </span>
                      <code className="bg-muted px-1 rounded">{resource.uri}</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">MIME Type: </span>
                      <code className="bg-muted px-1 rounded">{resource.mimeType}</code>
                    </div>
                    {resource.uriVariables && resource.uriVariables.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Variables: </span>
                        {resource.uriVariables.map((v) => v.name).join(', ')}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </TabsContent>

            {hasUI && (
              <TabsContent value="ui" className="p-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">UI Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Content Type: </span>
                      <code className="bg-muted px-1 rounded">
                        {uiResource?.contentType || 'rawHtml'}
                      </code>
                    </div>
                    {uiResource?.templatePlaceholders && uiResource.templatePlaceholders.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Placeholders: </span>
                        <span>{uiResource.templatePlaceholders.length}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </ScrollArea>
    </div>
  );
}
