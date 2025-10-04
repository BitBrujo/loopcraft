#!/usr/bin/env node
/**
 * HyperMemory MCP Server with UI Resources
 *
 * Fork of @modelcontextprotocol/server-memory with interactive UI
 * Uses stdio transport for local process communication
 *
 * To run: npx tsx src/mcp-servers/hypermemory-server.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createUIResource } from '@mcp-ui/server';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define memory file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORY_FILE_PATH = process.env.MEMORY_FILE_PATH || path.join(__dirname, 'hypermemory.json');

// Knowledge graph interfaces
interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

interface Relation {
  from: string;
  to: string;
  relationType: string;
}

interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

// Knowledge Graph Manager
class KnowledgeGraphManager {
  private async loadGraph(): Promise<KnowledgeGraph> {
    try {
      const data = await fs.readFile(MEMORY_FILE_PATH, "utf-8");
      const lines = data.split("\n").filter(line => line.trim() !== "");
      return lines.reduce((graph: KnowledgeGraph, line) => {
        const item = JSON.parse(line);
        if (item.type === "entity") graph.entities.push(item as Entity);
        if (item.type === "relation") graph.relations.push(item as Relation);
        return graph;
      }, { entities: [], relations: [] });
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
        return { entities: [], relations: [] };
      }
      throw error;
    }
  }

  private async saveGraph(graph: KnowledgeGraph): Promise<void> {
    const lines = [
      ...graph.entities.map(e => JSON.stringify({
        type: "entity",
        name: e.name,
        entityType: e.entityType,
        observations: e.observations
      })),
      ...graph.relations.map(r => JSON.stringify({
        type: "relation",
        from: r.from,
        to: r.to,
        relationType: r.relationType
      })),
    ];
    await fs.writeFile(MEMORY_FILE_PATH, lines.join("\n"));
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    const graph = await this.loadGraph();
    const newEntities = entities.filter(e => !graph.entities.some(existingEntity => existingEntity.name === e.name));
    graph.entities.push(...newEntities);
    await this.saveGraph(graph);
    return newEntities;
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    const graph = await this.loadGraph();
    const newRelations = relations.filter(r => !graph.relations.some(existingRelation =>
      existingRelation.from === r.from &&
      existingRelation.to === r.to &&
      existingRelation.relationType === r.relationType
    ));
    graph.relations.push(...newRelations);
    await this.saveGraph(graph);
    return newRelations;
  }

  async addObservations(observations: { entityName: string; contents: string[] }[]): Promise<{ entityName: string; addedObservations: string[] }[]> {
    const graph = await this.loadGraph();
    const results = observations.map(o => {
      const entity = graph.entities.find(e => e.name === o.entityName);
      if (!entity) {
        throw new Error(`Entity with name ${o.entityName} not found`);
      }
      const newObservations = o.contents.filter(content => !entity.observations.includes(content));
      entity.observations.push(...newObservations);
      return { entityName: o.entityName, addedObservations: newObservations };
    });
    await this.saveGraph(graph);
    return results;
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.entities = graph.entities.filter(e => !entityNames.includes(e.name));
    graph.relations = graph.relations.filter(r => !entityNames.includes(r.from) && !entityNames.includes(r.to));
    await this.saveGraph(graph);
  }

  async deleteObservations(deletions: { entityName: string; observations: string[] }[]): Promise<void> {
    const graph = await this.loadGraph();
    deletions.forEach(d => {
      const entity = graph.entities.find(e => e.name === d.entityName);
      if (entity) {
        entity.observations = entity.observations.filter(o => !d.observations.includes(o));
      }
    });
    await this.saveGraph(graph);
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.relations = graph.relations.filter(r => !relations.some(delRelation =>
      r.from === delRelation.from &&
      r.to === delRelation.to &&
      r.relationType === delRelation.relationType
    ));
    await this.saveGraph(graph);
  }

  async readGraph(): Promise<KnowledgeGraph> {
    return this.loadGraph();
  }

  async searchNodes(query: string): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();

    const filteredEntities = graph.entities.filter(e =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.entityType.toLowerCase().includes(query.toLowerCase()) ||
      e.observations.some(o => o.toLowerCase().includes(query.toLowerCase()))
    );

    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));

    const filteredRelations = graph.relations.filter(r =>
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );

    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();

    const filteredEntities = graph.entities.filter(e => names.includes(e.name));
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));

    const filteredRelations = graph.relations.filter(r =>
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );

    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }
}

const knowledgeGraphManager = new KnowledgeGraphManager();

// Create MCP server
const server = new Server(
  {
    name: 'hypermemory',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_memory_interface",
        description: "Get an interactive UI for managing the knowledge graph (creating entities, searching, viewing results)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_entities",
        description: "Create multiple new entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            entities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "The name of the entity" },
                  entityType: { type: "string", description: "The type of the entity" },
                  observations: {
                    type: "array",
                    items: { type: "string" },
                    description: "An array of observation contents associated with the entity"
                  },
                },
                required: ["name", "entityType", "observations"],
              },
            },
          },
          required: ["entities"],
        },
      },
      {
        name: "create_relations",
        description: "Create multiple new relations between entities in the knowledge graph. Relations should be in active voice",
        inputSchema: {
          type: "object",
          properties: {
            relations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string", description: "The name of the entity where the relation starts" },
                  to: { type: "string", description: "The name of the entity where the relation ends" },
                  relationType: { type: "string", description: "The type of the relation" },
                },
                required: ["from", "to", "relationType"],
              },
            },
          },
          required: ["relations"],
        },
      },
      {
        name: "add_observations",
        description: "Add new observations to existing entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            observations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityName: { type: "string", description: "The name of the entity to add the observations to" },
                  contents: {
                    type: "array",
                    items: { type: "string" },
                    description: "An array of observation contents to add"
                  },
                },
                required: ["entityName", "contents"],
              },
            },
          },
          required: ["observations"],
        },
      },
      {
        name: "delete_entities",
        description: "Delete multiple entities and their associated relations from the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            entityNames: {
              type: "array",
              items: { type: "string" },
              description: "An array of entity names to delete"
            },
          },
          required: ["entityNames"],
        },
      },
      {
        name: "delete_observations",
        description: "Delete specific observations from entities in the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            deletions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  entityName: { type: "string", description: "The name of the entity containing the observations" },
                  observations: {
                    type: "array",
                    items: { type: "string" },
                    description: "An array of observations to delete"
                  },
                },
                required: ["entityName", "observations"],
              },
            },
          },
          required: ["deletions"],
        },
      },
      {
        name: "delete_relations",
        description: "Delete multiple relations from the knowledge graph",
        inputSchema: {
          type: "object",
          properties: {
            relations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string", description: "The name of the entity where the relation starts" },
                  to: { type: "string", description: "The name of the entity where the relation ends" },
                  relationType: { type: "string", description: "The type of the relation" },
                },
                required: ["from", "to", "relationType"],
              },
              description: "An array of relations to delete"
            },
          },
          required: ["relations"],
        },
      },
      {
        name: "read_graph",
        description: "Read the entire knowledge graph",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "search_nodes",
        description: "Search for nodes in the knowledge graph based on a query",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query to match against entity names, types, and observation content" },
          },
          required: ["query"],
        },
      },
      {
        name: "open_nodes",
        description: "Open specific nodes in the knowledge graph by their names",
        inputSchema: {
          type: "object",
          properties: {
            names: {
              type: "array",
              items: { type: "string" },
              description: "An array of entity names to retrieve",
            },
          },
          required: ["names"],
        },
      },
    ],
  }));

  // Resource list handler - return empty list (no resources exposed)
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: []
  }));

  // Tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error(`[HYPERMEMORY] Tool called: ${name}`);

    if (name === "get_memory_interface") {
      console.error('[HYPERMEMORY] Generating UI resource...');
      const uiResource = createUIResource({
        uri: "ui://hypermemory/interface",
        content: {
          type: 'rawHtml',
          htmlString: `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #f5f5f5; }
  .container { max-width: 800px; margin: 0 auto; }
  .card { background: white; border-radius: 8px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  h2 { margin-bottom: 16px; color: #333; }
  form { display: flex; flex-direction: column; gap: 12px; }
  input, textarea { padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
  input:focus, textarea:focus { outline: none; border-color: #0066cc; }
  textarea { min-height: 80px; resize: vertical; font-family: inherit; }
  button { padding: 10px 16px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
  button:hover { background: #0052a3; }
  button:active { transform: scale(0.98); }
  #searchBtn { background: #28a745; }
  #searchBtn:hover { background: #218838; }
  #results { margin-top: 12px; }
  .entity { background: #f8f9fa; padding: 12px; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #0066cc; }
  .entity-name { font-weight: bold; color: #333; }
  .entity-type { color: #666; font-size: 12px; margin-left: 8px; }
  .observations { margin-top: 8px; padding-left: 16px; color: #555; font-size: 14px; }
  .error { background: #f8d7da; color: #721c24; padding: 12px; border-radius: 4px; border-left: 3px solid #dc3545; }
  .success { background: #d4edda; color: #155724; padding: 12px; border-radius: 4px; border-left: 3px solid #28a745; }
</style>

<div class="container">
  <div class="card">
    <h2>Create Entity</h2>
    <form id="entityForm">
      <input id="name" placeholder="Entity Name" required>
      <input id="type" placeholder="Type (person, place, organization, etc.)" required>
      <textarea id="observation" placeholder="Observations (one per line)"></textarea>
      <button type="submit">Add Entity</button>
    </form>
    <div id="createResult"></div>
  </div>

  <div class="card">
    <h2>Search Knowledge Graph</h2>
    <input id="searchInput" placeholder="Search entities, types, or observations">
    <button id="searchBtn">Search</button>
    <div id="results"></div>
  </div>
</div>

<script>
  const showMessage = (elementId, message, isError = false) => {
    const el = document.getElementById(elementId);
    el.innerHTML = '<div class="' + (isError ? 'error' : 'success') + '">' + message + '</div>';
    setTimeout(() => { el.innerHTML = ''; }, 5000);
  };

  const displayEntities = (data) => {
    const resultsDiv = document.getElementById('results');
    if (!data.entities || data.entities.length === 0) {
      resultsDiv.innerHTML = '<p style="color: #666; padding: 12px;">No results found</p>';
      return;
    }

    resultsDiv.innerHTML = data.entities.map(e =>
      '<div class="entity">' +
        '<div><span class="entity-name">' + e.name + '</span>' +
        '<span class="entity-type">[' + e.entityType + ']</span></div>' +
        (e.observations && e.observations.length > 0
          ? '<div class="observations">' + e.observations.map(o => '• ' + o).join('<br>') + '</div>'
          : '') +
      '</div>'
    ).join('');
  };

  document.getElementById('entityForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const type = document.getElementById('type').value.trim();
    const obsText = document.getElementById('observation').value.trim();
    const observations = obsText ? obsText.split('\\n').filter(o => o.trim()) : [];

    try {
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'create_entities',
          params: {
            entities: [{
              name: name,
              entityType: type,
              observations: observations
            }]
          }
        }
      }, '*');

      showMessage('createResult', 'Entity creation requested...');
      document.getElementById('entityForm').reset();
    } catch (error) {
      showMessage('createResult', 'Error: ' + error.message, true);
    }
  });

  document.getElementById('searchBtn').addEventListener('click', async () => {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
      showMessage('results', 'Please enter a search query', true);
      return;
    }

    try {
      window.parent.postMessage({
        type: 'tool',
        payload: {
          toolName: 'search_nodes',
          params: { query: query }
        }
      }, '*');
    } catch (error) {
      showMessage('results', 'Error: ' + error.message, true);
    }
  });

  // Listen for tool call responses
  window.addEventListener('message', (event) => {
    if (event.data.type === 'mcp-ui-tool-response') {
      const { result } = event.data;
      if (result && result.content && result.content[0]) {
        try {
          const data = JSON.parse(result.content[0].text);
          if (data.entities) {
            displayEntities(data);
          }
        } catch (e) {
          console.error('Failed to parse response:', e);
        }
      }
    }
  });
</script>
`
        },
        encoding: 'text',
        uiMetadata: {
          'preferred-frame-size': ['800px', '600px'],
        }
      });

      // Return as text with special prefix to bypass MCP validation
      // The chat API will detect this and handle it appropriately
      const response = {
        content: [{
          type: "text",
          text: "__MCP_UI_RESOURCE__:" + JSON.stringify(uiResource)
        }]
      };
      console.error('[HYPERMEMORY] Returning UI resource with prefix, length:', response.content[0].text.length);
      return response;
    }

    if (name === "read_graph") {
      return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.readGraph(), null, 2) }] };
    }

    if (!args) {
      throw new Error(`No arguments provided for tool: ${name}`);
    }

    switch (name) {
      case "create_entities":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.createEntities(args.entities as Entity[]), null, 2) }] };
      case "create_relations":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.createRelations(args.relations as Relation[]), null, 2) }] };
      case "add_observations":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.addObservations(args.observations as { entityName: string; contents: string[] }[]), null, 2) }] };
      case "delete_entities":
        await knowledgeGraphManager.deleteEntities(args.entityNames as string[]);
        return { content: [{ type: "text", text: "Entities deleted successfully" }] };
      case "delete_observations":
        await knowledgeGraphManager.deleteObservations(args.deletions as { entityName: string; observations: string[] }[]);
        return { content: [{ type: "text", text: "Observations deleted successfully" }] };
      case "delete_relations":
        await knowledgeGraphManager.deleteRelations(args.relations as Relation[]);
        return { content: [{ type: "text", text: "Relations deleted successfully" }] };
      case "search_nodes":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.searchNodes(args.query as string), null, 2) }] };
      case "open_nodes":
        return { content: [{ type: "text", text: JSON.stringify(await knowledgeGraphManager.openNodes(args.names as string[]), null, 2) }] };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('HyperMemory MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
