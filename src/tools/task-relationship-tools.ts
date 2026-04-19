import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const addTaskDependenciesTool: Tool = {
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

export const addTaskDependentsTool: Tool = {
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

export const addTaskFollowersTool: Tool = {
  name: "asana_add_task_followers",
  description: "Add followers to a task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to add followers to"
      },
      followers: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of user GIDs to add as followers of the task"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["task_id", "followers"]
  }
};

export const removeTaskFollowersTool: Tool = {
  name: "asana_remove_task_followers",
  description: "Remove followers from a task",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to remove followers from"
      },
      followers: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of user GIDs to remove as followers of the task"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["task_id", "followers"]
  }
};

export const setParentForTaskTool: Tool = {
  name: "asana_set_parent_for_task",
  description: "Set the parent of a task and position the subtask within the other subtasks of that parent",
  inputSchema: {
    type: "object",
    properties: {
      data: {
        parent: {
          type: "string",
          description: "The GID of the new parent of the task, or null for no parent",
          required: true
        },
        insert_after: {
          type: "string",
          description: "A subtask of the parent to insert the task after, or null to insert at the beginning of the list. Cannot be used with insert_before. The task must already be set as a subtask of that parent."
        },
        insert_before: {
          type: "string",
          description: "A subtask of the parent to insert the task before, or null to insert at the end of the list. Cannot be used with insert_after. The task must already be set as a subtask of that parent."
        },
      },
      task_id: {
        type: "string",
        description: "The task ID to operate on"
      },
      opts: {
        opt_fields: {
          type: "string",
          description: "Comma-separated list of optional fields to include"
        }
      }
    },
    required: ["task_id", "data"]
  }
};
