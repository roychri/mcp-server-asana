import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const getTagTool: Tool = {
  name: 'asana_get_tag',
  description: 'Get detailed information about a specific tag',
  inputSchema: {
    type: 'object',
    properties: {
      tag_gid: {
        type: 'string',
        description: 'Globally unique identifier for the tag',
      },
      opt_fields: {
        type: 'string',
        description: 'Comma-separated list of optional fields to include',
      },
    },
    required: ['tag_gid'],
  },
};

export const getTagsTool: Tool = {
  name: 'asana_get_tags',
  description: 'Get multiple tags with filtering options',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description:
          'Results per page. The number of objects to return per page. The value must be between 1 and 100.',
      },
      offset: {
        type: 'string',
        description:
          'Offset token. An offset to the next page returned by the API. A pagination request will return an offset token, which can be used as an input parameter to the next request. If an offset is not passed in, the API will return the first page of results.',
      },
      workspace: {
        type: 'string',
        description: 'The workspace to filter tags on',
      },
      opt_fields: {
        type: 'string',
        description: 'Comma-separated list of optional fields to include',
      },
    },
  },
};

export const getTagsForTaskTool: Tool = {
  name: 'asana_get_tags_for_task',
  description: "Get a task's tags",
  inputSchema: {
    type: 'object',
    properties: {
      task_gid: {
        type: 'string',
        description: 'The task to operate on',
      },
      limit: {
        type: 'number',
        description:
          'Results per page. The number of objects to return per page. The value must be between 1 and 100.',
      },
      offset: {
        type: 'string',
        description:
          'Offset token. An offset to the next page returned by the API.',
      },
      opt_fields: {
        type: 'string',
        description: 'Comma-separated list of optional fields to include',
      },
    },
    required: ['task_gid'],
  },
};

export const getTagsForWorkspaceTool: Tool = {
  name: 'asana_get_tags_for_workspace',
  description: 'Get tags in a workspace',
  inputSchema: {
    type: 'object',
    properties: {
      workspace_gid: {
        type: 'string',
        description:
          'Globally unique identifier for the workspace or organization',
      },
      limit: {
        type: 'integer',
        description:
          'Results per page. The number of objects to return per page. The value must be between 1 and 100.',
      },
      offset: {
        type: 'string',
        description:
          'Offset token. An offset to the next page returned by the API.',
      },
      opt_fields: {
        type: 'string',
        description: 'Comma-separated list of optional fields to include',
      },
    },
    required: ['workspace_gid'],
  },
};

export const updateTagTool: Tool = {
  name: 'asana_update_tag',
  description: 'Update an existing tag',
  inputSchema: {
    type: 'object',
    properties: {
      tag_gid: {
        type: 'string',
        description: 'Globally unique identifier for the tag',
      },
      name: {
        type: 'string',
        description: 'Name of the tag',
      },
      color: {
        type: 'string',
        description:
          'Color of the tag. Can be one of: dark-pink, dark-green, dark-blue, dark-red, dark-teal, dark-brown, dark-orange, dark-purple, dark-warm-gray, light-pink, light-green, light-blue, light-red, light-teal, light-brown, light-orange, light-purple, light-warm-gray',
      },
      notes: {
        type: 'string',
        description: 'Notes about the tag',
      },
      opt_fields: {
        type: 'string',
        description: 'Comma-separated list of optional fields to include',
      },
    },
    required: ['tag_gid'],
  },
};

export const deleteTagTool: Tool = {
  name: 'asana_delete_tag',
  description: 'Delete a tag',
  inputSchema: {
    type: 'object',
    properties: {
      tag_gid: {
        type: 'string',
        description: 'Globally unique identifier for the tag',
      },
    },
    required: ['tag_gid'],
  },
};

export const getTasksForTagTool: Tool = {
  name: 'asana_get_tasks_for_tag',
  description: 'Get tasks for a specific tag',
  inputSchema: {
    type: 'object',
    properties: {
      tag_gid: {
        type: 'string',
        description: 'The tag GID to retrieve tasks for',
      },
      opt_fields: {
        type: 'string',
        description: 'Comma-separated list of optional fields to include',
      },
      opt_pretty: {
        type: 'boolean',
        description: "Provides the response in a 'pretty' format",
      },
      limit: {
        type: 'integer',
        description:
          'The number of objects to return per page. The value must be between 1 and 100.',
      },
      offset: {
        type: 'string',
        description: 'An offset to the next page returned by the API.',
      },
    },
    required: ['tag_gid'],
  },
};

export const createTagTool: Tool = {
  name: 'asana_create_tag',
  description: 'Create a new tag in a workspace or organization',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the tag',
      },
      workspace: {
        type: 'string',
        description:
          'Globally unique identifier for the workspace or organization',
      },
      followers: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'An array of strings identifying users. These can either be the string "me", an email, or the gid of a user.',
      },
      color: {
        type: 'string',
        description:
          'Color of the tag (optional). Can be one of: dark-pink, dark-green, dark-blue, dark-red, dark-teal, dark-brown, dark-orange, dark-purple, dark-warm-gray, light-pink, light-green, light-blue, light-red, light-teal, light-brown, light-orange, light-purple, light-warm-gray',
      },
      notes: {
        type: 'string',
        description: 'Notes about the tag (optional)',
      },
      opt_fields: {
        type: 'string',
        description: 'Comma-separated list of optional fields to include',
      },
    },
    required: ['name'],
  },
};

export const createTagForWorkspaceTool: Tool = {
  name: 'asana_create_tag_for_workspace',
  description: 'Create a new tag in a workspace',
  inputSchema: {
    type: 'object',
    properties: {
      workspace_gid: {
        type: 'string',
        description:
          'Globally unique identifier for the workspace or organization',
      },
      name: {
        type: 'string',
        description: 'Name of the tag',
      },
      followers: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'An array of strings identifying users. These can either be the string "me", an email, or the gid of a user.',
      },
      color: {
        type: 'string',
        description:
          'Color of the tag (optional). Can be one of: dark-pink, dark-green, dark-blue, dark-red, dark-teal, dark-brown, dark-orange, dark-purple, dark-warm-gray, light-pink, light-green, light-blue, light-red, light-teal, light-brown, light-orange, light-purple, light-warm-gray',
      },
      notes: {
        type: 'string',
        description: 'Notes about the tag (optional)',
      },
      opt_fields: {
        type: 'string',
        description: 'Comma-separated list of optional fields to include',
      },
    },
    required: ['workspace_gid', 'name'],
  },
};

export const addTagToTaskTool: Tool = {
  name: 'asana_add_tag_to_task',
  description: 'Add a tag to a task',
  inputSchema: {
    type: 'object',
    properties: {
      task_gid: {
        type: 'string',
        description: 'The task GID to add the tag to',
      },
      tag_gid: {
        type: 'string',
        description: 'The tag GID to add to the task',
      },
    },
    required: ['task_gid', 'tag_gid'],
  },
};

export const removeTagFromTaskTool: Tool = {
  name: 'asana_remove_tag_from_task',
  description: 'Remove a tag from a task',
  inputSchema: {
    type: 'object',
    properties: {
      task_gid: {
        type: 'string',
        description: 'The task GID to remove the tag from',
      },
      tag_gid: {
        type: 'string',
        description: 'The tag GID to remove from the task',
      },
    },
    required: ['task_gid', 'tag_gid'],
  },
};
