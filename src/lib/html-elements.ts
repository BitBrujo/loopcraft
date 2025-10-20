/**
 * HTML Element Building Blocks
 * Simple, reusable HTML elements for the MCP-UI Builder
 */

export interface HTMLElement {
  id: string;
  name: string;
  category: 'buttons' | 'inputs' | 'forms' | 'containers' | 'interactive';
  description: string;
  html: string;
}

export const htmlElements: HTMLElement[] = [
  // ===== BUTTONS =====
  {
    id: 'btn-primary',
    name: 'Primary Button',
    category: 'buttons',
    description: 'Blue action button',
    html: `<button id="primary-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Click Me
</button>`,
  },
  {
    id: 'btn-secondary',
    name: 'Secondary Button',
    category: 'buttons',
    description: 'Gray secondary button',
    html: `<button id="secondary-btn" class="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
  Secondary
</button>`,
  },
  {
    id: 'btn-submit',
    name: 'Submit Button',
    category: 'buttons',
    description: 'Green submit button',
    html: `<button type="submit" id="submit-btn" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
  Submit
</button>`,
  },
  {
    id: 'btn-cancel',
    name: 'Cancel Button',
    category: 'buttons',
    description: 'Red cancel button',
    html: `<button id="cancel-btn" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
  Cancel
</button>`,
  },
  {
    id: 'btn-outline',
    name: 'Outline Button',
    category: 'buttons',
    description: 'Button with border only',
    html: `<button id="outline-btn" class="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
  Outline
</button>`,
  },

  // ===== INPUTS =====
  {
    id: 'input-text',
    name: 'Text Input',
    category: 'inputs',
    description: 'Single-line text input',
    html: `<input type="text" id="text-input" placeholder="Enter text..." class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />`,
  },
  {
    id: 'input-email',
    name: 'Email Input',
    category: 'inputs',
    description: 'Email input with validation',
    html: `<input type="email" id="email-input" placeholder="you@example.com" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />`,
  },
  {
    id: 'input-password',
    name: 'Password Input',
    category: 'inputs',
    description: 'Password input (hidden text)',
    html: `<input type="password" id="password-input" placeholder="••••••••" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />`,
  },
  {
    id: 'input-number',
    name: 'Number Input',
    category: 'inputs',
    description: 'Numeric input with spinner',
    html: `<input type="number" id="number-input" placeholder="0" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />`,
  },
  {
    id: 'input-textarea',
    name: 'Textarea',
    category: 'inputs',
    description: 'Multi-line text input',
    html: `<textarea id="message-textarea" rows="4" placeholder="Enter your message..." class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full resize-y"></textarea>`,
  },
  {
    id: 'input-select',
    name: 'Select Dropdown',
    category: 'inputs',
    description: 'Dropdown selection menu',
    html: `<select id="option-select" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
  <option value="">Choose an option...</option>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
  <option value="option3">Option 3</option>
</select>`,
  },
  {
    id: 'input-checkbox',
    name: 'Checkbox',
    category: 'inputs',
    description: 'Checkbox with label',
    html: `<label class="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" id="agree-checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
  <span class="text-gray-700">I agree to the terms</span>
</label>`,
  },
  {
    id: 'input-radio',
    name: 'Radio Buttons',
    category: 'inputs',
    description: 'Radio button group',
    html: `<div class="space-y-2">
  <label class="flex items-center gap-2 cursor-pointer">
    <input type="radio" name="choice" value="yes" id="radio-yes" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500" />
    <span class="text-gray-700">Yes</span>
  </label>
  <label class="flex items-center gap-2 cursor-pointer">
    <input type="radio" name="choice" value="no" id="radio-no" class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500" />
    <span class="text-gray-700">No</span>
  </label>
</div>`,
  },

  // ===== FORMS =====
  {
    id: 'form-field',
    name: 'Form Field',
    category: 'forms',
    description: 'Label + input combo',
    html: `<div class="space-y-2">
  <label for="field-input" class="block text-sm font-medium text-gray-700">
    Field Label
  </label>
  <input type="text" id="field-input" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
</div>`,
  },
  {
    id: 'form-simple',
    name: 'Simple Form',
    category: 'forms',
    description: 'Basic form structure',
    html: `<form id="contact-form" class="space-y-4">
  <div class="space-y-2">
    <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
    <input type="text" id="name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
  </div>
  <div class="space-y-2">
    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
    <input type="email" id="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
  </div>
  <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    Submit
  </button>
</form>`,
  },

  // ===== CONTAINERS =====
  {
    id: 'container-card',
    name: 'Card',
    category: 'containers',
    description: 'Content card with shadow',
    html: `<div class="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
  <h3 class="text-xl font-bold text-gray-900 mb-2">Card Title</h3>
  <p class="text-gray-600">Card content goes here.</p>
</div>`,
  },
  {
    id: 'container-grid',
    name: 'Grid Layout',
    category: 'containers',
    description: '2-column responsive grid',
    html: `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class="bg-gray-100 p-4 rounded">Column 1</div>
  <div class="bg-gray-100 p-4 rounded">Column 2</div>
</div>`,
  },
  {
    id: 'container-flex',
    name: 'Flex Container',
    category: 'containers',
    description: 'Horizontal flex layout',
    html: `<div class="flex gap-4 items-center">
  <div class="flex-1 bg-gray-100 p-4 rounded">Item 1</div>
  <div class="flex-1 bg-gray-100 p-4 rounded">Item 2</div>
</div>`,
  },
  {
    id: 'container-section',
    name: 'Section',
    category: 'containers',
    description: 'Page section with heading',
    html: `<section class="py-8">
  <h2 class="text-2xl font-bold text-gray-900 mb-4">Section Title</h2>
  <p class="text-gray-600">Section content goes here.</p>
</section>`,
  },

  // ===== INTERACTIVE =====
  {
    id: 'interactive-link',
    name: 'Link',
    category: 'interactive',
    description: 'Styled hyperlink',
    html: `<a href="#" id="nav-link" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
  Click here
</a>`,
  },
  {
    id: 'interactive-badge',
    name: 'Badge',
    category: 'interactive',
    description: 'Small status badge',
    html: `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
  Badge
</span>`,
  },
  {
    id: 'interactive-alert',
    name: 'Alert',
    category: 'interactive',
    description: 'Alert/notification box',
    html: `<div class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg" role="alert">
  <p class="font-medium">Info Alert</p>
  <p class="text-sm">This is an informational message.</p>
</div>`,
  },
];

// Group elements by category
export const elementsByCategory = htmlElements.reduce((acc, element) => {
  if (!acc[element.category]) {
    acc[element.category] = [];
  }
  acc[element.category].push(element);
  return acc;
}, {} as Record<string, HTMLElement[]>);

// Category metadata
export const categoryInfo = {
  buttons: { label: 'Buttons', icon: '🔘', description: 'Interactive button elements' },
  inputs: { label: 'Inputs', icon: '✏️', description: 'Form input fields' },
  forms: { label: 'Forms', icon: '📝', description: 'Complete form structures' },
  containers: { label: 'Containers', icon: '📦', description: 'Layout containers' },
  interactive: { label: 'Interactive', icon: '✨', description: 'Links, badges, alerts' },
};
