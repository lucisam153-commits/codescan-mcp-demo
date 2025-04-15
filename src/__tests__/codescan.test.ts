const axios = require('axios');
const { CodescanClient } = require('../codescan.js');

// Mock axios
const mockAxios = {
  get: jest.fn()
};
jest.mock('axios', () => mockAxios);

describe('CodescanClient', () => {
  let client: typeof CodescanClient;
  const mockToken = 'test-token';
  const mockBaseUrl = 'https://test.codescan.io';
  const mockOrg = 'test-org';
  const mockComponent = 'test-component';
  const mockProject = 'test-project';

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create a new client instance for each test
    client = new CodescanClient(mockToken, mockBaseUrl, mockOrg, mockComponent, mockProject);
  });

  describe('constructor', () => {
    it('should initialize with provided parameters', () => {
      expect(client).toBeInstanceOf(CodescanClient);
    });

    it('should use default values when parameters are not provided', () => {
      const defaultClient = new CodescanClient(mockToken);
      expect(defaultClient).toBeInstanceOf(CodescanClient);
    });
  });

  describe('listProjects', () => {
    it('should fetch projects successfully', async () => {
      const mockResponse = {
        data: {
          components: [
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
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.listProjects();

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].key).toBe('project1');
      expect(result.paging.total).toBe(1);
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/projects/search`,
        expect.objectContaining({
          params: expect.objectContaining({
            organization: mockOrg,
            projects: mockProject,
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      const mockError: any = new Error('API Error');
      mockError.response = {
        data: {
          errors: [{ msg: 'API Error' }],
        },
      };

      mockAxios.get.mockRejectedValueOnce(mockError);

      await expect(client.listProjects()).rejects.toThrow('Codescan API error');
    });

    it('should handle non-array projects response', async () => {
      const mockResponse = {
        data: {
          components: 'not-an-array',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(client.listProjects()).rejects.toThrow('API returned non-array projects');
    });
  });

  describe('getIssues', () => {
    it('should fetch issues successfully', async () => {
      const mockResponse = {
        data: {
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
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getIssues({ component: 'test-component' });

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].key).toBe('issue1');
      expect(result.paging.total).toBe(1);
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/issues/search`,
        expect.objectContaining({
          params: expect.objectContaining({
            organization: mockOrg,
            component: 'test-component',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      const mockError: any = new Error('API Error');
      mockError.response = {
        data: {
          errors: [{ msg: 'API Error' }],
        },
      };

      mockAxios.get.mockRejectedValueOnce(mockError);

      await expect(client.getIssues({ component: 'test-component' })).rejects.toThrow('Codescan API error');
    });

    it('should handle non-array issues response', async () => {
      const mockResponse = {
        data: {
          issues: 'not-an-array',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(client.getIssues({ component: 'test-component' })).rejects.toThrow('API returned non-array issues');
    });
  });

  describe('getMetrics', () => {
    it('should fetch metrics successfully', async () => {
      const mockResponse = {
        data: {
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
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getMetrics({ component: 'test-component' });

      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0].key).toBe('bugs');
      expect(result.paging.total).toBe(1);
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/metrics/search`,
        expect.objectContaining({
          params: expect.objectContaining({
            organization: mockOrg,
            component: 'test-component',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      const mockError: any = new Error('API Error');
      mockError.response = {
        data: {
          errors: [{ msg: 'API Error' }],
        },
      };

      mockAxios.get.mockRejectedValueOnce(mockError);

      await expect(client.getMetrics({ component: 'test-component' })).rejects.toThrow('Codescan API error');
    });

    it('should handle non-array metrics response', async () => {
      const mockResponse = {
        data: {
          metrics: 'not-an-array',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(client.getMetrics({ component: 'test-component' })).rejects.toThrow('API returned non-array metrics');
    });
  });
});
