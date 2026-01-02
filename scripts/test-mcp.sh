#!/bin/bash
#
# MCP Server Test Helper Functions
# Source this file to get helper functions for testing the MCP server
#
# Usage:
#   source scripts/test-mcp.sh
#   mcp_call asana_list_workspaces
#   mcp_call asana_search_tasks '{"workspace":"YOUR_WORKSPACE_GID","completed":false}'
#

# Configuration
MCP_SERVER_CMD="${MCP_SERVER_CMD:-node dist/index.js}"
MCP_INSPECTOR="npx @modelcontextprotocol/inspector@latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if ASANA_ACCESS_TOKEN is set
_mcp_check_token() {
    if [ -z "$ASANA_ACCESS_TOKEN" ]; then
        echo -e "${RED}Error: ASANA_ACCESS_TOKEN environment variable is not set${NC}" >&2
        return 1
    fi
    return 0
}

# List all available MCP tools
mcp_list_tools() {
    _mcp_check_token || return 1
    echo -e "${YELLOW}Listing available tools...${NC}" >&2
    $MCP_INSPECTOR --cli --method tools/list -- $MCP_SERVER_CMD 2>/dev/null | jq -r '.tools[].name' | sort
}

# Call an MCP tool (raw JSON output)
# Args format: "key1=value1,key2=value2" (comma-separated key=value pairs)
mcp_call() {
    local tool_name="$1"
    local tool_args="$2"

    _mcp_check_token || return 1

    if [ -z "$tool_name" ]; then
        echo -e "${RED}Usage: mcp_call <tool_name> ['key1=val1,key2=val2']${NC}" >&2
        return 1
    fi

    echo -e "${YELLOW}Calling $tool_name...${NC}" >&2

    if [ -z "$tool_args" ]; then
        $MCP_INSPECTOR --cli --method tools/call --tool-name "$tool_name" -- $MCP_SERVER_CMD 2>/dev/null
    else
        # Build array of --tool-arg flags from comma-separated key=value pairs
        local arg_flags=()
        IFS=',' read -ra pairs <<< "$tool_args"
        for pair in "${pairs[@]}"; do
            arg_flags+=("--tool-arg=$pair")
        done
        $MCP_INSPECTOR --cli --method tools/call --tool-name "$tool_name" "${arg_flags[@]}" -- $MCP_SERVER_CMD 2>/dev/null
    fi
}

# Call an MCP tool and extract just the result text
mcp_call_text() {
    mcp_call "$@" | jq -r '.content[0].text'
}

# Call an MCP tool and parse the result as JSON
mcp_call_json() {
    mcp_call "$@" | jq -r '.content[0].text' | jq .
}

# Test a tool and verify it returns a successful result
mcp_test() {
    local tool_name="$1"
    local tool_args="$2"
    local expected_filter="${3:-}"

    _mcp_check_token || return 1

    echo -e "${YELLOW}Testing $tool_name...${NC}" >&2

    local result
    result=$(mcp_call "$tool_name" "$tool_args" 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$result" ]; then
        echo -e "${RED}FAIL: $tool_name - execution failed${NC}"
        return 1
    fi

    if echo "$result" | jq -e '.error' >/dev/null 2>&1; then
        local error
        error=$(echo "$result" | jq -r '.error')
        echo -e "${RED}FAIL: $tool_name - $error${NC}"
        return 1
    fi

    if [ -n "$expected_filter" ]; then
        local text
        text=$(echo "$result" | jq -r '.content[0].text')
        local check
        check=$(echo "$text" | jq "$expected_filter")
        if [ "$check" != "true" ]; then
            echo -e "${RED}FAIL: $tool_name - filter '$expected_filter' returned $check${NC}"
            return 1
        fi
    fi

    echo -e "${GREEN}PASS: $tool_name${NC}"
    return 0
}

# Quick health check
mcp_health_check() {
    _mcp_check_token || return 1

    echo -e "${YELLOW}Running health check...${NC}"

    local tools
    tools=$(mcp_list_tools 2>/dev/null)

    if [ -z "$tools" ]; then
        echo -e "${RED}FAIL: Could not list tools${NC}"
        return 1
    fi

    local count
    count=$(echo "$tools" | wc -l)
    echo -e "${GREEN}PASS: Server healthy, $count tools available${NC}"
    return 0
}

# Run smoke tests
mcp_smoke_test() {
    local workspace_gid="${1:-YOUR_WORKSPACE_GID}"
    local passed=0
    local failed=0

    _mcp_check_token || return 1

    echo -e "${YELLOW}=== Running Smoke Tests ===${NC}\n"

    if mcp_test asana_list_workspaces "" 'length > 0' 2>/dev/null; then
        ((passed++))
    else
        ((failed++))
    fi

    if mcp_test asana_search_projects "workspace=$workspace_gid,name_pattern=.*" 'length >= 0' 2>/dev/null; then
        ((passed++))
    else
        ((failed++))
    fi

    if mcp_test asana_search_tasks "workspace=$workspace_gid,completed=false" 'length >= 0' 2>/dev/null; then
        ((passed++))
    else
        ((failed++))
    fi

    if mcp_test asana_get_tags_for_workspace "workspace_gid=$workspace_gid" 'length >= 0' 2>/dev/null; then
        ((passed++))
    else
        ((failed++))
    fi

    echo -e "\n${YELLOW}=== Smoke Test Results ===${NC}"
    echo -e "${GREEN}Passed: $passed${NC}"
    if [ $failed -gt 0 ]; then
        echo -e "${RED}Failed: $failed${NC}"
        return 1
    else
        echo -e "${GREEN}All tests passed!${NC}"
        return 0
    fi
}

# Test search parameter fix (Issue #25)
mcp_test_search_params() {
    local workspace_gid="${1:-YOUR_WORKSPACE_GID}"

    _mcp_check_token || return 1

    echo -e "${YELLOW}=== Search Parameter Fix Test (Issue #25) ===${NC}"
    echo -e "Testing that underscore params are correctly mapped to dot notation\n"

    echo -e "${YELLOW}1. Testing with fake assignee ID...${NC}"
    local fake_result
    fake_result=$(mcp_call_text asana_search_tasks "workspace=$workspace_gid,assignee_any=99999999999999,completed=false" 2>/dev/null)
    local fake_count
    fake_count=$(echo "$fake_result" | jq 'length' 2>/dev/null || echo "error")

    if [ "$fake_count" = "error" ]; then
        echo -e "${RED}FAIL: Could not parse result${NC}"
        return 1
    fi

    echo "   Result count: $fake_count"

    if [ "$fake_count" -lt 10 ]; then
        echo -e "${GREEN}PASS: Filter is being applied${NC}"
    else
        echo -e "${RED}FAIL: Filter may be ignored (count: $fake_count)${NC}"
        return 1
    fi

    echo -e "\n${GREEN}=== Search parameter tests passed! ===${NC}"
}

# Print usage information
mcp_help() {
    cat << 'EOF'
MCP Server Test Helper Functions (using MCP Inspector CLI)

Available functions:
  mcp_list_tools                 List all available MCP tools
  mcp_call <tool> ['<args>']     Call a tool (args as key=value pairs)
  mcp_call_text <tool> ['<args>']  Call a tool, get text content
  mcp_call_json <tool> ['<args>']  Call a tool, parse as JSON
  mcp_test <tool> ['<args>'] [filter]  Test with optional jq filter
  mcp_health_check               Quick health check
  mcp_smoke_test [workspace]     Run smoke tests
  mcp_test_search_params [workspace]  Test Issue #25 fix
  mcp_help                       Show this help

Examples:
  mcp_list_tools
  mcp_call asana_list_workspaces
  mcp_call asana_search_tasks 'workspace=123,completed=false'
  mcp_call_json asana_get_task 'task_id=456'
  mcp_test asana_list_workspaces '' 'length > 0'

Environment variables:
  ASANA_ACCESS_TOKEN  Required. Your Asana access token
  MCP_SERVER_CMD      Server command (default: node dist/index.js)
EOF
}

# If sourced, print help message. If executed directly, run the command.
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Script is being executed directly
    if [ $# -eq 0 ]; then
        mcp_help
        exit 0
    fi
    "$@"
else
    # Script is being sourced
    echo -e "${GREEN}MCP test helpers loaded. Run 'mcp_help' for usage.${NC}"
fi
