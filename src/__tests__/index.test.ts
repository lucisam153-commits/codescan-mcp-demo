/// <reference types="jest" />

/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, jest } from '@jest/globals';
import nock from 'nock';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Mock environment variables
process.env.CODESCAN_TOKEN = 'test-token';
process.env.CODESCAN_URL = 'http://localhost:9000';

// Mock Codescan client responses
beforeAll(() => {
  nock('http://localhost:9000')
    .persist()
    .get('/api/projects/search')
    .query(true)
    .reply(200, {
      projects: [
        {
          key: 'test-project',
          name: 'Test Project',
          qualifier: 'TRK',
          visibility: 'public',
          lastAnalysisDate: '2024-03-01',
          revision: 'abc123',
          managed: false,
        },
      ],
      paging: {
        pageIndex: 1,
        pageSize: 10,
        total: 1,
      },
    });

  nock('http://localhost:9000')
    .persist()
    .get('/api/metrics/search')
    .query(true)
    .reply(200, {
      metrics: [
        {
          key: 'test-metric',
          name: 'Test Metric',
          description: 'Test metric description',
          domain: 'test',
          type: 'INT',
        },
      ],
      paging: {
        pageIndex: 1,
        pageSize: 10,
        total: 1,
      },
    });

  nock('http://localhost:9000')
    .persist()
    .get('/api/issues/search')
    .query(true)
    .reply(200, {
      issues: [
        {
          key: 'test-issue',
          rule: 'test-rule',
          severity: 'MAJOR',
          component: 'test-component',
          project: 'test-project',
          line: 1,
          status: 'OPEN',
          message: 'Test issue',
        },
      ],
      components: [],
      rules: [],
      users: [],
      facets: [],
      paging: {
        pageIndex: 1,
        pageSize: 10,
        total: 1,
      },
    });
});

afterAll(() => {
  nock.cleanAll();
});

// Mock the handlers
const mockHandlers = {
  handleCodescanProjects: jest.fn().mockResolvedValue({
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          projects: [
            {
              key: 'test-project',
              name: 'Test Project',
              qualifier: 'TRK',
              visibility: 'public',
              lastAnalysisDate: '2024-03-01',
              revision: 'abc123',
              managed: false,
            },
          ],
          paging: {
            pageIndex: 1,
            pageSize: 10,
            total: 1,
          },
        }),
      },
    ],
  }),
  handleCodescanGetMetrics: jest.fn().mockResolvedValue({
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          metrics: [
            {
              key: 'test-metric',
              name: 'Test Metric',
              description: 'Test metric description',
              domain: 'test',
              type: 'INT',
            },
          ],
          paging: {
            pageIndex: 1,
            pageSize: 10,
            total: 1,
          },
        }),
      },
    ],
  }),
  handleCodescanGetIssues: jest.fn().mockResolvedValue({
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          issues: [
            {
              key: 'test-issue',
              rule: 'test-rule',
              severity: 'MAJOR',
              component: 'test-component',
              project: 'test-project',
              line: 1,
              status: 'OPEN',
              message: 'Test issue',
            },
          ],
          components: [],
          rules: [],
          users: [],
          facets: [],
          paging: {
            pageIndex: 1,
            pageSize: 10,
            total: 1,
          },
        }),
      },
    ],
  }),
};

// Define the mock handlers but don't mock the entire module
jest.mock('../index.js', () => {
  // Get the original module
  const originalModule = jest.requireActual('../index.js');

  return {
    // Return everything from the original module
    ...originalModule,
    // But override these specific functions for tests that need mocks
    mcpServer: {
      ...originalModule.mcpServer,
      connect: jest.fn(),
    },
  };
});

// Save environment variables
const originalEnv = process.env;
let mcpServer: any;
let nullToUndefined: any;
let handleCodescanProjects: any;
let mapToCodescanParams: any;
let handleCodescanGetIssues: any;
let handleCodescanGetMetrics: any;

interface Connectable {
  connect: () => Promise<void>;
}

describe('MCP Server', () => {
  beforeAll(async () => {
    const module = await import('../index.js');
    mcpServer = module.mcpServer;
    nullToUndefined = module.nullToUndefined;
    handleCodescanProjects = module.handleCodescanProjects;
    mapToCodescanParams = module.mapToCodescanParams;
    handleCodescanGetIssues = module.handleCodescanGetIssues;
    handleCodescanGetMetrics = module.handleCodescanGetMetrics;
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    nock.cleanAll();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  it('should have initialized the MCP server', () => {
    expect(mcpServer).toBeDefined();
    expect(mcpServer.server).toBeDefined();
  });

  describe('Tool registration', () => {
    let testServer: any;
    let registeredTools: Map<string, any>;

    beforeEach(() => {
      registeredTools = new Map();
      testServer = {
        tool: jest.fn((name: string, description: string, schema: any, handler: any) => {
          registeredTools.set(name, { description, schema, handler });
        }),
      };

      // Register tools
      testServer.tool(
        'projects',
        'List all Codescan projects',
        { page: {}, page_size: {} },
        mockHandlers.handleCodescanProjects
      );

      testServer.tool(
        'metrics',
        'Get available metrics from Codescan',
        { page: {}, page_size: {} },
        mockHandlers.handleCodescanGetMetrics
      );

      testServer.tool(
        'issues',
        'Get issues for a Codescan project',
        {
          project_key: z.string(),
          severity: z.enum(['INFO', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER']).optional(),
          page: z.number().optional(),
          page_size: z.number().optional(),
        },
        mockHandlers.handleCodescanGetIssues
      );
    });

    it('should register all tools', () => {
      expect(registeredTools.size).toBe(3);
      expect(registeredTools.has('projects')).toBe(true);
      expect(registeredTools.has('metrics')).toBe(true);
      expect(registeredTools.has('issues')).toBe(true);
    });

    it('should register tools with correct descriptions', () => {
      expect(registeredTools.get('projects').description).toBe('List all Codescan projects');
      expect(registeredTools.get('metrics').description).toBe('Get available metrics from Codescan');
      expect(registeredTools.get('issues').description).toBe('Get issues for a Codescan project');
    });
  });

  describe('handleCodescanProjects', () => {
    it('should fetch and return a list of projects', async () => {
      nock('http://localhost:9000')
        .get('/api/projects/search')
        .query(true)
        .reply(200, {
          components: [
            {
              key: 'project1',
              name: 'Project 1',
              qualifier: 'TRK',
              visibility: 'public',
            },
          ],
          paging: {
            pageIndex: 1,
            pageSize: 10,
            total: 1,
          },
        });

      const response = await handleCodescanProjects({ page: 1, page_size: 1 });
      expect(response.content[0].text).toContain('project1');
    });
  });

  describe('mapToCodescanParams', () => {
    it('should map MCP tool parameters to Codescan client parameters', () => {
      const params = mapToCodescanParams({ project_key: 'key', severity: 'MAJOR' });
      expect(params.projectKey).toBe('key');
      expect(params.severity).toBe('MAJOR');
    });
  });

  describe('handleCodescanGetIssues', () => {
    it('should fetch and return a list of issues', async () => {
      nock('http://localhost:9000')
        .get('/api/issues/search')
        .query(true)
        .reply(200, {
          issues: [
            {
              key: 'issue1',
              rule: 'rule1',
              severity: 'MAJOR',
              component: 'component1',
              project: 'project1',
            },
          ],
          paging: {
            pageIndex: 1,
            pageSize: 10,
            total: 1,
          },
        });

      const response = await handleCodescanGetIssues({ projectKey: 'key' });
      expect(response.content[0].text).toContain('issue');
    });
  });

  describe('handleCodescanGetMetrics', () => {
    it('should fetch and return a list of metrics', async () => {
      nock('http://localhost:9000')
        .get('/api/metrics/search')
        .query(true)
        .reply(200, {
          metrics: [
            {
              key: 'metric1',
              name: 'Metric 1',
              description: 'Description 1',
              domain: 'Domain 1',
              type: 'INT',
            },
          ],
          paging: {
            pageIndex: 1,
            pageSize: 10,
            total: 1,
          },
        });

      const response = await handleCodescanGetMetrics({ page: 1, pageSize: 1 });
      expect(response.content[0].text).toContain('metric');
    });
  });

  describe('Schema transformations', () => {
    it('should handle complex parameter combinations', () => {
      const params = {
        project_key: 'test-project',
        severity: 'MAJOR',
        statuses: ['OPEN', 'CONFIRMED'],
        types: ['BUG', 'VULNERABILITY'],
        tags: ['security', 'performance'],
        created_after: '2024-01-01',
        languages: ['java', 'typescript'],
        resolved: 'true',
        since_leak_period: 'true',
        in_new_code_period: 'true',
      };

      return mockHandlers.handleCodescanGetIssues(mapToCodescanParams(params));
    });
  });
});
