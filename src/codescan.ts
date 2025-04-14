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
  projectKey: string;
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
export interface ProjectsParams extends PaginationParams {}

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
export interface MetricsParams extends PaginationParams {}

/**
 * Codescan client for interacting with the Codescan API
 */
export class CodescanClient {
  private readonly baseUrl: string;
  private readonly auth: { username: string; password: string };
  private readonly organization: string | null;

  /**
   * Creates a new Codescan client
   * @param token Codescan authentication token
   * @param baseUrl Base URL of the Codescan instance (default: https://codescan.io)
   * @param organization Optional organization key
   */
  constructor(token: string, baseUrl = 'https://codescan.io', organization?: string | null) {
    this.baseUrl = baseUrl;
    this.auth = { username: token, password: '' };
    this.organization = organization ?? null;
  }

  /**
   * Lists all projects in Codescan
   * @param params Optional parameters for pagination
   * @returns Promise resolving to projects result
   */
  async listProjects(params: ProjectsParams = {}): Promise<CodescanProjectsResult> {
    const response = await axios.get(`${this.baseUrl}/api/projects/search`, {
      auth: this.auth,
      params: {
        ...params,
        organization: this.organization,
      },
    });

    // Transform Codescan 'components' to our clean 'projects' interface
    return {
      projects: response.data.components.map((component: CodescanApiComponent) => ({
        key: component.key,
        name: component.name,
        qualifier: component.qualifier,
        visibility: component.visibility,
        lastAnalysisDate: component.lastAnalysisDate,
        revision: component.revision,
        managed: component.managed,
      })),
      paging: response.data.paging,
    };
  }

  /**
   * Gets issues for a project in Codescan
   * @param params Parameters for filtering issues
   * @returns Promise resolving to issues result
   */
  async getIssues(params: IssuesParams): Promise<CodescanIssuesResult> {
    const response = await axios.get(`${this.baseUrl}/api/issues/search`, {
      auth: this.auth,
      params: {
        ...params,
        organization: this.organization,
      },
    });

    return response.data;
  }

  /**
   * Gets available metrics from Codescan
   * @param params Optional parameters for pagination
   * @returns Promise resolving to metrics result
   */
  async getMetrics(params: MetricsParams = {}): Promise<CodescanMetricsResult> {
    const response = await axios.get(`${this.baseUrl}/api/metrics/search`, {
      auth: this.auth,
      params: {
        ...params,
        organization: this.organization,
      },
    });

    return response.data;
  }
}
