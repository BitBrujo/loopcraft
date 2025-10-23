/**
 * Code Generation for Composition Patterns
 * Generates complete HTML + JavaScript code from pattern configuration
 */

import type {
  PatternType,
  PatternInstance,
  ElementConfig,
  ActionConfig,
  HandlerConfig,
  ButtonStyle,
  NotificationVariant,
} from '@/components/mcp-ui-builder/tabs/composition/types';
import { getPattern } from './composition-patterns';

/**
 * Generate combined code for multiple patterns
 * Useful for when user has configured multiple patterns and wants one HTML file
 */
export function generateMultiPatternCode(patterns: PatternInstance[]): string {
  // Filter out incomplete patterns
  const completePatterns = patterns.filter(
    p => p.selectedPattern && p.elementConfig && p.actionConfig && p.handlerConfig
  );

  if (completePatterns.length === 0) {
    return '<!-- No complete patterns to generate -->';
  }

  // If only one pattern, use the single pattern generator
  if (completePatterns.length === 1) {
    const p = completePatterns[0];
    return generatePatternCode(
      p.selectedPattern!,
      p.elementConfig!,
      p.actionConfig!,
      p.handlerConfig!
    );
  }

  // Generate HTML for each pattern
  const patternsHTML = completePatterns
    .map((p, index) => {
      const patternMeta = getPattern(p.selectedPattern!);
      const elementHTML = generateElementHTML(p.elementConfig!, patternMeta.elementType);
      const handlerHTML = generateHandlerContainerHTML(p.handlerConfig!);
      return `
    <!-- Pattern ${index + 1}: ${patternMeta.name} -->
    <div class="pattern-section mb-8 p-6 bg-gray-50 rounded-lg">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">${patternMeta.icon} ${patternMeta.name}</h2>
      ${elementHTML}
      ${handlerHTML}
    </div>`;
    })
    .join('\n');

  // Generate scripts for each pattern
  const scriptsHTML = completePatterns
    .map((p) => generateScript(p.elementConfig!, p.actionConfig!, p.handlerConfig!))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Pattern Composition (${completePatterns.length} patterns)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .pattern-section {
      border-left: 4px solid #667eea;
    }
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error {
      background-color: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }
    .success {
      background-color: #efe;
      border: 1px solid #cfc;
      color: #3c3;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="text-3xl font-bold mb-8 text-gray-800">MCP-UI Composition</h1>
    <p class="text-sm text-gray-600 mb-6">${completePatterns.length} pattern${completePatterns.length > 1 ? 's' : ''} configured</p>

    ${patternsHTML}
  </div>

  ${scriptsHTML}
</body>
</html>`;
}

/**
 * Generate complete pattern code (single pattern)
 */
export function generatePatternCode(
  pattern: PatternType,
  elementConfig: ElementConfig,
  actionConfig: ActionConfig,
  handlerConfig: HandlerConfig
): string {
  const patternMeta = getPattern(pattern);

  const htmlCode = generateElementHTML(elementConfig, patternMeta.elementType);
  const handlerContainerHTML = generateHandlerContainerHTML(handlerConfig);
  const scriptCode = generateScript(elementConfig, actionConfig, handlerConfig);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${patternMeta.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error {
      background-color: #fee;
      border: 1px solid #fcc;
      color: #c33;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }
    .success {
      background-color: #efe;
      border: 1px solid #cfc;
      color: #3c3;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">${patternMeta.name}</h1>

    ${htmlCode}

    ${handlerContainerHTML}
  </div>

  ${scriptCode}
</body>
</html>`;
}

/**
 * Generate HTML for element
 */
function generateElementHTML(config: ElementConfig, elementType: string): string {
  switch (elementType) {
    case 'button':
      return generateButtonHTML(config);
    case 'form':
      return generateFormHTML(config);
    case 'input':
      return generateInputHTML(config);
    case 'link':
      return generateLinkHTML(config);
    default:
      return '';
  }
}

/**
 * Generate button HTML
 */
function generateButtonHTML(config: ElementConfig): string {
  const styleClasses = getButtonStyleClasses(config.buttonStyle || 'primary');
  return `    <button
      id="${config.id}"
      class="${styleClasses}"
    >
      ${config.buttonText || 'Execute'}
    </button>`;
}

/**
 * Generate form HTML
 */
function generateFormHTML(config: ElementConfig): string {
  const fields = config.formFields || [];
  const fieldsHTML = fields.map(field => {
    switch (field.type) {
      case 'textarea':
        return `      <div>
        <label for="${field.name}" class="block text-sm font-medium text-gray-700 mb-1">
          ${field.label}${field.required ? ' *' : ''}
        </label>
        <textarea
          id="${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          placeholder="${field.placeholder || ''}"
          rows="4"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        ></textarea>
      </div>`;

      case 'select':
        const options = field.options || [];
        return `      <div>
        <label for="${field.name}" class="block text-sm font-medium text-gray-700 mb-1">
          ${field.label}${field.required ? ' *' : ''}
        </label>
        <select
          id="${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select an option</option>
          ${options.map(opt => `          <option value="${opt}">${opt}</option>`).join('\n')}
        </select>
      </div>`;

      case 'checkbox':
        return `      <div class="flex items-center">
        <input
          type="checkbox"
          id="${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label for="${field.name}" class="ml-2 text-sm font-medium text-gray-700">
          ${field.label}${field.required ? ' *' : ''}
        </label>
      </div>`;

      default:
        return `      <div>
        <label for="${field.name}" class="block text-sm font-medium text-gray-700 mb-1">
          ${field.label}${field.required ? ' *' : ''}
        </label>
        <input
          type="${field.type}"
          id="${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          placeholder="${field.placeholder || ''}"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>`;
    }
  }).join('\n\n');

  return `    <form id="${config.id}" class="space-y-4">
${fieldsHTML}

      <button
        type="submit"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Submit
      </button>
    </form>`;
}

/**
 * Generate input HTML
 */
function generateInputHTML(config: ElementConfig): string {
  return `    <div>
      <input
        type="${config.inputType || 'text'}"
        id="${config.id}"
        placeholder="${config.inputPlaceholder || ''}"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>`;
}

/**
 * Generate link HTML
 */
function generateLinkHTML(config: ElementConfig): string {
  return `    <a
      id="${config.id}"
      href="${config.linkHref || '#'}"
      class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
    >
      ${config.linkText || 'Click here'}
    </a>`;
}

/**
 * Generate handler container HTML
 */
function generateHandlerContainerHTML(config: HandlerConfig): string {
  // Containers removed - results are handled via notifications
  return '';
}

/**
 * Generate complete script
 */
function generateScript(
  elementConfig: ElementConfig,
  actionConfig: ActionConfig,
  handlerConfig: HandlerConfig
): string {
  const actionCode = generateActionCode(elementConfig, actionConfig);
  const handlerCode = generateHandlerCode(handlerConfig);

  return `  <script>
${actionCode}
${handlerCode}
  </script>`;
}

/**
 * Generate action code
 */
function generateActionCode(
  elementConfig: ElementConfig,
  actionConfig: ActionConfig
): string {
  const elementId = elementConfig.id;
  const elementType = elementConfig.elementType;

  // Determine event type
  let eventType = 'click';
  if (elementType === 'form') {
    eventType = 'submit';
  } else if (elementType === 'input' && elementConfig.inputType === 'search') {
    eventType = 'input';
  }

  // Build action payload
  const actionPayload = generateActionPayload(elementConfig, actionConfig);

  return `    // Action: ${actionConfig.actionType}
    const element = document.getElementById('${elementId}');
    element.addEventListener('${eventType}', async (e) => {
      ${elementType === 'form' ? 'e.preventDefault();' : ''}

      ${actionPayload}
    });`;
}

/**
 * Generate action payload code
 */
function generateActionPayload(
  elementConfig: ElementConfig,
  actionConfig: ActionConfig
): string {
  switch (actionConfig.actionType) {
    case 'tool':
      return generateToolCallCode(elementConfig, actionConfig);
    case 'prompt':
      return generatePromptCode(actionConfig);
    case 'link':
      return generateLinkActionCode(actionConfig);
    case 'intent':
      return generateIntentCode(actionConfig);
    case 'notify':
      return generateNotifyCode(actionConfig);
    default:
      return '// Unknown action type';
  }
}

/**
 * Generate tool call code
 */
function generateToolCallCode(
  elementConfig: ElementConfig,
  actionConfig: ActionConfig
): string {
  const params = actionConfig.toolParameters || [];

  // Build parameters object
  let paramsCode = '        const params = {\n';
  params.forEach(param => {
    if (param.valueSource === 'static') {
      const value = typeof param.staticValue === 'string'
        ? `"${param.staticValue}"`
        : param.staticValue;
      paramsCode += `          "${param.name}": ${value},\n`;
    } else if (param.valueSource === 'formField' && param.formFieldName) {
      paramsCode += `          "${param.name}": document.getElementById('${param.formFieldName}').value,\n`;
    }
  });
  paramsCode += '        };\n';

  return `      try {
        showLoading(true);
${elementConfig.elementType === 'form' ? paramsCode : '        const params = {};\n'}

        // Call MCP tool via postMessage
        window.parent.postMessage({
          type: 'tool',
          payload: {
            toolName: '${actionConfig.toolName}',
            params: params
          }
        }, '*');

        // Listen for response
        window.addEventListener('message', handleToolResponse, { once: true });
      } catch (error) {
        showError(error.message || 'An error occurred');
      }`;
}

/**
 * Generate prompt code
 */
function generatePromptCode(actionConfig: ActionConfig): string {
  return `      // Send prompt to AI
      window.parent.postMessage({
        type: 'prompt',
        payload: {
          text: '${actionConfig.promptText}'
        }
      }, '*');

      showNotification('Prompt sent to AI assistant', 'success');`;
}

/**
 * Generate link action code
 */
function generateLinkActionCode(actionConfig: ActionConfig): string {
  const target = actionConfig.linkTarget || '_blank';
  return `      // Open link
      window.parent.postMessage({
        type: 'link',
        payload: {
          url: '${actionConfig.linkUrl}',
          target: '${target}'
        }
      }, '*');`;
}

/**
 * Generate intent code
 */
function generateIntentCode(actionConfig: ActionConfig): string {
  const data = JSON.stringify(actionConfig.intentData || {});
  return `      // Trigger intent
      window.parent.postMessage({
        type: 'intent',
        payload: {
          name: '${actionConfig.intentName}',
          data: ${data}
        }
      }, '*');

      showNotification('Intent triggered', 'success');`;
}

/**
 * Generate notify code
 */
function generateNotifyCode(actionConfig: ActionConfig): string {
  return `      // Show notification
      showNotification('${actionConfig.notificationMessage}', '${actionConfig.notificationVariant || 'info'}');`;
}

/**
 * Generate handler code
 */
function generateHandlerCode(config: HandlerConfig): string {
  let code = '';

  // Response handler
  if (config.handlerType === 'response' || config.handlerType === 'both') {
    code += `
    // Tool response handler
    function handleToolResponse(event) {
      if (event.data.type === 'mcp-ui-tool-response') {
        showLoading(false);
        const result = event.data.result;

        if (result.error) {
          showError(result.error);
        } else {
          console.log('Tool result:', result);
          ${config.handlerType === 'both' && config.successMessage ? `showNotification('${config.successMessage}', '${config.successVariant || 'success'}');` : `showNotification('Operation completed successfully', 'success');`}
        }
      }
    }`;
  }

  // Loading/error helpers
  code += `
    // Helper functions
    function showLoading(show) {
      if (show) {
        console.log('Loading...');
      }
    }

    function showError(message) {
      console.error('Error:', message);
      showNotification('Error: ' + message, 'error');
    }`;

  // Notification handler - always include since we use notifications for all responses
  code += `

    function showNotification(message, variant = 'info') {
      window.parent.postMessage({
        type: 'notify',
        payload: {
          message: message,
          variant: variant
        }
      }, '*');
    }`;


  return code;
}

/**
 * Get Tailwind classes for button style
 */
function getButtonStyleClasses(style: ButtonStyle): string {
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
