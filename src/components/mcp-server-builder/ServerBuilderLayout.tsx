"use client";

import { useServerBuilderStore } from "@/lib/stores/server-builder-store";
import { TemplateGalleryTab } from "./tabs/TemplateGalleryTab";
import { CustomizeToolTab } from "./tabs/CustomizeToolTab";
import { TestServerTab } from "./tabs/TestServerTab";
import { ChatLayout } from "@/components/chat/ChatLayout";
import type { TabId } from "@/types/server-builder";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'templates', label: 'Pick Template' },
  { id: 'customize', label: 'Customize Tool' },
  { id: 'test', label: 'Test in Chat' },
];

export function ServerBuilderLayout() {
  const { activeTab, setActiveTab, activeTool } = useServerBuilderStore();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplateGalleryTab />;
      case 'customize':
        return <CustomizeToolTab />;
      case 'test':
        return <TestServerTab />;
      default:
        return <TemplateGalleryTab />;
    }
  };

  return (
    <ChatLayout>
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="h-14 border-b bg-card/50 backdrop-blur flex items-center justify-center px-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            MCP Server Builder
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="border-b bg-muted/30">
          <div className="flex items-center justify-center px-4 py-3">
            {/* Centered Tab Container */}
            <div className="inline-flex items-center gap-1 p-1 rounded-lg ring-2 ring-blue-500/60 bg-background/50">
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                const isCompleted =
                  (tab.id === 'templates' && activeTool) ||
                  (tab.id === 'customize' && activeTool && activeTab === 'test');

                // Disable tabs until previous steps are complete
                const isDisabled =
                  (tab.id === 'customize' && !activeTool) ||
                  (tab.id === 'test' && !activeTool);

                return (
                  <button
                    key={tab.id}
                    className={`px-4 py-2 text-sm rounded-md transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-sm font-medium'
                        : isDisabled
                        ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                        : isCompleted
                        ? 'hover:bg-blue-500/10 text-muted-foreground'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    }`}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
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
        <div className="flex-1 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
    </ChatLayout>
  );
}
