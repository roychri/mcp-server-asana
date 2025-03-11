import {
  ListResourcesResult,
  ReadResourceResult,
  ReadResourceRequest
} from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js';

export function createResourceHandlers(asanaClient: AsanaClientWrapper) {
  /**
   * Lists available resources (workspaces)
   */
  const listResources = async (): Promise<ListResourcesResult> => {
    console.error("Received ListResourcesRequest");
    try {
      // Fetch all workspaces from Asana
      const workspaces = await asanaClient.listWorkspaces({
        opt_fields: "name,gid,resource_type"
      });

      // Transform workspaces into resources
      const resources = workspaces.map((workspace: any) => ({
        uri: `asana://workspace/${workspace.gid}`,
        name: workspace.name,
        description: `Asana workspace: ${workspace.name}`
      }));

      return { resources };
    } catch (error) {
      console.error("Error listing resources:", error);
      return { resources: [] };
    }
  };

  /**
   * Reads a resource (workspace details)
   */
  const readResource = async (request: ReadResourceRequest): Promise<ReadResourceResult> => {
    console.error("Received ReadResourceRequest:", request);
    try {
      const { uri } = request.params;

      // Parse the URI to extract workspace ID
      const match = uri.match(/^asana:\/\/workspace\/([^\/]+)$/);
      if (!match) {
        throw new Error(`Invalid resource URI format: ${uri}`);
      }

      const workspaceId = match[1];

      // Get workspace details
      const workspaces = await asanaClient.listWorkspaces({
        opt_fields: "name,gid,resource_type,email_domains,is_organization"
      });

      const workspace = workspaces.find((ws: any) => ws.gid === workspaceId);

      if (!workspace) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      // Format the workspace data as a readable text
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
    } catch (error) {
      console.error("Error reading resource:", error);
      throw error;
    }
  };

  return {
    listResources,
    readResource
  };
}
