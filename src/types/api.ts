// API 요청/응답 타입 정의

import type { User } from './auth';

/**
 * API 에러 응답
 */
export interface ApiError {
  error: string; // 에러 메시지
  code?: string; // 에러 코드
  details?: unknown; // 추가 정보
}

/**
 * 댓글 작성 요청
 */
export interface CreateCommentRequest {
  filePath: string; // 파일 경로 (예: "docs/01-변수.mdx")
  body: string; // 댓글 내용 (마크다운)
  lineNumber?: number; // 라인 번호 (코드 리뷰 댓글인 경우)
  inReplyTo?: number; // 답글인 경우 부모 댓글 ID
  anonymousName?: string; // 비로그인 시 작성자 이름 (선택)
}

/**
 * 댓글 작성 응답
 */
export interface CreateCommentResponse {
  success: boolean;
  comment: {
    id: number; // GitHub comment ID
    prNumber: number; // PR 번호
    htmlUrl: string; // GitHub PR 댓글 URL
    createdAt: string; // 생성 시각 (ISO 8601)
  };
}

/**
 * 댓글 수정 요청
 */
export interface UpdateCommentRequest {
  commentId: number; // GitHub comment ID
  body: string; // 수정된 내용
}

/**
 * 댓글 수정 응답
 */
export interface UpdateCommentResponse {
  success: boolean;
  comment: {
    id: number;
    updatedAt: string;
  };
}

/**
 * 댓글 삭제 요청
 */
export interface DeleteCommentRequest {
  commentId: number; // GitHub comment ID
}

/**
 * 댓글 삭제 응답
 */
export interface DeleteCommentResponse {
  success: boolean;
}

/**
 * 인증 상태 응답
 */
export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user?: User;
}

/**
 * 로그아웃 응답
 */
export interface LogoutResponse {
  success: boolean;
}
