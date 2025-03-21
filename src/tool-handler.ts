import { Tool, CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js';

import { listWorkspacesTool } from './tools/workspace-tools.js';
import {
  searchProjectsTool,
  getProjectTool,
  getProjectTaskCountsTool,
  getProjectSectionsTool
} from './tools/project-tools.js';
import { 
  getProjectStatusTool,
  getProjectStatusesForProjectTool,
  createProjectStatusTool,
  deleteProjectStatusTool
} from './tools/project-status-tools.js';
import {
  searchTasksTool,
  getTaskTool,
  createTaskTool,
  updateTaskTool,
  createSubtaskTool,
  getMultipleTasksByGidTool
} from './tools/task-tools.js';
import { 
  getTagTool,
  getTagsTool,
  getTagsForTaskTool,
  getTagsForWorkspaceTool, 
  updateTagTool,
  deleteTagTool,
  getTasksForTagTool, 
  createTagTool,
  createTagForWorkspaceTool,
  addTagToTaskTool, 
  removeTagFromTaskTool 
} from './tools/tag-tools.js';
import {
  addTaskDependenciesTool,
  addTaskDependentsTool,
  setParentForTaskTool
} from './tools/task-relationship-tools.js';
import {
  getStoriesForTaskTool,
  createTaskStoryTool
} from './tools/story-tools.js';

export const list_of_tools: Tool[] = [
  listWorkspacesTool,
  searchProjectsTool,
  searchTasksTool,
  getTaskTool,
  createTaskTool,
  getStoriesForTaskTool,
  updateTaskTool,
  getProjectTool,
  getProjectTaskCountsTool,
  getProjectSectionsTool,
  createTaskStoryTool,
  addTaskDependenciesTool,
  addTaskDependentsTool,
  createSubtaskTool,
  getMultipleTasksByGidTool,
  getProjectStatusTool,
  getProjectStatusesForProjectTool,
  createProjectStatusTool,
  deleteProjectStatusTool,
  setParentForTaskTool,
  getTagTool,
  getTagsTool,
  getTagsForTaskTool,
  getTagsForWorkspaceTool,
  updateTagTool,
  deleteTagTool,
  getTasksForTagTool,
  createTagTool,
  createTagForWorkspaceTool,
  addTagToTaskTool,
  removeTagFromTaskTool,
];

export function tool_handler(asanaClient: AsanaClientWrapper): (request: CallToolRequest) => Promise<CallToolResult> {
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

          case "asana_get_project_status": {
            const { project_status_gid, ...opts } = args;
            const response = await asanaClient.getProjectStatus(project_status_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_project_statuses": {
            const { project_gid, ...opts } = args;
            const response = await asanaClient.getProjectStatusesForProject(project_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_project_status": {
            const { project_gid, ...statusData } = args;
            const response = await asanaClient.createProjectStatus(project_gid, statusData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_delete_project_status": {
            const { project_status_gid } = args;
            const response = await asanaClient.deleteProjectStatus(project_status_gid);
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

          case "asana_set_parent_for_task": {
            let { data, task_id, opts } = args;
            if ( typeof data == "string" ) {
              data = JSON.parse( data );
            }
            if ( typeof opts == "string" ) {
              opts = JSON.parse( opts );
            }
            const response = await asanaClient.setParentForTask(data, task_id, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_tasks_for_tag": {
            const { tag_gid, ...opts } = args;
            const response = await asanaClient.getTasksForTag(tag_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_tags_for_workspace": {
            const { workspace_gid, ...opts } = args;
            const response = await asanaClient.getTagsForWorkspace(workspace_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_tag": {
            const { opt_fields, ...data } = args;
            const response = await asanaClient.createTag(data, { opt_fields });
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_create_tag_for_workspace": {
            const { workspace_gid, opt_fields, ...data } = args;
            const response = await asanaClient.createTagForWorkspace(workspace_gid, data, { opt_fields });
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_add_tag_to_task": {
            const { task_gid, tag_gid } = args;
            const response = await asanaClient.addTagToTask(task_gid, tag_gid);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_tag": {
            const { tag_gid, ...opts } = args;
            const response = await asanaClient.getTag(tag_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_tags": {
            const response = await asanaClient.getTags(args);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_get_tags_for_task": {
            const { task_gid, ...opts } = args;
            const response = await asanaClient.getTagsForTask(task_gid, opts);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_update_tag": {
            const { tag_gid, opt_fields, ...tagData } = args;
            const response = await asanaClient.updateTag(tag_gid, tagData, { opt_fields });
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_delete_tag": {
            const { tag_gid } = args;
            const response = await asanaClient.deleteTag(tag_gid);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          }

          case "asana_remove_tag_from_task": {
            const { task_gid, tag_gid } = args;
            const response = await asanaClient.removeTagFromTask(task_gid, tag_gid);
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
