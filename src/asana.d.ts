// Type definitions for Asana API v3
declare module 'asana' {
  export class ApiClient {
    static instance: ApiClient;

    basePath: string;
    RETURN_COLLECTION: boolean;
    authentications: {
      token: {
        type: 'personalAccessToken';
        accessToken?: string;
      };
    };
    defaultHeaders: Record<string, string>;
    timeout: number;
    cache: boolean;
    enableCookies: boolean;
    agent?: any;
    requestAgent: any | null;

    constructor();
    callApi(
      path: string,
      httpMethod: string,
      pathParams: object,
      queryParams: object,
      headerParams: object,
      formParams: object,
      bodyParam: any,
      authNames: string[],
      contentTypes: string[],
      accepts: string[],
      returnType: any
    ): Promise<any>;
  }

  interface TaskBase {
    gid: string;
    name: string;
    completed: boolean;
    completed_at?: string;
    created_at: string;
    due_on?: string;
    due_at?: string;
    modified_at: string;
    notes: string;
    resource_type: string;
    workspace: { gid: string };
    assignee?: { gid: string };
    custom_fields?: Array<{
      gid: string;
      name: string;
      type: string;
      enum_options?: Array<{ gid: string; name: string }>;
      number_value?: number;
      text_value?: string;
      enum_value?: { gid: string; name: string };
    }>;
    followers?: Array<{ gid: string }>;
    parent?: { gid: string };
    projects?: Array<{ gid: string }>;
    tags?: Array<{ gid: string }>;
  }

  export class TasksApi {
    constructor(apiClient?: ApiClient);

    createTask(body: any, opts?: any): Promise<{ data: TaskBase }>;
    createSubtaskForTask(body: any, taskGid: string, opts?: any): Promise<{ data: TaskBase }>;
    deleteTask(taskGid: string): Promise<{ data: {} }>;
    getTask(taskGid: string, opts?: any): Promise<{ data: TaskBase }>;
    getTasks(opts?: {
      assignee?: string;
      project?: string;
      section?: string;
      workspace?: string;
      completed_since?: string;
      modified_since?: string;
      opt_fields?: string[];
    }): Promise<{ data: TaskBase[] }>;
    getTasksForProject(projectGid: string, opts?: any): Promise<{ data: TaskBase[] }>;
    updateTask(body: any, taskGid: string, opts?: any): Promise<{ data: TaskBase }>;
    addDependenciesForTask(body: any, taskGid: string): Promise<{ data: {} }>;
    removeDependenciesForTask(body: any, taskGid: string): Promise<{ data: {} }>;
  }

  export class ProjectsApi {
    constructor(apiClient?: ApiClient);

    createProject(body: any, opts?: any): Promise<{ data: ProjectBase }>;
    getProject(projectGid: string, opts?: any): Promise<{ data: ProjectBase }>;
    deleteProject(projectGid: string): Promise<{ data: {} }>;
    getProjects(opts?: {
      workspace?: string;
      team?: string;
      archived?: boolean;
      opt_fields?: string[];
    }): Promise<{ data: ProjectBase[] }>;
  }

  export class WorkspacesApi {
    constructor(apiClient?: ApiClient);

    getWorkspace(workspaceGid: string, opts?: any): Promise<{ data: WorkspaceBase }>;
    getWorkspaces(opts?: any): Promise<{ data: WorkspaceBase[] }>;
    updateWorkspace(body: any, workspaceGid: string, opts?: any): Promise<{ data: WorkspaceBase }>;
  }

  // Base types for responses
  interface ProjectBase {
    gid: string;
    name: string;
    archived: boolean;
    color?: string;
    created_at: string;
    current_status?: {
      color: string;
      text: string;
      author: { gid: string };
    };
    modified_at: string;
    notes: string;
    public: boolean;
    workspace: { gid: string };
    team?: { gid: string };
  }

  interface WorkspaceBase {
    gid: string;
    name: string;
    email_domains?: string[];
    is_organization: boolean;
  }

  // Export all available APIs
  export {
    AllocationsApi,
    AttachmentsApi,
    AuditLogAPIApi,
    BatchAPIApi,
    CustomFieldSettingsApi,
    CustomFieldsApi,
    EventsApi,
    GoalRelationshipsApi,
    GoalsApi,
    JobsApi,
    MembershipsApi,
    OrganizationExportsApi,
    PortfolioMembershipsApi,
    PortfoliosApi,
    ProjectBriefsApi,
    ProjectMembershipsApi,
    ProjectStatusesApi,
    ProjectTemplatesApi,
    RulesApi,
    SectionsApi,
    StatusUpdatesApi,
    StoriesApi,
    TagsApi,
    TaskTemplatesApi,
    TeamMembershipsApi,
    TeamsApi,
    TimePeriodsApi,
    TimeTrackingEntriesApi,
    TypeaheadApi,
    UserTaskListsApi,
    UsersApi,
    WebhooksApi,
    WorkspaceMembershipsApi
  } from './api/index';
}
