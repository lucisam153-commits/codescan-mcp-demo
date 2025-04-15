import axios from 'axios';

/**
 * Interface for pagination parameters
 */
interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Interface for Codescan project
 */
export interface CodescanProject {
  key: string;
  name: string;
  qualifier: string;
  visibility: string;
  lastAnalysisDate?: string;
  revision?: string;
  managed?: boolean;
}

/**
 * Interface for Codescan issue impact
 */
export interface CodescanIssueImpact {
  softwareQuality: string;
  severity: string;
}

/**
 * Interface for text range in Codescan
 */
export interface CodescanTextRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

/**
 * Interface for message formatting in Codescan
 */
export interface CodescanMessageFormatting {
  start: number;
  end: number;
  type: string;
}

/**
 * Interface for issue location in Codescan
 */
export interface CodescanIssueLocation {
  textRange: CodescanTextRange;
  msg: string;
  msgFormattings?: CodescanMessageFormatting[];
}

/**
 * Interface for issue flow in Codescan
 */
export interface CodescanIssueFlow {
  locations: CodescanIssueLocation[];
}

/**
 * Interface for issue comment in Codescan
 */
export interface CodescanIssueComment {
  key: string;
  login: string;
  htmlText: string;
  markdown: string;
  updatable: boolean;
  createdAt: string;
}

/**
 * Interface for Codescan issue
 */
export interface CodescanIssue {
  key: string;
  rule: string;
  component: string;
  project: string;
  line?: number;
  hash?: string;
  textRange?: CodescanTextRange;
  message: string;
  messageFormattings?: CodescanMessageFormatting[];
  status: string;
  issueStatus?: string;
  effort?: string;
  debt?: string;
  author?: string;
  severity?: string;
  tags: string[];
  creationDate: string;
  updateDate: string;
  type?: string;
  cleanCodeAttribute?: string;
  cleanCodeAttributeCategory?: string;
  prioritizedRule?: boolean;
  impacts?: CodescanIssueImpact[];
  comments?: CodescanIssueComment[];
  transitions?: string[];
  actions?: string[];
  flows?: CodescanIssueFlow[];
  quickFixAvailable?: boolean;
  ruleDescriptionContextKey?: string;
  codeVariants?: string[];
}

/**
 * Interface for Codescan component
 */
export interface CodescanComponent {
  key: string;
  enabled?: boolean;
  qualifier: string;
  name: string;
  longName?: string;
  path?: string;
}

/**
 * Interface for Codescan rule
 */
export interface CodescanRule {
  key: string;
  name: string;
  status: string;
  lang: string;
  langName: string;
}

/**
 * Interface for Codescan user
 */
export interface CodescanUser {
  login: string;
  name: string;
  active: boolean;
  avatar?: string;
}

/**
 * Interface for Codescan facet value
 */
export interface CodescanFacetValue {
  val: string;
  count: number;
}

/**
 * Interface for Codescan facet
 */
export interface CodescanFacet {
  property: string;
  values: CodescanFacetValue[];
}

/**
 * Interface for Codescan issues result
 */
export interface CodescanIssuesResult {
  issues: CodescanIssue[];
  components: CodescanComponent[];
  rules: CodescanRule[];
  users?: CodescanUser[];
  facets?: CodescanFacet[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Interface for Codescan projects result - Clean abstraction for consumers
 */
export interface CodescanProjectsResult {
  projects: CodescanProject[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Interface for get issues parameters
 */
export interface IssuesParams extends PaginationParams {
  component: string;
  severity?: 'INFO' | 'MINOR' | 'MAJOR' | 'CRITICAL' | 'BLOCKER';
  statuses?: (
    | 'OPEN'
    | 'CONFIRMED'
    | 'REOPENED'
    | 'RESOLVED'
    | 'CLOSED'
    | 'TO_REVIEW'
    | 'IN_REVIEW'
    | 'REVIEWED'
  )[];
  resolutions?: ('FALSE-POSITIVE' | 'WONTFIX' | 'FIXED' | 'REMOVED')[];
  resolved?: boolean;
  types?: ('CODE_SMELL' | 'BUG' | 'VULNERABILITY' | 'SECURITY_HOTSPOT')[];
  rules?: string[];
  tags?: string[];
  createdAfter?: string;
  createdBefore?: string;
  createdAt?: string;
  createdInLast?: string;
  assignees?: string[];
  authors?: string[];
  cwe?: string[];
  languages?: string[];
  owaspTop10?: string[];
  sansTop25?: string[];
  sonarsourceSecurity?: string[];
  onComponentOnly?: boolean;
  facets?: string[];
  sinceLeakPeriod?: boolean;
  inNewCodePeriod?: boolean;
}

/**
 * Interface for list projects parameters
 */
export interface ProjectsParams extends PaginationParams {
  projects?: string;
}

/**
 * Interface for raw Codescan component as returned by the API
 */
interface CodescanApiComponent {
  key: string;
  name: string;
  qualifier: string;
  visibility: string;
  lastAnalysisDate?: string;
  revision?: string;
  managed?: boolean;
}

/**
 * Interface for Codescan metric
 */
export interface CodescanMetric {
  id: string;
  key: string;
  name: string;
  description: string;
  domain: string;
  type: string;
  direction: number;
  qualitative: boolean;
  hidden: boolean;
  custom: boolean;
}

/**
 * Interface for Codescan metrics result
 */
export interface CodescanMetricsResult {
  metrics: CodescanMetric[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Interface for metrics parameters
 */
export interface MetricsParams extends PaginationParams {
  component?: string;
}

/**
 * Codescan client for interacting with the Codescan API
 */
export class CodescanClient {
  private readonly baseUrl: string;
  private readonly auth: { username: string; password: string };
  private readonly organization: string | null;
  private readonly defaultComponent: string | null;
  private readonly defaultProject: string | null;

  /**
   * Creates a new Codescan client
   * @param token Codescan authentication token
   * @param baseUrl Base URL of the Codescan instance (default: https://app.codescan.io)
   * @param organization Optional organization key
   * @param defaultComponent Optional default component key
   * @param defaultProject Optional default project key
   */
  constructor(
    token: string,
    baseUrl = 'https://app.codescan.io',
    organization?: string | null,
    defaultComponent?: string | null,
    defaultProject?: string | null
  ) {
    this.baseUrl = baseUrl;
    this.auth = { username: token, password: '' };
    this.organization = organization ?? null;
    this.defaultComponent = defaultComponent ?? null;
    this.defaultProject = defaultProject ?? null;
  }

  /**
   * Lists all projects in Codescan
   * @param params Optional parameters for pagination and filtering
   * @returns Promise resolving to projects result
   */
  async listProjects(params: ProjectsParams = {}): Promise<CodescanProjectsResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/projects/search`, {
        auth: this.auth,
        params: {
          ...params,
          organization: this.organization,
          projects: params.projects || this.defaultProject,
        },
      });

      console.log('listProjects API Response:', JSON.stringify(response.data, null, 2));
      if (response.data.errors) {
        throw new Error('Codescan API error: ' + JSON.stringify(response.data.errors));
      }

      const projects = response.data.components || response.data.projects || [];
      if (!Array.isArray(projects)) {
        throw new Error('API returned non-array projects: ' + JSON.stringify(projects));
      }

      return {
        projects: projects.map((project: CodescanApiComponent) => ({
          key: project.key,
          name: project.name,
          qualifier: project.qualifier,
          visibility: project.visibility,
          lastAnalysisDate: project.lastAnalysisDate,
          revision: project.revision,
          managed: project.managed,
        })),
        paging: response.data.paging || {
          pageIndex: params.page || 1,
          pageSize: params.pageSize || projects.length,
          total: projects.length,
        },
      };
    } catch (error) {
      console.error('listProjects error:', error);
      throw error;
    }
  }

  /**
   * Gets issues for a project in Codescan
   * @param params Parameters for filtering issues
   * @returns Promise resolving to issues result
   */
  async getIssues(params: IssuesParams): Promise<CodescanIssuesResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/issues/search`, {
        auth: this.auth,
        params: {
          ...params,
          organization: this.organization,
          component: params.component || this.defaultComponent,
        },
      });

      console.log('getIssues API Response:', JSON.stringify(response.data, null, 2));
      if (response.data.errors) {
        throw new Error('Codescan API error: ' + JSON.stringify(response.data.errors));
      }

      const issues = response.data.issues || [];
      if (!Array.isArray(issues)) {
        throw new Error('API returned non-array issues: ' + JSON.stringify(issues));
      }

      return {
        issues: issues,
        components: response.data.components || [],
        rules: response.data.rules || [],
        users: response.data.users || [],
        facets: response.data.facets || [],
        paging: response.data.paging || {
          pageIndex: params.page || 1,
          pageSize: params.pageSize || issues.length,
          total: issues.length,
        },
      };
    } catch (error) {
      console.error('getIssues error:', error);
      throw error;
    }
  }

  /**
   * Gets available metrics from Codescan
   * @param params Optional parameters for pagination and filtering
   * @returns Promise resolving to metrics result
   */
  async getMetrics(params: MetricsParams = {}): Promise<CodescanMetricsResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/metrics/search`, {
        auth: this.auth,
        params: {
          ...params,
          organization: this.organization,
          component: params.component || this.defaultComponent,
        },
      });

      console.log('getMetrics API Response:', JSON.stringify(response.data, null, 2));
      if (response.data.errors) {
        throw new Error('Codescan API error: ' + JSON.stringify(response.data.errors));
      }

      const metrics = response.data.metrics || [];
      if (!Array.isArray(metrics)) {
        throw new Error('API returned non-array metrics: ' + JSON.stringify(metrics));
      }

      return {
        metrics: metrics,
        paging: response.data.paging || {
          pageIndex: params.page || 1,
          pageSize: params.pageSize || metrics.length,
          total: metrics.length,
        },
      };
    } catch (error) {
      console.error('getMetrics error:', error);
      throw error;
    }
  }
}