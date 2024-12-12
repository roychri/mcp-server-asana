import { GetPromptRequest, GetPromptResult, ListPromptsResult } from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js';

type PromptDefinition = {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
};

type PromptHandler = {
  listPrompts: any,
  getPrompt: any
};

const PROMPTS: Record<string, PromptDefinition> = {
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

export function createPromptHandlers(asanaClient: AsanaClientWrapper): PromptHandler {
  return {
    listPrompts: async (): Promise<ListPromptsResult> => {
      console.error("Received ListPromptsRequest");
      return {
        prompts: Object.values(PROMPTS)
      };
    },

    getPrompt: async (request: GetPromptRequest): Promise<GetPromptResult> => {
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
    }
  };
}
