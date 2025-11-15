// GitHub API 응답 타입 정의

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface PullRequestData {
  number: number;
  state: 'open' | 'closed';
  title: string;
  body: string | null;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  labels: Label[];
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface Comment {
  id: number;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  body: string;
  html_url: string;
  reactions: {
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface ReviewComment {
  id: number;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  body: string;
  html_url: string;
  path: string;
  position: number | null;
  original_position: number;
  line: number | null;
  original_line: number;
  diff_hunk: string;
  in_reply_to_id?: number;
  reactions: {
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface Review {
  id: number;
  user: GitHubUser;
  body: string | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  html_url: string;
  submitted_at: string;
}

export interface FileChange {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  patch?: string;
  previous_filename?: string;
}

export interface PRDataFile {
  pr: PullRequestData;
  comments: Comment[];
  reviewComments: ReviewComment[];
  reviews: Review[];
  files: FileChange[];
  lastUpdated: string;
}

// 컴포넌트에서 사용할 가공된 타입
export interface PRSummary {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: {
    name: string;
    avatarUrl: string;
    profileUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
  mergedAt: Date | null;
  url: string;
  labels: Label[];
  commentCount: number;
  reviewCount: number;
  changedFiles: string[];
  additions: number;
  deletions: number;
}

export interface CommentWithContext {
  id: number;
  author: {
    name: string;
    avatarUrl: string;
    profileUrl: string;
  };
  body: string;
  createdAt: Date;
  updatedAt: Date;
  url: string;
  type: 'comment' | 'review-comment';
  filePath?: string; // review comment인 경우
  lineNumber?: number; // review comment인 경우
  reactions: {
    '+1': number;
    '-1': number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}
