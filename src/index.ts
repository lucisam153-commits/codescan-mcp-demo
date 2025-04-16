#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CodescanClient,
  IssuesParams,
  ProjectsParams,
  CodescanProject,
  MetricsParams,
} from './codescan.js';
import { z } from 'zod';

interface Connectable {
  connect: () => Promise<void>;
}
if (!(StdioServerTransport.prototype as unknown as Connectable).connect) {
  (StdioServerTransport.prototype as unknown as Connectable).connect = async function () {
    // Dummy connect method for compatibility with MCP server
    return Promise.resolve();
  };
}

/**
 * Helper function to convert null to undefined
 * @param value Any value that might be null
 * @returns The original value or undefined if null
 */
function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}

// Initialize MCP server
export const mcpServer = new McpServer({
  name: 'codescan-mcp-server',
  version: '1.1.0',
});

// Log configuration
console.log('MCP Server Configuration:');
console.log('CODESCAN_URL:', process.env.CODESCAN_URL || 'https://app.codescan.io (default)');
console.log('CODESCAN_ORGANIZATION:', process.env.CODESCAN_ORGANIZATION || 'not set');
console.log('CODESCAN_COMPONENT:', process.env.CODESCAN_COMPONENT || 'not set');
console.log('CODESCAN_PROJECT:', process.env.CODESCAN_PROJECT || 'not set');

/**
 * Creates a new Codescan client with the provided token
 * @param token The Codescan API token
 * @returns A new CodescanClient instance
 */
function createClient(token: string): CodescanClient {
  return new CodescanClient(
    token,
    process.env.CODESCAN_URL || 'https://app.codescan.io',
    process.env.CODESCAN_ORGANIZATION || null,
    process.env.CODESCAN_COMPONENT || null,
    process.env.CODESCAN_PROJECT || null
  );
}

/**
 * Fetches and returns a list of all Codescan projects
 * @param params Parameters for listing projects, including pagination and organization
 * @returns A response containing the list of projects with their details
 */
export async function handleCodescanProjects(params: ProjectsParams & { token?: string }) {
  // Use environment token if token parameter is not provided
  const token = params.token || process.env.CODESCAN_TOKEN;
  
  if (!token) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Token is required either as a parameter or as CODESCAN_TOKEN environment variable',
            projects: [],
            paging: {
              pageIndex: params.page || 1,
              pageSize: params.pageSize || 0,
              total: 0
            }
          })
        }
      ]
    };
  }

  const client = createClient(token);
  let result;
  try {
    result = await client.listProjects(params);
    console.log('listProjects result:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: `Failed to list projects: ${error?.message || 'Unknown error'}`,
            projects: [],
            paging: {
              pageIndex: params.page || 1,
              pageSize: params.pageSize || 0,
              total: 0
            }
          })
        }
      ]
    };
  }

  if (!result || !Array.isArray(result.projects)) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Invalid response from listProjects: projects is not an array',
            projects: [],
            paging: {
              pageIndex: params.page || 1,
              pageSize: params.pageSize || 0,
              total: 0
            }
          })
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          projects: result.projects.map((project: CodescanProject) => ({
            key: project.key,
            name: project.name,
            qualifier: project.qualifier,
            visibility: project.visibility,
            lastAnalysisDate: project.lastAnalysisDate,
            revision: project.revision,
            managed: project.managed,
          })),
          paging: result.paging,
        })
      }
    ]
  };
}

/**
 * Maps MCP tool parameters to Codescan client parameters
 * @param params Parameters from the MCP tool
 * @returns Parameters for the Codescan client
 */
function mapToCodescanParams(params: any): IssuesParams & { token: string } {
  return {
    token: params.token || process.env.CODESCAN_TOKEN || '',
    component: params.component,
    severity: params.severity,
    page: nullToUndefined(params.page),
    pageSize: nullToUndefined(params.page_size),
    statuses: params.statuses,
    resolutions: params.resolutions,
    resolved: params.resolved,
    types: params.types,
    rules: params.rules,
    tags: params.tags,
    createdAfter: params.created_after,
    createdBefore: params.created_before,
    createdAt: params.created_at,
    createdInLast: params.created_in_last,
    assignees: params.assignees,
    authors: params.authors,
    cwe: params.cwe,
    languages: params.languages,
    owaspTop10: params.owasp_top10,
    sansTop25: params.sans_top25,
    sonarsourceSecurity: params.sonarsource_security,
    onComponentOnly: params.on_component_only,
    facets: params.facets,
    sinceLeakPeriod: params.since_leak_period,
    inNewCodePeriod: params.in_new_code_period,
  };
}

interface CodescanIssue {
  key: string;
  rule: string;
  severity: string;
  component: string;
  project: string;
  line?: number;
  status: string;
  message: string;
  effort?: string;
  debt?: string;
  author?: string;
  tags?: string[];
  creationDate: string;
  updateDate: string;
  type: string;
}

/**
 * Fetches and returns issues from a specified Codescan project
 * @param params Parameters for fetching issues, including project key, severity, and pagination
 * @returns A response containing the list of issues with their details
 */
export async function handleCodescanGetIssues(params: IssuesParams & { token?: string }): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Use environment token if token parameter is not provided
  const token = params.token || process.env.CODESCAN_TOKEN;
  
  if (!token) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Token is required either as a parameter or as CODESCAN_TOKEN environment variable',
            issues: [],
            components: [],
            rules: [],
            users: [],
            facets: [],
            paging: {
              pageIndex: 1,
              pageSize: 0,
              total: 0
            }
          })
        }
      ]
    };
  }
  
  const client = new CodescanClient(token);
  const result = await client.getIssues(params);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result)
      }
    ]
  };
}

/**
 * Handler for getting Codescan metrics
 * @param params Parameters for the metrics request
 * @returns Promise with the metrics result
 */
export async function handleCodescanGetMetrics(params: MetricsParams & { token?: string }) {
  // Use environment token if token parameter is not provided
  const token = params.token || process.env.CODESCAN_TOKEN;
  
  if (!token) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Token is required either as a parameter or as CODESCAN_TOKEN environment variable',
            metrics: [],
            paging: {
              pageIndex: params.page || 1,
              pageSize: params.pageSize || 0,
              total: 0
            }
          })
        }
      ]
    };
  }

  const client = createClient(token);
  let result;
  try {
    result = await client.getMetrics(params);
    console.log('getMetrics result:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: `Failed to get metrics: ${error?.message || 'Unknown error'}`,
            metrics: [],
            paging: {
              pageIndex: params.page || 1,
              pageSize: params.pageSize || 0,
              total: 0
            }
          })
        }
      ]
    };
  }

  if (!result || !Array.isArray(result.metrics)) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: 'Invalid response from getMetrics: metrics is not an array',
            metrics: [],
            paging: {
              pageIndex: params.page || 1,
              pageSize: params.pageSize || 0,
              total: 0
            }
          })
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          metrics: result.metrics,
          paging: result.paging,
        })
      }
    ]
  };
}

// Define Codescan severity schema for validation
const severitySchema = z
  .enum(['INFO', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER'])
  .optional();
const statusSchema = z
  .array(
    z.enum([
      'OPEN',
      'CONFIRMED',
      'REOPENED',
      'RESOLVED',
      'CLOSED',
      'TO_REVIEW',
      'IN_REVIEW',
      'REVIEWED',
    ])
  )
  .nullable()
  .optional();
const resolutionSchema = z
  .array(z.enum(['FALSE-POSITIVE', 'WONTFIX', 'FIXED', 'REMOVED']))
  .nullable()
  .optional();
const typeSchema = z
  .array(z.enum(['CODE_SMELL', 'BUG', 'VULNERABILITY', 'SECURITY_HOTSPOT']))
  .nullable()
  .optional();

// Register Codescan tools
mcpServer.tool(
  'projects',
  'List all Codescan projects',
  {
    token: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
    page_size: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
    projects: z.string().optional(),
  },
  async (params) => {
    const projectsParams: ProjectsParams & { token?: string } = {
      token: params.token,
      page: nullToUndefined(params.page),
      pageSize: nullToUndefined(params.page_size),
      projects: params.projects,
    };
    return handleCodescanProjects(projectsParams);
  }
);

mcpServer.tool(
  'metrics',
  'Get available metrics from Codescan',
  {
    token: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
    page_size: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
    component: z.string().optional(),
  },
  async (params) => {
    const metricsParams: MetricsParams & { token?: string } = {
      token: params.token,
      page: nullToUndefined(params.page),
      pageSize: nullToUndefined(params.page_size),
      component: params.component,
    };
    return handleCodescanGetMetrics(metricsParams);
  }
);

mcpServer.tool(
  'issues',
  'Get issues for a Codescan project',
  {
    token: z.string().optional(),
    component: z.string(),
    severity: severitySchema,
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
    page_size: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
    statuses: statusSchema,
    resolutions: resolutionSchema,
    resolved: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    types: typeSchema,
    rules: z.array(z.string()).nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    created_after: z.string().nullable().optional(),
    created_before: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    created_in_last: z.string().nullable().optional(),
    assignees: z.array(z.string()).nullable().optional(),
    authors: z.array(z.string()).nullable().optional(),
    cwe: z.array(z.string()).nullable().optional(),
    languages: z.array(z.string()).nullable().optional(),
    owasp_top10: z.array(z.string()).nullable().optional(),
    sans_top25: z.array(z.string()).nullable().optional(),
    sonarsource_security: z.array(z.string()).nullable().optional(),
    on_component_only: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    facets: z.array(z.string()).nullable().optional(),
    since_leak_period: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    in_new_code_period: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  },
  async (params) => {
    const issuesParams = {
      ...mapToCodescanParams(params),
      token: params.token || process.env.CODESCAN_TOKEN,
    };
    return handleCodescanGetIssues(issuesParams);
  }
);

// Only start the server if not in test mode
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  const transport = new StdioServerTransport();
  await (transport as unknown as Connectable).connect();
  await mcpServer.connect(transport);
}

export { nullToUndefined };