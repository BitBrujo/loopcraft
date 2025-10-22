'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import type { ActionSnippet } from '@/lib/action-snippets';

interface ActionConfigFormProps {
  snippet: ActionSnippet;
  onInsert: (configuredCode: string) => void;
}

export function ActionConfigForm({ snippet, onInsert }: ActionConfigFormProps) {
  const [promptMessage, setPromptMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyLevel, setNotifyLevel] = useState<'default' | 'success' | 'error' | 'warning'>('default');
  const [urlError, setUrlError] = useState('');

  // Validate URL
  const validateUrl = (url: string) => {
    if (!url) {
      setUrlError('URL is required');
      return false;
    }
    try {
      new URL(url);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Invalid URL format');
      return false;
    }
  };

  // Get placeholder value based on action type
  const getPlaceholder = () => {
    if (snippet.category === 'prompt') return snippet.placeholder || 'Enter your prompt message';
    if (snippet.category === 'link') return snippet.placeholder || 'https://example.com';
    if (snippet.category === 'notify') return snippet.placeholder || 'Enter notification message';
    return '';
  };

  // Configure code with actual values
  const configureCode = () => {
    let configuredCode = snippet.code;

    if (snippet.category === 'prompt') {
      if (!promptMessage.trim()) return;
      // Replace placeholder with actual message
      configuredCode = configuredCode.replace(
        snippet.placeholder || 'Explain how this feature works',
        promptMessage
      );
    } else if (snippet.category === 'link') {
      if (!validateUrl(linkUrl)) return;
      // Replace placeholder with actual URL
      configuredCode = configuredCode.replace(
        snippet.placeholder || 'https://example.com/docs',
        linkUrl
      );
    } else if (snippet.category === 'notify') {
      if (!notifyMessage.trim()) return;
      // Replace placeholder with actual message
      configuredCode = configuredCode.replace(
        snippet.placeholder || 'Operation completed successfully!',
        notifyMessage
      );

      // Note: Level-specific styling is handled by the snippet templates themselves
    }

    onInsert(configuredCode);
  };

  // Check if form is valid
  const isValid = () => {
    if (snippet.category === 'prompt') return promptMessage.trim().length > 0;
    if (snippet.category === 'link') return linkUrl.trim().length > 0 && !urlError;
    if (snippet.category === 'notify') return notifyMessage.trim().length > 0;
    return false;
  };

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-md border">
      {/* Prompt Configuration */}
      {snippet.category === 'prompt' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="prompt-message" className="text-xs font-medium">
              Prompt Message
            </Label>
            <Input
              id="prompt-message"
              placeholder={getPlaceholder()}
              value={promptMessage}
              onChange={(e) => setPromptMessage(e.target.value)}
              className="text-sm"
            />
          </div>
        </>
      )}

      {/* Link Configuration */}
      {snippet.category === 'link' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="link-url" className="text-xs font-medium">
              URL
            </Label>
            <Input
              id="link-url"
              type="url"
              placeholder={getPlaceholder()}
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                if (e.target.value) {
                  validateUrl(e.target.value);
                } else {
                  setUrlError('');
                }
              }}
              className="text-sm"
            />
            {urlError && (
              <div className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {urlError}
              </div>
            )}
          </div>
        </>
      )}

      {/* Notify Configuration */}
      {snippet.category === 'notify' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="notify-message" className="text-xs font-medium">
              Message
            </Label>
            <Input
              id="notify-message"
              placeholder={getPlaceholder()}
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="notify-level" className="text-xs font-medium block mb-4">
              Level
            </Label>
            <Select value={notifyLevel} onValueChange={(value) => setNotifyLevel(value as 'default' | 'success' | 'error' | 'warning')}>
              <SelectTrigger id="notify-level" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button
        size="sm"
        onClick={configureCode}
        disabled={!isValid()}
        className="w-full text-xs h-7"
      >
        Insert Configured
      </Button>
    </div>
  );
}
