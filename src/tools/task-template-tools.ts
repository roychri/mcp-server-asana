import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getTaskTemplatesTool: Tool = {
  name: "asana_get_task_templates",
  description: "List task templates filtered by project. The Asana API requires the 'project' parameter to scope the results.",
  inputSchema: {
    type: "object",
    properties: {
      project: {
        type: "string",
        description: "The project GID to filter task templates on"
      },
      limit: {
        type: "number",
        description: "Results per page (1-100)"
      },
      offset: {
        type: "string",
        description: "Pagination offset token from a previous response"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project"]
  }
};

export const getTaskTemplateTool: Tool = {
  name: "asana_get_task_template",
  description: "Get the full record for a single task template by GID",
  inputSchema: {
    type: "object",
    properties: {
      task_template_gid: {
        type: "string",
        description: "The task template GID to retrieve"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["task_template_gid"]
  }
};

export const instantiateTaskTool: Tool = {
  name: "asana_instantiate_task",
  description: "Instantiate a task from a task template. The Asana API processes this asynchronously: the response is a Job, not a Task. To retrieve the resulting task GID, poll asana_get_job until the job's status is 'succeeded' (the new task GID will then appear in the job's 'new_task' field).",
  inputSchema: {
    type: "object",
    properties: {
      task_template_gid: {
        type: "string",
        description: "The task template GID to instantiate from"
      },
      name: {
        type: "string",
        description: "The name for the new task (overrides any default name in the template)"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include in the Job response"
      }
    },
    required: ["task_template_gid", "name"]
  }
};
