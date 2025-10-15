'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { UIResource } from '@/types/ui-builder';

interface DeploymentStep {
  step: number;
  total: number;
  message: string;
  status: 'pending' | 'running' | 'success' | 'error';
  logs?: string;
}

interface DeploymentResult {
  success: boolean;
  serverName?: string;
  filePath?: string;
  message?: string;
  error?: string;
}

interface DeploymentProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: UIResource;
  format: 'standalone' | 'fastmcp';
  language: 'typescript' | 'javascript';
  onDeploymentComplete?: (result: DeploymentResult) => void;
}

const DEPLOYMENT_STEPS = [
  'Writing server file to disk',
  'Installing dependencies',
  'Testing server startup',
  'Validating MCP protocol',
  'Adding to database',
  'Enabling and connecting server'
];

export function DeploymentProgressModal({
  open,
  onOpenChange,
  resource,
  format,
  language,
  onDeploymentComplete
}: DeploymentProgressModalProps) {
  const [steps, setSteps] = useState<DeploymentStep[]>(
    DEPLOYMENT_STEPS.map((message, index) => ({
      step: index + 1,
      total: DEPLOYMENT_STEPS.length,
      message,
      status: 'pending' as const
    }))
  );
  const [result, setResult] = useState<DeploymentResult | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    if (open && !isDeploying && !result) {
      startDeployment();
    }
  }, [open]);

  const startDeployment = async () => {
    setIsDeploying(true);
    setResult(null);

    try {
      const response = await fetch('/api/ui-builder/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          resource,
          format,
          language
        })
      });

      if (!response.ok) {
        throw new Error(`Deployment request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            // Check if it's a step update
            if ('step' in data && 'status' in data) {
              const stepUpdate: DeploymentStep = data;
              setSteps(prev =>
                prev.map(s =>
                  s.step === stepUpdate.step
                    ? { ...s, ...stepUpdate }
                    : s
                )
              );
            }

            // Check if it's the final result
            if ('success' in data) {
              const finalResult: DeploymentResult = data;
              setResult(finalResult);
              onDeploymentComplete?.(finalResult);
            }
          } catch (error) {
            console.error('Failed to parse deployment update:', error);
          }
        }
      }
    } catch (error) {
      console.error('Deployment error:', error);
      const errorResult: DeploymentResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed'
      };
      setResult(errorResult);
      onDeploymentComplete?.(errorResult);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClose = () => {
    if (!isDeploying) {
      onOpenChange(false);
      // Reset state for next deployment
      setTimeout(() => {
        setSteps(
          DEPLOYMENT_STEPS.map((message, index) => ({
            step: index + 1,
            total: DEPLOYMENT_STEPS.length,
            message,
            status: 'pending' as const
          }))
        );
        setResult(null);
      }, 300);
    }
  };

  const currentStep = steps.find(s => s.status === 'running')?.step || 0;
  const completedSteps = steps.filter(s => s.status === 'success').length;
  const progress = (completedSteps / DEPLOYMENT_STEPS.length) * 100;
  const hasError = result?.success === false || steps.some(s => s.status === 'error');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDeploying && <Loader2 className="h-5 w-5 animate-spin" />}
            {!isDeploying && result?.success && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {!isDeploying && result?.success === false && <AlertCircle className="h-5 w-5 text-red-600" />}
            Quick Deploy
          </DialogTitle>
          <DialogDescription>
            {isDeploying && `Deploying ${format} server...`}
            {!isDeploying && result?.success && 'Deployment completed successfully!'}
            {!isDeploying && result?.success === false && 'Deployment failed'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Progress Bar */}
          {isDeploying && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Step {currentStep} of {DEPLOYMENT_STEPS.length}
              </p>
            </div>
          )}

          {/* Step List */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.step}
                className={`p-3 rounded-lg border ${
                  step.status === 'success'
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    : step.status === 'running'
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                    : step.status === 'error'
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                    : 'bg-muted border-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'success' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {step.status === 'running' && (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    )}
                    {step.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    {step.status === 'pending' && (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        step.status === 'success'
                          ? 'text-green-900 dark:text-green-100'
                          : step.status === 'running'
                          ? 'text-blue-900 dark:text-blue-100'
                          : step.status === 'error'
                          ? 'text-red-900 dark:text-red-100'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.message}
                    </p>

                    {/* Step Logs */}
                    {step.logs && (
                      <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                        {step.logs}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final Result */}
          {result && (
            <div className="mt-6">
              {result.success ? (
                <Alert className="border-green-500/30 bg-green-50/30 dark:bg-green-950/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      {result.message || 'Deployment successful!'}
                    </p>
                    {result.serverName && (
                      <p className="mt-2 text-sm text-green-800 dark:text-green-200">
                        Server Name: <code className="bg-green-100 dark:bg-green-900 px-1 rounded">{result.serverName}</code>
                      </p>
                    )}
                    {result.filePath && (
                      <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                        File Path: <code className="bg-green-100 dark:bg-green-900 px-1 rounded text-xs">{result.filePath}</code>
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold">{result.error || 'Deployment failed'}</p>
                    <p className="mt-2 text-sm">
                      Please check the logs above for more details, or try deploying manually using the generated code.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            {result?.success && (
              <Link href="/chat">
                <Button variant="default" className="gap-2">
                  Test in Chat
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button
              variant={result?.success ? 'outline' : 'default'}
              onClick={handleClose}
              disabled={isDeploying}
            >
              {isDeploying ? 'Deploying...' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
