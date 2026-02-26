import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const rollbackTool: Tool = {
  name: "asana_rollback",
  description: "Rollback one or more previous write operations performed through this MCP server. Specify a transaction_id for a single rollback, session_id to rollback an entire session, or last_n for the most recent operations. Use dry_run to preview without executing. Operations are rolled back in reverse chronological order. Irreversible operations (deletes, comments) are skipped.",
  inputSchema: {
    type: "object",
    properties: {
      transaction_id: {
        type: "string",
        description: "UUID of a specific transaction to roll back"
      },
      session_id: {
        type: "string",
        description: "Roll back all reversible operations from this session (in reverse order)"
      },
      last_n: {
        type: "number",
        description: "Roll back the last N reversible operations from the current session"
      },
      dry_run: {
        type: "boolean",
        description: "If true, return what would be rolled back without executing (default: false)"
      }
    },
    required: []
  }
};

export const getTransactionLogTool: Tool = {
  name: "asana_get_transaction_log",
  description: "View the transaction log of write operations performed through this MCP server. Returns log entries with operation details, reversibility status, and rollback state.",
  inputSchema: {
    type: "object",
    properties: {
      session_id: {
        type: "string",
        description: "Filter to a specific session. Defaults to the current session."
      },
      reversible_only: {
        type: "boolean",
        description: "If true, only show reversible transactions (default: false)"
      },
      include_rolled_back: {
        type: "boolean",
        description: "If true, include already rolled-back transactions (default: false)"
      },
      limit: {
        type: "number",
        description: "Maximum number of entries to return (default: 50)"
      }
    },
    required: []
  }
};
