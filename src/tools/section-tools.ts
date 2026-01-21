import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createSectionTool: Tool = {
  name: "asana_create_section",
  description: "Create a new section in a project",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "The project GID to create the section in"
      },
      name: {
        type: "string",
        description: "Name of the new section"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["project_id", "name"]
  }
};

export const updateSectionTool: Tool = {
  name: "asana_update_section",
  description: "Update a section (rename it)",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description: "The section GID to update"
      },
      name: {
        type: "string",
        description: "New name for the section"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["section_id", "name"]
  }
};

export const deleteSectionTool: Tool = {
  name: "asana_delete_section",
  description: "Delete a section from a project",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description: "The section GID to delete"
      }
    },
    required: ["section_id"]
  }
};

export const addTaskToSectionTool: Tool = {
  name: "asana_add_task_to_section",
  description: "Move a task to a section within its project",
  inputSchema: {
    type: "object",
    properties: {
      section_id: {
        type: "string",
        description: "The section GID to add the task to"
      },
      task_id: {
        type: "string",
        description: "The task GID to move"
      },
      insert_before: {
        type: "string",
        description: "A task GID to insert the task before (optional)"
      },
      insert_after: {
        type: "string",
        description: "A task GID to insert the task after (optional)"
      }
    },
    required: ["section_id", "task_id"]
  }
};
