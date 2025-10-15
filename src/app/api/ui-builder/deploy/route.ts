import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateServerCode, generateFastMCPCode } from '@/lib/code-generation';
import type { UIResource } from '@/types/ui-builder';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';
import { mcpClientManager } from '@/lib/mcp-client';

interface DeployRequest {
  resource: UIResource;
  format: 'standalone' | 'fastmcp';
  language: 'typescript' | 'javascript';
}

interface DeploymentStep {
  step: number;
  total: number;
  message: string;
  status: 'pending' | 'running' | 'success' | 'error';
  logs?: string;
}

/**
 * Quick Deploy API Endpoint
 * Automates the deployment of Standalone/FastMCP MCP servers
 *
 * Steps:
 * 1. Write server file to disk
 * 2. Install dependencies
 * 3. Test server startup
 * 4. Validate MCP protocol
 * 5. Add to database
 * 6. Enable and connect server
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: DeployRequest = await request.json();
    const { resource, format, language } = body;

    // Validate input
    if (!resource || !format || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: resource, format, language' },
        { status: 400 }
      );
    }

    if (format !== 'standalone' && format !== 'fastmcp') {
      return NextResponse.json(
        { error: 'Invalid format. Must be "standalone" or "fastmcp"' },
        { status: 400 }
      );
    }

    // Extract server name from URI
    const serverName = resource.uri.split('/')[2] || 'my-ui-server';
    const extension = language === 'typescript' ? 'ts' : 'js';
    const fileName = `${serverName}-server.${extension}`;

    // Setup streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (update: DeploymentStep) => {
          controller.enqueue(encoder.encode(JSON.stringify(update) + '\n'));
        };

        try {
          // Step 1: Write server file
          sendUpdate({
            step: 1,
            total: 6,
            message: 'Writing server file to disk...',
            status: 'running'
          });

          const serverDir = join(process.cwd(), 'mcp-servers');
          const filePath = join(serverDir, fileName);

          // Ensure directory exists
          await mkdir(serverDir, { recursive: true });

          // Generate code
          const code = format === 'fastmcp'
            ? generateFastMCPCode(resource)
            : generateServerCode(resource);

          // Write file
          await writeFile(filePath, code, 'utf-8');

          sendUpdate({
            step: 1,
            total: 6,
            message: `Server file written: ${filePath}`,
            status: 'success',
            logs: `File: ${fileName}\nPath: ${filePath}\nSize: ${code.length} bytes`
          });

          // Step 2: Install dependencies
          sendUpdate({
            step: 2,
            total: 6,
            message: 'Installing dependencies...',
            status: 'running'
          });

          const dependencies = format === 'fastmcp'
            ? ['fastmcp', 'zod', '@mcp-ui/server']
            : ['@mcp-ui/server', '@modelcontextprotocol/sdk'];

          const npmInstall = await runCommand('npm', ['install', ...dependencies]);

          if (!npmInstall.success) {
            throw new Error(`Failed to install dependencies: ${npmInstall.error}`);
          }

          sendUpdate({
            step: 2,
            total: 6,
            message: 'Dependencies installed successfully',
            status: 'success',
            logs: npmInstall.output
          });

          // Step 3: Test server startup
          sendUpdate({
            step: 3,
            total: 6,
            message: 'Testing server startup...',
            status: 'running'
          });

          const testResult = await testServerStartup(filePath, 10000);

          if (!testResult.success) {
            throw new Error(`Server startup failed: ${testResult.error}`);
          }

          sendUpdate({
            step: 3,
            total: 6,
            message: 'Server started successfully',
            status: 'success',
            logs: testResult.output
          });

          // Step 4: Validate MCP protocol
          sendUpdate({
            step: 4,
            total: 6,
            message: 'Validating MCP protocol...',
            status: 'running'
          });

          // Connect to server temporarily for validation
          const testServerConfig = {
            name: `${serverName}-test`,
            command: ['npx', '-y', language === 'typescript' ? 'tsx' : 'node', filePath],
            type: 'stdio' as const,
          };

          await mcpClientManager.connectToServer(testServerConfig);
          const tools = await mcpClientManager.getAllTools();
          const serverTools = tools.filter(t => t.serverName === `${serverName}-test`);

          await mcpClientManager.disconnectFromServer(`${serverName}-test`);

          if (serverTools.length === 0) {
            throw new Error('Server connected but no tools found');
          }

          sendUpdate({
            step: 4,
            total: 6,
            message: `MCP protocol validated (${serverTools.length} tools found)`,
            status: 'success',
            logs: serverTools.map(t => `- ${t.name}: ${t.description || 'No description'}`).join('\n')
          });

          // Step 5: Add to database
          sendUpdate({
            step: 5,
            total: 6,
            message: 'Adding server to database...',
            status: 'running'
          });

          // Check for existing server with same name
          const existingServers = await query<{ id: number }>(
            'SELECT id FROM mcp_servers WHERE user_id = ? AND name = ?',
            [user.userId, serverName]
          );

          let finalServerName = serverName;
          if (Array.isArray(existingServers) && existingServers.length > 0) {
            // Append timestamp to avoid collision
            finalServerName = `${serverName}-${Date.now()}`;
          }

          const serverConfig = {
            command: ['npx', '-y', language === 'typescript' ? 'tsx' : 'node', filePath],
            type: 'stdio' as const,
          };

          await query(
            `INSERT INTO mcp_servers (user_id, name, config, is_enabled, created_at)
             VALUES (?, ?, ?, true, NOW())`,
            [user.userId, finalServerName, JSON.stringify(serverConfig)]
          );

          sendUpdate({
            step: 5,
            total: 6,
            message: `Server added to database: ${finalServerName}`,
            status: 'success',
            logs: `Server Name: ${finalServerName}\nStatus: Enabled\nType: stdio\nCommand: ${serverConfig.command.join(' ')}`
          });

          // Step 6: Enable and connect server
          sendUpdate({
            step: 6,
            total: 6,
            message: 'Enabling and connecting server...',
            status: 'running'
          });

          await mcpClientManager.connectToServer({
            name: finalServerName,
            ...serverConfig
          });

          // Track user server
          await mcpClientManager.trackUserServer(user.userId, finalServerName);

          sendUpdate({
            step: 6,
            total: 6,
            message: 'Server deployed and connected successfully!',
            status: 'success',
            logs: `Server: ${finalServerName}\nFile: ${filePath}\nStatus: Connected and ready to use`
          });

          // Send final success message
          controller.enqueue(encoder.encode(JSON.stringify({
            success: true,
            serverName: finalServerName,
            filePath,
            message: 'Deployment complete! Server is ready to use in chat.'
          }) + '\n'));

        } catch (error) {
          // Send error update
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          sendUpdate({
            step: 0,
            total: 6,
            message: 'Deployment failed',
            status: 'error',
            logs: errorMessage
          });

          controller.enqueue(encoder.encode(JSON.stringify({
            success: false,
            error: errorMessage
          }) + '\n'));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Deploy API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deployment failed' },
      { status: 500 }
    );
  }
}

/**
 * Run a shell command and return the result
 */
async function runCommand(
  command: string,
  args: string[],
  timeout: number = 60000
): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const childProcess = spawn(command, args, {
      cwd: process.cwd(),
      shell: true
    });

    let output = '';
    let errorOutput = '';

    childProcess.stdout?.on('data', (data) => {
      output += data.toString();
    });

    childProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    const timeoutId = setTimeout(() => {
      childProcess.kill();
      resolve({
        success: false,
        output,
        error: 'Command timed out'
      });
    }, timeout);

    childProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({
        success: code === 0,
        output: output || errorOutput,
        error: code !== 0 ? errorOutput : undefined
      });
    });

    childProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        output,
        error: err.message
      });
    });
  });
}

/**
 * Test server startup by spawning the process and checking for errors
 */
async function testServerStartup(
  filePath: string,
  timeout: number = 10000
): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const extension = filePath.endsWith('.ts') ? 'ts' : 'js';
    const command = extension === 'ts' ? 'tsx' : 'node';

    const serverProcess = spawn('npx', ['-y', command, filePath], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';
    let resolved = false;

    serverProcess.stdout?.on('data', (data) => {
      output += data.toString();
      // Look for success indicators
      if ((output.includes('MCP server running') || output.includes('Server started')) && !resolved) {
        resolved = true;
        serverProcess.kill();
        resolve({
          success: true,
          output
        });
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
      // Check for startup messages (some servers log to stderr)
      if ((errorOutput.includes('MCP server running') || errorOutput.includes('Server started')) && !resolved) {
        resolved = true;
        serverProcess.kill();
        resolve({
          success: true,
          output: errorOutput
        });
      }
    });

    // Timeout - assume success if no errors after timeout
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        serverProcess.kill();
        // If no errors and server is still running, consider it a success
        if (errorOutput.includes('Error') || errorOutput.includes('error')) {
          resolve({
            success: false,
            output: output || errorOutput,
            error: 'Server startup errors detected'
          });
        } else {
          resolve({
            success: true,
            output: output || errorOutput || 'Server started (no output)'
          });
        }
      }
    }, timeout);

    serverProcess.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve({
          success: false,
          output,
          error: err.message
        });
      }
    });

    serverProcess.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        // Early exit with code 0 is acceptable for some MCP servers
        if (code === 0 || !errorOutput) {
          resolve({
            success: true,
            output: output || errorOutput
          });
        } else {
          resolve({
            success: false,
            output: output || errorOutput,
            error: `Server exited with code ${code}`
          });
        }
      }
    });
  });
}
