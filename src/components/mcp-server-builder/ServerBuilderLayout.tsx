"use client";

import { useServerBuilderStore } from "@/lib/stores/server-builder-store";
import { TemplateGalleryTab } from "./tabs/TemplateGalleryTab";
import { ManageToolsTab } from "./tabs/ManageToolsTab";
import { TestServerTab } from "./tabs/TestServerTab";
import { ChatLayout } from "@/components/chat/ChatLayout";
import type { TabId } from "@/types/server-builder";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'templates', label: 'Browse Categories' },
  { id: 'customize', label: 'Manage Tools' },
  { id: 'test', label: 'Test Server' },
];

export function ServerBuilderLayout() {
  const { activeTab, setActiveTab, serverConfig, addSelectedToolsToServer } = useServerBuilderStore();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplateGalleryTab />;
      case 'customize':
        return <ManageToolsTab />;
      case 'test':
        return <TestServerTab />;
      default:
        return <TemplateGalleryTab />;
    }
  };

  const tools = serverConfig?.tools || [];

  return (
    <ChatLayout>
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="h-14 border-b bg-card/50 backdrop-blur flex items-center justify-center px-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MCP Server Builder
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="border-b bg-muted/30">
          <div className="flex items-center justify-center px-4 py-3">
            {/* Centered Tab Container */}
            <div className="inline-flex items-center gap-1 p-1 rounded-lg ring-2 ring-orange-500/60 bg-background/50">
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                const isCompleted =
                  (tab.id === 'templates' && tools.length > 0) ||
                  (tab.id === 'customize' && tools.length > 0 && activeTab === 'test');

                // No tab locking - users can navigate freely
                const isDisabled = false;

                return (
                  <button
                    key={tab.id}
                    className={`px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-sm font-medium'
                        : isCompleted
                        ? 'hover:bg-orange-500/10 text-muted-foreground'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                    onClick={() => {
                      // Auto-commit selected tools when navigating to Manage Tools tab
                      if (tab.id === 'customize') {
                        addSelectedToolsToServer();
                      }
                      setActiveTab(tab.id);
                    }}
                    disabled={isDisabled}
                  >
                    <span className="flex items-center justify-center w-5 h-5 rounded-full border text-xs">
                      {index + 1}
                    </span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </ChatLayout>
  );
}
