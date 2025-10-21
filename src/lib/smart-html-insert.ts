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
 * Extract element ID from snippet code
 */
function extractElementId(snippet: string): string | null {
  // Match id="..." or id='...'
  const idMatch = snippet.match(/id=["']([^"']+)["']/);
  return idMatch ? idMatch[1] : null;
}

/**
 * Check if element ID already exists in HTML
 */
function elementIdExists(html: string, elementId: string): boolean {
  if (!elementId) return false;

  // Check for id="elementId" or id='elementId'
  const regex = new RegExp(`id=["']${elementId}["']`, 'i');
  return regex.test(html);
}

/**
 * Remove existing element with given ID from HTML
 */
function removeElementById(html: string, elementId: string): string {
  if (!elementId || !elementIdExists(html, elementId)) {
    return html;
  }

  // Find the element with this ID and remove it along with its associated script
  // This is a simplified approach - finds opening tag with ID and removes until closing tag
  const lines = html.split('\n');
  const newLines: string[] = [];
  let skipUntilClosing: string | null = null;
  let skipScript = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If we're inside a script that follows our element, skip it
    if (skipScript) {
      if (line.includes('</script>')) {
        skipScript = false;
      }
      continue;
    }

    // If we're skipping until a closing tag
    if (skipUntilClosing) {
      if (line.includes(`</${skipUntilClosing}>`)) {
        skipUntilClosing = null;
        // Check if next lines contain a related script
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('<script>')) {
          skipScript = true;
        }
      }
      continue;
    }

    // Check if this line contains our element ID
    if (line.includes(`id="${elementId}"`) || line.includes(`id='${elementId}'`)) {
      // Extract tag name
      const tagMatch = line.match(/<(\w+)/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        // If it's a self-closing tag or closes on same line, skip just this line
        if (line.includes('/>') || line.includes(`</${tagName}>`)) {
          // Check if next lines contain a related script
          if (i + 1 < lines.length && lines[i + 1].trim().startsWith('<script>')) {
            skipScript = true;
          }
          continue;
        }
        // Otherwise, skip until closing tag
        skipUntilClosing = tagName;
      }
      continue;
    }

    newLines.push(line);
  }

  return newLines.join('\n');
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

  // Check for duplicate element IDs and remove existing if found
  let htmlToModify = existingHTML;
  if (snippetType === 'html') {
    const elementId = extractElementId(snippetCode);
    if (elementId && elementIdExists(htmlToModify, elementId)) {
      // Remove existing element with same ID to prevent duplicates
      htmlToModify = removeElementById(htmlToModify, elementId);
    }
  }

  // Insert based on snippet type
  switch (snippetType) {
    case 'style':
      return insertInHead(htmlToModify, snippetCode);
    case 'script':
      return insertBeforeBodyEnd(htmlToModify, snippetCode);
    case 'html':
      return insertBeforeBodyEnd(htmlToModify, snippetCode, true);
    default:
      return htmlToModify;
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
