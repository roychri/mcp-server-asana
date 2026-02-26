#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { VERSION } from './version.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tool_handler, list_of_tools } from './tool-handler.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js'
import { TransactionLogger } from './lib/transaction-logger.js';
import { createPromptHandlers } from './prompt-handler.js';
import { createResourceHandlers } from './resource-handler.js';

async function main() {
  const asanaToken = process.env.ASANA_ACCESS_TOKEN;

  if (!asanaToken) {
    console.error("Please set ASANA_ACCESS_TOKEN environment variable");
    process.exit(1);
  }

  console.error("Starting Asana MCP Server...");
  const server = new Server(
    {
      name: "Asana MCP Server",
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {}
      },
    }
  );

  const asanaClient = new AsanaClientWrapper(asanaToken);

  const transactionLogger = new TransactionLogger(asanaClient, {
    logPath: process.env.TRANSACTION_LOG_PATH || './asana-mcp-transactions.jsonl',
    enabled: process.env.TRANSACTION_LOG_ENABLED !== 'false',
    readOnlyMode: process.env.READ_ONLY_MODE === 'true',
  });

  server.setRequestHandler(
    CallToolRequestSchema,
    transactionLogger.wrap(tool_handler(asanaClient))
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools: list_of_tools,
    };
  });

  const promptHandlers = createPromptHandlers(asanaClient);

  // Add prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, promptHandlers.listPrompts);
  server.setRequestHandler(GetPromptRequestSchema, promptHandlers.getPrompt);

  // Add resource handlers
  const resourceHandlers = createResourceHandlers(asanaClient);
  server.setRequestHandler(ListResourcesRequestSchema, resourceHandlers.listResources);
  server.setRequestHandler(ListResourceTemplatesRequestSchema, resourceHandlers.listResourceTemplates);
  server.setRequestHandler(ReadResourceRequestSchema, resourceHandlers.readResource);

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("Asana MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
