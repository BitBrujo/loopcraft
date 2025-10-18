"use client";

import { useMemo, useRef, useEffect } from "react";
import type { UIResource } from "@/types/ui-builder";

interface ClientPreviewProps {
  resource: UIResource;
}

export function ClientPreview({ resource }: ClientPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Replace placeholders with test data
  const processedContent = useMemo(() => {
    if (resource.contentType !== "rawHtml") {
      return resource.content;
    }

    let html = resource.content;

    // Replace placeholders with test data if available
    if (resource.placeholderTestData) {
      Object.entries(resource.placeholderTestData).forEach(([placeholder, value]) => {
        // Escape special regex characters in placeholder name
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\{\\{${escapedPlaceholder}\\}\\}`, "g");
        html = html.replace(regex, value);
      });
    }

    return html;
  }, [resource.content, resource.contentType, resource.placeholderTestData]);

  // Extract UI metadata
  const preferredFrameSize = resource.uiMetadata?.["preferred-frame-size"] || ["800px", "600px"];
  const sandboxPermissions =
    resource.uiMetadata?.["sandbox-permissions"] || "allow-forms allow-scripts allow-same-origin";
  const containerStyle = resource.uiMetadata?.["container-style"];
  const autoResize = resource.uiMetadata?.["auto-resize-iframe"];

  // Auto-resize iframe when enabled
  // Two-phase rendering: Shows at preferred size initially, then auto-resizes to content
  useEffect(() => {
    if (!iframeRef.current || !autoResize) return;

    const iframe = iframeRef.current;
    const resizeIframe = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Determine which dimensions to auto-resize
        const resizeWidth = typeof autoResize === 'boolean'
          ? autoResize
          : autoResize.width === true;
        const resizeHeight = typeof autoResize === 'boolean'
          ? autoResize
          : autoResize.height === true;

        if (resizeHeight) {
          const contentHeight = iframeDoc.body.scrollHeight;
          iframe.style.height = `${contentHeight}px`;
        }

        if (resizeWidth) {
          const contentWidth = iframeDoc.body.scrollWidth;
          iframe.style.width = `${contentWidth}px`;
        }
      } catch (error) {
        // Cross-origin restrictions or other errors - fail silently
        console.debug('Auto-resize failed:', error);
      }
    };

    // Delayed resize to allow initial render at preferred size
    // This creates a two-phase rendering: preferred size → auto-resize to content
    const handleLoad = () => {
      // Wait for content to render at preferred size before auto-resizing
      setTimeout(resizeIframe, 100);
    };

    iframe.addEventListener('load', handleLoad);

    // Set up ResizeObserver for dynamic content changes
    let observer: ResizeObserver | null = null;
    iframe.addEventListener('load', () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc?.body) {
          observer = new ResizeObserver(resizeIframe);
          observer.observe(iframeDoc.body);
        }
      } catch (error) {
        console.debug('ResizeObserver setup failed:', error);
      }
    });

    return () => {
      iframe.removeEventListener('load', handleLoad);
      observer?.disconnect();
    };
  }, [autoResize, processedContent]);

  // Build iframe style
  // Note: Use !== undefined check to distinguish between empty string (user wants none) and undefined (use default)
  // Note: Only set borderColor if border shorthand is not set (React warns about mixing shorthand and specific properties)
  const iframeStyle: React.CSSProperties = {
    width: preferredFrameSize[0],
    height: preferredFrameSize[1],
    maxWidth: "100%",
    border: containerStyle?.border !== undefined ? containerStyle.border : "1px solid #e5e7eb",
    // Only include borderColor if border shorthand is not explicitly set by user
    ...(containerStyle?.border === undefined && containerStyle?.borderColor ? { borderColor: containerStyle.borderColor } : {}),
    borderRadius: containerStyle?.borderRadius !== undefined ? containerStyle.borderRadius : "8px",
    minHeight: containerStyle?.minHeight,
  };

  // Render based on content type
  if (resource.contentType === "rawHtml") {
    return (
      <div className="w-full flex justify-center">
        <iframe
          ref={iframeRef}
          srcDoc={processedContent}
          sandbox={sandboxPermissions}
          style={iframeStyle}
          title={resource.uiMetadata?.["iframe-title"] || resource.metadata?.title || "UI Preview"}
          className="bg-white dark:bg-gray-900"
        />
      </div>
    );
  }

  if (resource.contentType === "externalUrl") {
    // Validate URL
    if (!resource.content.trim()) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          💡 Enter a URL in the Design tab to see preview
        </div>
      );
    }

    return (
      <div className="w-full flex justify-center">
        <iframe
          ref={iframeRef}
          src={resource.content}
          sandbox={sandboxPermissions}
          style={iframeStyle}
          title={resource.uiMetadata?.["iframe-title"] || resource.metadata?.title || "UI Preview"}
          className="bg-white dark:bg-gray-900"
        />
      </div>
    );
  }

  if (resource.contentType === "remoteDom") {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-sm mb-2">⚙️ Remote DOM Preview</p>
          <p className="text-xs">Remote DOM preview is coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Unknown content type
    </div>
  );
}
