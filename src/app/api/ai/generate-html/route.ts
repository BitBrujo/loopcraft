import { NextRequest, NextResponse } from 'next/server';
import { createOllama } from 'ollama-ai-provider-v2';
import { generateText } from 'ai';
import { getUserFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import type { Setting } from '@/types/database';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentHtml } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Get AI configuration (user settings or environment variables)
    let baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api';
    let modelName = process.env.OLLAMA_MODEL || 'llama3.2:latest';

    // Check for user-specific AI settings
    const user = getUserFromRequest(req);
    if (user) {
      try {
        const userApiUrl = await queryOne<Setting>(
          'SELECT * FROM settings WHERE user_id = ? AND `key` = ?',
          [user.userId, 'ollama_base_url']
        );

        const userModelName = await queryOne<Setting>(
          'SELECT * FROM settings WHERE user_id = ? AND `key` = ?',
          [user.userId, 'ollama_model']
        );

        // Use user settings if they exist
        if (userApiUrl && userApiUrl.value) {
          baseURL = userApiUrl.value;
        }
        if (userModelName && userModelName.value) {
          modelName = userModelName.value;
        }
      } catch (error) {
        console.error('Error fetching user AI settings:', error);
        // Continue with environment variable defaults
      }
    }

    // Configure AI provider
    const ollama = createOllama({
      baseURL,
    });

    // Build system prompt
    const systemPrompt = `You are an expert HTML/CSS developer. Generate clean, semantic, and well-structured HTML based on the user's request.

Rules:
- Always include a complete HTML document with <!DOCTYPE html>, <html>, <head>, and <body> tags
- Use semantic HTML5 elements (header, nav, main, article, section, footer, etc.)
- Include inline CSS styles in a <style> tag in the <head> section
- Make the design responsive and modern
- Use proper indentation and formatting
- Include appropriate meta tags and title
- Add data-action attributes to interactive elements (buttons, forms, links) for MCP-UI action mapping
- Return ONLY the HTML code without any explanations or markdown code blocks`;

    // Build user prompt with context
    let userPrompt = prompt;
    if (currentHtml && currentHtml.trim()) {
      userPrompt = `Current HTML code for context:\n\`\`\`html\n${currentHtml}\n\`\`\`\n\nUser request: ${prompt}`;
    }

    // Generate HTML using AI
    const result = await generateText({
      model: ollama(modelName),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 4000,
    });

    // Clean up the response (remove markdown code blocks if present)
    let generatedHtml = result.text.trim();

    // Remove markdown code blocks
    if (generatedHtml.startsWith('```html') || generatedHtml.startsWith('```')) {
      generatedHtml = generatedHtml.replace(/^```html?\n?/, '').replace(/\n?```$/, '').trim();
    }

    return NextResponse.json({
      success: true,
      html: generatedHtml,
    });
  } catch (error) {
    console.error('Error generating HTML:', error);

    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        return NextResponse.json(
          { error: 'Failed to connect to AI service. Please check your configuration.' },
          { status: 503 }
        );
      }
      if (error.message.includes('model')) {
        return NextResponse.json(
          { error: 'AI model not found. Please check your model configuration.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate HTML. Please try again.' },
      { status: 500 }
    );
  }
}
