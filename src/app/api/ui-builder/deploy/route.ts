import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateServerCode, generateFastMCPCode } from '@/lib/code-generation';
import type { UIResource } from '@/types/ui-builder';
import { writeFile, mkdir, unlink, access, constants } from 'fs/promises';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import { mcpClientManager } from '@/lib/mcp-client';

interface DeployRequest {
  resource: UIResource;
  format: 'standalone' | 'fastmcp';
  language: 'typescript' | 'javascript';
  // Companion mode settings
  companionMode?: 'disabled' | 'enabled';
  targetServerName?: string | null;
  selectedTools?: string[];
}

interface DeploymentStep {
  step: number;
  total: number;
  message: string;
  status: 'pending' | 'running' | 'success' | 'error';
  logs?: string;
}

interface DeploymentState {
  fileCreated: boolean;
  filePath?: string;
  dependenciesInstalled: boolean;
  testServerConnected: boolean;
  testServerName?: string;
  dbEntryCreated: boolean;
  dbServerId?: number;
  serverName?: string;
  serverConnected: boolean;
  userId?: number;
  spawnedProcesses: Set<ChildProcess>;
}

/**
 * Error Categorization and Troubleshooting
 */

interface CategorizedError {
  category: 'permission' | 'dependency' | 'port' | 'timeout' | 'validation' | 'unknown';
  message: string;
  troubleshooting: string[];
  fixCommand?: string;
}

function categorizeError(error: Error): CategorizedError {
  const errorMsg = error.message.toLowerCase();

  // Server startup failures with exit code 1
  if (errorMsg.includes('server exited with code 1') || errorMsg.includes('exited with code 1')) {
    return {
      category: 'validation',
      message: 'Server startup failed with exit code 1',
      troubleshooting: [
        'The server process started but exited unexpectedly',
        'This often indicates a runtime error in the generated code',
        'Check for syntax errors or missing dependencies in the generated server file',
        'Review the server logs above for specific error messages',
        'Try running the generated server manually to see detailed error output'
      ],
      fixCommand: 'npx tsx mcp-servers/[server-name]-server.ts  # Replace [server-name] with your server name'
    };
  }

  // Node.js version issues (File global missing)
  if (errorMsg.includes('file is not defined') || errorMsg.includes('referenceerror: file')) {
    return {
      category: 'dependency',
      message: 'Node.js version too old (requires v20+)',
      troubleshooting: [
        'The MCP SDK requires Node.js v20 or higher',
        'Your current Node.js version is too old and missing required globals',
        'Install Node.js v20+ from https://nodejs.org',
        'Or use nvm: nvm install 20 && nvm use 20',
        'Restart your terminal/IDE after upgrading'
      ],
      fixCommand: 'nvm install 20 && nvm use 20'
    };
  }

  // Permission errors
  if (errorMsg.includes('permission denied') || errorMsg.includes('eacces')) {
    return {
      category: 'permission',
      message: 'Permission denied - cannot write to server directory',
      troubleshooting: [
        'The application does not have write permissions to the mcp-servers directory',
        'This usually happens when the directory is owned by root or another user',
        'You can fix this by changing the directory permissions'
      ],
      fixCommand: `sudo chmod -R u+w ${join(process.cwd(), 'mcp-servers')}`
    };
  }

  // Missing dependencies
  if (errorMsg.includes('not found') || errorMsg.includes('command not found') || errorMsg.includes('enoent')) {
    if (errorMsg.includes('node')) {
      return {
        category: 'dependency',
        message: 'Node.js is not installed or not in PATH',
        troubleshooting: [
          'Node.js is required to run MCP servers',
          'Download and install from https://nodejs.org',
          'After installation, restart your terminal/IDE'
        ],
        fixCommand: undefined
      };
    }
    if (errorMsg.includes('npm') || errorMsg.includes('npx')) {
      return {
        category: 'dependency',
        message: 'npm is not installed or not in PATH',
        troubleshooting: [
          'npm is included with Node.js installation',
          'If Node.js is installed but npm is missing, reinstall Node.js',
          'Download from https://nodejs.org'
        ],
        fixCommand: undefined
      };
    }
    if (errorMsg.includes('tsx')) {
      return {
        category: 'dependency',
        message: 'tsx is not available',
        troubleshooting: [
          'tsx is required to run TypeScript servers',
          'Install it globally or let npx download it automatically',
          'Make sure you have internet connection for first-time download'
        ],
        fixCommand: 'npm install -g tsx'
      };
    }
  }

  // Port conflicts
  if (errorMsg.includes('eaddrinuse') || (errorMsg.includes('port') && errorMsg.includes('already in use'))) {
    return {
      category: 'port',
      message: 'Port is already in use by another process',
      troubleshooting: [
        'Another server is already running on the same port',
        'Find the process using the port and stop it',
        'Or configure your server to use a different port'
      ],
      fixCommand: 'lsof -i :PORT_NUMBER  # Replace PORT_NUMBER with your port'
    };
  }

  // Timeout errors
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
    return {
      category: 'timeout',
      message: 'Operation timed out',
      troubleshooting: [
        'The server took too long to start or respond',
        'This may be due to slow system resources or network',
        'Try closing other applications to free up resources',
        'Check if antivirus is blocking the process'
      ],
      fixCommand: undefined
    };
  }

  // Validation errors
  if (errorMsg.includes('validation') || errorMsg.includes('invalid') || errorMsg.includes('no tools found')) {
    return {
      category: 'validation',
      message: 'Server validation failed',
      troubleshooting: [
        'The server started but did not expose any MCP tools',
        'Check your server code for correct tool definitions',
        'Make sure you are using @mcp-ui/server or fastmcp correctly',
        'Review the generated code in the Export tab'
      ],
      fixCommand: undefined
    };
  }

  // Unknown errors
  return {
    category: 'unknown',
    message: error.message,
    troubleshooting: [
      'An unexpected error occurred during deployment',
      'Check the detailed logs above for more information',
      'Try deploying manually using the generated code',
      'Report this issue if the problem persists'
    ],
    fixCommand: undefined
  };
}

/**
 * Rollback Functions - Clean up resources in reverse order on failure
 */

async function rollbackFile(state: DeploymentState): Promise<string> {
  if (state.fileCreated && state.filePath) {
    try {
      await unlink(state.filePath);
      return `Deleted file: ${state.filePath}`;
    } catch (error) {
      return `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  return 'No file to delete';
}

async function rollbackDatabase(state: DeploymentState): Promise<string> {
  if (state.dbEntryCreated && state.dbServerId && state.userId) {
    try {
      await query(
        'DELETE FROM mcp_servers WHERE id = ? AND user_id = ?',
        [state.dbServerId, state.userId]
      );
      return `Deleted database entry: ID ${state.dbServerId}`;
    } catch (error) {
      return `Failed to delete database entry: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  return 'No database entry to delete';
}

async function rollbackTestServer(state: DeploymentState): Promise<string> {
  if (state.testServerConnected && state.testServerName) {
    try {
      await mcpClientManager.disconnectFromServer(state.testServerName);
      return `Disconnected test server: ${state.testServerName}`;
    } catch (error) {
      return `Failed to disconnect test server: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  return 'No test server to disconnect';
}

async function rollbackServerConnection(state: DeploymentState): Promise<string> {
  if (state.serverConnected && state.serverName) {
    try {
      await mcpClientManager.disconnectFromServer(state.serverName);
      return `Disconnected server: ${state.serverName}`;
    } catch (error) {
      return `Failed to disconnect server: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
  return 'No server to disconnect';
}

async function rollbackProcesses(state: DeploymentState): Promise<string> {
  const results: string[] = [];
  for (const process of state.spawnedProcesses) {
    try {
      process.kill();
      results.push(`Killed process PID ${process.pid}`);
    } catch (error) {
      results.push(`Failed to kill process: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  state.spawnedProcesses.clear();
  return results.length > 0 ? results.join('\n') : 'No processes to kill';
}

async function rollbackDeployment(
  state: DeploymentState,
  sendUpdate: (update: DeploymentStep) => void
): Promise<void> {
  sendUpdate({
    step: 0,
    total: 7,
    message: 'Rolling back deployment...',
    status: 'running',
    logs: 'Cleaning up partial deployment in reverse order'
  });

  // Rollback in reverse order of creation
  const rollbackSteps = [
    { fn: () => rollbackProcesses(state), name: 'Kill spawned processes' },
    { fn: () => rollbackServerConnection(state), name: 'Disconnect production server' },
    { fn: () => rollbackDatabase(state), name: 'Delete database entry' },
    { fn: () => rollbackTestServer(state), name: 'Disconnect test server' },
    { fn: () => rollbackFile(state), name: 'Delete server file' },
  ];

  const logs: string[] = [];
  for (const { fn, name } of rollbackSteps) {
    try {
      const result = await fn();
      logs.push(`✓ ${name}: ${result}`);
    } catch (error) {
      logs.push(`✗ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  sendUpdate({
    step: 0,
    total: 7,
    message: 'Rollback complete',
    status: 'success',
    logs: logs.join('\n')
  });
}

/**
 * Validate companion mode settings if applicable
 */
async function validateCompanionMode(
  resource: UIResource,
  userId: number,
  sendUpdate: (update: DeploymentStep) => void
): Promise<boolean> {
  // Check if this is a companion mode deployment (has selected server)
  if (!resource.selectedServerId || !resource.selectedServerName) {
    return true; // Not companion mode, skip validation
  }

  sendUpdate({
    step: 0,
    total: 7,
    message: 'Validating companion mode configuration...',
    status: 'running'
  });

  const logs: string[] = [];

  // 1. Check if target server exists in database
  try {
    const serverResults = await query<{ id: number; name: string; config: string; enabled: boolean }>(
      'SELECT id, name, config, enabled FROM mcp_servers WHERE id = ? AND user_id = ?',
      [resource.selectedServerId, userId]
    );

    if (!Array.isArray(serverResults) || serverResults.length === 0) {
      sendUpdate({
        step: 0,
        total: 7,
        message: 'Companion mode validation failed',
        status: 'error',
        logs: `✗ Target server not found\n\nServer '${resource.selectedServerName}' (ID: ${resource.selectedServerId}) does not exist in your configured servers.\n\nPlease add the target server in Settings before deploying companion mode.`
      });
      return false;
    }

    const targetServer = serverResults[0];
    logs.push(`✓ Target server found: ${targetServer.name}`);

    // 2. Check if server is enabled
    if (!targetServer.enabled) {
      sendUpdate({
        step: 0,
        total: 7,
        message: 'Companion mode validation failed',
        status: 'error',
        logs: `✗ Target server is disabled\n\nServer '${targetServer.name}' is currently disabled.\n\nPlease enable it in Settings before deploying companion mode.`
      });
      return false;
    }
    logs.push(`✓ Target server is enabled`);

    // 3. Check if server is connected
    const isConnected = mcpClientManager.isConnected(targetServer.name);
    if (!isConnected) {
      sendUpdate({
        step: 0,
        total: 7,
        message: 'Companion mode validation failed',
        status: 'error',
        logs: `✗ Target server not connected\n\nServer '${targetServer.name}' is not currently connected.\n\nThe server may have failed to start. Check server logs in Settings or try reconnecting.`
      });
      return false;
    }
    logs.push(`✓ Target server is connected`);

    // 4. Validate tools exist (if selectedTools are specified in resource)
    // Note: This requires selectedTools to be part of UIResource
    // For now, we'll skip this check as it requires frontend changes

    sendUpdate({
      step: 0,
      total: 7,
      message: 'Companion mode validated successfully',
      status: 'success',
      logs: logs.join('\n') + '\n\n✓ Companion mode configuration is valid'
    });

    return true;
  } catch (err) {
    sendUpdate({
      step: 0,
      total: 7,
      message: 'Companion mode validation failed',
      status: 'error',
      logs: `✗ Validation error\n\n${err instanceof Error ? err.message : 'Unknown error'}`
    });
    return false;
  }
}

/**
 * Pre-flight validation checks
 */
async function validateEnvironment(sendUpdate: (update: DeploymentStep) => void): Promise<boolean> {
  sendUpdate({
    step: 0,
    total: 7,
    message: 'Validating environment...',
    status: 'running'
  });

  const checks: { name: string; command: string; args: string[]; errorMsg: string }[] = [
    {
      name: 'Node.js',
      command: 'node',
      args: ['--version'],
      errorMsg: 'Node.js not found. Please install from https://nodejs.org'
    },
    {
      name: 'npm',
      command: 'npm',
      args: ['--version'],
      errorMsg: 'npm not found. Please install Node.js from https://nodejs.org'
    },
    {
      name: 'npx',
      command: 'npx',
      args: ['--version'],
      errorMsg: 'npx not found. Please install Node.js from https://nodejs.org'
    },
  ];

  const logs: string[] = [];

  for (const check of checks) {
    try {
      const result = await runCommand(check.command, check.args, 5000);
      if (!result.success) {
        throw new Error(check.errorMsg);
      }
      logs.push(`✓ ${check.name}: ${result.output.trim()}`);
    } catch {
      sendUpdate({
        step: 0,
        total: 7,
        message: 'Environment validation failed',
        status: 'error',
        logs: `✗ ${check.name} check failed\n\n${check.errorMsg}`
      });
      return false;
    }
  }

  // Check Node.js version (need v20+ for MCP SDK)
  try {
    const nodeVersionOutput = await runCommand('node', ['--version'], 5000);
    if (!nodeVersionOutput.success) {
      sendUpdate({
        step: 0,
        total: 7,
        message: 'Environment validation failed',
        status: 'error',
        logs: `✗ Could not determine Node.js version`
      });
      return false;
    }

    const nodeVersion = nodeVersionOutput.output.trim();
    const versionMatch = nodeVersion.match(/v(\d+)\./);
    const majorVersion = versionMatch ? parseInt(versionMatch[1], 10) : 0;

    if (majorVersion < 20) {
      sendUpdate({
        step: 0,
        total: 7,
        message: 'Environment validation failed',
        status: 'error',
        logs: `✗ Node.js version check failed

Current version: ${nodeVersion}
Required version: v20.0.0 or higher

The MCP SDK requires Node.js v20+ for the File global API.

Fix:
1. Install Node.js v20+ from https://nodejs.org
2. Or use nvm: nvm install 20 && nvm use 20
3. Restart your terminal/IDE after installation
4. Try deployment again`
      });
      return false;
    }

    logs.push(`✓ Node.js version: ${nodeVersion} (>= v20 required)`);
  } catch (error) {
    sendUpdate({
      step: 0,
      total: 7,
      message: 'Environment validation failed',
      status: 'error',
      logs: `✗ Node.js version check failed\n\n${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return false;
  }

  // Check write permissions to mcp-servers directory
  try {
    const serverDir = join(process.cwd(), 'mcp-servers');
    await mkdir(serverDir, { recursive: true });
    await access(serverDir, constants.W_OK);
    logs.push(`✓ Write permissions: ${serverDir}`);
  } catch {
    sendUpdate({
      step: 0,
      total: 7,
      message: 'Environment validation failed',
      status: 'error',
      logs: `✗ Permission check failed\n\nNo write access to ${join(process.cwd(), 'mcp-servers')}\n\nFix: Run 'sudo chmod -R u+w ${join(process.cwd(), 'mcp-servers')}'`
    });
    return false;
  }

  sendUpdate({
    step: 0,
    total: 7,
    message: 'Environment validated successfully',
    status: 'success',
    logs: logs.join('\n')
  });

  return true;
}

/**
 * Quick Deploy API Endpoint
 * Automates the deployment of Standalone/FastMCP MCP servers
 *
 * Steps:
 * 0. Validate environment (Node.js, npm, permissions)
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
    const { resource, format, language, companionMode, targetServerName, selectedTools } = body;

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

        // Initialize deployment state tracking
        const deploymentState: DeploymentState = {
          fileCreated: false,
          dependenciesInstalled: false,
          testServerConnected: false,
          dbEntryCreated: false,
          serverConnected: false,
          userId: user.userId,
          spawnedProcesses: new Set(),
        };

        try {
          // Step 0: Validate environment
          const isValid = await validateEnvironment(sendUpdate);
          if (!isValid) {
            throw new Error('Environment validation failed');
          }

          // Validate companion mode if applicable
          const companionValid = await validateCompanionMode(resource, user.userId, sendUpdate);
          if (!companionValid) {
            throw new Error('Companion mode validation failed');
          }

          // Step 1: Write server file
          sendUpdate({
            step: 1,
            total: 7,
            message: 'Writing server file to disk...',
            status: 'running'
          });

          const serverDir = join(process.cwd(), 'mcp-servers');
          const filePath = join(serverDir, fileName);

          // Ensure directory exists
          await mkdir(serverDir, { recursive: true });

          // Prepare options for companion mode if enabled
          const codeGenOptions = companionMode === 'enabled' && targetServerName
            ? {
                companionMode: true,
                targetServerName: targetServerName,
                selectedTools: selectedTools || []
              }
            : undefined;

          // Generate code with companion mode support
          const code = format === 'fastmcp'
            ? generateFastMCPCode(resource, codeGenOptions)
            : generateServerCode(resource, codeGenOptions);

          // Write file
          await writeFile(filePath, code, 'utf-8');

          // Track state
          deploymentState.fileCreated = true;
          deploymentState.filePath = filePath;

          sendUpdate({
            step: 1,
            total: 7,
            message: `Server file written: ${filePath}`,
            status: 'success',
            logs: `File: ${fileName}\nPath: ${filePath}\nSize: ${code.length} bytes`
          });

          // Step 2: Install dependencies
          sendUpdate({
            step: 2,
            total: 7,
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

          // Track state
          deploymentState.dependenciesInstalled = true;

          sendUpdate({
            step: 2,
            total: 7,
            message: 'Dependencies installed successfully',
            status: 'success',
            logs: npmInstall.output
          });

          // Step 3: Test server startup
          sendUpdate({
            step: 3,
            total: 7,
            message: 'Testing server startup...',
            status: 'running'
          });

          const testResult = await testServerStartup(filePath, 10000, deploymentState.spawnedProcesses);

          if (!testResult.success) {
            throw new Error(`Server startup failed: ${testResult.error}`);
          }

          sendUpdate({
            step: 3,
            total: 7,
            message: 'Server started successfully',
            status: 'success',
            logs: testResult.output
          });

          // Step 4: Validate MCP protocol
          sendUpdate({
            step: 4,
            total: 7,
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

          // Track state
          deploymentState.testServerConnected = true;
          deploymentState.testServerName = `${serverName}-test`;

          const tools = await mcpClientManager.getAllTools();
          const serverTools = tools.filter(t => t.serverName === `${serverName}-test`);

          if (serverTools.length === 0) {
            throw new Error('Server connected but no tools found');
          }

          sendUpdate({
            step: 4,
            total: 7,
            message: `MCP protocol validated (${serverTools.length} tools found)`,
            status: 'success',
            logs: serverTools.map(t => `- ${t.name}: ${t.description || 'No description'}`).join('\n')
          });

          // Disconnect test server (clean up before production deployment)
          await mcpClientManager.disconnectFromServer(`${serverName}-test`);
          deploymentState.testServerConnected = false;

          // Step 5: Add to database
          sendUpdate({
            step: 5,
            total: 7,
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

          const dbResult = await query(
            `INSERT INTO mcp_servers (user_id, name, config, enabled, created_at)
             VALUES (?, ?, ?, true, NOW())`,
            [user.userId, finalServerName, JSON.stringify(serverConfig)]
          ) as { insertId: number };

          // Track state
          deploymentState.dbEntryCreated = true;
          deploymentState.dbServerId = dbResult.insertId;
          deploymentState.serverName = finalServerName;

          sendUpdate({
            step: 5,
            total: 7,
            message: `Server added to database: ${finalServerName}`,
            status: 'success',
            logs: `Server Name: ${finalServerName}\nStatus: Enabled\nType: stdio\nCommand: ${serverConfig.command.join(' ')}`
          });

          // Step 6: Enable and connect server
          sendUpdate({
            step: 6,
            total: 7,
            message: 'Enabling and connecting server...',
            status: 'running'
          });

          await mcpClientManager.connectToServer({
            name: finalServerName,
            ...serverConfig
          });

          // Track state
          deploymentState.serverConnected = true;

          // Track user server
          await mcpClientManager.trackUserServer(user.userId, finalServerName);

          sendUpdate({
            step: 6,
            total: 7,
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
          // Categorize error and provide troubleshooting
          const categorizedError = categorizeError(
            error instanceof Error ? error : new Error('Unknown error')
          );

          // Build detailed error message with troubleshooting
          const troubleshootingMessage = [
            `Error Category: ${categorizedError.category}`,
            '',
            'Troubleshooting:',
            ...categorizedError.troubleshooting.map(tip => `• ${tip}`),
            ...(categorizedError.fixCommand ? ['', 'Fix Command:', `  ${categorizedError.fixCommand}`] : [])
          ].join('\n');

          sendUpdate({
            step: 0,
            total: 7,
            message: 'Deployment failed',
            status: 'error',
            logs: `${categorizedError.message}\n\n${troubleshootingMessage}`
          });

          // Rollback deployment (clean up partial resources)
          await rollbackDeployment(deploymentState, sendUpdate);

          controller.enqueue(encoder.encode(JSON.stringify({
            success: false,
            error: categorizedError.message,
            errorCategory: categorizedError.category,
            troubleshooting: categorizedError.troubleshooting,
            fixCommand: categorizedError.fixCommand
          }) + '\n'));
        } finally {
          // Clean up any remaining processes
          for (const process of deploymentState.spawnedProcesses) {
            try {
              process.kill();
            } catch {
              // Ignore errors during cleanup
            }
          }
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
  timeout: number = 10000,
  processTracker?: Set<ChildProcess>
): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const extension = filePath.endsWith('.ts') ? 'ts' : 'js';
    const command = extension === 'ts' ? 'tsx' : 'node';

    const serverProcess = spawn('npx', ['-y', command, filePath], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Track process if tracker provided
    if (processTracker) {
      processTracker.add(serverProcess);
    }

    let output = '';
    let errorOutput = '';
    let resolved = false;

    serverProcess.stdout?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;

      // Log stdout output for debugging
      console.log('[TEST SERVER STDOUT]:', chunk);

      // Look for success indicators
      if ((output.includes('MCP server running') || output.includes('Server started')) && !resolved) {
        resolved = true;
        console.error('[TEST] Success message detected in stdout');
        // Add delay to ensure server stabilizes before killing
        setTimeout(() => {
          serverProcess.kill();
          if (processTracker) processTracker.delete(serverProcess);
          resolve({
            success: true,
            output
          });
        }, 500);
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;

      // Log stderr output for debugging
      console.error('[TEST SERVER STDERR]:', chunk);

      // Check for startup messages (some servers log to stderr)
      if ((errorOutput.includes('MCP server running') || errorOutput.includes('Server started')) && !resolved) {
        resolved = true;
        console.error('[TEST] Success message detected in stderr');
        // Add delay to ensure server stabilizes before killing
        setTimeout(() => {
          serverProcess.kill();
          if (processTracker) processTracker.delete(serverProcess);
          resolve({
            success: true,
            output: errorOutput
          });
        }, 500);
      }
    });

    // Timeout - fail if no success signal received
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        serverProcess.kill();
        if (processTracker) processTracker.delete(serverProcess);
        // Timeout without explicit success signal is a failure
        resolve({
          success: false,
          output: output || errorOutput || 'No output received',
          error: `Server startup timeout (${timeout}ms) - no success signal detected. The server may be slow to start or may not be starting correctly.`
        });
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
        if (processTracker) processTracker.delete(serverProcess);

        // If we reach here, no success message was detected in time
        // This is a genuine failure - provide detailed error info
        const errorInfo = errorOutput || output || 'No output received';
        resolve({
          success: false,
          output: errorInfo,
          error: `Server exited with code ${code}. Output: ${errorInfo}`
        });
      }
    });
  });
}
