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
 * NOW SUPPORTS TOOL CHAINING - chains are detected and rendered sequentially
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

  // Detect chains: group patterns by chain relationships
  const chains: PatternInstance[][] = [];
  const independent: PatternInstance[] = [];

  completePatterns.forEach((p, idx) => {
    if (!p.isChained) {
      // Pattern is not chained - it's either independent or starts a new chain
      const nextPattern = completePatterns[idx + 1];
      if (nextPattern?.isChained && nextPattern.chainedFromPatternId === p.id) {
        // This pattern starts a chain
        chains.push([p]);
      } else {
        // Independent pattern
        independent.push(p);
      }
    } else {
      // Find the chain this belongs to
      const chainIndex = chains.findIndex(chain =>
        chain[chain.length - 1].id === p.chainedFromPatternId
      );
      if (chainIndex >= 0) {
        chains[chainIndex].push(p);
      } else {
        // Orphaned chained pattern (shouldn't happen, but handle gracefully)
        independent.push(p);
      }
    }
  });

  // Generate HTML for chains
  const chainsHTML = chains.map((chain, idx) =>
    generateChainHTML(chain, idx)
  ).join('\n');

  // Generate HTML for independent patterns
  const independentHTML = independent.map((p, idx) => {
    const patternMeta = getPattern(p.selectedPattern!);
    if (!patternMeta) {
      console.warn(`Skipping invalid pattern: ${p.selectedPattern}`);
      return '';
    }
    const elementHTML = generateElementHTML(p.elementConfig!, patternMeta.elementType);
    return `
    <!-- Independent Pattern ${idx + 1}: ${patternMeta.name} -->
    <div class="pattern-section mb-8 p-6 bg-gray-50 rounded-lg">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">${patternMeta.icon} ${patternMeta.name}</h2>
      ${elementHTML}
    </div>`;
  }).join('\n');

  // Generate scripts
  const scriptsHTML = [
    ...chains.map((chain, idx) => generateChainScript(chain, idx)),
    ...independent.map(p => generateScript(p.elementConfig!, p.actionConfig!, p.handlerConfig!))
  ].join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Pattern Composition (${completePatterns.length} patterns${chains.length > 0 ? `, ${chains.length} chain${chains.length > 1 ? 's' : ''}` : ''})</title>
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
    .chain-section {
      border-left: 4px solid #f97316;
    }
    .step-section {
      position: relative;
    }
    .step-section::before {
      content: '→';
      position: absolute;
      left: -1.5rem;
      top: 1rem;
      font-size: 1.5rem;
      color: #f97316;
    }
    .step-section:first-child::before {
      content: '';
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
    .result-container {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 1rem;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      max-height: 300px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="text-3xl font-bold mb-8 text-gray-800">MCP-UI Composition</h1>
    <p class="text-sm text-gray-600 mb-6">
      ${completePatterns.length} pattern${completePatterns.length > 1 ? 's' : ''}
      ${chains.length > 0 ? ` • ${chains.length} tool chain${chains.length > 1 ? 's' : ''}` : ''}
      ${independent.length > 0 ? ` • ${independent.length} independent` : ''}
    </p>

    ${chainsHTML}
    ${independentHTML}
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
  handlerConfig: HandlerConfig,
  targetServerName: string | null = null
): string {
  const patternMeta = getPattern(pattern);

  // Return error message if pattern is invalid (e.g., legacy 'multi-step')
  if (!patternMeta) {
    return `<!-- ERROR: Invalid pattern type "${pattern}". Please select a valid pattern. -->`;
  }

  const htmlCode = generateElementHTML(elementConfig, patternMeta.elementType);
  const handlerContainerHTML = generateHandlerContainerHTML(handlerConfig);
  const scriptCode = generateScript(elementConfig, actionConfig, handlerConfig, targetServerName);

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
 * Generate HTML for a tool chain
 */
function generateChainHTML(chain: PatternInstance[], chainIndex: number): string {
  const stepsHTML = chain.map((p, stepIdx) => {
    const patternMeta = getPattern(p.selectedPattern!);
    if (!patternMeta) return '';

    const elementHTML = generateElementHTML(p.elementConfig!, patternMeta.elementType);
    const resultContainerId = `result-chain${chainIndex}-step${stepIdx}`;
    const showResult = stepIdx < chain.length - 1; // Show intermediate results

    return `
      <div class="step-section mb-4 p-4 bg-white rounded-lg ${stepIdx > 0 ? 'border-l-4 border-orange-400 ml-6' : ''}">
        <h3 class="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
          <span class="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">${stepIdx + 1}</span>
          ${patternMeta.name}
          ${stepIdx > 0 ? '<span class="text-orange-600 text-xs ml-2">← Uses result from Step ' + stepIdx + '</span>' : ''}
        </h3>
        ${elementHTML}
        ${showResult ? `<div id="${resultContainerId}" class="result-container hidden mt-3">
          <div class="text-xs text-gray-500 mb-1">Step ${stepIdx + 1} Result:</div>
          <pre class="text-xs"></pre>
        </div>` : ''}
      </div>`;
  }).join('\n');

  return `
    <!-- Tool Chain ${chainIndex + 1}: ${chain.length} steps -->
    <div class="chain-section mb-8 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
      <h2 class="text-xl font-semibold mb-4 text-orange-700 flex items-center gap-2">
        🔗 Tool Chain ${chainIndex + 1}
        <span class="text-sm font-normal text-gray-600">(${chain.length} steps)</span>
      </h2>
      ${stepsHTML}
      <div id="chain${chainIndex}-final-result" class="hidden mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
        <div class="text-sm font-semibold text-green-700 mb-2">✓ Chain Completed</div>
        <div class="text-xs text-gray-600">All steps executed successfully</div>
      </div>
    </div>`;
}

/**
 * Generate script for a tool chain
 */
function generateChainScript(chain: PatternInstance[], chainIndex: number): string {

  // Generate async step execution functions
  const stepFunctions = chain.map((p, stepIdx) => {
    const toolName = p.actionConfig!.toolName;
    const params = p.actionConfig!.toolParameters || [];
    const elementId = p.elementConfig!.id;

    // Build params code with previous result support
    let paramsCode = '      const params = {\n';
    params.forEach(param => {
      if (param.valueSource === 'previousResult' && stepIdx > 0) {
        // Extract from previous result using path
        const path = param.previousResultPath;

        if (!path || path.trim() === '') {
          // Empty path = use entire result object
          paramsCode += `        "${param.name}": previousResults[${stepIdx - 1}],\n`;
        } else {
          // Build accessor from path (e.g., "content[0].text" -> previousResults[0]?.content[0]?.text)
          const pathParts = path.split('.');
          let accessor = 'previousResults[' + (stepIdx - 1) + ']';
          pathParts.forEach(part => {
            if (part.includes('[')) {
              accessor += '.' + part;
            } else {
              accessor += '?.' + part;
            }
          });
          paramsCode += `        "${param.name}": ${accessor},\n`;
        }
      } else if (param.valueSource === 'static') {
        const value = typeof param.staticValue === 'string'
          ? `"${param.staticValue}"`
          : param.staticValue;
        paramsCode += `        "${param.name}": ${value},\n`;
      } else if (param.valueSource === 'formField' && param.formFieldName) {
        paramsCode += `        "${param.name}": formData.get('${param.formFieldName}'),\n`;
      }
    });
    paramsCode += '      };';

    return `
    // Step ${stepIdx + 1}: ${toolName}
    async function executeStep${stepIdx}(previousResults, formData) {
${paramsCode}

      return new Promise((resolve, reject) => {
        window.parent.postMessage({
          type: 'tool',
          payload: { toolName: '${toolName}', params: params }
        }, '*');

        const handler = (event) => {
          if (event.data.type === 'mcp-ui-tool-response') {
            window.removeEventListener('message', handler);
            const result = event.data.result;

            if (result.error) {
              reject(result.error);
            } else {
              ${stepIdx < chain.length - 1 ? `
              // Display intermediate result
              const container = document.getElementById('result-chain${chainIndex}-step${stepIdx}');
              if (container) {
                container.classList.remove('hidden');
                container.querySelector('pre').textContent = JSON.stringify(result, null, 2);
              }
              ` : ''}
              resolve(result);
            }
          }
        };
        window.addEventListener('message', handler);
      });
    }`;
  }).join('\n');

  // Generate chain execution code
  const elementId = chain[0].elementConfig!.id;
  const eventType = chain[0].elementConfig!.elementType === 'form' ? 'submit' : 'click';

  return `  <script>
${stepFunctions}

    // Execute chain
    document.getElementById('${elementId}').addEventListener('${eventType}', async (e) => {
      ${chain[0].elementConfig!.elementType === 'form' ? 'e.preventDefault();' : ''}
      const previousResults = [];
      ${chain[0].elementConfig!.elementType === 'form' ? 'const formData = new FormData(e.target);' : 'const formData = null;'}

      try {
${chain.map((_, stepIdx) => `
        // Execute Step ${stepIdx + 1}
        showNotification('Executing step ${stepIdx + 1}...', 'info');
        const result${stepIdx} = await executeStep${stepIdx}(previousResults, formData);
        previousResults.push(result${stepIdx});
`).join('')}

        // Chain completed
        document.getElementById('chain${chainIndex}-final-result').classList.remove('hidden');
        showNotification('Chain completed successfully! 🎉', 'success');
      } catch (error) {
        console.error('Chain execution failed:', error);
        showNotification('Chain failed: ' + error, 'error');
      }
    });

    function showNotification(message, variant = 'info') {
      window.parent.postMessage({
        type: 'notify',
        payload: { message, variant }
      }, '*');
    }
  </script>`;
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
  // Add results display container for 'ui' destination (MCP-UI compliant only)
  const destination = config.responseDestination || 'ui';

  if (destination === 'ui') {
    return `
    <!-- Results Display Container -->
    <div id="results" class="mt-4 hidden">
      <h2 class="text-lg font-semibold mb-2 text-gray-700">Results:</h2>
      <div id="results-content" class="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-96"></div>
    </div>`;
  }

  return '';
}

/**
 * Generate complete script
 */
function generateScript(
  elementConfig: ElementConfig,
  actionConfig: ActionConfig,
  handlerConfig: HandlerConfig,
  targetServerName: string | null = null
): string {
  const actionCode = generateActionCode(elementConfig, actionConfig, targetServerName);
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
  actionConfig: ActionConfig,
  targetServerName: string | null = null
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
  const actionPayload = generateActionPayload(elementConfig, actionConfig, targetServerName);

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
  actionConfig: ActionConfig,
  targetServerName: string | null = null
): string {
  switch (actionConfig.actionType) {
    case 'tool':
      return generateToolCallCode(elementConfig, actionConfig, targetServerName);
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
  actionConfig: ActionConfig,
  targetServerName: string | null = null
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

  // Prefix tool name with MCP format if targetServerName is provided
  const toolName = targetServerName
    ? `mcp_${targetServerName}_${actionConfig.toolName}`
    : actionConfig.toolName;

  return `      try {
        showLoading(true);
${elementConfig.elementType === 'form' ? paramsCode : '        const params = {};\n'}

        // Call MCP tool via postMessage
        window.parent.postMessage({
          type: 'tool',
          payload: {
            toolName: '${toolName}',
            params: params
          }
        }, '*');

        // Listen for response - DON'T use { once: true } because we need to ignore acknowledgment
        window.addEventListener('message', handleToolResponse);
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
    const destination = config.responseDestination || 'ui'; // Default to UI

    code += `
    // Tool response handler
    function handleToolResponse(event) {
      console.log('📨 Message received:', event.data);

      // Ignore acknowledgment message - keep listening for actual response
      if (event.data.type === 'ui-message-received') {
        console.log('⏳ Acknowledgment received, waiting for result...');
        return; // Keep listener active
      }

      // Handle response message types: ui-message-response (from @mcp-ui/client) and mcp-ui-tool-response (legacy)
      if (event.data.type === 'ui-message-response' || event.data.type === 'mcp-ui-tool-response') {
        console.log('✅ Tool response received!');

        // Remove listener now that we got the response
        window.removeEventListener('message', handleToolResponse);

        showLoading(false);
        // Extract result from correct location:
        // - @mcp-ui/client sends: event.data.payload.response
        // - Legacy format: event.data.result
        const result = event.data.payload?.response || event.data.result;

        if (result.error) {
          showError(result.error);
        } else {
          console.log('Tool result:', result);

          // Route response based on destination: ${destination}`;

    // Generate routing logic (MCP-UI compliant only)
    if (destination === 'ui') {
      code += `
          // Display in UI (MCP-UI standard)
          displayToolResult(result);`;
    } else if (destination === 'none') {
      code += `
          // Fire and forget - no routing`;
    }

    code += `
        }
      }
    }`;
  }

  // Add displayToolResult function if destination is 'ui'
  if (config.responseDestination === 'ui') {
    code += `
    // Display tool result in UI
    function displayToolResult(result) {
      const resultsDiv = document.getElementById('results');
      const resultsContent = document.getElementById('results-content');

      if (!result.content || result.content.length === 0) {
        resultsContent.innerHTML = '<p class="text-gray-500">No data returned</p>';
        resultsDiv.classList.remove('hidden');
        return;
      }

      // Clear previous results
      resultsContent.innerHTML = '';

      // Process each content item
      result.content.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'mb-3 last:mb-0';

        if (item.type === 'text') {
          // Try to parse as JSON for pretty printing
          try {
            const jsonData = JSON.parse(item.text);
            const pre = document.createElement('pre');
            pre.className = 'bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto';
            pre.textContent = JSON.stringify(jsonData, null, 2);
            itemDiv.appendChild(pre);
          } catch {
            // Not JSON, display as plain text
            const p = document.createElement('p');
            p.className = 'text-gray-800 whitespace-pre-wrap';
            p.textContent = item.text;
            itemDiv.appendChild(p);
          }
        } else if (item.type === 'image') {
          const img = document.createElement('img');
          // Convert base64 data to data URL for proper display
          const mimeType = item.mimeType || 'image/png';
          if (item.data.startsWith('data:')) {
            img.src = item.data;  // Already a data URL
          } else {
            img.src = 'data:' + mimeType + ';base64,' + item.data;  // Convert base64 to data URL
          }
          img.alt = item.alt || 'Tool result image';
          img.className = 'max-w-full h-auto rounded border border-gray-300';
          itemDiv.appendChild(img);
        } else if (item.type === 'resource') {
          const link = document.createElement('a');
          link.href = item.uri || '#';
          link.textContent = item.uri || 'Resource';
          link.className = 'text-blue-600 hover:underline';
          link.target = '_blank';
          itemDiv.appendChild(link);
        } else {
          // Unknown type, display as string
          const p = document.createElement('p');
          p.className = 'text-gray-600 italic';
          p.textContent = JSON.stringify(item);
          itemDiv.appendChild(p);
        }

        resultsContent.appendChild(itemDiv);
      });

      // Show the results container
      resultsDiv.classList.remove('hidden');

      // Also show a success notification
      showNotification('Results loaded successfully', 'success');
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

  // Note: agent-message action removed for MCP-UI spec compliance
  // All responses now default to UI display only

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
