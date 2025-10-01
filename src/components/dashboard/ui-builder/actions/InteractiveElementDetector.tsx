"use client";

import { useEffect, useState } from 'react';
import { MousePointerClickIcon, FormInputIcon, LinkIcon, SquareIcon, SearchIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import { cn } from '@/lib/utils';

export interface DetectedElement {
  id: string; // Auto-generated if missing
  type: 'button' | 'form' | 'link' | 'input' | 'select';
  tagName: string;
  label?: string;
  attributes: Record<string, string>;
  hasEventHandler: boolean;
  selector: string;
}

function parseHTMLElements(htmlString: string): DetectedElement[] {
  if (typeof window === 'undefined') return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const elements: DetectedElement[] = [];
  let autoIdCounter = 0;

  // Find buttons
  doc.querySelectorAll('button').forEach((el, index) => {
    const id = el.id || `auto-button-${autoIdCounter++}`;
    elements.push({
      id,
      type: 'button',
      tagName: 'button',
      label: el.textContent?.trim() || el.getAttribute('aria-label') || `Button ${index + 1}`,
      attributes: {
        id: el.id,
        class: el.className,
        type: el.getAttribute('type') || 'button',
      },
      hasEventHandler: el.hasAttribute('onclick') || el.hasAttribute('@click'),
      selector: el.id ? `#${el.id}` : `button:nth-of-type(${index + 1})`,
    });
  });

  // Find forms
  doc.querySelectorAll('form').forEach((el, index) => {
    const id = el.id || `auto-form-${autoIdCounter++}`;
    elements.push({
      id,
      type: 'form',
      tagName: 'form',
      label: el.getAttribute('name') || `Form ${index + 1}`,
      attributes: {
        id: el.id,
        action: el.getAttribute('action') || '',
        method: el.getAttribute('method') || 'POST',
      },
      hasEventHandler: el.hasAttribute('onsubmit') || el.hasAttribute('@submit'),
      selector: el.id ? `#${el.id}` : `form:nth-of-type(${index + 1})`,
    });
  });

  // Find links with action-like attributes
  doc.querySelectorAll('a[href], a[onclick], a[@click]').forEach((el, index) => {
    const href = el.getAttribute('href');
    // Skip external navigation links
    if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/'))) {
      return;
    }

    const id = el.id || `auto-link-${autoIdCounter++}`;
    elements.push({
      id,
      type: 'link',
      tagName: 'a',
      label: el.textContent?.trim() || `Link ${index + 1}`,
      attributes: {
        id: el.id,
        href: href || '#',
        class: el.className,
      },
      hasEventHandler: el.hasAttribute('onclick') || el.hasAttribute('@click'),
      selector: el.id ? `#${el.id}` : `a:nth-of-type(${index + 1})`,
    });
  });

  // Find inputs that might trigger actions
  doc.querySelectorAll('input[type="submit"], input[type="button"]').forEach((el, index) => {
    const id = el.id || `auto-input-${autoIdCounter++}`;
    elements.push({
      id,
      type: 'input',
      tagName: 'input',
      label: el.getAttribute('value') || el.getAttribute('placeholder') || `Input ${index + 1}`,
      attributes: {
        id: el.id,
        type: el.getAttribute('type') || 'text',
        name: el.getAttribute('name') || '',
      },
      hasEventHandler: el.hasAttribute('onclick') || el.hasAttribute('@click'),
      selector: el.id ? `#${el.id}` : `input:nth-of-type(${index + 1})`,
    });
  });

  // Find select elements
  doc.querySelectorAll('select').forEach((el, index) => {
    const id = el.id || `auto-select-${autoIdCounter++}`;
    elements.push({
      id,
      type: 'select',
      tagName: 'select',
      label: el.getAttribute('name') || `Select ${index + 1}`,
      attributes: {
        id: el.id,
        name: el.getAttribute('name') || '',
        class: el.className,
      },
      hasEventHandler: el.hasAttribute('onchange') || el.hasAttribute('@change'),
      selector: el.id ? `#${el.id}` : `select:nth-of-type(${index + 1})`,
    });
  });

  return elements;
}

const typeIcons = {
  button: MousePointerClickIcon,
  form: FormInputIcon,
  link: LinkIcon,
  input: SquareIcon,
  select: SquareIcon,
};

interface InteractiveElementDetectorProps {
  onSelectElement: (element: DetectedElement) => void;
}

export function InteractiveElementDetector({ onSelectElement }: InteractiveElementDetectorProps) {
  const { currentResource, actionMappings } = useUIBuilderStore();
  const [elements, setElements] = useState<DetectedElement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentResource.contentType === 'rawHtml' && currentResource.content) {
      const detected = parseHTMLElements(currentResource.content);
      setElements(detected);
    } else {
      setElements([]);
    }
  }, [currentResource.content, currentResource.contentType]);

  const filteredElements = elements.filter(el =>
    el.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    el.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    el.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isMapped = (elementId: string) => {
    return actionMappings.some(mapping => mapping.uiElementId === elementId);
  };

  return (
    <div className="h-full flex flex-col border-r border-border bg-card/30">
      <div className="border-b border-border bg-card/50 p-4">
        <h3 className="text-sm font-medium mb-1">Interactive Elements</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Detected: {elements.length} | Mapped: {actionMappings.length}
        </p>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {currentResource.contentType !== 'rawHtml' ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <p className="text-sm text-muted-foreground">
              Element detection only works with Raw HTML content type
            </p>
          </div>
        ) : filteredElements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <MousePointerClickIcon className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No elements found' : 'No interactive elements detected'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add buttons, forms, or links to your HTML
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredElements.map((element) => {
              const Icon = typeIcons[element.type];
              const mapped = isMapped(element.id);

              return (
                <button
                  key={element.id}
                  onClick={() => onSelectElement(element)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all hover:bg-accent",
                    mapped ? "border-green-500 bg-green-500/5" : "border-border"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={cn("size-4 mt-0.5 flex-shrink-0", mapped && "text-green-600")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{element.label}</span>
                        {mapped && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-500/10 text-green-600 border-green-500/30">
                            MAPPED
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {element.type}
                        </Badge>
                        <span className="truncate">{element.selector}</span>
                        {element.hasEventHandler && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            event
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
