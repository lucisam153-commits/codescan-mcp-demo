const axios = require('axios');
const { CodescanClient } = require('../codescan');

jest.mock('axios');
const mockedAxios = axios;

describe('CodescanClient', () => {
  let client;
  const baseUrl = 'http://test.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new CodescanClient(token, baseUrl);
    jest.clearAllMocks();
  });

  describe('listProjects', () => {
    it('should return projects successfully', async () => {
      const mockResponse = {
        data: {
          components: [
            { key: 'project1', name: 'Project 1' },
            { key: 'project2', name: 'Project 2' }
          ],
          paging: {
            pageIndex: 1,
            pageSize: 2,
            total: 2
          }
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.listProjects();
      expect(result).toEqual({
        projects: [
          { 
            key: 'project1',
            name: 'Project 1',
            qualifier: undefined,
            visibility: undefined,
            lastAnalysisDate: undefined,
            revision: undefined,
            managed: undefined
          },
          { 
            key: 'project2',
            name: 'Project 2',
            qualifier: undefined,
            visibility: undefined,
            lastAnalysisDate: undefined,
            revision: undefined,
            managed: undefined
          }
        ],
        paging: {
          pageIndex: 1,
          pageSize: 2,
          total: 2
        }
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/api/projects/search`,
        expect.any(Object)
      );
    });

    it('should handle errors', async () => {
      const error = new Error('API Error');
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(client.listProjects()).rejects.toThrow('API Error');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics successfully', async () => {
      const mockResponse = {
        data: {
          metrics: [
            { 
              key: 'bugs',
              name: 'Bugs',
              description: 'Number of bugs',
              domain: 'Reliability',
              type: 'INT'
            }
          ],
          paging: {
            pageIndex: 1,
            pageSize: 1,
            total: 1
          }
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getMetrics({ component: 'project1' });
      expect(result).toEqual({
        metrics: [
          { 
            key: 'bugs',
            name: 'Bugs',
            description: 'Number of bugs',
            domain: 'Reliability',
            type: 'INT'
          }
        ],
        paging: {
          pageIndex: 1,
          pageSize: 1,
          total: 1
        }
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/api/metrics/search`,
        expect.any(Object)
      );
    });

    it('should handle errors', async () => {
      const error = new Error('API Error');
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(client.getMetrics({ component: 'project1' })).rejects.toThrow('API Error');
    });
  });
}); 