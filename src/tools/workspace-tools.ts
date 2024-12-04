import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const listWorkspacesTool: Tool = {
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
