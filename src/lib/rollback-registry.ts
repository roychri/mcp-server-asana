export interface RollbackOp {
  tool: string;
  args: Record<string, any>;
}

export interface RollbackRegistryEntry {
  reversible: boolean;
  needsPrefetch: boolean;
  generateRollbackOp: (
    input: Record<string, any>,
    prefetchedState: any | null,
    outputText: string | null
  ) => RollbackOp | null;
}

function tryParseJson(text: string | null): any | null {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

/**
 * Normalize a prefetched assignee object ({gid, name, ...}) to just the GID string,
 * which is the format the update tool accepts.
 */
function normalizeAssignee(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'object' && value.gid) return value.gid;
  if (typeof value === 'string') return value;
  return null;
}

/**
 * Normalize prefetched custom_fields array format to the {gid: value} object format
 * that the update tool accepts.
 */
function normalizeCustomFields(fields: any[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const cf of fields) {
    if (cf.type === 'enum') {
      result[cf.gid] = cf.enum_value?.gid || null;
    } else if (cf.type === 'multi_enum') {
      result[cf.gid] = cf.multi_enum_values?.map((v: any) => v.gid) || [];
    } else if (cf.type === 'number') {
      result[cf.gid] = cf.number_value;
    } else {
      result[cf.gid] = cf.display_value;
    }
  }
  return result;
}

export const ROLLBACK_REGISTRY: Record<string, RollbackRegistryEntry> = {

  // === UPDATE OPERATIONS (reversible via prefetched state) ===

  asana_update_task: {
    reversible: true,
    needsPrefetch: true,
    generateRollbackOp: (input, prefetchedState) => {
      if (!prefetchedState) return null;
      const rollbackArgs: Record<string, any> = { task_id: input.task_id };

      for (const key of Object.keys(input)) {
        if (key === 'task_id') continue;
        const original = prefetchedState[key];
        if (original === undefined) continue;

        if (key === 'assignee') {
          rollbackArgs[key] = normalizeAssignee(original);
        } else if (key === 'custom_fields' && Array.isArray(original)) {
          rollbackArgs[key] = normalizeCustomFields(original);
        } else {
          rollbackArgs[key] = original;
        }
      }

      return { tool: 'asana_update_task', args: rollbackArgs };
    }
  },

  asana_update_tag: {
    reversible: true,
    needsPrefetch: true,
    generateRollbackOp: (input, prefetchedState) => {
      if (!prefetchedState) return null;
      const rollbackArgs: Record<string, any> = { tag_gid: input.tag_gid };

      for (const key of Object.keys(input)) {
        if (key === 'tag_gid' || key === 'opt_fields') continue;
        const original = prefetchedState[key];
        if (original === undefined) continue;
        rollbackArgs[key] = original;
      }

      return { tool: 'asana_update_tag', args: rollbackArgs };
    }
  },

  // === CREATE OPERATIONS (reversible via deletion) ===

  asana_create_task: {
    reversible: true,
    needsPrefetch: false,
    generateRollbackOp: (_input, _prefetchedState, outputText) => {
      const parsed = tryParseJson(outputText);
      if (!parsed?.gid) return null;
      return { tool: 'asana_delete_task', args: { task_id: parsed.gid } };
    }
  },

  asana_create_subtask: {
    reversible: true,
    needsPrefetch: false,
    generateRollbackOp: (_input, _prefetchedState, outputText) => {
      const parsed = tryParseJson(outputText);
      if (!parsed?.gid) return null;
      return { tool: 'asana_delete_task', args: { task_id: parsed.gid } };
    }
  },

  asana_create_project: {
    reversible: false,
    needsPrefetch: false,
    generateRollbackOp: () => null
  },

  asana_create_project_status: {
    reversible: true,
    needsPrefetch: false,
    generateRollbackOp: (_input, _prefetchedState, outputText) => {
      const parsed = tryParseJson(outputText);
      if (!parsed?.gid) return null;
      return { tool: 'asana_delete_project_status', args: { project_status_gid: parsed.gid } };
    }
  },

  asana_create_task_story: {
    reversible: false,
    needsPrefetch: false,
    generateRollbackOp: () => null
  },

  asana_create_tag_for_workspace: {
    reversible: true,
    needsPrefetch: false,
    generateRollbackOp: (_input, _prefetchedState, outputText) => {
      const parsed = tryParseJson(outputText);
      if (!parsed?.gid) return null;
      return { tool: 'asana_delete_tag', args: { tag_gid: parsed.gid } };
    }
  },

  // === DELETE OPERATIONS (irreversible — prefetch for audit trail) ===

  asana_delete_task: {
    reversible: false,
    needsPrefetch: true,
    generateRollbackOp: () => null
  },

  asana_delete_tag: {
    reversible: false,
    needsPrefetch: true,
    generateRollbackOp: () => null
  },

  asana_delete_project_status: {
    reversible: false,
    needsPrefetch: true,
    generateRollbackOp: () => null
  },

  // === RELATIONSHIP OPERATIONS ===

  asana_add_tag_to_task: {
    reversible: true,
    needsPrefetch: false,
    generateRollbackOp: (input) => ({
      tool: 'asana_remove_tag_from_task',
      args: { task_gid: input.task_gid, tag_gid: input.tag_gid }
    })
  },

  asana_remove_tag_from_task: {
    reversible: true,
    needsPrefetch: false,
    generateRollbackOp: (input) => ({
      tool: 'asana_add_tag_to_task',
      args: { task_gid: input.task_gid, tag_gid: input.tag_gid }
    })
  },

  asana_add_project_to_task: {
    reversible: true,
    needsPrefetch: false,
    generateRollbackOp: (input) => ({
      tool: 'asana_remove_project_from_task',
      args: { task_id: input.task_id, project_id: input.project_id }
    })
  },

  asana_remove_project_from_task: {
    reversible: true,
    needsPrefetch: false,
    generateRollbackOp: (input) => ({
      tool: 'asana_add_project_to_task',
      args: { task_id: input.task_id, project_id: input.project_id }
    })
  },

  asana_add_task_dependencies: {
    reversible: false,
    needsPrefetch: false,
    generateRollbackOp: () => null
  },

  asana_add_task_dependents: {
    reversible: false,
    needsPrefetch: false,
    generateRollbackOp: () => null
  },

  asana_set_parent_for_task: {
    reversible: false,
    needsPrefetch: false,
    generateRollbackOp: () => null
  },
};
