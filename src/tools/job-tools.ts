import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const getJobTool: Tool = {
  name: "asana_get_job",
  description: "Get the full record for an Asana Job by GID. Used to poll asynchronous operations (e.g. task template instantiation). The Job's 'status' field will be 'not_started', 'in_progress', 'succeeded', or 'failed'. When succeeded, the resulting resource (e.g. 'new_task') will be populated.",
  inputSchema: {
    type: "object",
    properties: {
      job_gid: {
        type: "string",
        description: "The job GID to retrieve"
      },
      opt_fields: {
        type: "string",
        description: "Comma-separated list of optional fields to include"
      }
    },
    required: ["job_gid"]
  }
};
