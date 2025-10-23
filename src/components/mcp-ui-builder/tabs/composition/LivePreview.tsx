'use client';

import { useUIBuilderStore } from '@/lib/stores/ui-builder-store';
import type { ElementConfig, ButtonStyle } from './types';

export function LivePreview() {
  const { composition } = useUIBuilderStore();
  const elementConfig = composition.elementConfig;

  if (!elementConfig) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">👁️</div>
          <div className="font-medium">Live Preview</div>
          <div className="text-sm mt-1">
            Configure an element in Step 2 to see a live preview
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">👁️</span>
          Live Preview
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Visual representation of your configured element
        </p>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          {elementConfig.elementType === 'button' && (
            <ButtonPreview config={elementConfig} />
          )}
          {elementConfig.elementType === 'form' && (
            <FormPreview config={elementConfig} />
          )}
          {elementConfig.elementType === 'input' && (
            <InputPreview config={elementConfig} />
          )}
          {elementConfig.elementType === 'link' && (
            <LinkPreview config={elementConfig} />
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="border-t border-gray-200 bg-white px-6 py-3">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Element ID:</span> #{elementConfig.id}
          {' • '}
          <span className="font-medium">Type:</span> {elementConfig.elementType}
        </div>
      </div>
    </div>
  );
}

// Button Preview
function ButtonPreview({ config }: { config: ElementConfig }) {
  const buttonClasses = getButtonClasses(config.buttonStyle || 'primary');

  return (
    <div className="text-center">
      <button
        id={config.id}
        className={buttonClasses}
        disabled
      >
        {config.buttonText || 'Button'}
      </button>
    </div>
  );
}

// Form Preview
function FormPreview({ config }: { config: ElementConfig }) {
  const fields = config.formFields || [];

  return (
    <form id={config.id} className="space-y-4">
      {fields.map((field, index) => (
        <div key={index}>
          {field.type === 'textarea' ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}{field.required && ' *'}
              </label>
              <textarea
                id={field.name}
                name={field.name}
                required={field.required}
                placeholder={field.placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </>
          ) : field.type === 'select' ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}{field.required && ' *'}
              </label>
              <select
                id={field.name}
                name={field.name}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an option</option>
                {field.options?.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </>
          ) : field.type === 'checkbox' ? (
            <div className="flex items-center">
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                required={field.required}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                {field.label}{field.required && ' *'}
              </label>
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}{field.required && ' *'}
              </label>
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </>
          )}
        </div>
      ))}

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        disabled
      >
        Submit
      </button>
    </form>
  );
}

// Input Preview
function InputPreview({ config }: { config: ElementConfig }) {
  return (
    <div>
      <input
        type={config.inputType || 'text'}
        id={config.id}
        placeholder={config.inputPlaceholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

// Link Preview
function LinkPreview({ config }: { config: ElementConfig }) {
  return (
    <div className="text-center">
      <a
        id={config.id}
        href={config.linkHref || '#'}
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        onClick={(e) => e.preventDefault()}
      >
        {config.linkText || 'Link'}
      </a>
    </div>
  );
}

// Helper function to get button classes
function getButtonClasses(style: ButtonStyle): string {
  const baseClasses = 'px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  switch (style) {
    case 'primary':
      return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
    case 'secondary':
      return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500`;
    case 'success':
      return `${baseClasses} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`;
    case 'danger':
      return `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`;
    case 'warning':
      return `${baseClasses} bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500`;
    case 'info':
      return `${baseClasses} bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500`;
    default:
      return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
  }
}
