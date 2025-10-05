"use client";

import Editor from "@monaco-editor/react";
import { useUIBuilderStore } from "@/lib/stores/ui-builder-store";

interface RemoteDomEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const exampleScript = `// Remote DOM script example
// This script will be executed in a sandboxed environment

export default function render(root, { data }) {
  const container = root.appendChild(
    root.createComponent('div', {
      style: { padding: '20px', fontFamily: 'system-ui' }
    })
  );

  container.appendChild(
    root.createComponent('h2', {}, 'Hello from Remote DOM!')
  );

  container.appendChild(
    root.createComponent('p', {},
      \`This UI is rendered using Remote DOM. Data: \${JSON.stringify(data)}\`
    )
  );

  // You can create interactive elements
  const button = container.appendChild(
    root.createComponent('button', {
      style: {
        padding: '10px 20px',
        background: '#0066cc',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }
    }, 'Click Me')
  );

  button.addEventListener('click', () => {
    // Send a tool call to the host
    root.postMessage({
      type: 'tool',
      payload: {
        toolName: 'exampleTool',
        params: { clicked: true }
      }
    });
  });
}`;

export function RemoteDomEditor({ value, onChange }: RemoteDomEditorProps) {
  const { refreshPreview } = useUIBuilderStore();

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
      // Debounce preview refresh
      setTimeout(() => refreshPreview(), 500);
    }
  };

  const loadExample = () => {
    onChange(exampleScript);
    setTimeout(() => refreshPreview(), 500);
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Remote DOM JavaScript
        </p>
        <button
          onClick={loadExample}
          className="text-sm text-primary hover:underline"
        >
          Load Example
        </button>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={value || exampleScript}
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
    </div>
  );
}
