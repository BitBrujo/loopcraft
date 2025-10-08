/**
 * AI-Powered Tool Implementation Generator
 *
 * Takes tool schema and generates WORKING code (not stubs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';
import { getUserFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import type { ToolInference } from '@/lib/intelligent-analyzer';
import type { Setting } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // Get user settings for AI model
    const user = await getUserFromRequest(request);
    let baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api';
    let model = process.env.OLLAMA_MODEL || 'llama3.2:latest';

    if (user) {
      const aiConfig = await queryOne<Setting>(
        'SELECT * FROM settings WHERE user_id = ? AND `key` = ?',
        [user.userId, 'ollama_base_url']
      );
      if (aiConfig?.value) baseURL = aiConfig.value;

      const modelConfig = await queryOne<Setting>(
        'SELECT * FROM settings WHERE user_id = ? AND `key` = ?',
        [user.userId, 'ollama_model']
      );
      if (modelConfig?.value) model = modelConfig.value;
    }

    // Parse request body
    const {
      toolInference,
      previousCode,
      error: previousError
    }: {
      toolInference: ToolInference;
      previousCode?: string;
      error?: string;
    } = await request.json();

    if (!toolInference) {
      return NextResponse.json(
        { error: 'Tool inference is required' },
        { status: 400 }
      );
    }

    // Create Ollama client
    const ollama = createOllama({ baseURL });

    // Generate implementation using AI (with iteration support)
    const prompt = previousCode
      ? generateIterationPrompt(toolInference, previousCode, previousError)
      : generateImplementationPrompt(toolInference);

    const { text } = await generateText({
      model: ollama(model),
      prompt,
      temperature: 0.3, // Lower temperature for more deterministic code generation
    });

    // Extract code from AI response (handle markdown code blocks)
    const implementation = extractCodeFromResponse(text);

    return NextResponse.json({
      implementation,
      rawResponse: text,
      toolName: toolInference.toolName,
    });
  } catch (error) {
    console.error('Error generating implementation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate implementation' },
      { status: 500 }
    );
  }
}

/**
 * Generate prompt for AI to create working implementation
 */
function generateImplementationPrompt(tool: ToolInference): string {
  const { toolName, description, purpose, implementationType, parameters, suggestedImplementation } = tool;

  return `You are an expert backend developer. Generate a complete, production-ready implementation for an MCP tool.

**Tool Name**: ${toolName}
**Description**: ${description}
**Purpose**: ${purpose}
**Implementation Type**: ${implementationType}
**Parameters**: ${parameters.map(p => `- ${p.name} (${p.type})${p.required ? ' [required]' : ''}: ${p.description}`).join('\n')}

**Implementation Hint**: ${suggestedImplementation}

**Requirements**:
1. Generate ONLY the JavaScript code for the tool handler function
2. The function should accept 'args' parameter containing the tool parameters
3. Return an object with structure: { content: [{ type: 'text', text: JSON.stringify(result) }] }
4. Include proper error handling with try/catch
5. Add helpful comments explaining the logic
6. For ${implementationType} operations, include realistic placeholder code (e.g., database queries, API calls)
7. Return a detailed success/error response object

**Template Structure**:
\`\`\`javascript
// Handle ${toolName} tool
if (name === '${toolName}') {
  try {
    // Extract parameters
    ${parameters.map(p => `const ${p.name} = args?.['${p.name}'];`).join('\n    ')}

    // Validate required parameters
    ${parameters.filter(p => p.required).map(p => `if (!${p.name}) {
      throw new Error('${p.name} is required');
    }`).join('\n    ')}

    // TODO: Your implementation here

    // Return success response
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: 'Operation completed successfully',
          data: { /* your data here */ }
        }),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message
        }),
      }],
    };
  }
}
\`\`\`

**Context for ${implementationType} implementation**:
${getImplementationContext(implementationType, purpose)}

Generate the complete implementation code now. Include realistic placeholder database queries or API calls as comments where appropriate.`;
}

/**
 * Get implementation context based on type
 */
function getImplementationContext(type: string, purpose: string): string {
  switch (type) {
    case 'database':
      return `Use SQL-like queries in comments. Example:
// const result = await db.query('INSERT INTO contacts (name, email) VALUES (?, ?)', [name, email]);
// const id = result.insertId;

Return the inserted/updated record or query results.`;

    case 'email':
      return `Use email service in comments. Example:
// await emailService.send({
//   to: email,
//   subject: 'Contact Form Submission',
//   body: message
// });

Return confirmation of email sent.`;

    case 'api-call':
      return `Use fetch or HTTP client in comments. Example:
// const response = await fetch('https://api.example.com/endpoint', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify(data)
// });
// const result = await response.json();

Return the API response.`;

    case 'file-operation':
      return `Use file system operations in comments. Example:
// const fs = require('fs');
// const data = JSON.stringify(records, null, 2);
// await fs.promises.writeFile('export.json', data);

Return file path or download URL.`;

    case 'calculation':
      return `Perform calculations and return results. Example:
// const total = items.reduce((sum, item) => sum + item.price, 0);
// const average = total / items.length;

Return calculated values.`;

    default:
      return 'Implement the custom logic as described in the purpose.';
  }
}

/**
 * Generate prompt for iteration (fixing previous failed code)
 */
function generateIterationPrompt(tool: ToolInference, previousCode: string, error?: string): string {
  const { toolName, description, purpose, implementationType, parameters } = tool;

  return `You are an expert backend developer. The previous implementation failed. Fix the issues and generate an improved version.

**Tool Name**: ${toolName}
**Description**: ${description}
**Purpose**: ${purpose}
**Implementation Type**: ${implementationType}

**Previous Implementation** (that failed):
\`\`\`javascript
${previousCode}
\`\`\`

${error ? `**Error Message**: ${error}\n` : ''}

**Your Task**:
1. Analyze the previous code and identify the issues
2. Fix the errors while maintaining the same structure
3. Ensure proper error handling
4. Return ONLY the corrected JavaScript code (no explanations)
5. Use the same template structure: if (name === '${toolName}') { ... }

**Requirements**:
- Must accept 'args' parameter with: ${parameters.map(p => p.name).join(', ')}
- Must return: { content: [{ type: 'text', text: JSON.stringify(result) }] }
- Must include try/catch error handling
- Must validate required parameters: ${parameters.filter(p => p.required).map(p => p.name).join(', ')}

Generate the corrected implementation now:`;
}

/**
 * Extract code from AI response (handle markdown code blocks)
 */
function extractCodeFromResponse(response: string): string {
  // Try to extract code from markdown code blocks
  const codeBlockMatch = response.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // If no code block found, return the whole response
  return response.trim();
}
