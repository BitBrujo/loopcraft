'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ConversationMessage, ClarificationQuestion } from '@/types/conversational-builder';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ConversationPanelProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  onAnswerQuestion?: (questionId: string, answer: string) => void;
  isLoading?: boolean;
}

export function ConversationPanel({
  messages,
  onSendMessage,
  onAnswerQuestion,
  isLoading = false,
}: ConversationPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [questionInputs, setQuestionInputs] = useState<Record<string, string>>({});
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

  const handleAnswerClick = (questionId: string, answer: string) => {
    if (onAnswerQuestion) {
      onAnswerQuestion(questionId, answer);
    }
  };

  const handleQuestionInputSubmit = (questionId: string) => {
    const answer = questionInputs[questionId];
    if (answer && answer.trim() && onAnswerQuestion) {
      onAnswerQuestion(questionId, answer.trim());
      setQuestionInputs((prev) => ({ ...prev, [questionId]: '' }));
    }
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Conversation</h2>
        <p className="text-sm text-muted-foreground">
          Describe the UI component you want to create
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 h-0" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                👋 Hi! I&apos;ll help you build MCP-UI components. Tell me what you need:
              </p>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>• &quot;Create a contact form with name, email, and message fields&quot;</li>
                <li>• &quot;Build a dashboard showing user analytics with charts&quot;</li>
                <li>• &quot;I need a product gallery with image cards&quot;</li>
                <li>• &quot;Make a login form with username and password&quot;</li>
              </ul>
            </Card>
          )}

          {messages.map((message) => (
            <div key={message.id}>
              <div
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
                      {message.metadata.generatedHTML && (
                        <span className="ml-2">
                          • HTML generated
                        </span>
                      )}
                      {message.metadata.addedPlaceholders && message.metadata.addedPlaceholders.length > 0 && (
                        <span className="ml-2">
                          • {message.metadata.addedPlaceholders.length} placeholders added
                        </span>
                      )}
                      {message.metadata.addedActions && message.metadata.addedActions.length > 0 && (
                        <span className="ml-2">
                          • {message.metadata.addedActions.length} actions added
                        </span>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* Inline Questions */}
              {message.metadata?.questions && message.metadata.questions.length > 0 && (
                <div className="mt-3 ml-4 space-y-2">
                  {message.metadata.questions.map((question) => (
                    <Card
                      key={question.id}
                      className="p-3 border-blue-500/30 bg-blue-500/5"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant="outline" className="text-xs bg-blue-500/10">
                          Question
                        </Badge>
                        {question.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mb-3">{question.question}</p>

                      {question.suggestedAnswers && question.suggestedAnswers.length > 0 ? (
                        <div className="space-y-1">
                          {question.suggestedAnswers.map((answer) => (
                            <Button
                              key={answer}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-left hover:bg-blue-500/10"
                              onClick={() => handleAnswerClick(question.id, answer)}
                            >
                              {answer}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type your answer..."
                            value={questionInputs[question.id] || ''}
                            onChange={(e) =>
                              setQuestionInputs((prev) => ({
                                ...prev,
                                [question.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleQuestionInputSubmit(question.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleQuestionInputSubmit(question.id)}
                            disabled={!questionInputs[question.id]?.trim()}
                          >
                            Answer
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
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
