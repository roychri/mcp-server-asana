
# MCP Server for Asana

This Model Context Protocol server implementation of Asana allows you
to talk to Asana API from MCP Client such as Anthropic's Claude
Desktop Application, and many more.

More details on MCP here:
 - https://www.anthropic.com/news/model-context-protocol
 - https://modelcontextprotocol.io/introduction
 - https://github.com/modelcontextprotocol


## Tools

1. `asana_list_workspaces`

  - List all available workspaces in Asana
  - Optional input:
    - opt_fields (string): Comma-separated list of optional fields to include
  - Returns: List of workspaces

2. `asana_search_projects`

  - Search for projects in Asana using name pattern matching
  - Required input:
    - workspace (string): The workspace to search in
    - name_pattern (string): Regular expression pattern to match project names
  - Optional input:
    - archived (boolean): Only return archived projects (default: false)
    - opt_fields (string): Comma-separated list of optional fields to include
  - Returns: List of matching projects

3. `asana_search_tasks`

  - Search for tasks in a workspace
  - Required input:
    - workspace (string): The workspace to search in
    - text (string): Text to search for in task names and descriptions
  - Optional input:
    - completed (boolean): Filter for completed tasks (default: false)
    - opt_fields (string): Comma-separated list of optional fields to include
  - Returns: List of matching tasks

4. `asana_get_task`

  - Get detailed information about a specific task
  - Required input:
    - task_id (string): The task ID to retrieve
  - Optional input:
    - opt_fields (string): Comma-separated list of optional fields to include
  - Returns: Detailed task information

5. `asana_create_task`

  - Create a new task in a project
  - Required input:
    - project_id (string): The project to create the task in
    - name (string): Name of the task
  - Optional input:
    - notes (string): Description of the task
    - due_on (string): Due date in YYYY-MM-DD format
    - assignee (string): Assignee (can be 'me' or a user ID)
  - Returns: Created task information

## Prompts

None

## Resources

None

## Setup


1. **Create an Asana account**:

   - Visit the [Asana](https://www.asana.com).
   - Click "Sign up".

2. **Retrieve the Asana Access Token**:

   - You can generate a personal access token from the Asana developer console.
     - https://app.asana.com/0/my-apps
   - More details here: https://developers.asana.com/docs/personal-access-token

3. **Configure Claude Desktop**:
   Add the following to your `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "asana": {
         "command": "npx",
         "args": ["-y", "@roychri/mcp-server-asana"],
         "env": {
           "ASANA_ACCESS_TOKEN": "your-asana-access-token"
         }
       }
     }
   }
   ```

## Troubleshooting

If you encounter permission errors:

1. Ensure the asana plan you have allows API access
2. Confirm the access token and configuration are correctly set in `claude_desktop_config.json`.


## Contributing

Clone this repo and start hacking.

### Test it locally with the MCP Inspector

If you want to test your changes, you can use the MCP Inspector like this:

```bash
npm run inspector
```

This will expose the client to port `5173` and server to port `3000`.

If those ports are already used by something else, you can use:

```bash
CLIENT_PORT=5009 SERVER_PORT=3009 npm run inspector
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
