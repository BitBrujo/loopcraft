"use client";

import { useState } from 'react';
import {
  SearchIcon,
  LayoutDashboardIcon,
  FormInputIcon,
  MousePointerClickIcon,
  TableIcon,
  ImageIcon,
  FileCodeIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUIBuilderStore, type UIResourceDraft } from '@/lib/stores/ui-builder-store';
import { cn } from '@/lib/utils';

interface TemplateCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  templates: BuiltInTemplate[];
}

interface BuiltInTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: UIResourceDraft;
}

const BUILT_IN_TEMPLATES: TemplateCategory[] = [
  {
    id: 'dashboards',
    name: 'Dashboards',
    icon: LayoutDashboardIcon,
    templates: [
      {
        id: 'metrics-dashboard',
        name: 'Metrics Dashboard',
        description: 'Real-time metrics display with action buttons',
        category: 'dashboards',
        resource: {
          uri: 'ui://templates/metrics-dashboard',
          contentType: 'rawHtml',
          content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui; padding: 20px; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .dashboard { max-width: 600px; margin: 0 auto; }
    h2 { margin-top: 0; }
    .card { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 15px 0; backdrop-filter: blur(10px); }
    .metric { display: flex; justify-content: space-between; align-items: center; margin: 10px 0; }
    .metric-value { font-size: 24px; font-weight: bold; }
    button { background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s; width: 100%; margin-top: 10px; }
    button:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="dashboard">
    <h2>📊 Metrics Dashboard</h2>
    <div class="card">
      <h3>System Metrics</h3>
      <div class="metric"><span>Active Connections</span><span class="metric-value" id="connections">3</span></div>
      <div class="metric"><span>Tool Calls</span><span class="metric-value" id="toolcalls">127</span></div>
      <div class="metric"><span>Success Rate</span><span class="metric-value" id="success">98%</span></div>
    </div>
    <div class="card">
      <h3>Quick Actions</h3>
      <button onclick="window.parent.postMessage({type: 'tool', payload: {toolName: 'refresh-metrics', params: {timestamp: new Date().toISOString()}}}, '*')">🔄 Refresh Metrics</button>
      <button onclick="window.parent.postMessage({type: 'tool', payload: {toolName: 'export-data', params: {format: 'csv'}}}, '*')">📥 Export Data</button>
    </div>
  </div>
  <script>
    setInterval(() => {
      const rand = () => Math.floor(Math.random() * 10);
      document.getElementById('connections').textContent = 3 + rand();
      document.getElementById('toolcalls').textContent = 127 + rand() * 5;
      document.getElementById('success').textContent = (95 + rand() * 0.5).toFixed(1) + '%';
    }, 3000);
  </script>
</body>
</html>`,
          title: 'Metrics Dashboard',
          description: 'Interactive dashboard with live metrics',
          preferredSize: { width: 650, height: 500 },
          initialData: { theme: 'dark', refreshInterval: 3000 },
        },
      },
    ],
  },
  {
    id: 'forms',
    name: 'Forms',
    icon: FormInputIcon,
    templates: [
      {
        id: 'contact-form',
        name: 'Contact Form',
        description: 'Form with validation and submission',
        category: 'forms',
        resource: {
          uri: 'ui://templates/contact-form',
          contentType: 'rawHtml',
          content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui; padding: 24px; margin: 0; background: #f8f9fa; }
    .form-container { max-width: 400px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h3 { margin-top: 0; color: #333; }
    label { display: block; margin-top: 16px; margin-bottom: 4px; font-weight: 500; color: #555; }
    input, select, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
    textarea { resize: vertical; min-height: 80px; }
    button { margin-top: 20px; width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
    button:hover { background: #5568d3; }
  </style>
</head>
<body>
  <div class="form-container">
    <h3>📝 Contact Form</h3>
    <form id="contactForm">
      <label for="name">Name</label>
      <input type="text" id="name" required>
      <label for="email">Email</label>
      <input type="email" id="email" required>
      <label for="category">Category</label>
      <select id="category">
        <option>General Inquiry</option>
        <option>Technical Support</option>
        <option>Feature Request</option>
        <option>Bug Report</option>
      </select>
      <label for="message">Message</label>
      <textarea id="message" required></textarea>
      <button type="submit">Submit</button>
    </form>
  </div>
  <script>
    document.getElementById('contactForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        category: document.getElementById('category').value,
        message: document.getElementById('message').value,
      };
      window.parent.postMessage({type: 'tool', payload: {toolName: 'submit-form', params: formData}}, '*');
      window.parent.postMessage({type: 'notify', payload: {message: 'Form submitted successfully!'}}, '*');
      e.target.reset();
    });
  </script>
</body>
</html>`,
          title: 'Interactive Contact Form',
          description: 'Form with submission handling',
          preferredSize: { width: 450, height: 550 },
        },
      },
    ],
  },
  {
    id: 'interactive',
    name: 'Interactive',
    icon: MousePointerClickIcon,
    templates: [
      {
        id: 'action-buttons',
        name: 'Action Buttons',
        description: 'Set of interactive buttons with tool calls',
        category: 'interactive',
        resource: {
          uri: 'ui://templates/action-buttons',
          contentType: 'rawHtml',
          content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui; padding: 20px; background: #f0f4f8; }
    .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
    h2 { margin-top: 0; color: #333; }
    .button-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
    button { padding: 16px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: #667eea; color: white; }
    .btn-success { background: #48bb78; color: white; }
    .btn-warning { background: #ed8936; color: white; }
    .btn-danger { background: #f56565; color: white; }
    button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  </style>
</head>
<body>
  <div class="container">
    <h2>🎯 Action Buttons</h2>
    <p>Click any button to trigger an action:</p>
    <div class="button-grid">
      <button class="btn-primary" onclick="callTool('action-1', {type: 'primary'})">Primary Action</button>
      <button class="btn-success" onclick="callTool('action-2', {type: 'success'})">Success Action</button>
      <button class="btn-warning" onclick="callTool('action-3', {type: 'warning'})">Warning Action</button>
      <button class="btn-danger" onclick="callTool('action-4', {type: 'danger'})">Danger Action</button>
    </div>
  </div>
  <script>
    function callTool(action, params) {
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'handle-button-action',
          params: { action, ...params, timestamp: new Date().toISOString() }
        }
      }, '*');
    }
  </script>
</body>
</html>`,
          title: 'Interactive Action Buttons',
          description: 'Grid of styled buttons triggering tool calls',
          preferredSize: { width: 550, height: 400 },
        },
      },
    ],
  },
  {
    id: 'data',
    name: 'Data Display',
    icon: TableIcon,
    templates: [
      {
        id: 'data-table',
        name: 'Data Table',
        description: 'Sortable table with row selection',
        category: 'data',
        resource: {
          uri: 'ui://templates/data-table',
          contentType: 'rawHtml',
          content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }
    th { background: #f8f8f8; font-weight: 600; cursor: pointer; user-select: none; }
    th:hover { background: #ececec; }
    tr:hover { background: #f9f9f9; }
    .actions { margin: 20px; }
    button { padding: 10px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 8px; }
    button:hover { background: #5568d3; }
  </style>
</head>
<body>
  <div class="container">
    <div class="actions">
      <button onclick="exportData()">📥 Export CSV</button>
      <button onclick="refreshData()">🔄 Refresh</button>
    </div>
    <table id="dataTable">
      <thead>
        <tr>
          <th onclick="sortTable(0)">ID ▼</th>
          <th onclick="sortTable(1)">Name ▼</th>
          <th onclick="sortTable(2)">Status ▼</th>
          <th onclick="sortTable(3)">Value ▼</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>Item Alpha</td><td>Active</td><td>$125</td></tr>
        <tr><td>2</td><td>Item Beta</td><td>Pending</td><td>$89</td></tr>
        <tr><td>3</td><td>Item Gamma</td><td>Active</td><td>$210</td></tr>
        <tr><td>4</td><td>Item Delta</td><td>Inactive</td><td>$45</td></tr>
      </tbody>
    </table>
  </div>
  <script>
    function sortTable(col) {
      // Sorting logic here
      window.parent.postMessage({type: 'tool', payload: {toolName: 'sort-table', params: {column: col}}}, '*');
    }
    function exportData() {
      window.parent.postMessage({type: 'tool', payload: {toolName: 'export-table', params: {format: 'csv'}}}, '*');
    }
    function refreshData() {
      window.parent.postMessage({type: 'tool', payload: {toolName: 'refresh-table', params: {}}}, '*');
    }
  </script>
</body>
</html>`,
          title: 'Interactive Data Table',
          description: 'Table with sorting and export',
          preferredSize: { width: 700, height: 450 },
        },
      },
    ],
  },
  {
    id: 'media',
    name: 'Media',
    icon: ImageIcon,
    templates: [],
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: FileCodeIcon,
    templates: [
      {
        id: 'blank-html',
        name: 'Blank HTML',
        description: 'Start with a blank HTML canvas',
        category: 'custom',
        resource: {
          uri: 'ui://custom/blank',
          contentType: 'rawHtml',
          content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      margin: 0;
    }
  </style>
</head>
<body>
  <h1>Your Custom Component</h1>
  <p>Start building here...</p>

  <script>
    // Add your JavaScript here
  </script>
</body>
</html>`,
          title: 'Custom Component',
          description: 'Blank canvas for custom UI',
          preferredSize: { width: 800, height: 600 },
        },
      },
    ],
  },
];

export function TemplateGallery() {
  const {
    showTemplateGallery,
    setShowTemplateGallery,
    setCurrentResource,
    savedTemplates,
  } = useUIBuilderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allTemplates = [
    ...BUILT_IN_TEMPLATES.flatMap((cat) => cat.templates),
    ...savedTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || '',
      category: t.category,
      resource: t.resource,
      isCustom: true,
    })),
  ];

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (resource: UIResourceDraft) => {
    setCurrentResource(resource);
    setShowTemplateGallery(false);
  };

  return (
    <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Template Gallery</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Category sidebar */}
          <div className="w-48 space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                !selectedCategory ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              )}
            >
              All Templates
            </button>
            {BUILT_IN_TEMPLATES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors',
                    selectedCategory === category.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <Icon className="size-4" />
                  {category.name}
                </button>
              );
            })}
          </div>

          {/* Template grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-4 pr-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.resource)}
                  className="text-left p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all"
                >
                  <h4 className="font-medium mb-1">{template.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-secondary rounded">
                      {template.resource.contentType}
                    </span>
                    {'isCustom' in template && (template as { isCustom?: boolean }).isCustom && (
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        Custom
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setShowTemplateGallery(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
