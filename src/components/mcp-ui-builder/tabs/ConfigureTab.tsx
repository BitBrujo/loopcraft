'use client';

import { useEffect, useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Component, Puzzle, ArrowRight, ArrowLeft } from 'lucide-react';
import type { ContentType } from '@/types/ui-builder';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompanionWizard } from '../CompanionWizard';

interface MCPServer {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
}

export function ConfigureTab() {
  const {
    currentResource,
    updateResource,
    targetServerName,
    availableTools,
    selectedTools,
    setTargetServerName,
    setAvailableTools,
    toggleToolSelection,
    setActiveTab,
  } = useUIBuilderStore();
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [serverFetchError, setServerFetchError] = useState<string | null>(null);

  // Fetch MCP servers on mount
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setServerFetchError('Please log in to load your MCP servers');
          return;
        }

        const response = await fetch('/api/mcp-servers', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMcpServers(data || []);
          setServerFetchError(null);
        } else if (response.status === 401) {
          setServerFetchError('Session expired. Please log in again.');
        } else {
          setServerFetchError(`Failed to load servers (${response.status}). Please try again.`);
        }
      } catch (error) {
        console.error('Failed to fetch MCP servers:', error);
        setServerFetchError('Network error. Please check your connection and try again.');
      }
    };

    fetchServers();
  }, []);

  if (!currentResource) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No resource loaded</AlertDescription>
      </Alert>
    );
  }

  const handleContentTypeChange = (value: ContentType) => {
    // Clear content when switching content types to avoid stale data
    updateResource({
      contentType: value,
      content: '' // Reset content when changing type
    });
  };

  const handleTargetServerChange = async (serverName: string) => {
    setTargetServerName(serverName);

    // Fetch available tools from this server
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mcp/servers/${serverName}/tools`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableTools(data.tools || []);
      } else {
        setAvailableTools([]);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      setAvailableTools([]);
    }

    // Auto-fill URI with server name and default resource name
    if (serverName) {
      updateResource({
        uri: `ui://${serverName}-ui/resource`
      });
    }
  };

  const enabledServers = mcpServers.filter(s => s.enabled);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-5xl mx-auto pb-20">
        {/* Error State */}
        {serverFetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error loading servers:</strong> {serverFetchError}
              {serverFetchError.includes('log in') && (
                <a href="/login" className="block mt-2 underline text-sm">
                  Go to Login →
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Companion Wizard - 4-Step Workflow */}
        <CompanionWizard
          targetServerName={targetServerName}
          availableTools={availableTools}
          selectedTools={selectedTools}
          enabledServers={enabledServers}
          currentResource={currentResource}
          onTargetServerChange={handleTargetServerChange}
          onToolToggle={toggleToolSelection}
          updateResource={updateResource}
          handleContentTypeChange={handleContentTypeChange}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}
