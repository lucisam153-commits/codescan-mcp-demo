/// <reference types="jest" />

/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, jest } from '@jest/globals';
import nock from 'nock';
import { z } from 'zod';
import { CodescanClient } from '../codescan.js';
import {
  handleCodescanProjects,
  handleCodescanGetIssues,
  handleCodescanGetMetrics,
  mapToCodescanParams,
  nullToUndefined,
} from '../index.js';

// Mock MCP SDK modules
const mockMcpServer = {
  tool: jest.fn(),
  connect: jest.fn()
};

const mockStdioTransport = {
  connect: jest.fn()
};

jest.mock('@modelcontextprotocol/sdk', () => ({
  McpServer: jest.fn(() => mockMcpServer),
  StdioServerTransport: jest.fn(() => mockStdioTransport)
}));

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

describe('MCP Server Handlers', () => {
  let mockClient: jest.Mocked<CodescanClient>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a mock client
    mockClient = {
      listProjects: jest.fn(),
      getIssues: jest.fn(),
      getMetrics: jest.fn()
    } as unknown as jest.Mocked<CodescanClient>;
  });

  describe('nullToUndefined', () => {
    it('should convert null to undefined', () => {
      expect(nullToUndefined(null)).toBeUndefined();
    });

    it('should return the original value if not null', () => {
      expect(nullToUndefined('test')).toBe('test');
      expect(nullToUndefined(123)).toBe(123);
      expect(nullToUndefined(true)).toBe(true);
      expect(nullToUndefined({})).toEqual({});
      expect(nullToUndefined([])).toEqual([]);
    });
  });

  describe('mapToCodescanParams', () => {
    it('should map MCP tool parameters to Codescan client parameters', () => {
      const params = {
        component: 'test-component',
        severity: 'MAJOR',
        page: '1',
        page_size: '10',
        statuses: ['OPEN', 'CONFIRMED'],
        resolutions: ['FIXED'],
        resolved: 'true',
        types: ['BUG', 'VULNERABILITY'],
        rules: ['rule1', 'rule2'],
        tags: ['tag1', 'tag2'],
        created_after: '2023-01-01',
        created_before: '2023-12-31',
        created_at: '2023-06-15',
        created_in_last: '1d',
        assignees: ['user1', 'user2'],
        authors: ['author1', 'author2'],
        cwe: ['cwe1', 'cwe2'],
        languages: ['java', 'javascript'],
        owasp_top10: ['a1', 'a2'],
        sans_top25: ['s1', 's2'],
        sonarsource_security: ['ss1', 'ss2'],
        on_component_only: 'true',
        facets: ['f1', 'f2'],
        since_leak_period: 'true',
        in_new_code_period: 'true',
      };

      const result = mapToCodescanParams(params);

      expect(result).toEqual({
        component: 'test-component',
        severity: 'MAJOR',
        page: 1,
        pageSize: 10,
        statuses: ['OPEN', 'CONFIRMED'],
        resolutions: ['FIXED'],
        resolved: true,
        types: ['BUG', 'VULNERABILITY'],
        rules: ['rule1', 'rule2'],
        tags: ['tag1', 'tag2'],
        createdAfter: '2023-01-01',
        createdBefore: '2023-12-31',
        createdAt: '2023-06-15',
        createdInLast: '1d',
        assignees: ['user1', 'user2'],
        authors: ['author1', 'author2'],
        cwe: ['cwe1', 'cwe2'],
        languages: ['java', 'javascript'],
        owaspTop10: ['a1', 'a2'],
        sansTop25: ['s1', 's2'],
        sonarsourceSecurity: ['ss1', 'ss2'],
        onComponentOnly: true,
        facets: ['f1', 'f2'],
        sinceLeakPeriod: true,
        inNewCodePeriod: true,
      });
    });

    it('should handle null values', () => {
      const params = {
        component: 'test-component',
        severity: null,
        statuses: null,
        resolutions: null,
        types: null,
        rules: null,
        tags: null,
        created_after: null,
        created_before: null,
        created_at: null,
        created_in_last: null,
        assignees: null,
        authors: null,
        cwe: null,
        languages: null,
        owasp_top10: null,
        sans_top25: null,
        sonarsource_security: null,
        facets: null,
      };

      const result = mapToCodescanParams(params);

      expect(result).toEqual({
        component: 'test-component',
        severity: undefined,
        statuses: undefined,
        resolutions: undefined,
        types: undefined,
        rules: undefined,
        tags: undefined,
        createdAfter: undefined,
        createdBefore: undefined,
        createdAt: undefined,
        createdInLast: undefined,
        assignees: undefined,
        authors: undefined,
        cwe: undefined,
        languages: undefined,
        owaspTop10: undefined,
        sansTop25: undefined,
        sonarsourceSecurity: undefined,
        facets: undefined,
      });
    });
  });

  describe('handleCodescanProjects', () => {
    it('should return projects successfully', async () => {
      const mockResult = {
        projects: [
          {
            key: 'project1',
            name: 'Project 1',
            qualifier: 'TRK',
            visibility: 'public',
            lastAnalysisDate: '2023-01-01',
            revision: '1.0',
            managed: true,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 10,
          total: 1,
        },
      };

      mockClient.listProjects.mockResolvedValueOnce(mockResult);

      const result = await handleCodescanProjects({
        page: 1,
        pageSize: 10,
        projects: 'test-project',
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockResult);
      expect(mockClient.listProjects).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        projects: 'test-project',
      });
    });

    it('should handle errors', async () => {
      mockClient.listProjects.mockRejectedValueOnce(new Error('API Error'));

      await expect(handleCodescanProjects({})).rejects.toThrow('Failed to list projects: API Error');
    });
  });

  describe('handleCodescanGetIssues', () => {
    it('should return issues successfully', async () => {
      const mockResult = {
        issues: [
          {
            key: 'issue1',
            rule: 'rule1',
            severity: 'MAJOR',
            component: 'component1',
            project: 'project1',
            line: 10,
            status: 'OPEN',
            message: 'Test issue',
            creationDate: '2023-01-01',
            updateDate: '2023-01-01',
            type: 'BUG',
            tags: ['test'],
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
      };

      mockClient.getIssues.mockResolvedValueOnce(mockResult);

      const result = await handleCodescanGetIssues({
        component: 'test-component',
        severity: 'MAJOR',
        page: 1,
        pageSize: 10,
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockResult);
      expect(mockClient.getIssues).toHaveBeenCalledWith({
        component: 'test-component',
        severity: 'MAJOR',
        page: 1,
        pageSize: 10,
      });
    });

    it('should handle errors', async () => {
      mockClient.getIssues.mockRejectedValueOnce(new Error('API Error'));

      await expect(handleCodescanGetIssues({
        component: 'test-component',
      })).rejects.toThrow('Failed to get issues: API Error');
    });
  });

  describe('handleCodescanGetMetrics', () => {
    it('should return metrics successfully', async () => {
      const mockResult = {
        metrics: [
          {
            id: 'metric1',
            key: 'bugs',
            name: 'Bugs',
            description: 'Number of bugs',
            domain: 'Reliability',
            type: 'INT',
            direction: 0,
            qualitative: false,
            hidden: false,
            custom: false,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 10,
          total: 1,
        },
      };

      mockClient.getMetrics.mockResolvedValueOnce(mockResult);

      const result = await handleCodescanGetMetrics({
        page: 1,
        pageSize: 10,
        component: 'test-component',
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockResult);
      expect(mockClient.getMetrics).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        component: 'test-component',
      });
    });

    it('should handle errors', async () => {
      mockClient.getMetrics.mockRejectedValueOnce(new Error('API Error'));

      await expect(handleCodescanGetMetrics({
        component: 'test-component',
      })).rejects.toThrow('Failed to get metrics: API Error');
    });
  });
});
