/// <reference types="jest" />

/**
 * @jest-environment node
 */

const nock = require('nock');
const { z } = require('zod');
const { CodescanClient } = require('../codescan');
const {
  handleCodescanProjects,
  handleCodescanGetIssues,
  handleCodescanGetMetrics,
  mapToCodescanParams,
  nullToUndefined,
} = require('../index');

// Mock MCP SDK modules
const mockMcpServer = {
  tool: jest.fn(),
  connect: jest.fn()
};

const mockStdioTransport = {
  connect: jest.fn()
};

jest.mock('@modelcontextprotocol/sdk', () => ({
  __esModule: true,
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
        type: 'text',
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
        type: 'text',
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
        type: 'text',
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
jest.mock('../index', () => {
  // Get the original module
  const originalModule = jest.requireActual('../index');

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

describe('MCP Server', () => {
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

  // Add your test cases here
});
