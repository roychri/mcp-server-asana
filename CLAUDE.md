# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Build the project (uses esbuild)
npm run build

# Run in development mode with ts-node (requires Node.js 18-22, fails on v24+)
npm run dev

# Start the built server
npm start

# Watch mode for TypeScript compilation
npm run watch

# Test with MCP Inspector UI (opens client on port 5173, server on port 3000)
npm run inspector

# Use custom ports if defaults are taken
CLIENT_PORT=5009 SERVER_PORT=3009 npm run inspector
```

## Node.js Version Requirements

- **Node.js 18-22**: Required for `npm run dev` (ts-node ESM loader)
- **Node.js 22+**: Required for MCP Inspector CLI mode
- **Build/Start**: Works on all modern Node.js versions

Use `nvm` to switch versions: `nvm use 22`

## Environment Variables

- `ASANA_ACCESS_TOKEN` - Required. Your Asana personal access token
- `READ_ONLY_MODE` - Optional. Set to `'true'` to disable all write operations

## Architecture

This is an MCP (Model Context Protocol) server that exposes Asana functionality to AI assistants like Claude.

### Core Components

- **`src/index.ts`** - Entry point. Creates the MCP Server instance, initializes the Asana client, and registers all handlers (tools, prompts, resources)
- **`src/asana-client-wrapper.ts`** - Wraps the `asana` npm package, providing typed methods for all Asana API operations
- **`src/tool-handler.ts`** - Defines the `list_of_tools` array, `READ_ONLY_TOOLS` array, and the main `tool_handler` function that routes tool calls to the appropriate Asana client methods
- **`src/prompt-handler.ts`** - Defines MCP prompts (task-summary, task-completeness, create-task). Prompts are pre-built conversation starters
- **`src/resource-handler.ts`** - Exposes Asana workspaces and projects as MCP resources (readable via `asana://workspace/{gid}` and `asana://project/{gid}` URIs)
- **`src/asana-validate-xml.ts`** - Validates HTML/XML content for Asana's `html_notes` and `html_text` fields

### Tool Definitions

Individual tool definitions are in `src/tools/`:
- `workspace-tools.ts` - List workspaces
- `project-tools.ts` - Search projects, get project details/sections/task counts
- `project-status-tools.ts` - CRUD for project status updates
- `task-tools.ts` - Search/get/create/update tasks, create subtasks, get multiple tasks
- `task-relationship-tools.ts` - Dependencies, dependents, parent relationships
- `story-tools.ts` - Get/create task comments
- `tag-tools.ts` - CRUD for tags, add/remove tags from tasks

Each tool file exports a `Tool` object with `name`, `description`, and `inputSchema` following the MCP SDK types.

## Adding a New Tool - Checklist

When adding a new tool, ensure you complete ALL of these steps:

1. **Define the tool** in `src/tools/<category>-tools.ts`:
   - Export a `Tool` object with `name`, `description`, `inputSchema`
   - Use `asana_` prefix for the tool name

2. **Add API method** in `src/asana-client-wrapper.ts`:
   - Add the method that calls the Asana SDK

3. **Register the tool** in `src/tool-handler.ts`:
   - Import the tool from the tools file
   - Add to `all_tools` array
   - **If it's a READ-ONLY tool**: Add tool name to `READ_ONLY_TOOLS` array
   - Add the `case` handler in the switch statement

4. **Update documentation** in `README.md`:
   - Add tool to the numbered list with description and parameters

5. **Test the tool**:
   - Build: `npm run build`
   - Test using the helper script (see Testing section)

### Read-Only Mode

When `READ_ONLY_MODE=true`:
- Only tools listed in `READ_ONLY_TOOLS` array are available
- Write tool calls return an error
- The `create-task` prompt is filtered out

**Important**: When adding a new read-only tool, you MUST add its name to the `READ_ONLY_TOOLS` array in `tool-handler.ts`.

## Testing

### Using the Test Helper Script

Source the helper script to get testing functions:

```bash
source scripts/test-mcp.sh

# List all available tools
mcp_list_tools

# Call a tool and get JSON result
mcp_call asana_list_workspaces '{}'

# Call a tool and parse the result
mcp_call_json asana_search_tasks '{"workspace":"YOUR_WORKSPACE_GID","completed":false}'

# Test a tool with expected result
mcp_test asana_list_workspaces '{}' 'length > 0'

# Run tag operations test suite
mcp_test_tags YOUR_WORKSPACE_GID

# Health check
mcp_health_check
```

### Manual Testing via JSON-RPC

MCP servers communicate via JSON-RPC 2.0 over stdio. You can test manually:

```bash
# Build first
npm run build

# Send JSON-RPC messages (requires jq)
echo '{"jsonrpc":"2.0","method":"initialize","id":0,"params":{"capabilities":{},"clientInfo":{"name":"test","version":"1.0"},"protocolVersion":"2024-11-05"}}' | node dist/index.js 2>/dev/null
```

## Common Issues

### Asana API Parameter Naming

The Asana API uses **dot notation** for filter parameters (e.g., `assignee.any`, `sections.all`), but MCP tool schemas use **underscore notation** (e.g., `assignee_any`, `sections_all`) for JSON compatibility.

The `searchTasks` method in `asana-client-wrapper.ts` automatically maps underscore parameters to dot notation. If adding new search parameters, ensure they're included in the `keyMappings` object.

### Search Returns Too Many Results

If search filters appear to be ignored:
1. Check the parameter is in the `keyMappings` object in `searchTasks()`
2. Verify the parameter name matches the Asana API documentation
3. Test with an impossible filter value to confirm filtering is working

## Build System

Uses esbuild (`build.js`) to bundle TypeScript into a single ESM file. The version is injected at build time from `package.json` via `__VERSION__` define.
