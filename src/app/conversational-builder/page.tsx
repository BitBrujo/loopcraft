'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConversationState } from '@/lib/stores/conversation-state-store';
import { ConversationPanel } from '@/components/conversational-builder/ConversationPanel';
import { LivePreview } from '@/components/conversational-builder/LivePreview';
import { BuildStatusPanel } from '@/components/conversational-builder/BuildStatusPanel';
import { SchemaGenerator } from '@/lib/conversational-builder/schema-generator';
import { ClarificationEngine } from '@/lib/conversational-builder/clarification-engine';
import { ConversationalContext } from '@/types/conversational-builder';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';

export default function ConversationalBuilderPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  const {
    messages,
    currentPhase,
    intent,
    entities,
    capabilities,
    pendingQuestions,
    suggestions,
    serverConfig,
    uiResource,
    actionMappings,
    customTools,
    isDeploying,
    addMessage,
    setPhase,
    setIntent,
    addEntity,
    addCapability,
    updateCapability,
    setPendingQuestions,
    clearQuestion,
    setSuggestions,
    acceptSuggestion,
    updateServerConfig,
    setUIResource,
    setActionMappings,
    createSnapshot,
    setDeploying,
    setDeployedServer,
    setDeploymentError,
    reset,
  } = useConversationState();

  const handleSendMessage = async (message: string) => {
    // Add user message
    addMessage({
      role: 'user',
      content: message,
    });

    // Build context
    const context: ConversationalContext = {
      userIntent: intent,
      detectedEntities: entities,
      requiredCapabilities: capabilities,
      currentConfig: serverConfig,
      currentUI: uiResource,
      conversationHistory: messages,
    };

    setIsLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/conversational-builder/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantMessage = '';
      let metadata: Record<string, unknown> | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'metadata') {
                metadata = parsed;
                // Update state with metadata
                if (parsed.phase) setPhase(parsed.phase);
                if (parsed.intent) setIntent(parsed.intent);
                if (parsed.entities) {
                  (parsed.entities as Array<{ type: string; value: string; context?: string }>).forEach((e) => addEntity(e as never));
                }
                if (parsed.capabilities) {
                  (parsed.capabilities as Array<{ id: string; name: string; type: string; implemented: boolean }>).forEach((c) => addCapability(c as never));
                }
                // Keep questions in pendingQuestions state for tracking answered questions
                if (parsed.questions) setPendingQuestions(parsed.questions);
                if (parsed.suggestions) {
                  // Suggestions are handled by handleAcceptSuggestion
                  setSuggestions(parsed.suggestions as never);
                }
              } else if (parsed.type === 'text') {
                assistantMessage += parsed.content;
                setStreamingMessage(assistantMessage);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Add assistant message with embedded questions
      addMessage({
        role: 'assistant',
        content: assistantMessage,
        metadata: {
          phase: metadata?.phase as never,
          questions: metadata?.questions as never, // Embed questions in message
        },
      });

      setStreamingMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    clearQuestion(questionId);
    handleSendMessage(answer);

    // Parse answer for structured data
    const parsed = ClarificationEngine.parseAnswer(questionId, answer);
    if (parsed.entities) {
      parsed.entities.forEach((e) => addEntity(e));
    }
    if (parsed.capabilities) {
      parsed.capabilities.forEach((c) => addCapability(c));
    }
  };

  const handleAcceptSuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion) return;

    // Extract template ID from suggestion ID (format: "tool-{id}" or "resource-{id}")
    const [type, templateId] = suggestionId.split('-').slice(0, 2);

    if (type === 'tool') {
      const tool = SchemaGenerator.templateToTool(templateId);
      if (tool) {
        updateServerConfig({
          tools: [...serverConfig.tools, tool],
        });
        // Mark related capabilities as implemented
        capabilities.forEach((cap) => {
          if (tool.description.toLowerCase().includes(cap.name.toLowerCase())) {
            updateCapability(cap.id, { implemented: true });
          }
        });
        createSnapshot();
      }
    } else if (type === 'resource') {
      const resource = SchemaGenerator.templateToResource(templateId);
      if (resource) {
        updateServerConfig({
          resources: [...serverConfig.resources, resource],
        });
        createSnapshot();
      }
    }

    acceptSuggestion(suggestionId);
  };

  const handleDeploy = async () => {
    if (!serverConfig.name) {
      alert('Please name your server first');
      return;
    }

    setDeploying(true);
    setDeploymentError(undefined);

    try {
      const response = await fetch('/api/ui-builder/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          serverConfig,
          uiResource,
          actionMappings,
          customTools,
        }),
      });

      if (!response.ok) {
        throw new Error('Deployment failed');
      }

      const result = await response.json();
      setDeployedServer(result.serverName);

      // Success - redirect to chat or settings
      alert('Server deployed successfully! You can now test it in chat.');
      router.push('/');
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentError(error instanceof Error ? error.message : 'Deployment failed');
      alert('Failed to deploy server. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset? This will clear all conversation history, configuration, and progress.'
      )
    ) {
      reset();
    }
  };

  const canDeploy =
    serverConfig.tools.length > 0 &&
    serverConfig.resources.length > 0 &&
    serverConfig.name.length > 0 &&
    !isDeploying;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Conversational Builder</h1>
              <p className="text-sm text-muted-foreground">
                Build MCP servers through natural conversation
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 grid grid-cols-3 overflow-hidden">
        {/* Left: Conversation */}
        <ConversationPanel
          messages={[...messages, ...(streamingMessage ? [{
            id: 'streaming',
            role: 'assistant' as const,
            content: streamingMessage,
            timestamp: new Date(),
          }] : [])]}
          onSendMessage={handleSendMessage}
          onAnswerQuestion={handleAnswerQuestion}
          isLoading={isLoading}
        />

        {/* Center: Live Preview */}
        <LivePreview serverConfig={serverConfig} uiResource={uiResource} />

        {/* Right: Build Status */}
        <BuildStatusPanel
          phase={currentPhase}
          entities={entities}
          capabilities={capabilities}
          suggestions={suggestions}
          serverConfig={serverConfig}
          onAcceptSuggestion={handleAcceptSuggestion}
          onDeploy={handleDeploy}
          canDeploy={canDeploy}
        />
      </div>
    </div>
  );
}
