import { CodescanClient } from '../codescan';
import nock from 'nock';

describe('CodescanClient', () => {
  const baseUrl = 'https://codescan.example.com';
  const token = 'test-token';
  const organization = 'test-org';
  let client: CodescanClient;

  beforeEach(() => {
    client = new CodescanClient(token, baseUrl, organization);
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('listProjects', () => {
    it('should fetch projects successfully', async () => {
      const mockResponse = {
        components: [
          {
            key: 'project1',
            name: 'Project 1',
            qualifier: 'TRK',
            visibility: 'public',
            lastAnalysisDate: '2024-01-01',
            revision: 'abc123',
            managed: false,
          },
        ],
        paging: {
          pageIndex: 1,
          pageSize: 10,
          total: 1,
        },
      };

      nock(baseUrl)
        .get('/api/projects/search')
        .query(true)
        .reply(200, mockResponse);

      const result = await client.listProjects();
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].key).toBe('project1');
      expect(result.paging).toEqual(mockResponse.paging);
    });
  });

  describe('getIssues', () => {
    it('should fetch issues successfully', async () => {
      const mockResponse = {
        issues: [
          {
            key: 'issue1',
            rule: 'rule1',
            severity: 'MAJOR',
            component: 'component1',
            project: 'project1',
            line: 42,
            status: 'OPEN',
            message: 'Test issue',
          },
        ],
        components: [],
        rules: [],
        paging: {
          pageIndex: 1,
          pageSize: 10,
          total: 1,
        },
      };

      nock(baseUrl)
        .get('/api/issues/search')
        .query(true)
        .reply(200, mockResponse);

      const result = await client.getIssues({ projectKey: 'project1' });
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].key).toBe('issue1');
      expect(result.paging).toEqual(mockResponse.paging);
    });
  });

  describe('getMetrics', () => {
    it('should fetch metrics successfully', async () => {
      const mockResponse = {
        metrics: [
          {
            id: 'metric1',
            key: 'coverage',
            name: 'Coverage',
            description: 'Code coverage',
            domain: 'Coverage',
            type: 'PERCENT',
            direction: 1,
            qualitative: true,
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

      nock(baseUrl)
        .get('/api/metrics/search')
        .query(true)
        .reply(200, mockResponse);

      const result = await client.getMetrics();
      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0].key).toBe('coverage');
      expect(result.paging).toEqual(mockResponse.paging);
    });
  });
});
