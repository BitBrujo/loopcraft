'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ConversationMessage } from '@/types/conversational-builder';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationPanelProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function ConversationPanel({
  messages,
  onSendMessage,
  isLoading = false,
}: ConversationPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Conversation</h2>
        <p className="text-sm text-muted-foreground">
          Describe what your MCP server should do
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                👋 Hi! I'll help you build an MCP server. Tell me what you need:
              </p>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• "I need a server for PostgreSQL database access"</li>
                <li>• "Create a file upload system"</li>
                <li>• "Build an API wrapper for our REST service"</li>
              </ul>
            </Card>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`p-3 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                {message.metadata && (
                  <div className="mt-2 pt-2 border-t border-border/50 text-xs opacity-70">
                    Phase: {message.metadata.phase}
                    {message.metadata.generatedTools && message.metadata.generatedTools.length > 0 && (
                      <span className="ml-2">
                        • {message.metadata.generatedTools.length} tools added
                      </span>
                    )}
                    {message.metadata.generatedResources && message.metadata.generatedResources.length > 0 && (
                      <span className="ml-2">
                        • {message.metadata.generatedResources.length} resources added
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-3 bg-muted">
                <div className="flex items-center gap-2 text-sm">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Thinking...
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="resize-none"
            rows={3}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
