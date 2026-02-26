import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getStoriesForTaskTool: Tool = {
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

export const createTaskStoryTool: Tool = {
  name: "asana_create_task_story",
  description: "Create a comment or story on a task. Either text or html_text is required.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The task ID to add the story to"
      },
      text: {
        type: "string",
        description: "The plain text content of the story/comment. Required if html_text is not provided."
      },
      html_text: {
        type: "string",
        description: "HTML-like formatted text for the comment. Required if text is not provided. Does not support ALL HTML tags. Only a subset. The only allowed TAG in the HTML are: <body> <h1> <h2> <ol> <ul> <li> <strong> <em> <u> <s> <code> <pre> <blockquote> <a data-asana-type=\"\" data-asana-gid=\"\"> <hr> <img> <table> <tr> <td>. No other tags are allowed. Use the \\n to create a newline. Do not use \\n after <body>."
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["task_id"]
  }
};

export const updateTaskStoryTool: Tool = {
  name: "asana_update_task_story",
  description: "Update a comment or story on a task. Only comment stories can have their text updated, and only comment stories and attachment stories can be pinned. Only one of text and html_text can be specified.",
  inputSchema: {
    type: "object",
    properties: {
      story_id: {
        type: "string",
        description: "The story/comment ID to update"
      },
      text: {
        type: "string",
        description: "The plain text content of the story/comment. Cannot be used together with html_text."
      },
      html_text: {
        type: "string",
        description: "HTML-like formatted text for the comment. Cannot be used together with text. Does not support ALL HTML tags. Only a subset. The only allowed TAG in the HTML are: <body> <h1> <h2> <ol> <ul> <li> <strong> <em> <u> <s> <code> <pre> <blockquote> <a data-asana-type=\"\" data-asana-gid=\"\"> <hr> <img> <table> <tr> <td>. No other tags are allowed. Use the \\n to create a newline. Do not use \\n after <body>."
      },
      is_pinned: {
        type: "boolean",
        description: "Whether the story should be pinned on the resource"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["story_id"]
  }
};
