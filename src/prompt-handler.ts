import { GetPromptRequest, GetPromptResult, ListPromptsResult } from "@modelcontextprotocol/sdk/types.js";
import { AsanaClientWrapper } from './asana-client-wrapper.js';

type PromptDefinition = {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
};

type PromptHandler = {
  listPrompts: any,
  getPrompt: any
};

const PROMPTS: Record<string, PromptDefinition> = {
  "task-summary": {
    name: "task-summary",
    description: "Get a summary and status update for a task based on its notes, custom fields and comments",
    arguments: [
      {
        name: "task_id",
        description: "The task ID to get summary for",
        required: true
      }
    ]
  },
  "task-completeness": {
    name: "task-completeness",
    description: "Analyze if a task description contains all necessary details for completion",
    arguments: [
      {
        name: "task_id",
        description: "The task ID or URL to analyze",
        required: true
      }
    ]
  },
  "create-task": {
    name: "create-task",
    description: "Create a new task with specified details",
    arguments: [
      {
        name: "project_name",
        description: "The name of the Asana project where the task should be created",
        required: true
      },
      {
        name: "title",
        description: "The title of the task",
        required: true
      },
      {
        name: "notes",
        description: "Notes or description for the task",
        required: false
      },
      {
        name: "due_date",
        description: "Due date for the task (YYYY-MM-DD format)",
        required: false
      }
    ]
  }
};

// List of prompts that only read Asana state
const READ_ONLY_PROMPTS = [
  'task-summary',
  'task-completeness'
];

// Filter prompts based on READ_ONLY_MODE
const isReadOnlyMode = process.env.READ_ONLY_MODE === 'true';

export function createPromptHandlers(asanaClient: AsanaClientWrapper): PromptHandler {
  return {
    listPrompts: async (): Promise<ListPromptsResult> => {
      console.error("Received ListPromptsRequest");
      const availablePrompts = isReadOnlyMode
        ? Object.values(PROMPTS).filter(prompt => READ_ONLY_PROMPTS.includes(prompt.name))
        : Object.values(PROMPTS);
      return {
        prompts: availablePrompts
      };
    },

    getPrompt: async (request: GetPromptRequest): Promise<GetPromptResult> => {
      console.error("Received GetPromptRequest:", request);

      // Block non-read prompts in read-only mode
      if (isReadOnlyMode && !READ_ONLY_PROMPTS.includes(request.params.name)) {
        throw new Error(`Prompt ${request.params.name} is not available in read-only mode`);
      }

      const prompt = PROMPTS[request.params.name];
      if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
      }

      if (request.params.name === "task-summary") {
        const taskId = request.params.arguments?.task_id;
        if (!taskId) {
          throw new Error("Task ID is required");
        }

        // Get task details with all fields
        const task = await asanaClient.getTask(taskId, {
          opt_fields: "name,notes,custom_fields,custom_fields.name,custom_fields.display_value"
        });

        // Get all comments/stories
        const stories = await asanaClient.getStoriesForTask(taskId, {
          opt_fields: "text,created_at,created_by"
        });

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Please provide a summary and status update for this task based on the following information:

Task Name: ${task.name}

Task Notes:
${task.notes || "No notes"}

Custom Fields:
${task.custom_fields?.map((field: { name: string; display_value: string }) =>
                  `${field.name}: ${field.display_value}`).join('\n') || "No custom fields"}

Comments/Updates (from newest to oldest):
${stories.map((story: { created_at: string; text: string }) =>
                    `[${new Date(story.created_at).toLocaleString()}] ${story.text}`
                  ).join('\n\n') || "No comments"}

Please include:
1. Current status and progress
2. Key updates or decisions
3. Any blockers or dependencies
4. Next steps or pending actions`
              }
            }
          ]
        };
      } else if (request.params.name === "task-completeness") {
        const taskId = request.params.arguments?.task_id;
        if (!taskId) {
          throw new Error("Task ID or Task URL is required");
        }

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `I'll provide you with the ID or URL of an Asana task.
Your job is to fetch the task details using the asana tools and conduct a
horough analysis of the task description and help transform it into a
comprehensive, actionable set of instructions.

Task Analysis Process:
1. First, retrieve and examine the complete task details using the ID (extract if from url if it's a url) provided
2. Systematically evaluate if the task contains ALL essential components:
   • Clear, specific objective with defined scope
   • Detailed deliverables with acceptance criteria
   • Technical requirements and specifications (when appropriate)
   • Design/UX guidelines or references (when appropriate)
   • Required resources, tools, and access needs
   • Dependencies on other tasks or team members (when appropriate)
   • Timeline details (deadlines, milestones, priority level)
   • Success criteria and testing/validation methods
   • Stakeholder approval process (when appropriate)
   • Communication expectations (when appropriate)

3. Identify any information gaps that would prevent the assignee from:
   • Understanding exactly what needs to be done
   • Knowing how to approach the task correctly
   • Determining when the task is successfully completed
   • Accessing necessary resources or inputs
   • Coordinating with other team members

4. Ask targeted, specific questions to fill these gaps, focusing on the most critical missing elements first

5. Once you have gathered the additional information:
   • Update the task description by integrating the new details seamlessly with the existing content
   • Organize the information logically with clear section headings
   • Highlight any critical requirements or constraints
   • Add a checklist of subtasks if appropriate
   * Do not remove anything from the original description unless officially requested.

The end result should be a task description so clear and complete that anyone with the
appropriate skills could execute it successfully without needing to ask for clarification.

Task: ${taskId}
`
              }
            }
          ]
        };
      } else if (request.params.name === "create-task") {
        const projectName = request.params.arguments?.project_name;
        const title = request.params.arguments?.title;

        if (!projectName) {
          throw new Error("Project ID is required");
        }

        if (!title) {
          throw new Error("Task title is required");
        }

        const notes = request.params.arguments?.notes || "";
        const dueDate = request.params.arguments?.due_date;

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `# Comprehensive Asana Task Creator

You are a strategic task management specialist with expertise in creating clear, actionable Asana tasks that drive successful project outcomes. Your role is to guide the user through crafting thorough task descriptions that leave no room for ambiguity, ensuring task assignees have complete clarity on expectations, requirements, and success criteria.

## Task Discovery Process

### Initial Assessment
- Identify the task type (technical implementation, creative design, research, communication, etc.)
- Understand where this task fits within the broader project/initiative
- Determine the primary stakeholders and their specific needs

### Core Information Collection
1. **Task Overview:**
   - What is the primary objective of this task?
   - How does this task contribute to broader project goals?
   - What specific problem is this task solving?
   - What is the business justification or motivation behind this task?

2. **Scope Definition:**
   - What specific deliverables are expected from this task?
   - What is explicitly included in this task's scope?
   - What is explicitly excluded from this task's scope?
   - Are there any dependencies that must be completed before this task begins?
   - Will this task create dependencies for other tasks?

3. **Technical Requirements:** (For technical tasks)
   - Which systems, platforms, or technologies will this task involve?
   - Are there specific technical constraints or requirements to consider?
   - What technical documentation or resources are available to support the task?
   - Are there security considerations, performance requirements, or compatibility issues?
   - What testing criteria should be applied to verify technical implementation?

4. **Design/UX Specifications:** (For design/UX tasks)
   - What user experience goals must be achieved?
   - Are there brand guidelines, style guides, or design systems to follow?
   - What specific user flows or interactions need to be addressed?
   - Are there accessibility requirements to consider?
   - What user feedback or research should inform this design work?

5. **Resource Requirements:**
   - What skills or expertise are needed to complete this task?
   - What tools, software, or accounts will the assignee need access to?
   - Is collaboration with specific team members or departments required?
   - Are there budget considerations or approvals needed?

6. **Timeline and Prioritization:**
   - When does this task need to be completed?
   - Are there interim milestones or check-in points?
   - How should this task be prioritized relative to other work?
   - Is this a blocking task for other team members?

7. **Success Criteria:**
   - How will you determine if this task has been completed successfully?
   - What specific metrics or outcomes will be used to measure success?
   - What review process will be used to evaluate the deliverables?
   - Who needs to approve the completed work?

8. **Communication Plan:**
   - Who should receive updates on task progress?
   - What is the preferred method and frequency of status updates?
   - Who should be consulted if questions or issues arise?
   - Are there any stakeholders who need special communication handling?

### Documentation Elements
- Reference materials, links, or attachments needed
- Screenshots or visual references
- Contact information for subject matter experts
- Examples of similar completed tasks
- Templates or starter files

## Task Creation Framework

Based on the collected information, I'll help you structure your Asana task with:

1. **Clear, action-oriented task title** that immediately communicates purpose
2. **Concise summary** of the task's objective and importance
3. **Detailed description** with all relevant specifications and requirements
4. **Task checklist** breaking down complex tasks into manageable steps
5. **Custom fields** for tracking important metrics or attributes
6. **Due date and time estimate** that accurately reflects effort required
7. **Proper task assignments** to individuals or teams
8. **Relevant tags** for easy filtering and reporting
9. **Task relationships** (dependencies, subtasks, related tasks)
10. **Attachments and references** providing necessary context and resources

Throughout our conversation, I'll ask targeted questions to ensure we capture all necessary details, helping you create a comprehensive Asana task that enables successful execution and minimizes back-and-forth clarification.

Here's some details to get started:
Project Name: ${projectName} (confirm the name is right by searching it)
Task Title: ${title}
${notes ? `Notes/Description: ${notes}` : ''}
${dueDate ? `Due Date: ${dueDate}` : ''}
`
              }
            }
          ]
        };
      }

      throw new Error("Prompt implementation not found");
    }
  };
}
