import Asana from 'asana';

export class AsanaClientWrapper {
  private workspaces: any;
  private projects: any;
  private tasks: any;
  private stories: any;

  constructor(token: string) {
    const client = Asana.ApiClient.instance;
    client.authentications['token'].accessToken = token;

    // Initialize API instances
    this.workspaces = new Asana.WorkspacesApi();
    this.projects = new Asana.ProjectsApi();
    this.tasks = new Asana.TasksApi();
    this.stories = new Asana.StoriesApi();
  }

  async listWorkspaces(opts: any = {}) {
    const response = await this.workspaces.getWorkspaces(opts);
    return response.data;
  }

  async searchProjects(workspace: string, namePattern: string, archived: boolean = false, opts: any = {}) {
    const response = await this.projects.getProjectsForWorkspace(workspace, {
      archived,
      ...opts
    });
    const pattern = new RegExp(namePattern, 'i');
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
      ...otherOpts // Include any additional filter parameters
    };

    // Handle custom fields if provided
    if (searchOpts.custom_fields) {
      if ( typeof searchOpts.custom_fields == "string" ) {
        try {
          searchOpts.custom_fields = JSON.parse( searchOpts.custom_fields );
        } catch ( err ) {
          if (err instanceof Error) {
            err.message = "custom_fields must be a JSON object : " + err.message;
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
    if (has_attachment !== undefined) searchParams.has_attachment = has_attachment;
    if (is_blocked !== undefined) searchParams.is_blocked = is_blocked;
    if (is_blocking !== undefined) searchParams.is_blocking = is_blocking;
    if (sort_by) searchParams.sort_by = sort_by;
    if (sort_ascending !== undefined) searchParams.sort_ascending = sort_ascending;
    if (opt_fields) searchParams.opt_fields = opt_fields;

    const response = await this.tasks.searchTasksForWorkspace(workspace, searchParams);

    // Transform the response to simplify custom fields if present
    const transformedData = response.data.map((task: any) => {
      if (!task.custom_fields) return task;

      return {
        ...task,
        custom_fields: task.custom_fields.map((field: any) => {
          const baseField = {
            gid: field.gid,
            name: field.name,
            display_value: field.display_value,
            type: field.type
          };

          // Get the value based on field type (number_value, text_value, enum_value, etc)
          const rawValue = field[`${field.type}_value`];

          // For enum types, only keep gid and name
          const value = field.type === 'enum' && rawValue ?
            { gid: rawValue.gid, name: rawValue.name } :
            rawValue;

          return {
            ...baseField,
            value
          };
        })
      };
    });

    return transformedData;
  }

  async getTask(taskId: string, opts: any = {}) {
    const response = await this.tasks.getTask(taskId, opts);
    return response.data;
  }

  async createTask(projectId: string, data: any) {
    const taskData = {
      data: {
        ...data,
        projects: [projectId]
      }
    };
    const response = await this.tasks.createTask(taskData);
    return response.data;
  }

  async getStoriesForTask(taskId: string, opts: any = {}) {
    const response = await this.stories.getStoriesForTask(taskId, opts);
    return response.data;
  }

  async updateTask(taskId: string, data: any) {
    const body = { data };
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

  async getProjectTaskCounts(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const response = await this.projects.getTaskCountsForProject(projectId, options);
    return response.data;
  }

  async getProjectSections(projectId: string, opts: any = {}) {
    // Only include opts if opt_fields was actually provided
    const options = opts.opt_fields ? opts : {};
    const sections = new Asana.SectionsApi();
    const response = await sections.getSectionsForProject(projectId, options);
    return response.data;
  }

  async createTaskStory(taskId: string, text: string, opts: any = {}) {
    const options = opts.opt_fields ? opts : {};
    const body = {
      data: {
        text: text
      }
    };
    const response = await this.stories.createStoryForTask(body, taskId, options);
    return response.data;
  }

  async addTaskDependencies(taskId: string, dependencies: string[]) {
    const body = {
      data: {
        dependencies: dependencies
      }
    };
    const response = await this.tasks.addDependenciesForTask(body, taskId);
    return response.data;
  }

  async addTaskDependents(taskId: string, dependents: string[]) {
    const body = {
      data: {
        dependents: dependents
      }
    };
    const response = await this.tasks.addDependentsForTask(body, taskId);
    return response.data;
  }

  async createSubtask(parentTaskId: string, data: any, opts: any = {}) {
    const taskData = {
      data: {
        ...data
      }
    };
    const response = await this.tasks.createSubtaskForTask(taskData, parentTaskId, opts);
    return response.data;
  }

  async getMultipleTasksByGid(taskIds: string[], opts: any = {}) {
    if (taskIds.length > 25) {
      throw new Error("Maximum of 25 task IDs allowed");
    }

    // Use Promise.all to fetch tasks in parallel
    const tasks = await Promise.all(
      taskIds.map(taskId => this.getTask(taskId, opts))
    );

    return tasks;
  }
}
