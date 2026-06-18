import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const createAttachmentTool: Tool = {
  name: "asana_create_attachment",
  description: "Attach a file to a task, project, or project brief. Either upload a local file (file_path) or attach an external URL (url). Local files are uploaded with resource_subtype 'asana'; URLs use resource_subtype 'external'.",
  inputSchema: {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "The GID of the task, project, or project_brief to attach to"
      },
      file_path: {
        type: "string",
        description: "Absolute path to a local file to upload (e.g. a .md file). Provide either file_path or url, not both."
      },
      url: {
        type: "string",
        description: "External URL to attach instead of uploading a file. Requires resource_subtype 'external'."
      },
      name: {
        type: "string",
        description: "Name for the attachment. Optional for uploads (defaults to the file name); recommended for URL attachments."
      },
      resource_subtype: {
        type: "string",
        enum: ["asana", "external"],
        description: "Attachment type. 'asana' for an uploaded file (default when file_path is given), 'external' for a URL (default when url is given)."
      }
    },
    required: ["parent"]
  }
};

export const getAttachmentsForObjectTool: Tool = {
  name: "asana_get_attachments_for_object",
  description: "List all attachments on a task, project, or project brief. Returns attachment GIDs, names, and download/view URLs.",
  inputSchema: {
    type: "object",
    properties: {
      parent: {
        type: "string",
        description: "The GID of the task, project, or project_brief to list attachments for"
      },
      limit: {
        type: "number",
        description: "Maximum number of attachments to return (1-100)"
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
    required: ["parent"]
  }
};

export const getAttachmentTool: Tool = {
  name: "asana_get_attachment",
  description: "Get the full record for a single attachment, including name, download_url, view_url, and parent.",
  inputSchema: {
    type: "object",
    properties: {
      attachment_gid: {
        type: "string",
        description: "The GID of the attachment to retrieve"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["attachment_gid"]
  }
};

export const deleteAttachmentTool: Tool = {
  name: "asana_delete_attachment",
  description: "Delete an attachment by its GID. This cannot be undone.",
  inputSchema: {
    type: "object",
    properties: {
      attachment_gid: {
        type: "string",
        description: "The GID of the attachment to delete"
      }
    },
    required: ["attachment_gid"]
  }
};
