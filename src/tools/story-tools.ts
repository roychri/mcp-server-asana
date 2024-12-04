import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getStoriesForTaskTool: Tool = {
  name: "asana_get_task_stories",
  description: "Get comments and stories for a specific task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to get stories for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["task_id"]
  }
};

export const createTaskStoryTool: Tool = {
  name: "asana_create_task_story",
  description: "Create a comment or story on a task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to add the story to"
      },
      text: {
        type: "string",
        description: "The text content of the story/comment"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["task_id", "text"]
  }
};
