"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";

interface HTMLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMount?: OnMount;
}

export function HTMLEditor({ value, onChange, onMount }: HTMLEditorProps) {
  const { refreshPreview } = useUIBuilderStore();

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
      // Debounce preview refresh
      setTimeout(() => refreshPreview(), 500);
    }
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="html"
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        onMount={onMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
        }}
      />
    </div>
  );
}
