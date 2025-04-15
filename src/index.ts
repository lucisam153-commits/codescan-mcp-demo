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

const client = new CodescanClient(
  process.env.CODESCAN_TOKEN!,
  process.env.CODESCAN_URL,
  process.env.CODESCAN_ORGANIZATION
);

console.log('CODESCAN_URL:', process.env.CODESCAN_URL);
console.log('CODESCAN_TOKEN:', process.env.CODESCAN_TOKEN);
console.log('CODESCAN_ORGANIZATION:', process.env.CODESCAN_ORGANIZATION);

/**
 * Fetches and returns a list of all Codescan projects
 * @param params Parameters for listing projects, including pagination and organization
 * @returns A response containing the list of projects with their details
 * @throws Error if the CODESCAN_TOKEN environment variable is not set
 */
export async function handleCodescanProjects(params: {
  page?: number | null;
  page_size?: number | null;
}) {
  const projectsParams: ProjectsParams = {
    page: nullToUndefined(params.page),
    pageSize: nullToUndefined(params.page_size),
  };

  let result;
  try {
    result = await client.listProjects(projectsParams);
    console.log('listProjects result:', JSON.stringify(result, null, 2));
  } catch (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }

  if (!result || !Array.isArray(result.projects)) {
    throw new Error('Invalid response from listProjects: projects is not an array');
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
        }),
      },
    ],
  };
}

/**
 * Maps MCP tool parameters to Codescan client parameters
 * @param params Parameters from the MCP tool
 * @returns Parameters for the Codescan client
 */
export function mapToCodescanParams(params: Record<string, unknown>): IssuesParams {
  return {
    projectKey: params.project_key as string,
    severity: nullToUndefined(params.severity) as IssuesParams['severity'],
    page: nullToUndefined(params.page) as number | undefined,
    pageSize: nullToUndefined(params.page_size) as number | undefined,
    statuses: nullToUndefined(params.statuses) as IssuesParams['statuses'],
    resolutions: nullToUndefined(params.resolutions) as IssuesParams['resolutions'],
    resolved: nullToUndefined(params.resolved) as boolean | undefined,
    types: nullToUndefined(params.types) as IssuesParams['types'],
    rules: nullToUndefined(params.rules) as string[] | undefined,
    tags: nullToUndefined(params.tags) as string[] | undefined,
    createdAfter: nullToUndefined(params.created_after) as string | undefined,
    createdBefore: nullToUndefined(params.created_before) as string | undefined,
    createdAt: nullToUndefined(params.created_at) as string | undefined,
    createdInLast: nullToUndefined(params.created_in_last) as string | undefined,
    assignees: nullToUndefined(params.assignees) as string[] | undefined,
    authors: nullToUndefined(params.authors) as string[] | undefined,
    cwe: nullToUndefined(params.cwe) as string[] | undefined,
    languages: nullToUndefined(params.languages) as string[] | undefined,
    owaspTop10: nullToUndefined(params.owasp_top10) as string[] | undefined,
    sansTop25: nullToUndefined(params.sans_top25) as string[] | undefined,
    sonarsourceSecurity: nullToUndefined(params.sonarsource_security) as string[] | undefined,
    onComponentOnly: nullToUndefined(params.on_component_only) as boolean | undefined,
    facets: nullToUndefined(params.facets) as string[] | undefined,
    sinceLeakPeriod: nullToUndefined(params.since_leak_period) as boolean | undefined,
    inNewCodePeriod: nullToUndefined(params.in_new_code_period) as boolean | undefined,
  };
}

/**
 * Fetches and returns issues from a specified Codescan project
 * @param params Parameters for fetching issues, including project key, severity, and pagination
 * @returns A response containing the list of issues with their details
 * @throws Error if the CODESCAN_TOKEN environment variable is not set
 */
export async function handleCodescanGetIssues(params: IssuesParams) {
  let result;
  try {
    result = await client.getIssues(params);
    console.log('getIssues result:', JSON.stringify(result, null, 2));
  } catch (error) {
    throw new Error(`Failed to get issues: ${error.message}`);
  }

  if (!result || !Array.isArray(result.issues)) {
    throw new Error('Invalid response from getIssues: issues is not an array');
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          issues: result.issues.map((issue) => ({
            key: issue.key,
            rule: issue.rule,
            severity: issue.severity,
            component: issue.component,
            project: issue.project,
            line: issue.line,
            status: issue.status,
            issueStatus: issue.issueStatus,
            message: issue.message,
            messageFormattings: issue.messageFormattings,
            effort: issue.effort,
            debt: issue.debt,
            author: issue.author,
            tags: issue.tags,
            creationDate: issue.creationDate,
            updateDate: issue.updateDate,
            type: issue.type,
            cleanCodeAttribute: issue.cleanCodeAttribute,
            cleanCodeAttributeCategory: issue.cleanCodeAttributeCategory,
            prioritizedRule: issue.prioritizedRule,
            impacts: issue.impacts,
            textRange: issue.textRange,
            comments: issue.comments,
            transitions: issue.transitions,
            actions: issue.actions,
            flows: issue.flows,
            quickFixAvailable: issue.quickFixAvailable,
            ruleDescriptionContextKey: issue.ruleDescriptionContextKey,
            codeVariants: issue.codeVariants,
            hash: issue.hash,
          })),
          components: result.components,
          rules: result.rules,
          users: result.users,
          facets: result.facets,
          paging: result.paging,
        }),
      },
    ],
  };
}

/**
 * Handler for getting Codescan metrics
 * @param params Parameters for the metrics request
 * @returns Promise with the metrics result
 */
export async function handleCodescanGetMetrics(params: MetricsParams) {
  let result;
  try {
    result = await client.getMetrics(params);
    console.log('getMetrics result:', JSON.stringify(result, null, 2));
  } catch (error) {
    throw new Error(`Failed to get metrics: ${error.message}`);
  }

  if (!result || !Array.isArray(result.metrics)) {
    throw new Error('Invalid response from getMetrics: metrics is not an array');
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          metrics: result.metrics,
          paging: result.paging,
        }),
      },
    ],
  };
}

// Define Codescan severity schema for validation
const severitySchema = z
  .enum(['INFO', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER'])
  .nullable()
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
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
    page_size: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
  },
  handleCodescanProjects
);

mcpServer.tool(
  'metrics',
  'Get available metrics from Codescan',
  {
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
    page_size: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) || null : null)),
  },
  async (params) => {
    const metricsParams: MetricsParams = {
      page: nullToUndefined(params.page),
      pageSize: nullToUndefined(params.page_size),
    };
    return handleCodescanGetMetrics(metricsParams);
  }
);

mcpServer.tool(
  'issues',
  'Get issues for a Codescan project',
  {
    project_key: z.string(),
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
  async (params) => handleCodescanGetIssues(mapToCodescanParams(params))
);

// Only start the server if not in test mode
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  const transport = new StdioServerTransport();
  await (transport as unknown as Connectable).connect();
  await mcpServer.connect(transport);
}

export { nullToUndefined };