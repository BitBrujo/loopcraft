"use client";

import { useState } from "react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";
import { ConfigureTab } from "./tabs/ConfigureTab";
import { DesignTab } from "./tabs/DesignTab";
import { CompositionTab } from "./tabs/CompositionTab";
import { ExportTab } from "./tabs/ExportTab";
import { Button } from "@/components/ui/button";
import { SaveDialog } from "./SaveDialog";
import { LoadDialog } from "./LoadDialog";
import { Save, FolderOpen, RotateCcw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TabId } from "@/types/ui-builder";

const tabs: Array<{ id: TabId; label: string; description: string }> = [
    {
        id: "configure",
        label: "Select Server & Tools",
        description: "Choose target server and tools",
    },
    { id: "design", label: "Design UI", description: "Create your UI content" },
    { id: "composition", label: "Composition", description: "Build interactive patterns" },
    { id: "export", label: "Deploy Companion", description: "Deploy portable server" },
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
            case "configure":
                return <ConfigureTab />;
            case "design":
                return <DesignTab />;
            case "composition":
                return <CompositionTab />;
            case "export":
                return <ExportTab />;
            default:
                return <ConfigureTab />;
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header - Centered */}
            <div className="border-b bg-card px-6 py-4 relative">
                <div className="text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        MCP-UI Builder
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Create UI resources for your MCP servers
                    </p>
                </div>

                {/* Reset Button and File Dropdown - Absolute Right */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 text-destructive hover:bg-destructive/10"
                        onClick={() => setShowResetConfirmation(true)}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Save className="h-4 w-4" />
                                File
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => setShowSaveDialog(true)}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save Template
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setShowLoadDialog(true)}
                            >
                                <FolderOpen className="h-4 w-4 mr-2" />
                                Load Template
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Body: Vertical Tabs + Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Vertical Tab Sidebar */}
                <aside className="w-56 border-r bg-muted/30 p-4 overflow-y-auto">
                    <div className="space-y-2">
                        {tabs.map((tab, index) => {
                            const isActive = activeTab === tab.id;
                            const isCompleted =
                                tabs.findIndex((t) => t.id === activeTab) > index;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    w-full text-left px-4 py-3 rounded-lg transition-all
                    ${
                        isActive
                            ? "border-2 border-primary text-primary bg-transparent hover:bg-primary/5"
                            : isCompleted
                              ? "border-2 border-green-500 text-green-600 bg-transparent hover:bg-green-500/5"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }
                  `}
                                >
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={`
                      flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5
                      ${
                          isActive
                              ? "border-2 border-primary text-primary bg-transparent"
                              : isCompleted
                                ? "border-2 border-green-500 text-green-600 bg-transparent"
                                : "bg-muted text-muted-foreground"
                      }
                    `}
                                        >
                                            {isCompleted ? "✓" : index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">
                                                {tab.label}
                                            </div>
                                            <div className="text-xs opacity-70 mt-0.5">
                                                {tab.description}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden">
                    {renderActiveTab()}
                </div>
            </div>

            {/* Dialogs */}
            <SaveDialog
                open={showSaveDialog}
                onOpenChange={setShowSaveDialog}
            />
            <LoadDialog
                open={showLoadDialog}
                onOpenChange={setShowLoadDialog}
            />

            <Dialog
                open={showResetConfirmation}
                onOpenChange={setShowResetConfirmation}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Builder?</DialogTitle>
                        <DialogDescription>
                            This will clear all your current work and reset to a
                            blank canvas. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowResetConfirmation(false)}
                        >
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
