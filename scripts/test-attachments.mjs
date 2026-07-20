#!/usr/bin/env node
// Live test driver for the attachment tools.
// Usage: node scripts/test-attachments.mjs <TASK_GID> <FILE_PATH>
// Token: ASANA_ACCESS_TOKEN env, or first CLI arg file local/scripts/asana/.asana_pat.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { readFileSync, existsSync } from 'node:fs';

const [taskGid, filePath] = process.argv.slice(2);
if (!taskGid || !filePath) {
  console.error('Usage: node scripts/test-attachments.mjs <TASK_GID> <FILE_PATH>');
  process.exit(2);
}

let token = process.env.ASANA_ACCESS_TOKEN;
if (!token) {
  const tokenFile = 'C:/Users/Victor.Perez/Projects/Tip-Top-Poultry/local/scripts/asana/.asana_pat';
  if (existsSync(tokenFile)) token = readFileSync(tokenFile, 'utf8').trim();
}
if (!token) { console.error('No Asana token found (ASANA_ACCESS_TOKEN or .asana_pat).'); process.exit(2); }

const srv = spawn('node', ['dist/index.js'], {
  env: { ...process.env, ASANA_ACCESS_TOKEN: token },
  stdio: ['pipe', 'pipe', 'inherit'],
});

const rl = createInterface({ input: srv.stdout });
const pending = new Map();
let nextId = 1;
rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  if (msg.id != null && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

const send = (obj) => srv.stdin.write(JSON.stringify(obj) + '\n');
const rpc = (method, params) => new Promise((resolve) => {
  const id = nextId++;
  pending.set(id, resolve);
  send({ jsonrpc: '2.0', id, method, params });
});
const callTool = async (name, args) => {
  const r = await rpc('tools/call', { name, arguments: args });
  const text = r.result?.content?.[0]?.text ?? JSON.stringify(r.error ?? r);
  let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { isError: r.result?.isError, parsed };
};

const ok = (b) => (b ? 'PASS' : 'FAIL');
let allPass = true;
const mark = (b) => { if (!b) allPass = false; return ok(b); };

(async () => {
  await rpc('initialize', {
    capabilities: {}, clientInfo: { name: 'attach-test', version: '1' },
    protocolVersion: '2024-11-05',
  });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  console.log(`\n1) asana_create_attachment  (upload ${filePath} -> task ${taskGid})`);
  const created = await callTool('asana_create_attachment', { parent: taskGid, file_path: filePath });
  const attGid = created.parsed?.gid;
  console.log('   ', mark(!!attGid && !created.isError), '->', JSON.stringify(created.parsed));

  if (!attGid) { console.log('\nRESULT:', mark(false)); srv.kill(); process.exit(1); }

  console.log(`\n2) asana_get_attachments_for_object  (parent ${taskGid})`);
  const list = await callTool('asana_get_attachments_for_object', { parent: taskGid });
  const found = Array.isArray(list.parsed) && list.parsed.some(a => a.gid === attGid);
  console.log('   ', mark(found), '->', JSON.stringify(list.parsed));

  console.log(`\n3) asana_get_attachment  (${attGid})`);
  const got = await callTool('asana_get_attachment', { attachment_gid: attGid, opt_fields: 'name,resource_type,download_url,parent' });
  console.log('   ', mark(got.parsed?.gid === attGid), '->', JSON.stringify(got.parsed));

  console.log(`\n4) asana_delete_attachment  (${attGid})  [cleanup]`);
  const del = await callTool('asana_delete_attachment', { attachment_gid: attGid });
  console.log('   ', mark(!del.isError), '->', JSON.stringify(del.parsed));

  console.log('\nRESULT:', allPass ? 'ALL PASS' : 'SOME FAILED');
  srv.kill();
  process.exit(allPass ? 0 : 1);
})();
