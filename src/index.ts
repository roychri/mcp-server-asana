#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
  GetPromptRequest,
} from "@modelcontextprotocol/sdk/types.js";
import Asana from 'asana';

// Tool definitions
const listWorkspacesTool: Tool = {
  name: "asana_list_workspaces",
  description: "List all available workspaces in Asana",
  inputSchema: {
    type: "object",
    properties: {
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    }
  }
};

const searchProjectsTool: Tool = {
  name: "asana_search_projects",
  description: "Search for projects in Asana using name pattern matching",
  inputSchema: {
    type: "object",
    properties: {
      workspace: {
        type: "string",
        description: "The workspace to search in"
      },
      name_pattern: {
        type: "string",
        description: "Regular expression pattern to match project names"
      },
      archived: {
        type: "boolean",
        description: "Only return archived projects",
        default: false
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["workspace", "name_pattern"]
  }
};

const searchTasksTool: Tool = {
  name: "asana_search_tasks",
  description: "Search tasks in a workspace with advanced filtering options",
  inputSchema: {
    type: "object",
    properties: {
      workspace: {
        type: "string",
        description: "The workspace to search in"
      },
      text: {
        type: "string",
        description: "Text to search for in task names and descriptions"
      },
      resource_subtype: {
        type: "string",
        description: "Filter by task subtype (e.g. milestone)"
      },
      "portfolios.any": {
        type: "string",
        description: "Comma-separated list of portfolio IDs"
      },
      "assignee.any": {
        type: "string",
        description: "Comma-separated list of user IDs"
      },
      "assignee.not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "projects.any": {
        type: "string",
        description: "Comma-separated list of project IDs"
      },
      "projects.not": {
        type: "string",
        description: "Comma-separated list of project IDs to exclude"
      },
      "projects.all": {
        type: "string",
        description: "Comma-separated list of project IDs that must all match"
      },
      "sections.any": {
        type: "string",
        description: "Comma-separated list of section IDs"
      },
      "sections.not": {
        type: "string",
        description: "Comma-separated list of section IDs to exclude"
      },
      "sections.all": {
        type: "string",
        description: "Comma-separated list of section IDs that must all match"
      },
      "tags.any": {
        type: "string",
        description: "Comma-separated list of tag IDs"
      },
      "tags.not": {
        type: "string",
        description: "Comma-separated list of tag IDs to exclude"
      },
      "tags.all": {
        type: "string",
        description: "Comma-separated list of tag IDs that must all match"
      },
      "teams.any": {
        type: "string",
        description: "Comma-separated list of team IDs"
      },
      "followers.not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "created_by.any": {
        type: "string",
        description: "Comma-separated list of user IDs"
      },
      "created_by.not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "assigned_by.any": {
        type: "string",
        description: "Comma-separated list of user IDs"
      },
      "assigned_by.not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "liked_by.not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "commented_on_by.not": {
        type: "string",
        description: "Comma-separated list of user IDs to exclude"
      },
      "due_on": {
        type: "string",
        description: "ISO 8601 date string or null"
      },
      "due_on.before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "due_on.after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "due_at.before": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "due_at.after": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "start_on": {
        type: "string",
        description: "ISO 8601 date string or null"
      },
      "start_on.before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "start_on.after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "created_on": {
        type: "string",
        description: "ISO 8601 date string or null"
      },
      "created_on.before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "created_on.after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "created_at.before": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "created_at.after": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "completed_on": {
        type: "string",
        description: "ISO 8601 date string or null"
      },
      "completed_on.before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "completed_on.after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "completed_at.before": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "completed_at.after": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "modified_on": {
        type: "string",
        description: "ISO 8601 date string or null"
      },
      "modified_on.before": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "modified_on.after": {
        type: "string",
        description: "ISO 8601 date string"
      },
      "modified_at.before": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      "modified_at.after": {
        type: "string",
        description: "ISO 8601 datetime string"
      },
      completed: {
        type: "boolean",
        description: "Filter for completed tasks"
      },
      is_subtask: {
        type: "boolean",
        description: "Filter for subtasks"
      },
      has_attachment: {
        type: "boolean",
        description: "Filter for tasks with attachments"
      },
      is_blocked: {
        type: "boolean",
        description: "Filter for tasks with incomplete dependencies"
      },
      is_blocking: {
        type: "boolean",
        description: "Filter for incomplete tasks with dependents"
      },
      sort_by: {
        type: "string",
        description: "Sort by: due_date, created_at, completed_at, likes, modified_at",
        default: "modified_at"
      },
      sort_ascending: {
        type: "boolean",
        description: "Sort in ascending order",
        default: false
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["workspace"]
  }
};

const getTaskTool: Tool = {
  name: "asana_get_task",
  description: "Get detailed information about a specific task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to retrieve"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["task_id"]
  }
};

const addTaskDependentsTool: Tool = {
  name: "asana_add_task_dependents",
  description: "Set dependents for a task (tasks that depend on this task)",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to add dependents to"
      },
      dependents: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of task IDs that depend on this task"
      }
    },
    required: ["task_id", "dependents"]
  }
};

const addTaskDependenciesTool: Tool = {
  name: "asana_add_task_dependencies",
  description: "Set dependencies for a task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to add dependencies to"
      },
      dependencies: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of task IDs that this task depends on"
      }
    },
    required: ["task_id", "dependencies"]
  }
};

const createTaskStoryTool: Tool = {
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

const getProjectSectionsTool: Tool = {
  name: "asana_get_project_sections",
  description: "Get sections in a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to get sections for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

const getProjectTaskCountsTool: Tool = {
  name: "asana_get_project_task_counts",
  description: "Get the number of tasks in a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to get task counts for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

const getProjectTool: Tool = {
  name: "asana_get_project",
  description: "Get detailed information about a specific project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project ID to retrieve"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id"]
  }
};

const updateTaskTool: Tool = {
  name: "asana_update_task",
  description: "Update an existing task's details",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to update"
      },
      name: {
        type: "string",
        description: "New name for the task"
      },
      notes: {
        type: "string",
        description: "New description for the task"
      },
      due_on: {
        type: "string",
        description: "New due date in YYYY-MM-DD format"
      },
      assignee: {
        type: "string",
        description: "New assignee (can be 'me' or a user ID)"
      },
      completed: {
        type: "boolean",
        description: "Mark task as completed or not"
      }
    },
    required: ["task_id"]
  }
};

const getStoriesForTaskTool: Tool = {
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

const createSubtaskTool: Tool = {
  name: "asana_create_subtask",
  description: "Create a new subtask for an existing task",
  inputSchema: {
    type: "object",
    properties: {
      parent_task_id: {
        type: "string",
        description: "The parent task ID to create the subtask under"
      },
      name: {
        type: "string",
        description: "Name of the subtask"
      },
      notes: {
        type: "string",
        description: "Description of the subtask"
      },
      due_on: {
        type: "string",
        description: "Due date in YYYY-MM-DD format"
      },
      assignee: {
        type: "string",
        description: "Assignee (can be 'me' or a user ID)"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["parent_task_id", "name"]
  }
};

const createTaskTool: Tool = {
  name: "asana_create_task",
  description: "Create a new task in a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project to create the task in"
      },
      name: {
        type: "string",
        description: "Name of the task"
      },
      notes: {
        type: "string",
        description: "Description of the task"
      },
      due_on: {
        type: "string",
        description: "Due date in YYYY-MM-DD format"
      },
      assignee: {
        type: "string",
        description: "Assignee (can be 'me' or a user ID)"
      }
    },
    required: ["project_id", "name"]
  }
};

class AsanaClientWrapper {
  private workspaces: any;
  private projects: any;
  private tasks: any;
  private stories: any;

  constructor(token: string) {
    const client = Asana.ApiClient.instance;
    client.authentications['token'].accessToken = token;

    // Initialize API instances
    this.workspaces = new Asana.WorkspacesApi();
    this.projects = new Asana.ProjectsApi();
    this.tasks = new Asana.TasksApi();
    this.stories = new Asana.StoriesApi();
  }

  async listWorkspaces(opts: any = {}) {
    const response = await this.workspaces.getWorkspaces(opts);
    return response.data;
  }

  async searchProjects(workspace: string, namePattern: string, archived: boolean = false, opts: any = {}) {
    const response = await this.projects.getProjectsForWorkspace(workspace, {
      archived,
      ...opts
    });
    const pattern = new RegExp(namePattern, 'i');
    return response.data.filter((project: any) => pattern.test(project.name));
  }

  async searchTasks(workspace: string, searchOpts: any = {}) {
    // Extract known parameters
    const {
      text,
      resource_subtype,
      completed,
      is_subtask,
      has_attachment,
      is_blocked,
      is_blocking,
      sort_by,
      sort_ascending,
      opt_fields,
      ...otherOpts
    } = searchOpts;

    // Build search parameters
    const searchParams: any = {
      ...otherOpts // Include any additional filter parameters
    };

    // Add optional parameters if provided
    if (text) searchParams.text = text;
    if (resource_subtype) searchParams.resource_subtype = resource_subtype;
    if (completed !== undefined) searchParams.completed = completed;
    if (is_subtask !== undefined) searchParams.is_subtask = is_subtask;
    if (has_attachment !== undefined) searchParams.has_attachment = has_attachment;
    if (is_blocked !== undefined) searchParams.is_blocked = is_blocked;
    if (is_blocking !== undefined) searchParams.is_blocking = is_blocking;
    if (sort_by) searchParams.sort_by = sort_by;
    if (sort_ascending !== undefined) searchParams.sort_ascending = sort_ascending;
    if (opt_fields) searchParams.opt_fields = opt_fields;

    const response = await this.tasks.searchTasksForWorkspace(workspace, searchParams);
    return response.data;
  }

  async getTask(taskId: string, opts: any = {}) {
    const response = await this.tasks.getTask(taskId, opts);
    return response.data;
  }

  async createTask(projectId: string, data: any) {
    const taskData = {
      data: {
        ...data,
        projects: [projectId]
      }
    };
    const response = await this.tasks.createTask(taskData);
    return response.data;
  }

  async getStoriesForTask(taskId: string, opts: any = {}) {
    const response = await this.stories.getStoriesForTask(taskId, opts);
    return response.data;
  }

  async updateTask(taskId: string, data: any) {
    const body = { data };
    const opts = {};
    const response = await this.tasks.updateTask(body, taskId, opts);
    return response.data;
  }

  async getProject(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const response = await this.projects.getProject(projectId, options);
    return response.data;
  }

  async getProjectTaskCounts(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const response = await this.projects.getTaskCountsForProject(projectId, options);
    return response.data;
  }

  async getProjectSections(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const sections = new Asana.SectionsApi();
    const response = await sections.getSectionsForProject(projectId, options);
    return response.data;
  }

  async createTaskStory(taskId: string, text: string, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const body = {
      data: {
        text: text
      }
    };
    const response = await this.stories.createStoryForTask(body, taskId, options);
    return response.data;
  }

  async addTaskDependencies(taskId: string, dependencies: string[]) {
    const body = {
      data: {
        dependencies: dependencies
      }
    };
    const response = await this.tasks.addDependenciesForTask(body, taskId);
    return response.data;
  }

  async addTaskDependents(taskId: string, dependents: string[]) {
    const body = {
      data: {
        dependents: dependents
      }
    };
    const response = await this.tasks.addDependentsForTask(body, taskId);
    return response.data;
  }

  async createSubtask(parentTaskId: string, data: any, opts: any = {}) {
    const taskData = {
      data: {
        ...data
      }
    };
    const response = await this.tasks.createSubtaskForTask(taskData, parentTaskId, opts);
    return response.data;
  }
}

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
      version: "1.1.0",
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
    async (request: CallToolRequest) => {
      console.error("Received CallToolRequest:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        const args = request.params.arguments as any;

        switch (request.params.name) {
          case "asana_list_workspaces": {
            const response = await asanaClient.listWorkspaces(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_search_projects": {
            const { workspace, name_pattern, archived = false, ...opts } = args;
            const response = await asanaClient.searchProjects(
              workspace,
              name_pattern,
              archived,
              opts
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_search_tasks": {
            const { workspace, ...searchOpts } = args;
            const response = await asanaClient.searchTasks(workspace, searchOpts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_task": {
            const { task_id, ...opts } = args;
            const response = await asanaClient.getTask(task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_task": {
            const { project_id, ...taskData } = args;
            const response = await asanaClient.createTask(project_id, taskData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_task_stories": {
            const { task_id, ...opts } = args;
            const response = await asanaClient.getStoriesForTask(task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_update_task": {
            const { task_id, ...taskData } = args;
            const response = await asanaClient.updateTask(task_id, taskData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProject(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_task_counts": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProjectTaskCounts(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_sections": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProjectSections(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_task_story": {
            const { task_id, text, ...opts } = args;
            const response = await asanaClient.createTaskStory(task_id, text, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_task_dependencies": {
            const { task_id, dependencies } = args;
            const response = await asanaClient.addTaskDependencies(task_id, dependencies);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_task_dependents": {
            const { task_id, dependents } = args;
            const response = await asanaClient.addTaskDependents(task_id, dependents);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_subtask": {
            const { parent_task_id, opt_fields, ...taskData } = args;
            const response = await asanaClient.createSubtask(parent_task_id, taskData, { opt_fields });
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    }
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
