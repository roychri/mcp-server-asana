# Complete Guide: Using MCP Inspector CLI Mode for Testing & Automation

Based on the official Model Context Protocol documentation and repositories, here’s a comprehensive guide on using the MCP Inspector in CLI mode to test and automate MCP server operations.

## Overview

The MCP Inspector CLI mode enables programmatic interaction with MCP servers from the command line, ideal for scripting, automation, and integration with coding assistants .

**Official Sources:**

- Main repository: <https://github.com/modelcontextprotocol/inspector>
- Official documentation: <https://modelcontextprotocol.io/docs/tools/inspector>
- NPM package: <https://www.npmjs.com/package/@modelcontextprotocol/inspector>

## Requirements

- **Node.js**: ^22.7.5 

## Basic Usage

### Starting the Inspector in CLI Mode

The basic syntax for CLI mode is:

```bash
npx @modelcontextprotocol/inspector --cli <command_to_start_server>
```

### Testing a Local Node.js MCP Server

```bash
npx @modelcontextprotocol/inspector --cli node build/index.js
```

### Using a Configuration File

You can use configuration files to store settings for different MCP servers :

```bash
npx @modelcontextprotocol/inspector --cli --config path/to/config.json --server myserver
```

**Example configuration file** (config.json):

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["build/index.js", "arg1", "arg2"],
      "env": {
        "key": "value",
        "key2": "value2"
      }
    }
  }
}
```

Reference: [GitHub - modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)

## Core Operations

### 1. Listing Available Tools

```bash
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list
```

### 2. Calling a Specific Tool

**Simple parameters:**

```bash
npx @modelcontextprotocol/inspector --cli node build/index.js \
  --method tools/call \
  --tool-name mytool \
  --tool-arg key=value \
  --tool-arg another=value2
```

**JSON parameters:**

```bash
npx @modelcontextprotocol/inspector --cli node build/index.js \
  --method tools/call \
  --tool-name mytool \
  --tool-arg 'options={"format": "json", "max_tokens": 100}'
```

### 3. Listing Resources

```bash
npx @modelcontextprotocol/inspector --cli node build/index.js --method resources/list
```

### 4. Listing Prompts

```bash
npx @modelcontextprotocol/inspector --cli node build/index.js --method prompts/list
```

Reference: [Official MCP Inspector Documentation](https://modelcontextprotocol.io/docs/tools/inspector)

## Working with Remote Servers

### SSE (Server-Sent Events) Transport

The default transport for remote servers is SSE :

```bash
# List tools from remote SSE server
npx @modelcontextprotocol/inspector --cli https://my-mcp-server.example.com \
  --method tools/list

# Call a tool on remote server
npx @modelcontextprotocol/inspector --cli https://my-mcp-server.example.com \
  --method tools/call \
  --tool-name remotetool \
  --tool-arg param=value
```

### Streamable HTTP Transport

```bash
npx @modelcontextprotocol/inspector --cli https://my-mcp-server.example.com \
  --transport http \
  --method tools/list

# With custom headers
npx @modelcontextprotocol/inspector --cli https://my-mcp-server.example.com \
  --transport http \
  --method tools/list \
  --header "X-API-Key: your-api-key"
```

Reference: [GitHub - modelcontextprotocol/inspector README](https://github.com/modelcontextprotocol/inspector)

## Passing Environment Variables and Arguments

### Environment Variables

Use the `-e` flag:

```bash
npx @modelcontextprotocol/inspector \
  -e API_KEY=your-key \
  -e DEBUG=true \
  --cli node build/index.js
```

### Arguments

Pass arguments directly after the server command:

```bash
npx @modelcontextprotocol/inspector --cli node build/index.js arg1 arg2
```

### Combining Both

```bash
npx @modelcontextprotocol/inspector \
  -e key=value \
  -e key2=$VALUE2 \
  --cli node build/index.js arg1 arg2
```

### Separating Inspector Flags from Server Arguments

Use `--` to separate inspector flags from server arguments :

```bash
npx @modelcontextprotocol/inspector -e key=$VALUE -- node build/index.js -e server-flag
```

Reference: [NPM - @modelcontextprotocol/inspector](https://www.npmjs.com/package/@modelcontextprotocol/inspector)

## Alternative: Direct JSON-RPC Testing

For even more control, you can interact directly with MCP servers using JSON-RPC 2.0 over stdio. MCP uses JSON-RPC 2.0 over stdio or SSE transport .

### Helper Functions for Shell Scripts

Create these functions in your shell:

```bash
# List MCP tools
mcp_tools() {
  local server_command=("${@}")
  echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
    "${server_command[@]}" | jq
}

# Call an MCP tool
mcp_call() {
  local tool="$1"
  local args="$2"
  shift 2
  local server_command=("${@}")
  echo "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"id\":1,\"params\":{\"name\":\"$tool\",\"arguments\":$args}}" | \
    "${server_command[@]}" | jq
}

# List MCP resources
mcp_resources() {
  local server_command=("${@}")
  echo '{"jsonrpc":"2.0","method":"resources/list","id":3}' | \
    "${server_command[@]}" | jq
}
```

### Usage Examples

```bash
# List available tools
mcp_tools npx -y @modelcontextprotocol/server-filesystem ~/Code

# Call a tool
mcp_call read_file '{"path":"/path/to/file"}' npx -y @modelcontextprotocol/server-filesystem ~/Code

# Extract just the content
mcp_call "read_file" '{"path":"/path/to/file"}' npx -y @modelcontextprotocol/server-filesystem ~/Code | \
  jq -r '.result.content[].text'

# Get list of tool names only
mcp_tools npx -y @modelcontextprotocol/server-filesystem ~/Code | \
  jq -r '.result.tools[].name'
```

Reference: [fka.dev - Inspecting and Debugging MCP Servers Using CLI and jq](https://blog.fka.dev/blog/2025-03-25-inspecting-mcp-servers-using-cli/)

## Automation & Testing Scripts

### Basic Test Script

Create a file `test-mcp-server.sh`:

```bash
#!/bin/bash

SERVER_CMD="node build/index.js"
INSPECTOR="npx @modelcontextprotocol/inspector --cli"

echo "Testing MCP Server..."

# Test 1: List tools
echo "1. Listing tools..."
$INSPECTOR $SERVER_CMD --method tools/list | jq '.result.tools[].name'

# Test 2: Call a specific tool
echo "2. Testing tool execution..."
$INSPECTOR $SERVER_CMD \
  --method tools/call \
  --tool-name my_tool \
  --tool-arg param1=value1

# Test 3: List resources
echo "3. Listing resources..."
$INSPECTOR $SERVER_CMD --method resources/list

echo "Tests complete!"
```

Make it executable:

```bash
chmod +x test-mcp-server.sh
./test-mcp-server.sh
```

### CI/CD Integration

CLI mode outputs JSON by default, making it ideal for automated testing pipelines. Combine with jq or other JSON processors for advanced workflows .

Example GitHub Actions workflow:

```yaml
name: Test MCP Server

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build server
        run: npm run build
      
      - name: Test with Inspector CLI
        run: |
          # Test tools listing
          npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list
          
          # Test tool execution
          npx @modelcontextprotocol/inspector --cli node build/index.js \
            --method tools/call \
            --tool-name test_tool \
            --tool-arg input=test
```

Reference: [MCPcat - MCP Inspector Setup Guide](https://mcpcat.io/guides/setting-up-mcp-inspector-server-testing/)

## Alternative CLI Tools

### MCP Tools (by fka.dev)

An alternative command-line tool specifically designed for MCP server interaction:

```bash
# Install via Homebrew
brew tap f/mcptools && brew install mcp

# List tools
mcp tools npx -y @modelcontextprotocol/server-filesystem ~/Code

# Call a tool
mcp call read_file --params '{"path": "/path/to/file"}' \
  npx -y @modelcontextprotocol/server-filesystem ~/Code

# Interactive shell mode
mcp shell npx -y @modelcontextprotocol/server-filesystem ~/Code
```

Reference: [fka.dev - Introducing MCP Tools](https://blog.fka.dev/blog/2025-03-26-introducing-mcp-tools-cli/)

### @wong2/mcp-cli

Another community CLI tool with OAuth support:

```bash
npx @wong2/mcp-cli

# Use Claude Desktop config
npx @wong2/mcp-cli -c config.json

# Call specific tool
npx @wong2/mcp-cli -c config.json call-tool filesystem:read_file \
  --args '{"path": "package.json"}'
```

Reference: [GitHub - wong2/mcp-cli](https://github.com/wong2/mcp-cli)

## Debugging & Monitoring

### Viewing Server Logs

Redirect stderr to a log file:

```bash
npx @modelcontextprotocol/inspector --cli node build/index.js 2>server.log

# In another terminal
tail -f server.log
```

### Testing Error Handling

```bash
# Test with invalid parameters
mcp_call read_file '{"path":"/nonexistent"}' \
  npx -y @modelcontextprotocol/server-filesystem ~/Code
```

Reference: [fka.dev - Inspecting MCP Servers](https://blog.fka.dev/blog/2025-03-25-inspecting-mcp-servers-using-cli/)

## Best Practices

1. **Start with UI Mode for Development**: Use UI mode when learning or debugging visually, and CLI mode when you need to automate tasks 
1. **Use Configuration Files**: Store frequently used settings in config files to avoid repetitive command-line arguments
1. **Validate Outputs**: Always pipe CLI output through `jq` or similar tools to validate JSON structure
1. **Test Edge Cases**: Test invalid inputs, missing arguments, and concurrent operations
1. **Integration Testing**: Create test scripts that exercise all server capabilities, then run these through the Inspector’s CLI mode as part of your deployment pipeline 

Reference: [BootcampToProd - MCP Inspector Guide](https://bootcamptoprod.com/mcp-inspector-guide/)

## Summary

The MCP Inspector CLI mode provides a powerful way to test and automate MCP server operations. Key takeaways:

- Use `--cli` flag for programmatic access
- Combine with `--method` to specify operations
- Support for both local (stdio) and remote (SSE/HTTP) servers
- JSON output enables easy integration with testing pipelines
- Alternative tools available for different workflows

All information in this guide comes from official Anthropic documentation and verified community resources.​​​​​​​​​​​​​​​​
