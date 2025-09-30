"use client";

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  DatabaseIcon,
  SettingsIcon,
  ActivityIcon,
  BugIcon,
  TerminalIcon,
  RefreshCwIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { ResourceExplorer } from '@/components/dashboard/ResourceExplorer';
import { ConfigEditor } from '@/components/dashboard/ConfigEditor';
import { MetricsDashboard } from '@/components/dashboard/MetricsDashboard';
import { DebuggerPanel } from '@/components/dashboard/DebuggerPanel';
import { ConsolePanel } from '@/components/dashboard/ConsolePanel';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { activePanel, setActivePanel, triggerRefresh } = useDashboardStore();
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');

  const panels = [
    { id: 'resources', label: 'Resources', icon: DatabaseIcon, component: ResourceExplorer },
    { id: 'config', label: 'Config', icon: SettingsIcon, component: ConfigEditor },
    { id: 'metrics', label: 'Metrics', icon: ActivityIcon, component: MetricsDashboard },
    { id: 'debugger', label: 'Debugger', icon: BugIcon, component: DebuggerPanel },
    { id: 'console', label: 'Console', icon: TerminalIcon, component: ConsolePanel },
  ];

  const ActiveComponent = panels.find(p => p.id === activePanel)?.component || ResourceExplorer;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card/30 px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">MCP-UI Lab Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerRefresh}
            className="gap-2"
          >
            <RefreshCwIcon className="size-4" />
            Reload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLayout(layout === 'horizontal' ? 'vertical' : 'horizontal')}
          >
            {layout === 'horizontal' ? 'Vertical' : 'Horizontal'} Layout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <PanelGroup direction={layout === 'horizontal' ? 'horizontal' : 'vertical'} className="flex-1">
        {/* Sidebar with panel tabs */}
        <Panel defaultSize={15} minSize={10} maxSize={20}>
          <div className="flex h-full flex-col border-r border-border bg-card/30 p-2">
            <nav className="space-y-1">
              {panels.map((panel) => {
                const Icon = panel.icon;
                return (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id as typeof activePanel)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      activePanel === panel.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {panel.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-primary" />

        {/* Main panel area */}
        <Panel defaultSize={85} minSize={50}>
          <div className="h-full overflow-auto">
            <ActiveComponent />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}