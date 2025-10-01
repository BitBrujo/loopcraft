"use client";

import { useState } from 'react';
import { DownloadIcon, LayoutIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toPng } from 'html-to-image';

type LayoutDirection = 'horizontal' | 'vertical' | 'tree';

interface FlowControlsProps {
  onLayoutChange?: (layout: LayoutDirection) => void;
  onExport?: () => void;
}

export function FlowControls({ onLayoutChange, onExport }: FlowControlsProps) {
  const [layout, setLayout] = useState<LayoutDirection>('horizontal');

  const handleLayoutChange = (newLayout: LayoutDirection) => {
    setLayout(newLayout);
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  };

  const handleExportPNG = async () => {
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;

    try {
      const dataUrl = await toPng(flowElement, {
        backgroundColor: '#ffffff',
        quality: 1.0,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `flow-diagram-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export diagram:', error);
      alert('Failed to export diagram. Please try again.');
    }
  };

  const handleExportSVG = () => {
    if (onExport) {
      onExport();
    }
    // SVG export would require additional implementation
    alert('SVG export coming soon!');
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-card/50 p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <LayoutIcon className="size-4 text-muted-foreground" />
          <Label htmlFor="layout-select" className="text-sm font-medium">
            Layout
          </Label>
          <Select value={layout} onValueChange={(value: LayoutDirection) => handleLayoutChange(value)}>
            <SelectTrigger id="layout-select" className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="vertical">Vertical</SelectItem>
              <SelectItem value="tree">Tree</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 mr-3">
            <span className="size-2 rounded-full bg-blue-500" />
            UI Element
          </span>
          <span className="inline-flex items-center gap-1 mr-3">
            <span className="size-2 rounded-full bg-purple-500" />
            Tool
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-green-500" />
            Handler
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPNG}
          className="h-8 gap-2 text-xs"
        >
          <DownloadIcon className="size-3" />
          Export PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportSVG}
          className="h-8 gap-2 text-xs"
        >
          <DownloadIcon className="size-3" />
          Export SVG
        </Button>
      </div>
    </div>
  );
}
