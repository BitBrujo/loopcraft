"use client";

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TestRunner } from './test/TestRunner';
import { TestResultsViewer } from './test/TestResultsViewer';

/**
 * Test Tab - Test and validate the complete integration
 * Features:
 * - Execute real tool calls against connected MCP servers
 * - Request/response log viewer with filtering
 * - Parameter type validation
 * - Test history with success/error tracking
 * - Validation report summary
 * - Export test results
 */
export function TestTabContent() {
  const handleTestComplete = () => {
    // Optionally trigger validation or other side effects
  };

  return (
    <div className="h-full">
      <PanelGroup direction="horizontal">
        {/* Left: Test Runner */}
        <Panel defaultSize={50} minSize={35}>
          <TestRunner onTestComplete={handleTestComplete} />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border transition-colors hover:bg-primary" />

        {/* Right: Test Results */}
        <Panel defaultSize={50} minSize={35}>
          <TestResultsViewer />
        </Panel>
      </PanelGroup>
    </div>
  );
}
