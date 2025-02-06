import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getProjectStatusTool: Tool = {
  name: "asana_get_project_status",
  description: "Get a project status update",
  inputSchema: {
    type: "object",
    properties: {
      project_status_gid: {
        type: "string",
        description: "The project status GID to retrieve"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_status_gid"]
  }
};

export const getProjectStatusesForProjectTool: Tool = {
  name: "asana_get_project_statuses",
  description: "Get all status updates for a project",
  inputSchema: {
    type: "object",
    properties: {
      project_gid: {
        type: "string",
        description: "The project GID to get statuses for"
      },
      limit: {
        type: "number",
        description: "Results per page (1-100)",
        minimum: 1,
        maximum: 100
      },
      offset: {
        type: "string",
        description: "Pagination offset token"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_gid"]
  }
};

export const createProjectStatusTool: Tool = {
  name: "asana_create_project_status",
  description: "Create a new status update for a project",
  inputSchema: {
    type: "object",
    properties: {
      project_gid: {
        type: "string",
        description: "The project GID to create the status for"
      },
      text: {
        type: "string",
        description: "The text content of the status update"
      },
      color: {
        type: "string",
        description: "The color of the status (green, yellow, red)",
        enum: ["green", "yellow", "red"]
      },
      title: {
        type: "string",
        description: "The title of the status update"
      },
      html_text: {
        type: "string",
        description: "HTML formatted text for the status update"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_gid", "text"]
  }
};

export const deleteProjectStatusTool: Tool = {
  name: "asana_delete_project_status",
  description: "Delete a project status update",
  inputSchema: {
    type: "object",
    properties: {
      project_status_gid: {
        type: "string",
        description: "The project status GID to delete"
      }
    },
    required: ["project_status_gid"]
  }
};
