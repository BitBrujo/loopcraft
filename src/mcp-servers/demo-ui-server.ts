import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Manual UI resource creation (avoiding @mcp-ui/server module resolution issues)
function createUIResource(config: {
  uri: string;
  content: { type: string; htmlString?: string; iframeUrl?: string };
  encoding: string;
}) {
  const { uri, content, encoding } = config;

  // Convert HTML string to base64 if provided
  let text = "";
  if (content.htmlString) {
    text = Buffer.from(content.htmlString, "utf-8").toString("base64");
  } else if (content.iframeUrl) {
    text = content.iframeUrl;
  }

  return {
    uri,
    mimeType: content.type === "rawHtml" ? "text/html" : "text/html",
    text,
    _meta: {
      "mcpui.dev/ui-encoding": encoding,
      "mcpui.dev/ui-contentType": content.type,
    },
  };
}

// Create MCP server instance
const server = new Server(
  {
    name: "demo-ui-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Tool 1: Greeting Card - Returns a styled HTML card
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "show_greeting_card",
        description: "Display a personalized greeting card with the user's name in a styled UI component",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name to display on the greeting card",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "interactive_counter",
        description: "Display an interactive counter with increment and decrement buttons",
        inputSchema: {
          type: "object",
          properties: {
            initialValue: {
              type: "number",
              description: "The starting value for the counter",
              default: 0,
            },
          },
        },
      },
      {
        name: "contact_form",
        description: "Display an interactive contact form with name, email, and message fields",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title to display at the top of the form",
              default: "Contact Form",
            },
          },
        },
      },
      {
        name: "data_chart",
        description: "Display a simple bar chart visualization with sample data",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title for the chart",
              default: "Sample Data",
            },
            data: {
              type: "array",
              description: "Array of data points [value1, value2, ...]",
              items: { type: "number" },
              default: [10, 25, 15, 30, 20],
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "show_greeting_card": {
      const userName = (args as { name: string }).name || "Friend";
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 200px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card {
              background: white;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 400px;
            }
            .greeting {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              margin-bottom: 16px;
            }
            .message {
              font-size: 18px;
              color: #666;
              line-height: 1.6;
            }
            .emoji {
              font-size: 48px;
              margin-bottom: 16px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="emoji">👋</div>
            <div class="greeting">Hello, ${userName}!</div>
            <div class="message">
              Welcome to MCP-UI! This is an interactive greeting card
              rendered as a UI component in your chat.
            </div>
          </div>
        </body>
        </html>
      `;

      const uiResource = createUIResource({
        uri: `ui://greeting-card/${Date.now()}`,
        content: {
          type: "rawHtml",
          htmlString: htmlContent,
        },
        encoding: "text",
      });

      return {
        content: [
          {
            type: "resource",
            resource: uiResource,
          },
        ],
      };
    }

    case "interactive_counter": {
      const initialValue = (args as { initialValue?: number }).initialValue ?? 0;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 200px;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            .counter-container {
              background: white;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
            }
            .counter-value {
              font-size: 64px;
              font-weight: bold;
              color: #f5576c;
              margin: 20px 0;
            }
            .button-container {
              display: flex;
              gap: 16px;
              justify-content: center;
            }
            button {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              border: none;
              border-radius: 8px;
              padding: 12px 24px;
              font-size: 18px;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
            }
            button:hover {
              transform: scale(1.05);
            }
            button:active {
              transform: scale(0.95);
            }
          </style>
        </head>
        <body>
          <div class="counter-container">
            <h2>Interactive Counter</h2>
            <div class="counter-value" id="counter">${initialValue}</div>
            <div class="button-container">
              <button onclick="decrement()">➖ Decrease</button>
              <button onclick="increment()">➕ Increase</button>
            </div>
          </div>
          <script>
            let count = ${initialValue};
            function increment() {
              count++;
              document.getElementById('counter').textContent = count;
            }
            function decrement() {
              count--;
              document.getElementById('counter').textContent = count;
            }
          </script>
        </body>
        </html>
      `;

      const uiResource = createUIResource({
        uri: `ui://counter/${Date.now()}`,
        content: {
          type: "rawHtml",
          htmlString: htmlContent,
        },
        encoding: "text",
      });

      return {
        content: [
          {
            type: "resource",
            resource: uiResource,
          },
        ],
      };
    }

    case "contact_form": {
      const title = (args as { title?: string }).title || "Contact Form";
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }
            .form-container {
              background: white;
              border-radius: 16px;
              padding: 40px;
              max-width: 500px;
              margin: 0 auto;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h2 {
              color: #4facfe;
              margin-top: 0;
            }
            .form-group {
              margin-bottom: 20px;
            }
            label {
              display: block;
              margin-bottom: 8px;
              color: #333;
              font-weight: 600;
            }
            input, textarea {
              width: 100%;
              padding: 12px;
              border: 2px solid #e0e0e0;
              border-radius: 8px;
              font-size: 16px;
              font-family: inherit;
              box-sizing: border-box;
            }
            input:focus, textarea:focus {
              outline: none;
              border-color: #4facfe;
            }
            textarea {
              resize: vertical;
              min-height: 100px;
            }
            button {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              color: white;
              border: none;
              border-radius: 8px;
              padding: 12px 32px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
              width: 100%;
            }
            button:hover {
              transform: translateY(-2px);
            }
            .success-message {
              display: none;
              background: #4caf50;
              color: white;
              padding: 16px;
              border-radius: 8px;
              margin-top: 20px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="form-container">
            <h2>${title}</h2>
            <form onsubmit="handleSubmit(event)">
              <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" required placeholder="Enter your name">
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" required placeholder="your@email.com">
              </div>
              <div class="form-group">
                <label for="message">Message</label>
                <textarea id="message" required placeholder="Your message here..."></textarea>
              </div>
              <button type="submit">Submit</button>
            </form>
            <div class="success-message" id="success">✅ Form submitted successfully!</div>
          </div>
          <script>
            function handleSubmit(event) {
              event.preventDefault();
              const name = document.getElementById('name').value;
              const email = document.getElementById('email').value;
              const message = document.getElementById('message').value;
              console.log('Form submitted:', { name, email, message });
              document.getElementById('success').style.display = 'block';
              event.target.reset();
              setTimeout(() => {
                document.getElementById('success').style.display = 'none';
              }, 3000);
            }
          </script>
        </body>
        </html>
      `;

      const uiResource = createUIResource({
        uri: `ui://contact-form/${Date.now()}`,
        content: {
          type: "rawHtml",
          htmlString: htmlContent,
        },
        encoding: "text",
      });

      return {
        content: [
          {
            type: "resource",
            resource: uiResource,
          },
        ],
      };
    }

    case "data_chart": {
      const title = (args as { title?: string }).title || "Sample Data";
      const data = (args as { data?: number[] }).data || [10, 25, 15, 30, 20];
      const maxValue = Math.max(...data);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            }
            .chart-container {
              background: white;
              border-radius: 16px;
              padding: 40px;
              max-width: 600px;
              margin: 0 auto;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h2 {
              color: #fa709a;
              margin-top: 0;
              text-align: center;
            }
            .chart {
              display: flex;
              align-items: flex-end;
              justify-content: space-around;
              height: 300px;
              border-bottom: 2px solid #333;
              padding: 20px 0;
            }
            .bar {
              background: linear-gradient(180deg, #fa709a 0%, #fee140 100%);
              width: 60px;
              border-radius: 8px 8px 0 0;
              transition: transform 0.3s;
              position: relative;
              display: flex;
              align-items: flex-end;
              justify-content: center;
            }
            .bar:hover {
              transform: scale(1.05);
            }
            .bar-value {
              position: absolute;
              top: -25px;
              font-weight: 600;
              color: #333;
            }
            .bar-label {
              text-align: center;
              margin-top: 10px;
              color: #666;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="chart-container">
            <h2>${title}</h2>
            <div class="chart">
              ${data.map((value, index) => {
                const height = (value / maxValue) * 100;
                return `<div style="height: ${height}%; width: 60px; background: linear-gradient(180deg, #fa709a 0%, #fee140 100%); border-radius: 8px 8px 0 0; position: relative; display: flex; align-items: flex-start; justify-content: center;">
                  <div style="position: absolute; top: -25px; font-weight: 600; color: #333;">${value}</div>
                </div>`;
              }).join('')}
            </div>
            <div style="display: flex; justify-content: space-around; margin-top: 10px;">
              ${data.map((_, index) => `<div style="width: 60px; text-align: center; color: #666; font-weight: 600;">Item ${index + 1}</div>`).join('')}
            </div>
          </div>
        </body>
        </html>
      `;

      const uiResource = createUIResource({
        uri: `ui://data-chart/${Date.now()}`,
        content: {
          type: "rawHtml",
          htmlString: htmlContent,
        },
        encoding: "text",
      });

      return {
        content: [
          {
            type: "resource",
            resource: uiResource,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Add prompts for suggestions
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "greeting_card_demo",
        description: "Demonstrate the greeting card UI component",
        arguments: [
          {
            name: "name",
            description: "Name to display on the card",
            required: false,
          },
        ],
      },
      {
        name: "counter_demo",
        description: "Demonstrate the interactive counter UI component",
      },
      {
        name: "form_demo",
        description: "Demonstrate the contact form UI component",
      },
      {
        name: "chart_demo",
        description: "Demonstrate the data chart UI component",
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "greeting_card_demo":
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Show me a greeting card with the name "${(args?.name as string) || "Alex"}"`,
            },
          },
        ],
      };

    case "counter_demo":
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Create an interactive counter starting at 5",
            },
          },
        ],
      };

    case "form_demo":
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Display a contact form titled 'Get in Touch'",
            },
          },
        ],
      };

    case "chart_demo":
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "Show me a bar chart with the title 'Monthly Sales'",
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Demo UI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});