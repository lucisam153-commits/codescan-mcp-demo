import axios from 'axios';

/**
 * Interface for pagination parameters
 */
interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Interface for codescan project
 */
export interface codescanProject {
  key: string;
  name: string;
  qualifier: string;
  visibility: string;
  lastAnalysisDate?: string;
  revision?: string;
  managed?: boolean;
}

/**
 * Interface for codescan issue impact
 */
export interface codescanIssueImpact {
  softwareQuality: string;
  severity: string;
}

/**
 * Interface for text range in codescan
 */
export interface codescanTextRange {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
}

/**
 * Interface for message formatting in codescan
 */
export interface codescanMessageFormatting {
  start: number;
  end: number;
  type: string;
}

/**
 * Interface for issue location in codescan
 */
export interface codescanIssueLocation {
  textRange: codescanTextRange;
  msg: string;
  msgFormattings?: codescanMessageFormatting[];
}

/**
 * Interface for issue flow in codescan
 */
export interface codescanIssueFlow {
  locations: codescanIssueLocation[];
}

/**
 * Interface for issue comment in codescan
 */
export interface codescanIssueComment {
  key: string;
  login: string;
  htmlText: string;
  markdown: string;
  updatable: boolean;
  createdAt: string;
}

/**
 * Interface for codescan issue
 */
export interface codescanIssue {
  key: string;
  rule: string;
  component: string;
  project: string;
  line?: number;
  hash?: string;
  textRange?: codescanTextRange;
  message: string;
  messageFormattings?: codescanMessageFormatting[];
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
  impacts?: codescanIssueImpact[];
  comments?: codescanIssueComment[];
  transitions?: string[];
  actions?: string[];
  flows?: codescanIssueFlow[];
  quickFixAvailable?: boolean;
  ruleDescriptionContextKey?: string;
  codeVariants?: string[];
}

/**
 * Interface for codescan component
 */
export interface codescanComponent {
  key: string;
  enabled?: boolean;
  qualifier: string;
  name: string;
  longName?: string;
  path?: string;
}

/**
 * Interface for codescan rule
 */
export interface codescanRule {
  key: string;
  name: string;
  status: string;
  lang: string;
  langName: string;
}

/**
 * Interface for codescan user
 */
export interface codescanUser {
  login: string;
  name: string;
  active: boolean;
  avatar?: string;
}

/**
 * Interface for codescan facet value
 */
export interface codescanFacetValue {
  val: string;
  count: number;
}

/**
 * Interface for codescan facet
 */
export interface codescanFacet {
  property: string;
  values: codescanFacetValue[];
}

/**
 * Interface for codescan issues result
 */
export interface codescanIssuesResult {
  issues: codescanIssue[];
  components: codescanComponent[];
  rules: codescanRule[];
  users?: codescanUser[];
  facets?: codescanFacet[];
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Interface for codescan projects result - Clean abstraction for consumers
 */
export interface codescanProjectsResult {
  projects: codescanProject[];
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
 * Interface for raw codescan component as returned by the API
 */
interface codescanApiComponent {
  key: string;
  name: string;
  qualifier: string;
  visibility: string;
  lastAnalysisDate?: string;
  revision?: string;
  managed?: boolean;
}

/**
 * Interface for codescan metric
 */
export interface codescanMetric {
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
 * Interface for codescan metrics result
 */
export interface codescanMetricsResult {
  metrics: codescanMetric[];
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
 * codescan client for interacting with the codescan API
 */
export class codescanClient {
  private readonly baseUrl: string;
  private readonly auth: { username: string; password: string };
  private readonly organization: string | null;

  /**
   * Creates a new codescan client
   * @param token codescan authentication token
   * @param baseUrl Base URL of the codescan instance (default: https://sonarcloud.io)
   * @param organization Organization name
   */
  constructor(token: string, baseUrl = 'https://sonarcloud.io', organization?: string | null) {
    this.baseUrl = baseUrl;
    this.auth = { username: token, password: '' };
    this.organization = organization ?? null;
  }

  /**
   * Lists all projects in codescan
   * @param params Pagination and organization parameters
   * @returns Promise with the list of projects
   */
  async listProjects(params: ProjectsParams = {}): Promise<codescanProjectsResult> {
    const { page, pageSize } = params;

    const response = await axios.get(`${this.baseUrl}/api/projects/search`, {
      auth: this.auth,
      params: {
        organization: this.organization,
        p: page,
        ps: pageSize,
      },
    });

    // Transform codescan 'components' to our clean 'projects' interface
    return {
      projects: response.data.components.map((component: codescanApiComponent) => ({
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
   * Gets issues for a project in codescan
   * @param params Parameters including project key, severity, pagination and organization
   * @returns Promise with the list of issues
   */
  async getIssues(params: IssuesParams): Promise<codescanIssuesResult> {
    const {
      projectKey,
      severity,
      page,
      pageSize,
      statuses,
      resolutions,
      resolved,
      types,
      rules,
      tags,
      createdAfter,
      createdBefore,
      createdAt,
      createdInLast,
      assignees,
      authors,
      cwe,
      languages,
      owaspTop10,
      sansTop25,
      sonarsourceSecurity,
      onComponentOnly,
      facets,
      sinceLeakPeriod,
      inNewCodePeriod,
    } = params;

    const response = await axios.get(`${this.baseUrl}/api/issues/search`, {
      auth: this.auth,
      params: {
        componentKeys: projectKey,
        severities: severity,
        organization: this.organization,
        p: page,
        ps: pageSize,
        statuses: statuses?.join(','),
        resolutions: resolutions?.join(','),
        resolved,
        types: types?.join(','),
        rules: rules?.join(','),
        tags: tags?.join(','),
        createdAfter,
        createdBefore,
        createdAt,
        createdInLast,
        assignees: assignees?.join(','),
        authors: authors?.join(','),
        cwe: cwe?.join(','),
        languages: languages?.join(','),
        owaspTop10: owaspTop10?.join(','),
        sansTop25: sansTop25?.join(','),
        sonarsourceSecurity: sonarsourceSecurity?.join(','),
        onComponentOnly,
        facets: facets?.join(','),
        sinceLeakPeriod,
        inNewCodePeriod,
      },
    });

    return response.data;
  }

  /**
   * Gets available metrics from codescan
   * @param params Parameters including pagination
   * @returns Promise with the list of metrics
   */
  async getMetrics(params: MetricsParams = {}): Promise<codescanMetricsResult> {
    const { page, pageSize } = params;

    const response = await axios.get(`${this.baseUrl}/api/metrics/search`, {
      auth: this.auth,
      params: {
        organization: this.organization,
        p: page,
        ps: pageSize,
      },
    });

    return {
      metrics: response.data.metrics,
      paging: response.data.paging,
    };
  }
}
