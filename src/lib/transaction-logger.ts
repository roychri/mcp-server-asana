import * as fs from 'fs';
import * as crypto from 'crypto';
import { CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from '../asana-client-wrapper.js';
import { ROLLBACK_REGISTRY, RollbackOp } from './rollback-registry.js';
import { READ_ONLY_TOOLS } from '../tool-handler.js';

interface TransactionLogEntry {
  id: string;
  timestamp: string;
  session_id: string;
  tool: string;
  input: Record<string, any>;
  output: string;
  prefetched_state?: any;
  success: boolean;
  reversible: boolean;
  rollback_op: RollbackOp | null;
  rolled_back: boolean;
  rolled_back_at: string | null;
}

interface RollbackLogEntry {
  id: string;
  timestamp: string;
  session_id: string;
  type: 'rollback_event';
  original_transaction_id: string;
  tool: string;
  input: Record<string, any>;
  output: string;
  success: boolean;
}

type LogEntry = TransactionLogEntry | RollbackLogEntry;

function isRollbackEvent(entry: LogEntry): entry is RollbackLogEntry {
  return 'type' in entry && entry.type === 'rollback_event';
}

export interface TransactionLoggerOptions {
  logPath?: string;
  enabled?: boolean;
  readOnlyMode?: boolean;
}

export class TransactionLogger {
  private readonly logPath: string;
  private readonly enabled: boolean;
  private readonly readOnlyMode: boolean;
  private readonly sessionId: string;
  private readonly asanaClient: AsanaClientWrapper;

  constructor(asanaClient: AsanaClientWrapper, options: TransactionLoggerOptions = {}) {
    this.asanaClient = asanaClient;
    this.logPath = options.logPath || './asana-mcp-transactions.jsonl';
    this.enabled = options.enabled !== false;
    this.readOnlyMode = options.readOnlyMode === true;
    this.sessionId = crypto.randomUUID();

    if (this.enabled) {
      console.error(`Transaction logger: enabled, session=${this.sessionId}, path=${this.logPath}`);
    }
  }

  /**
   * Wraps the inner tool handler with transaction logging middleware.
   * Intercepts asana_rollback and asana_get_transaction_log before they reach the inner handler.
   */
  wrap(
    innerHandler: (request: CallToolRequest) => Promise<CallToolResult>
  ): (request: CallToolRequest) => Promise<CallToolResult> {
    return async (request: CallToolRequest): Promise<CallToolResult> => {
      const toolName = request.params.name;
      const args = (request.params.arguments as Record<string, any>) || {};

      // Intercept transaction-specific tools
      if (toolName === 'asana_rollback') {
        if (this.readOnlyMode) {
          return {
            isError: true,
            content: [{ type: 'text', text: JSON.stringify({ error: 'Tool asana_rollback is not available in read-only mode' }) }],
          };
        }
        return this.handleRollback(args);
      }
      if (toolName === 'asana_get_transaction_log') {
        return this.handleGetTransactionLog(args);
      }

      // Pass through if logging disabled or tool is read-only
      if (!this.enabled || READ_ONLY_TOOLS.includes(toolName)) {
        return innerHandler(request);
      }

      // Look up registry entry for this write tool
      const registryEntry = ROLLBACK_REGISTRY[toolName];

      // Pre-fetch state if needed
      let prefetchedState: any = null;
      if (registryEntry?.needsPrefetch) {
        try {
          prefetchedState = await this.prefetch(toolName, args);
        } catch (err) {
          console.error(`Transaction logger: prefetch failed for ${toolName}:`, err);
        }
      }

      // Execute the actual tool handler
      const result = await innerHandler(request);

      // Extract output and determine success
      const outputText = this.extractOutputText(result);
      const success = !(result as any).isError;

      // Generate rollback op (only for successful, reversible operations)
      let rollbackOp: RollbackOp | null = null;
      if (success && registryEntry?.reversible) {
        rollbackOp = registryEntry.generateRollbackOp(args, prefetchedState, outputText);
      }

      // Write log entry
      const entry: TransactionLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        tool: toolName,
        input: args,
        output: outputText,
        success,
        reversible: registryEntry ? registryEntry.reversible && rollbackOp !== null : false,
        rollback_op: rollbackOp,
        rolled_back: false,
        rolled_back_at: null,
      };

      // Include prefetched state for audit trail (useful for irreversible deletes)
      if (prefetchedState) {
        entry.prefetched_state = prefetchedState;
      }

      await this.appendEntry(entry);

      return result;
    };
  }

  // --- Private: pre-fetch ---

  private async prefetch(toolName: string, args: Record<string, any>): Promise<any> {
    switch (toolName) {
      case 'asana_update_task':
        return this.asanaClient.getTask(args.task_id, {});
      case 'asana_update_tag':
        return this.asanaClient.getTag(args.tag_gid, {});
      case 'asana_delete_task':
        return this.asanaClient.getTask(args.task_id, {});
      case 'asana_delete_tag':
        return this.asanaClient.getTag(args.tag_gid, {});
      case 'asana_delete_project_status':
        return this.asanaClient.getProjectStatus(args.project_status_gid, {});
      default:
        return null;
    }
  }

  // --- Private: rollback handler ---

  private async handleRollback(args: Record<string, any>): Promise<CallToolResult> {
    const { transaction_id, session_id, last_n, dry_run = false } = args;

    if (!transaction_id && !session_id && !last_n) {
      return this.textResult(JSON.stringify({
        error: "At least one of transaction_id, session_id, or last_n is required"
      }));
    }

    const allEntries = await this.readEntries();

    // Build set of already-rolled-back transaction IDs
    const rolledBackIds = new Set<string>();
    for (const entry of allEntries) {
      if (isRollbackEvent(entry) && entry.success) {
        rolledBackIds.add(entry.original_transaction_id);
      }
    }

    // Filter to regular transaction entries (not rollback events)
    const transactions = allEntries.filter(
      (e): e is TransactionLogEntry => !isRollbackEvent(e)
    );

    // Select target transactions
    let targets: TransactionLogEntry[];
    if (transaction_id) {
      targets = transactions.filter(t => t.id === transaction_id);
    } else if (session_id) {
      targets = transactions.filter(t => t.session_id === session_id);
    } else {
      // last_n: from current session
      targets = transactions
        .filter(t => t.session_id === this.sessionId)
        .slice(-last_n);
    }

    // Process in reverse chronological order
    targets.reverse();

    const rolled_back: any[] = [];
    const skipped_irreversible: any[] = [];
    const already_rolled_back: any[] = [];
    const errors: any[] = [];

    for (const tx of targets) {
      if (rolledBackIds.has(tx.id)) {
        already_rolled_back.push({ id: tx.id, tool: tx.tool });
        continue;
      }

      if (!tx.reversible || !tx.rollback_op) {
        skipped_irreversible.push({ id: tx.id, tool: tx.tool });
        continue;
      }

      if (dry_run) {
        rolled_back.push({
          id: tx.id,
          tool: tx.tool,
          rollback_op: tx.rollback_op,
          dry_run: true
        });
        continue;
      }

      // Execute the rollback
      try {
        const result = await this.executeRollbackOp(tx.rollback_op);

        // Log the rollback event
        const rollbackEntry: RollbackLogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          session_id: this.sessionId,
          type: 'rollback_event',
          original_transaction_id: tx.id,
          tool: tx.rollback_op.tool,
          input: tx.rollback_op.args,
          output: JSON.stringify(result),
          success: true,
        };
        await this.appendEntry(rollbackEntry);

        rolled_back.push({ id: tx.id, tool: tx.tool, rollback_tool: tx.rollback_op.tool });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);

        const rollbackEntry: RollbackLogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          session_id: this.sessionId,
          type: 'rollback_event',
          original_transaction_id: tx.id,
          tool: tx.rollback_op.tool,
          input: tx.rollback_op.args,
          output: JSON.stringify({ error: errMsg }),
          success: false,
        };
        await this.appendEntry(rollbackEntry);

        errors.push({ id: tx.id, tool: tx.tool, error: errMsg });
      }
    }

    return this.textResult(JSON.stringify({
      rolled_back,
      skipped_irreversible,
      already_rolled_back,
      errors,
      dry_run,
    }, null, 2));
  }

  // --- Private: execute a single rollback operation ---

  private async executeRollbackOp(op: RollbackOp): Promise<any> {
    switch (op.tool) {
      case 'asana_update_task': {
        const { task_id, ...data } = op.args;
        return this.asanaClient.updateTask(task_id, data);
      }
      case 'asana_update_tag': {
        const { tag_gid, opt_fields, ...data } = op.args;
        return this.asanaClient.updateTag(tag_gid, data, { opt_fields });
      }
      case 'asana_delete_task':
        return this.asanaClient.deleteTask(op.args.task_id);
      case 'asana_delete_tag':
        return this.asanaClient.deleteTag(op.args.tag_gid);
      case 'asana_delete_project_status':
        return this.asanaClient.deleteProjectStatus(op.args.project_status_gid);
      case 'asana_remove_tag_from_task':
        return this.asanaClient.removeTagFromTask(op.args.task_gid, op.args.tag_gid);
      case 'asana_add_tag_to_task':
        return this.asanaClient.addTagToTask(op.args.task_gid, op.args.tag_gid);
      case 'asana_remove_project_from_task':
        return this.asanaClient.removeProjectFromTask(op.args.task_id, op.args.project_id);
      case 'asana_add_project_to_task':
        return this.asanaClient.addProjectToTask(op.args.task_id, op.args.project_id, {});
      default:
        throw new Error(`Unknown rollback tool: ${op.tool}`);
    }
  }

  // --- Private: get transaction log handler ---

  private async handleGetTransactionLog(args: Record<string, any>): Promise<CallToolResult> {
    const {
      session_id = this.sessionId,
      reversible_only = false,
      include_rolled_back = false,
      limit = 50,
    } = args;

    const allEntries = await this.readEntries();

    // Build set of rolled-back transaction IDs with their timestamps
    const rolledBackMap = new Map<string, string>();
    for (const entry of allEntries) {
      if (isRollbackEvent(entry) && entry.success) {
        rolledBackMap.set(entry.original_transaction_id, entry.timestamp);
      }
    }

    // Filter to regular transaction entries
    let transactions = allEntries
      .filter((e): e is TransactionLogEntry => !isRollbackEvent(e))
      .filter(t => t.session_id === session_id);

    // Apply filters
    if (reversible_only) {
      transactions = transactions.filter(t => t.reversible);
    }

    if (!include_rolled_back) {
      transactions = transactions.filter(t => !rolledBackMap.has(t.id));
    }

    // Apply limit (most recent first)
    transactions = transactions.slice(-limit).reverse();

    // Merge rolled-back state into the view
    const result = transactions.map(t => ({
      ...t,
      rolled_back: rolledBackMap.has(t.id),
      rolled_back_at: rolledBackMap.get(t.id) || null,
    }));

    return this.textResult(JSON.stringify({
      session_id,
      current_session_id: this.sessionId,
      total: result.length,
      entries: result,
    }, null, 2));
  }

  // --- Private: file I/O ---

  private async appendEntry(entry: LogEntry): Promise<void> {
    try {
      await fs.promises.appendFile(this.logPath, JSON.stringify(entry) + '\n');
    } catch (err) {
      console.error('Transaction logger: failed to write log entry:', err);
    }
  }

  private async readEntries(): Promise<LogEntry[]> {
    try {
      const content = await fs.promises.readFile(this.logPath, 'utf-8');
      return content
        .trim()
        .split('\n')
        .filter(Boolean)
        .flatMap(line => {
          try { return [JSON.parse(line)]; }
          catch { console.error('Transaction logger: skipping corrupt log line'); return []; }
        });
    } catch (err: any) {
      if (err.code === 'ENOENT') return [];
      console.error('Transaction logger: failed to read log file:', err);
      return [];
    }
  }

  // --- Private: helpers ---

  private extractOutputText(result: CallToolResult): string {
    if (result.content && result.content.length > 0) {
      const first = result.content[0];
      if ('text' in first && typeof first.text === 'string') {
        return first.text;
      }
    }
    return '';
  }

  private textResult(text: string): CallToolResult {
    return {
      content: [{ type: "text", text }],
    };
  }
}
