'use client';

import { useState } from 'react';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { ConfigureTab } from './tabs/ConfigureTab';
import { DesignTab } from './tabs/DesignTab';
import { ExportTab } from './tabs/ExportTab';
import { Button } from '@/components/ui/button';
import { SaveDialog } from './SaveDialog';
import { LoadDialog } from './LoadDialog';
import { Save, FolderOpen, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TabId } from '@/types/ui-builder';

const tabs: Array<{ id: TabId; label: string; description: string }> = [
  { id: 'configure', label: 'Configure', description: 'Set resource URI and metadata' },
  { id: 'design', label: 'Design', description: 'Create your UI content' },
  { id: 'export', label: 'Export', description: 'Get integration code' },
];

export function BuilderLayout() {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const { activeTab, setActiveTab, resetResource } = useUIBuilderStore();

  const handleReset = () => {
    resetResource();
    setShowResetConfirmation(false);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'configure':
        return <ConfigureTab />;
      case 'design':
        return <DesignTab />;
      case 'export':
        return <ExportTab />;
      default:
        return <ConfigureTab />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MCP-UI Builder
          </h1>
          <p className="text-sm text-muted-foreground">
            Create UI resources for your MCP servers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                File
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLoadDialog(true)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowResetConfirmation(true)}
                className="text-destructive"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-muted/30">
        <div className="flex items-center px-6">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const isCompleted = tabs.findIndex(t => t.id === activeTab) > index;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-4 transition-colors border-b-2
                  ${isActive
                    ? 'border-primary text-primary font-semibold'
                    : isCompleted
                    ? 'border-green-500/30 text-muted-foreground hover:text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {isCompleted ? '✓' : index + 1}
                  </span>
                  <div className="text-left">
                    <div className="text-sm">{tab.label}</div>
                    <div className="text-xs opacity-70">{tab.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>

      {/* Dialogs */}
      <SaveDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} />
      <LoadDialog open={showLoadDialog} onOpenChange={setShowLoadDialog} />

      <Dialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Builder?</DialogTitle>
            <DialogDescription>
              This will clear all your current work and reset to a blank canvas.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
