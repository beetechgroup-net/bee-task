import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { BeeTaskService } from '../../scripts/beeTaskService';

const server = new Server(
  {
    name: 'bee-task-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Environment variables or settings
const SERVICE_ACCOUNT_PATH = process.env.BEE_TASK_SERVICE_ACCOUNT_PATH;
const USER_ID = process.env.BEE_TASK_USER_ID;

if (!SERVICE_ACCOUNT_PATH || !USER_ID) {
  console.error('Missing environment variables: BEE_TASK_SERVICE_ACCOUNT_PATH and BEE_TASK_USER_ID must be set.');
  process.exit(1);
}

const beeService = new BeeTaskService(SERVICE_ACCOUNT_PATH, USER_ID);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_tasks',
        description: 'Get all pending tasks from Bee Task',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task in Bee Task',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            projectId: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
          required: ['title'],
        },
      },
      {
        name: 'toggle_task',
        description: 'Start or pause a task by ID. If no ID is provided, it attempts to pause the current active task or start the most recent one (not implemented yet, ID is currently required).',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
          },
          required: ['taskId'],
        },
      },
      {
        name: 'finish_task',
        description: 'Mark a task as completed',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
          },
          required: ['taskId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_tasks': {
        const tasks = await beeService.getTasks();
        return {
          content: [{ type: 'text', text: JSON.stringify(tasks.filter((t: any) => t.status !== 'done'), null, 2) }],
        };
      }

      case 'create_task': {
        const { title, description, projectId, priority } = z.object({
          title: z.string(),
          description: z.string().optional(),
          projectId: z.string().optional(),
          priority: z.enum(['low', 'medium', 'high']).optional(),
        }).parse(args);

        const task = await beeService.addTask(title, description, projectId, "Development", priority as any);
        return {
          content: [{ type: 'text', text: `Task created: ${task.title} (ID: ${task.id})` }],
        };
      }

      case 'toggle_task': {
        const { taskId } = z.object({
          taskId: z.string(),
        }).parse(args);

        const task = await beeService.toggleTask(taskId);
        if (!task) throw new Error('Task not found');
        const isActive = task.logs.some(l => !l.endTime);
        return {
          content: [{ type: 'text', text: `Task ${task.title} is now ${isActive ? 'in-progress' : 'paused'}.` }],
        };
      }

      case 'finish_task': {
        const { taskId } = z.object({
          taskId: z.string(),
        }).parse(args);

        const task = await beeService.finishTask(taskId);
        if (!task) throw new Error('Task not found');
        return {
          content: [{ type: 'text', text: `Task ${task.title} marked as done.` }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: 'text', text: error.message }],
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Bee Task MCP server running on stdio');
}

runServer().catch(console.error);
