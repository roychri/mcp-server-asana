import { Tool, CallToolRequest, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js';
import { validateAsanaXml } from './asana-validate-xml.js';

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
import { getTasksForTagTool, getTagsForWorkspaceTool } from './tools/tag-tools.js';
import {
  addTaskDependenciesTool,
  addTaskDependentsTool,
  setParentForTaskTool
} from './tools/task-relationship-tools.js';
import {
  getStoriesForTaskTool,
  createTaskStoryTool
} from './tools/story-tools.js';

// List of all available tools
const all_tools: Tool[] = [
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
  getTasksForTagTool,
  getTagsForWorkspaceTool,
];

// List of tools that only read Asana state
const READ_ONLY_TOOLS = [
  'asana_list_workspaces',
  'asana_search_projects',
  'asana_search_tasks',
  'asana_get_task',
  'asana_get_task_stories',
  'asana_get_project',
  'asana_get_project_task_counts',
  'asana_get_project_status',
  'asana_get_project_statuses',
  'asana_get_project_sections',
  'asana_get_multiple_tasks_by_gid',
  'asana_get_tasks_for_tag',
  'asana_get_tags_for_workspace'
];

// Filter tools based on READ_ONLY_MODE
const isReadOnlyMode = process.env.READ_ONLY_MODE === 'true';

// Export filtered list of tools
export const list_of_tools = isReadOnlyMode
  ? all_tools.filter(tool => READ_ONLY_TOOLS.includes(tool.name))
  : all_tools;

export function tool_handler(asanaClient: AsanaClientWrapper): (request: CallToolRequest) => Promise<CallToolResult> {
  return async (request: CallToolRequest) => {
    console.error("Received CallToolRequest:", request);
    try {
      if (!request.params.arguments) {
        throw new Error("No arguments provided");
      }

      // Block non-read operations in read-only mode
      if (isReadOnlyMode && !READ_ONLY_TOOLS.includes(request.params.name)) {
        throw new Error(`Tool ${request.params.name} is not available in read-only mode`);
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
          try {
            const response = await asanaClient.createTask(project_id, taskData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          } catch (error) {
            // When error occurs and html_notes was provided, validate it
            if (taskData.html_notes && error instanceof Error && [400, 500].includes(error.status)) {
              const xmlValidationErrors = validateAsanaXml(taskData.html_notes);
              if (xmlValidationErrors.length > 0) {
                // Provide detailed validation errors to help the user
                return {
                  content: [{
                    type: "text",
                    text: JSON.stringify({
                      error: error instanceof Error ? error.message : String(error),
                      validation_errors: xmlValidationErrors,
                      message: "The HTML notes contain invalid XML formatting. Please check the validation errors above."
                    })
                  }],
                };
              } else {
                // HTML is valid, something else caused the error
                return {
                  content: [{
                    type: "text",
                    text: JSON.stringify({
                      error: error instanceof Error ? error.message : String(error),
                      html_notes_validation: "The HTML notes format is valid. The error must be related to something else."
                    })
                  }],
                };
              }
            }
            throw error; // re-throw to be caught by the outer try/catch
          }
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
          try {
            const response = await asanaClient.updateTask(task_id, taskData);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          } catch (error) {
            // When error occurs and html_notes was provided, validate it
            if (taskData.html_notes && error instanceof Error && error.message.includes('400')) {
              const xmlValidationErrors = validateAsanaXml(taskData.html_notes);
              if (xmlValidationErrors.length > 0) {
                // Provide detailed validation errors to help the user
                return {
                  content: [{
                    type: "text",
                    text: JSON.stringify({
                      error: error instanceof Error ? error.message : String(error),
                      validation_errors: xmlValidationErrors,
                      message: "The HTML notes contain invalid XML formatting. Please check the validation errors above."
                    })
                  }],
                };
              } else {
                // HTML is valid, something else caused the error
                return {
                  content: [{
                    type: "text",
                    text: JSON.stringify({
                      error: error instanceof Error ? error.message : String(error),
                      html_notes_validation: "The HTML notes format is valid. The error must be related to something else."
                    })
                  }],
                };
              }
            }
            throw error; // re-throw to be caught by the outer try/catch
          }
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
          const { task_id, text, html_text, ...opts } = args;

          try {
            // Validate if html_text is provided
            if (html_text) {
              const xmlValidationErrors = validateAsanaXml(html_text);
              if (xmlValidationErrors.length > 0) {
                return {
                  content: [{
                    type: "text",
                    text: JSON.stringify({
                      error: "HTML validation failed",
                      validation_errors: xmlValidationErrors,
                      message: "The HTML text contains invalid XML formatting. Please check the validation errors above."
                    })
                  }],
                };
              }
            }

            const response = await asanaClient.createTaskStory(task_id, text, opts, html_text);
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          } catch (error) {
            // When error occurs and html_text was provided, help troubleshoot
            if (html_text && error instanceof Error && error.message.includes('400')) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    error: error instanceof Error ? error.message : String(error),
                    html_text_validation: "The HTML format is valid. The error must be related to something else in the API request."
                  })
                }],
              };
            }
            throw error; // re-throw to be caught by the outer try/catch
          }
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

          try {
            // Validate html_notes if provided
            if (taskData.html_notes) {
              const xmlValidationErrors = validateAsanaXml(taskData.html_notes);
              if (xmlValidationErrors.length > 0) {
                return {
                  content: [{
                    type: "text",
                    text: JSON.stringify({
                      error: "HTML validation failed",
                      validation_errors: xmlValidationErrors,
                      message: "The HTML notes contain invalid XML formatting. Please check the validation errors above."
                    })
                  }],
                };
              }
            }

            const response = await asanaClient.createSubtask(parent_task_id, taskData, { opt_fields });
            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
            };
          } catch (error) {
            // When error occurs and html_notes was provided, help troubleshoot
            if (taskData.html_notes && error instanceof Error && error.message.includes('400')) {
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify({
                    error: error instanceof Error ? error.message : String(error),
                    html_notes_validation: "The HTML notes format is valid. The error must be related to something else."
                  })
                }],
              };
            }
            throw error; // re-throw to be caught by the outer try/catch
          }
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
          if (typeof data == "string") {
            data = JSON.parse(data);
          }
          if (typeof opts == "string") {
            opts = JSON.parse(opts);
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

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      console.error("Error executing tool:", error);

      // Default error response
      const errorResponse = {
        error: error instanceof Error ? error.message : String(error),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(errorResponse),
          },
        ],
      };
    }
  };
}
