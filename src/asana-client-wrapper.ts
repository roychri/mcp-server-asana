import Asana from "asana";

export class AsanaClientWrapper {
  private workspaces: any;
  private projects: any;
  private tasks: any;
  private stories: any;
  private projectStatuses: any;
  private tags: any;
  private customFieldSettings: any;

  constructor(token: string) {
    const client = Asana.ApiClient.instance;
    client.authentications["token"].accessToken = token;

    // Initialize API instances
    this.workspaces = new Asana.WorkspacesApi();
    this.projects = new Asana.ProjectsApi();
    this.tasks = new Asana.TasksApi();
    this.stories = new Asana.StoriesApi();
    this.projectStatuses = new Asana.ProjectStatusesApi();
    this.tags = new Asana.TagsApi();
    this.customFieldSettings = new Asana.CustomFieldSettingsApi();
  }

  async listWorkspaces(opts: any = {}) {
    const response = await this.workspaces.getWorkspaces(opts);
    return response.data;
  }

  async searchProjects(
    workspace: string,
    namePattern: string,
    archived: boolean = false,
    opts: any = {}
  ) {
    const response = await this.projects.getProjectsForWorkspace(workspace, {
      archived,
      ...opts,
    });
    const pattern = new RegExp(namePattern, "i");
    return response.data.filter((project: any) => pattern.test(project.name));
  }

  async searchTasks(workspace: string, searchOpts: any = {}) {
    // Extract known parameters
    const {
      text,
      resource_subtype,
      completed,
      is_subtask,
      has_attachment,
      is_blocked,
      is_blocking,
      sort_by,
      sort_ascending,
      opt_fields,
      ...otherOpts
    } = searchOpts;

    // Build search parameters
    const searchParams: any = {
      ...otherOpts, // Include any additional filter parameters
    };

    // FIX: Manually translate parameter names from underscore to dot notation
    const keyMappings: { [key: string]: string } = {
      portfolios_any: "portfolios.any",
      assignee_any: "assignee.any",
      assignee_not: "assignee.not",
      projects_any: "projects.any",
      projects_not: "projects.not",
      projects_all: "projects.all",
      sections_any: "sections.any",
      sections_not: "sections.not",
      sections_all: "sections.all",
      tags_any: "tags.any",
      tags_not: "tags.not",
      tags_all: "tags.all",
      teams_any: "teams.any",
      followers_any: "followers.any",
      followers_not: "followers.not",
      created_by_any: "created_by.any",
      created_by_not: "created_by.not",
      assigned_by_any: "assigned_by.any",
      assigned_by_not: "assigned_by.not",
      liked_by_not: "liked_by.not",
      commented_on_by_not: "commented_on_by.not",
      due_on_before: "due_on.before",
      due_on_after: "due_on.after",
      due_at_before: "due_at.before",
      due_at_after: "due_at.after",
      start_on_before: "start_on.before",
      start_on_after: "start_on.after",
      created_on_before: "created_on.before",
      created_on_after: "created_on.after",
      created_at_before: "created_at.before",
      created_at_after: "created_at.after",
      completed_on_before: "completed_on.before",
      completed_on_after: "completed_on.after",
      completed_at_before: "completed_at.before",
      completed_at_after: "completed_at.after",
      modified_on_before: "modified_on.before",
      modified_on_after: "modified_on.after",
      modified_at_before: "modified_at.before",
      modified_at_after: "modified_at.after",
    };

    for (const [oldKey, newKey] of Object.entries(keyMappings)) {
      if (searchParams[oldKey] !== undefined) {
        searchParams[newKey] = searchParams[oldKey];
        delete searchParams[oldKey];
      }
    }

    // Handle custom fields if provided
    if (searchOpts.custom_fields) {
      if (typeof searchOpts.custom_fields == "string") {
        try {
          searchOpts.custom_fields = JSON.parse(searchOpts.custom_fields);
        } catch (err) {
          if (err instanceof Error) {
            err.message =
              "custom_fields must be a JSON object : " + err.message;
          }
          throw err;
        }
      }
      Object.entries(searchOpts.custom_fields).forEach(([key, value]) => {
        searchParams[`custom_fields.${key}`] = value;
      });
      delete searchParams.custom_fields; // Remove the custom_fields object since we've processed it
    }

    // Add optional parameters if provided
    if (text) searchParams.text = text;
    if (resource_subtype) searchParams.resource_subtype = resource_subtype;
    if (completed !== undefined) searchParams.completed = completed;
    if (is_subtask !== undefined) searchParams.is_subtask = is_subtask;
    if (has_attachment !== undefined)
      searchParams.has_attachment = has_attachment;
    if (is_blocked !== undefined) searchParams.is_blocked = is_blocked;
    if (is_blocking !== undefined) searchParams.is_blocking = is_blocking;
    if (sort_by) searchParams.sort_by = sort_by;
    if (sort_ascending !== undefined)
      searchParams.sort_ascending = sort_ascending;
    if (opt_fields) searchParams.opt_fields = opt_fields;

    const response = await this.tasks.searchTasksForWorkspace(
      workspace,
      searchParams
    );

    // Transform the response to simplify custom fields if present
    const transformedData = response.data.map((task: any) => {
      if (!task.custom_fields) return task;

      return {
        ...task,
        custom_fields: task.custom_fields.reduce((acc: any, field: any) => {
          const key = `${field.name} (${field.gid})`;
          let value = field.display_value;

          // For enum fields with a value, include the enum option GID
          if (field.type === "enum" && field.enum_value) {
            value = `${field.display_value} (${field.enum_value.gid})`;
          }

          acc[key] = value;
          return acc;
        }, {}),
      };
    });

    return transformedData;
  }

  async getTask(taskId: string, opts: any = {}) {
    const response = await this.tasks.getTask(taskId, opts);
    return response.data;
  }

  async createTask(projectId: string, data: any) {
    // Ensure projects array includes the projectId
    const projects = data.projects || [];
    if (!projects.includes(projectId)) {
      projects.push(projectId);
    }

    const taskData = {
      data: {
        ...data,
        projects,
        // Handle resource_subtype if provided
        resource_subtype: data.resource_subtype || "default_task",
        // Handle custom_fields if provided
        custom_fields: data.custom_fields || {},
      },
    };
    const response = await this.tasks.createTask(taskData);
    return response.data;
  }

  async getStoriesForTask(taskId: string, opts: any = {}) {
    const response = await this.stories.getStoriesForTask(taskId, opts);
    return response.data;
  }

  async updateTask(taskId: string, data: any) {
    const body = {
      data: {
        ...data,
        // Handle resource_subtype if provided
        resource_subtype: data.resource_subtype || undefined,
        // Handle custom_fields if provided
        custom_fields: data.custom_fields || undefined,
      },
    };
    const opts = {};
    const response = await this.tasks.updateTask(body, taskId, opts);
    return response.data;
  }

  async getProject(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const response = await this.projects.getProject(projectId, options);
    return response.data;
  }

  async getProjectCustomFieldSettings(projectId: string, opts: any = {}) {
    try {
      const options = {
        limit: 100,
        opt_fields:
          opts.opt_fields ||
          "custom_field,custom_field.name,custom_field.gid,custom_field.resource_type,custom_field.type,custom_field.description,custom_field.enum_options,custom_field.enum_options.name,custom_field.enum_options.gid,custom_field.enum_options.enabled",
      };

      const response =
        await this.customFieldSettings.getCustomFieldSettingsForProject(
          projectId,
          options
        );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching custom field settings for project ${projectId}:`,
        error
      );
      return [];
    }
  }

  async getProjectTaskCounts(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const response = await this.projects.getTaskCountsForProject(
      projectId,
      options
    );
    return response.data;
  }

  async getProjectSections(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const sections = new Asana.SectionsApi();
    const response = await sections.getSectionsForProject(projectId, options);
    return response.data;
  }

  async createTaskStory(
    taskId: string,
    text: string | null = null,
    opts: any = {},
    html_text: string | null = null
  ) {
    const options = opts.opt_fields ? opts : {};
    const data: any = {};

    if (text) {
      data.text = text;
    } else if (html_text) {
      data.html_text = html_text;
    } else {
      throw new Error("Either text or html_text must be provided");
    }

    const body = { data };
    const response = await this.stories.createStoryForTask(
      body,
      taskId,
      options
    );
    return response.data;
  }

  async addTaskDependencies(taskId: string, dependencies: string[]) {
    const body = {
      data: {
        dependencies: dependencies,
      },
    };
    const response = await this.tasks.addDependenciesForTask(body, taskId);
    return response.data;
  }

  async addTaskDependents(taskId: string, dependents: string[]) {
    const body = {
      data: {
        dependents: dependents,
      },
    };
    const response = await this.tasks.addDependentsForTask(body, taskId);
    return response.data;
  }

  async createSubtask(parentTaskId: string, data: any, opts: any = {}) {
    const taskData = {
      data: {
        ...data,
      },
    };
    const response = await this.tasks.createSubtaskForTask(
      taskData,
      parentTaskId,
      opts
    );
    return response.data;
  }

  async setParentForTask(data: any, taskId: string, opts: any = {}) {
    const response = await this.tasks.setParentForTask({ data }, taskId, opts);
    return response.data;
  }

  async getProjectStatus(statusId: string, opts: any = {}) {
    const response = await this.projectStatuses.getProjectStatus(
      statusId,
      opts
    );
    return response.data;
  }

  async getProjectStatusesForProject(projectId: string, opts: any = {}) {
    const response = await this.projectStatuses.getProjectStatusesForProject(
      projectId,
      opts
    );
    return response.data;
  }

  async createProjectStatus(projectId: string, data: any) {
    const body = { data };
    const response = await this.projectStatuses.createProjectStatusForProject(
      body,
      projectId
    );
    return response.data;
  }

  async deleteProjectStatus(statusId: string) {
    const response = await this.projectStatuses.deleteProjectStatus(statusId);
    return response.data;
  }

  async getMultipleTasksByGid(taskIds: string[], opts: any = {}) {
    if (taskIds.length > 25) {
      throw new Error("Maximum of 25 task IDs allowed");
    }

    // Use Promise.all to fetch tasks in parallel
    const tasks = await Promise.all(
      taskIds.map((taskId) => this.getTask(taskId, opts))
    );

    return tasks;
  }

  async getTasksForTag(tag_gid: string, opts: any = {}) {
    const response = await this.tasks.getTasksForTag(tag_gid, opts);
    return response.data;
  }

  async getTagsForWorkspace(workspace_gid: string, opts: any = {}) {
    const response = await this.tags.getTagsForWorkspace(workspace_gid, opts);
    return response.data;
  }
}
