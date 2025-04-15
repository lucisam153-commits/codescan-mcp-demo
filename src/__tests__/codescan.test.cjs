const { describe, it, expect, beforeEach } = require('@jest/globals');
const axios = require('axios');
const { CodescanClient } = require('../codescan');

jest.mock('axios');

describe('CodescanClient', () => {
  let client;
  const baseURL = 'https://api.codescan.com';
  const token = 'test-token';

  beforeEach(() => {
    client = new CodescanClient(baseURL, token);
    jest.clearAllMocks();
  });

  describe('listProjects', () => {
    it('should return projects successfully', async () => {
      const mockProjects = [
        { key: 'project1', name: 'Project 1' },
        { key: 'project2', name: 'Project 2' }
      ];

      axios.get.mockResolvedValueOnce({ data: { components: mockProjects } });

      const result = await client.listProjects();
      expect(result).toEqual(mockProjects);
      expect(axios.get).toHaveBeenCalledWith(
        `${baseURL}/api/projects/search`,
        expect.any(Object)
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Network Error');
      axios.get.mockRejectedValueOnce(error);

      await expect(client.listProjects()).rejects.toThrow('Network Error');
    });
  });

  describe('getMetrics', () => {
    it('should return metrics successfully', async () => {
      const mockMetrics = [
        { metric: 'bugs', value: '10' },
        { metric: 'vulnerabilities', value: '5' }
      ];

      axios.get.mockResolvedValueOnce({ data: { component: { measures: mockMetrics } } });

      const result = await client.getMetrics('test-component');
      expect(result).toEqual(mockMetrics);
      expect(axios.get).toHaveBeenCalledWith(
        `${baseURL}/api/measures/component`,
        expect.objectContaining({
          params: { component: 'test-component' }
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Network Error');
      axios.get.mockRejectedValueOnce(error);

      await expect(client.getMetrics('test-component')).rejects.toThrow('Network Error');
    });
  });
}); 