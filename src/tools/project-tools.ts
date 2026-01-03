import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const searchProjectsTool: Tool = {
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

export const getProjectTool: Tool = {
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

export const getProjectTaskCountsTool: Tool = {
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

export const getProjectSectionsTool: Tool = {
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

export const createProjectTool: Tool = {
  name: "asana_create_project",
  description: "Create a new project in a workspace or team",
  inputSchema: {
    type: "object",
    properties: {
      workspace: {
        type: "string",
        description: "The workspace GID to create the project in"
      },
      name: {
        type: "string",
        description: "Name of the project"
      },
      team: {
        type: "string",
        description: "The team GID to create the project in (required for organization workspaces)"
      },
      notes: {
        type: "string",
        description: "Description or notes for the project"
      },
      color: {
        type: "string",
        description: "Color of the project. Can be one of: dark-pink, dark-green, dark-blue, dark-red, dark-teal, dark-brown, dark-orange, dark-purple, dark-warm-gray, light-pink, light-green, light-blue, light-red, light-teal, light-brown, light-orange, light-purple, light-warm-gray"
      },
      privacy_setting: {
        type: "string",
        description: "Privacy setting of the project. Can be: public_to_workspace, private_to_team, private"
      },
      default_view: {
        type: "string",
        description: "The default view of the project. Can be: list, board, calendar, timeline"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include in the response"
      }
    },
    required: ["workspace", "name"]
  }
};
