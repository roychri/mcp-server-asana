import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js';

export function tool_handler(asanaClient: AsanaClientWrapper) {
    return async (request: CallToolRequest) => {
      console.error("Received CallToolRequest:", request);
      try {
        if (!request.params.arguments) {
          throw new Error("No arguments provided");
        }

        const args = request.params.arguments as any;

        switch (request.params.name) {
          case "asana_list_workspaces": {
            const response = await asanaClient.listWorkspaces(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_search_projects": {
            const { workspace, name_pattern, archived = false, ...opts } = args;
            const response = await asanaClient.searchProjects(
              workspace,
              name_pattern,
              archived,
              opts
            );
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_search_tasks": {
            const { workspace, ...searchOpts } = args;
            const response = await asanaClient.searchTasks(workspace, searchOpts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_task": {
            const { task_id, ...opts } = args;
            const response = await asanaClient.getTask(task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_task": {
            const { project_id, ...taskData } = args;
            const response = await asanaClient.createTask(project_id, taskData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_task_stories": {
            const { task_id, ...opts } = args;
            const response = await asanaClient.getStoriesForTask(task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_update_task": {
            const { task_id, ...taskData } = args;
            const response = await asanaClient.updateTask(task_id, taskData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProject(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_task_counts": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProjectTaskCounts(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_sections": {
            const { project_id, ...opts } = args;
            const response = await asanaClient.getProjectSections(project_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_task_story": {
            const { task_id, text, ...opts } = args;
            const response = await asanaClient.createTaskStory(task_id, text, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_task_dependencies": {
            const { task_id, dependencies } = args;
            const response = await asanaClient.addTaskDependencies(task_id, dependencies);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_task_dependents": {
            const { task_id, dependents } = args;
            const response = await asanaClient.addTaskDependents(task_id, dependents);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_subtask": {
            const { parent_task_id, opt_fields, ...taskData } = args;
            const response = await asanaClient.createSubtask(parent_task_id, taskData, { opt_fields });
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_multiple_tasks_by_gid": {
            const { task_ids, ...opts } = args;
            // Handle both array and string input
            const taskIdList = Array.isArray(task_ids)
              ? task_ids
              : task_ids.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
            const response = await asanaClient.getMultipleTasksByGid(taskIdList, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    };
}
