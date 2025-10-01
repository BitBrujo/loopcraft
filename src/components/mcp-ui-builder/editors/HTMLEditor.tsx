"use client";

import { useTheme } from "next-themes";
import Editor from "@monaco-editor/react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";

interface HTMLEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function HTMLEditor({ value, onChange }: HTMLEditorProps) {
  const { theme } = useTheme();
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
        theme={theme === "dark" ? "vs-dark" : "vs"}
        value={value}
        onChange={handleChange}
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
