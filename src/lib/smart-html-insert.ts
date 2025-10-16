/**
 * Smart HTML Insertion Utility
 *
 * Intelligently inserts code snippets into HTML based on content type:
 * - HTML elements → Before </body>
 * - <script> blocks → Before </body> (after HTML content)
 * - <style> blocks → In <head> section
 * - Maintains proper indentation and readability
 */

/**
 * Detect the type of code snippet
 */
function detectSnippetType(snippet: string): 'style' | 'script' | 'html' {
  const trimmed = snippet.trim();

  if (trimmed.startsWith('<style')) {
    return 'style';
  }
  if (trimmed.startsWith('<script')) {
    return 'script';
  }
  return 'html';
}

/**
 * Get the indentation level of a line
 */
function getIndentation(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

/**
 * Smart insert HTML snippet into existing HTML content
 *
 * @param existingHTML - The existing HTML content
 * @param snippetCode - The code snippet to insert
 * @returns Updated HTML with snippet inserted in the correct location
 */
export function smartInsertHTML(existingHTML: string, snippetCode: string): string {
  const snippetType = detectSnippetType(snippetCode);

  // If HTML is empty or minimal, create basic structure
  if (!existingHTML.trim() || existingHTML.trim().length < 50) {
    return createMinimalHTMLWithSnippet(snippetCode, snippetType);
  }

  // Check if HTML has proper structure
  const hasDoctype = existingHTML.includes('<!DOCTYPE');
  const hasHead = existingHTML.includes('<head');
  const hasBody = existingHTML.includes('<body');

  // If no proper structure, wrap and insert
  if (!hasDoctype || !hasHead || !hasBody) {
    return createMinimalHTMLWithSnippet(snippetCode, snippetType);
  }

  // Insert based on snippet type
  switch (snippetType) {
    case 'style':
      return insertInHead(existingHTML, snippetCode);
    case 'script':
      return insertBeforeBodyEnd(existingHTML, snippetCode);
    case 'html':
      return insertBeforeBodyEnd(existingHTML, snippetCode, true);
    default:
      return existingHTML;
  }
}

/**
 * Insert snippet into <head> section
 */
function insertInHead(html: string, snippet: string): string {
  const headEndIndex = html.indexOf('</head>');
  if (headEndIndex === -1) {
    return html; // No head tag found
  }

  // Get indentation from the line before </head>
  const beforeHead = html.substring(0, headEndIndex);
  const lines = beforeHead.split('\n');
  const lastLine = lines[lines.length - 1];
  const baseIndent = getIndentation(lastLine);

  // Insert with proper indentation
  const indentedSnippet = snippet
    .split('\n')
    .map((line, index) => (index === 0 ? baseIndent + line : baseIndent + line))
    .join('\n');

  const insertion = `\n${indentedSnippet}\n${baseIndent}`;

  return (
    html.substring(0, headEndIndex) +
    insertion +
    html.substring(headEndIndex)
  );
}

/**
 * Insert snippet before </body>
 * @param beforeScript - If true, insert before any existing scripts (for HTML elements)
 */
function insertBeforeBodyEnd(html: string, snippet: string, beforeScript = false): string {
  const bodyEndIndex = html.indexOf('</body>');
  if (bodyEndIndex === -1) {
    return html; // No body tag found
  }

  let insertionPoint = bodyEndIndex;

  // If inserting HTML elements, try to insert before scripts
  if (beforeScript) {
    const beforeBody = html.substring(0, bodyEndIndex);
    const lastScriptMatch = beforeBody.lastIndexOf('<script');
    if (lastScriptMatch !== -1) {
      // Find the start of the line containing <script
      const lineStart = beforeBody.lastIndexOf('\n', lastScriptMatch);
      insertionPoint = lineStart !== -1 ? lineStart + 1 : lastScriptMatch;
    }
  }

  // Get indentation from the line before insertion point
  const beforeInsertion = html.substring(0, insertionPoint);
  const lines = beforeInsertion.split('\n');
  const lastLine = lines[lines.length - 1];
  const baseIndent = getIndentation(lastLine);

  // Insert with proper indentation and blank lines for readability
  const indentedSnippet = snippet
    .split('\n')
    .map((line, index) => {
      if (line.trim() === '') return ''; // Preserve blank lines
      return index === 0 ? baseIndent + line : baseIndent + line;
    })
    .join('\n');

  const insertion = beforeScript
    ? `\n${indentedSnippet}\n\n${baseIndent}` // Extra blank line for HTML elements
    : `\n${indentedSnippet}\n${baseIndent}`; // Normal for scripts

  return (
    html.substring(0, insertionPoint) +
    insertion +
    html.substring(insertionPoint)
  );
}

/**
 * Create minimal HTML structure with snippet inserted
 */
function createMinimalHTMLWithSnippet(snippet: string, snippetType: 'style' | 'script' | 'html'): string {
  const style = snippetType === 'style' ? `  ${snippet}\n` : '';
  const body = snippetType === 'html' ? `  ${snippet}\n\n` : '  <h1>Hello World!</h1>\n\n';
  const script = snippetType === 'script' ? `  ${snippet}\n` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Template</title>
  <script src="https://cdn.tailwindcss.com"></script>
${style}</head>
<body class="p-8 max-w-4xl mx-auto">
${body}${script}</body>
</html>`;
}
