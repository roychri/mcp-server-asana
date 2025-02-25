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
} from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js'
import { createPromptHandlers } from './prompt-handler.js';

/**
 * Tries to decode a base64 string, returns the original string if decoding fails
 * @param token The token to decode
 * @returns The decoded token or the original token if decoding fails
 */
function tryDecodeBase64(token: string): string {
  try {
    // Check if the string looks like base64
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (base64Regex.test(token)) {
      const decoded = Buffer.from(token, 'base64').toString();
      // If the decoded string is valid and different from the input, use it
      if (decoded && decoded !== token) {
        console.error("Successfully decoded base64 token");
        return decoded;
      }
    }
    return token; // Return original if not base64 or decoding produces same string
  } catch (error) {
    console.error("Error decoding token, using original:", error);
    return token; // Return original on any error
  }
}

async function main() {
  const encodedAsanaToken = process.env.ASANA_ACCESS_TOKEN;

  if (!encodedAsanaToken) {
    console.error("Please set ASANA_ACCESS_TOKEN environment variable");
    process.exit(1);
  }
  
  // Try to decode the token if it's base64 encoded
  const asanaToken = tryDecodeBase64(encodedAsanaToken);

  console.error("Starting Asana MCP Server...");
  const server = new Server(
    {
      name: "Asana MCP Server",
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        prompts: {}
      },
    }
  );

  const asanaClient = new AsanaClientWrapper(asanaToken);

  server.setRequestHandler(
    CallToolRequestSchema,
    tool_handler(asanaClient)
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

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("Asana MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
