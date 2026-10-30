import assert from 'node:assert/strict'
import test from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

test('asana_create_task_story exposes parent_comment without regressing rich text', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['dist/index.js'],
    env: { ...process.env, ASANA_ACCESS_TOKEN: 'schema-test-token' },
    stderr: 'pipe'
  })
  const client = new Client(
    { name: 'mcp-server-asana-schema-test', version: '1.0.0' },
    { capabilities: {} }
  )

  try {
    await client.connect(transport)
    const { tools } = await client.listTools()
    const storyTool = tools.find(tool => tool.name === 'asana_create_task_story')

    assert.ok(storyTool, 'asana_create_task_story must be registered')
    assert.equal(storyTool.inputSchema.properties.parent_comment.type, 'string')
    assert.equal(storyTool.inputSchema.properties.html_text.type, 'string')
    assert.deepEqual(storyTool.inputSchema.required, ['task_id'])
  } finally {
    await client.close()
  }
})
