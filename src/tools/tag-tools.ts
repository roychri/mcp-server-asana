import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getTagsForWorkspaceTool: Tool = {
  name: "asana_get_tags_for_workspace",
  description: "Get tags in a workspace",
  inputSchema: {
    type: "object",
    properties: {
      workspace_gid: {
        type: "string",
        description: "Globally unique identifier for the workspace or organization"
      },
      limit: {
        type: "integer",
        description: "Results per page. The number of objects to return per page. The value must be between 1 and 100."
      },
      offset: {
        type: "string",
        description: "Offset token. An offset to the next page returned by the API."
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["workspace_gid"]
  }
};

export const getTasksForTagTool: Tool = {
  name: "asana_get_tasks_for_tag",
  description: "Get tasks for a specific tag",
  inputSchema: {
    type: "object",
    properties: {
      tag_gid: {
        type: "string",
        description: "The tag GID to retrieve tasks for"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      },
      opt_pretty: {
        type: "boolean",
        description: "Provides the response in a 'pretty' format"
      },
      limit: {
        type: "integer",
        description: "The number of objects to return per page. The value must be between 1 and 100."
      },
      offset: {
        type: "string",
        description: "An offset to the next page returned by the API."
      }
    },
    required: ["tag_gid"]
  }
};
