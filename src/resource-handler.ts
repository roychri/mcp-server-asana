import {
  ListResourcesResult,
  ListResourceTemplatesResult,
  ReadResourceResult,
  ReadResourceRequest
} from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js';

export function createResourceHandlers(asanaClient: AsanaClientWrapper) {
  /**
   * Lists available resources (workspaces and resource templates)
   */
  const listResources = async (): Promise<ListResourcesResult> => {
    console.error("Received ListResourcesRequest");
    try {
      // Fetch all workspaces from Asana
      const workspaces = await asanaClient.listWorkspaces({
        opt_fields: "name,gid,resource_type"
      });

      // Transform workspaces into resources
      const workspaceResources = workspaces.map((workspace: any) => ({
        uri: `asana://workspace/${workspace.gid}`,
        name: workspace.name,
        description: `Asana workspace: ${workspace.name}`
      }));

      // Add resource templates
      const resourceTemplates = [
        {
          uriTemplate: "asana://project/{project_gid}",
          name: "Asana Project Template",
          description: "Get details for a specific Asana project by GID",
          mimeType: "application/json"
        }
      ];

      return {
        resources: workspaceResources,
        resourceTemplates: resourceTemplates
      };
    } catch (error) {
      console.error("Error listing resources:", error);
      return { resources: [] };
    }
  };

  /**
   * Reads a resource (workspace details or project details)
   */
  const readResource = async (request: ReadResourceRequest): Promise<ReadResourceResult> => {
    console.error("Received ReadResourceRequest:", request);
    try {
      const { uri } = request.params;

      // Parse workspace URI
      const workspaceMatch = uri.match(/^asana:\/\/workspace\/([^\/]+)$/);
      if (workspaceMatch) {
        return await readWorkspaceResource(workspaceMatch[1], uri);
      }

      // Parse project URI
      const projectMatch = uri.match(/^asana:\/\/project\/([^\/]+)$/);
      if (projectMatch) {
        return await readProjectResource(projectMatch[1], uri);
      }

      throw new Error(`Invalid resource URI format: ${uri}`);
    } catch (error) {
      console.error("Error reading resource:", error);
      throw error;
    }
  };

  /**
   * Read workspace resource
   */
  const readWorkspaceResource = async (workspaceId: string, uri: string): Promise<ReadResourceResult> => {
    // Get workspace details
    const workspaces = await asanaClient.listWorkspaces({
      opt_fields: "name,gid,resource_type,email_domains,is_organization"
    });

    const workspace = workspaces.find((ws: any) => ws.gid === workspaceId);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    // Format the workspace data
    const workspaceData = {
      name: workspace.name,
      id: workspace.gid,
      type: workspace.resource_type,
      is_organization: workspace.is_organization,
      email_domains: workspace.email_domains,
    };

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(workspaceData, null, 2)
        }
      ]
    };
  };

  /**
   * Read project resource
   */
  const readProjectResource = async (projectId: string, uri: string): Promise<ReadResourceResult> => {
    try {
      // Get project details
      const project = await asanaClient.getProject(projectId, {
        opt_fields: "name,gid,resource_type,created_at,modified_at,archived,public,notes,color,default_view,due_date,due_on,start_on,workspace,team"
      });

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Get project sections - handle potential errors
      let sections = [];
      try {
        sections = await asanaClient.getProjectSections(projectId, {
          opt_fields: "name,gid,created_at"
        });
      } catch (sectionError) {
        console.error(`Error fetching sections for project ${projectId}:`, sectionError);
        // Continue with empty sections array
      }

      // Get custom field settings directly
      let customFields = [];
      try {
        const customFieldSettings = await asanaClient.getProjectCustomFieldSettings(projectId, {
          opt_fields: "custom_field.name,custom_field.gid,custom_field.resource_type,custom_field.type,custom_field.description,custom_field.enum_options,custom_field.enum_options.gid,custom_field.enum_options.name,custom_field.enum_options.enabled,custom_field.precision,custom_field.format"
        });

        if (customFieldSettings && Array.isArray(customFieldSettings)) {
          customFields = customFieldSettings
            .filter((setting: any) => setting && setting.custom_field)
            .map((setting: any) => {
              const field = setting.custom_field;
              let fieldData: any = {
                gid: field.gid || null,
                name: field.name || null,
                type: field.resource_type || null,
                field_type: field.type || null,
                description: field.description || null
              };

              // Add field type specific properties
              switch (field.type) {
                case 'enum':
                  if (field.enum_options && Array.isArray(field.enum_options)) {
                    fieldData.enum_options = field.enum_options
                      .filter((option: any) => option.enabled !== false)
                      .map((option: any) => ({
                        gid: option.gid || null,
                        name: option.name || null
                      }));
                  }
                  break;
                case 'multi_enum':
                  if (field.enum_options && Array.isArray(field.enum_options)) {
                    fieldData.enum_options = field.enum_options
                      .filter((option: any) => option.enabled !== false)
                      .map((option: any) => ({
                        gid: option.gid || null,
                        name: option.name || null
                      }));
                  }
                  break;
                case 'number':
                  fieldData.precision = field.precision || 0;
                  break;
                case 'text':
                case 'date':
                  // No special handling needed
                  break;
                case 'people':
                  // No special handling needed
                  break;
              }

              return fieldData;
            });
        }
      } catch (customFieldError) {
        console.error(`Error fetching custom fields for project ${projectId}:`, customFieldError);
        // Continue with empty customFields array
      }

      // Format project data with sections and custom fields
      const projectData = {
        name: project.name || null,
        id: project.gid || null,
        type: project.resource_type || null,
        created_at: project.created_at || null,
        modified_at: project.modified_at || null,
        archived: project.archived || false,
        public: project.public || false,
        notes: project.notes || null,
        color: project.color || null,
        default_view: project.default_view || null,
        due_date: project.due_date || null,
        due_on: project.due_on || null,
        start_on: project.start_on || null,
        workspace: project.workspace ? {
          gid: project.workspace.gid || null,
          name: project.workspace.name || null
        } : null,
        team: project.team ? {
          gid: project.team.gid || null,
          name: project.team.name || null
        } : null,
        sections: sections ? sections.map((section: any) => ({
          gid: section.gid || null,
          name: section.name || null,
          created_at: section.created_at || null
        })) : [],
        custom_fields: customFields || []
      };

      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(projectData, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Error reading project ${projectId}:`, error);
      throw new Error(`Failed to read project: ${error.message}`);
    }
  };

  /**
   * Lists available resource templates (project template)
   */
  const listResourceTemplates = async (): Promise<ListResourceTemplatesResult> => {
    console.error("Received ListResourceTemplatesRequest");
    try {
      // Define resource templates
      const resourceTemplates = [
        {
          uriTemplate: "asana://project/{project_gid}",
          name: "Asana Project Template",
          description: "Get details for a specific Asana project by GID",
          mimeType: "application/json"
        }
      ];

      return { resourceTemplates };
    } catch (error) {
      console.error("Error listing resource templates:", error);
      return { resourceTemplates: [] };
    }
  };

  return {
    listResources,
    listResourceTemplates,
    readResource
  };
}
