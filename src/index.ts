#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { VERSION } from './version.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { tool_handler } from './tool-handler.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js'

import { listWorkspacesTool } from './tools/workspace-tools.js';
import {
  searchProjectsTool,
  getProjectTool,
  getProjectTaskCountsTool,
  getProjectSectionsTool
} from './tools/project-tools.js';
import {
  searchTasksTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
  createSubtaskTool,
  getMultipleTasksByGidTool
} from './tools/task-tools.js';
import {
  addTaskDependenciesTool,
  addTaskDependentsTool
} from './tools/task-relationship-tools.js';
import {
  getStoriesForTaskTool,
  createTaskStoryTool
} from './tools/story-tools.js';

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
        prompts: {}
      },
    }
  );

  const asanaClient = new AsanaClientWrapper(asanaToken);

  server.setRequestHandler(
    CallToolRequestSchema,
    await tool_handler(asanaClient)
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools: [
        listWorkspacesTool,
        searchProjectsTool,
        searchTasksTool,
        getTaskTool,
        createTaskTool,
        getStoriesForTaskTool,
        updateTaskTool,
        getProjectTool,
        getProjectTaskCountsTool,
        getProjectSectionsTool,
        createTaskStoryTool,
        addTaskDependenciesTool,
        addTaskDependentsTool,
        createSubtaskTool,
        getMultipleTasksByGidTool,
      ],
    };
  });

  // Define prompts with types
  const PROMPTS: Record<string, {
    name: string;
    description: string;
    arguments: Array<{
      name: string;
      description: string;
      required: boolean;
    }>;
  }> = {
    "task-summary": {
      name: "task-summary",
      description: "Get a summary and status update for a task based on its notes, custom fields and comments",
      arguments: [
        {
          name: "task_id",
          description: "The task ID to get summary for",
          required: true
        }
      ]
    }
  };

  // Add prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    console.error("Received ListPromptsRequest");
    return {
      prompts: Object.values(PROMPTS)
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    console.error("Received GetPromptRequest:", request);

    const prompt = PROMPTS[request.params.name];
    if (!prompt) {
      throw new Error(`Prompt not found: ${request.params.name}`);
    }

    if (request.params.name === "task-summary") {
      const taskId = request.params.arguments?.task_id;
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      // Get task details with all fields
      const task = await asanaClient.getTask(taskId, {
        opt_fields: "name,notes,custom_fields,custom_fields.name,custom_fields.display_value"
      });

      // Get all comments/stories
      const stories = await asanaClient.getStoriesForTask(taskId, {
        opt_fields: "text,created_at,created_by"
      });

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please provide a summary and status update for this task based on the following information:

  Task Name: ${task.name}

  Task Notes:
  ${task.notes || "No notes"}

  Custom Fields:
  ${task.custom_fields?.map((field: {name: string; display_value: string}) =>
    `${field.name}: ${field.display_value}`).join('\n') || "No custom fields"}

  Comments/Updates (from newest to oldest):
  ${stories.map((story: {created_at: string; text: string}) =>
    `[${new Date(story.created_at).toLocaleString()}] ${story.text}`
  ).join('\n\n') || "No comments"}

  Please include:
  1. Current status and progress
  2. Key updates or decisions
  3. Any blockers or dependencies
  4. Next steps or pending actions`
            }
          }
        ]
      };
    }

    throw new Error("Prompt implementation not found");
  });

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);

  console.error("Asana MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
