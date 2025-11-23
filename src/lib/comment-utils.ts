/**
 * 댓글 관련 유틸리티 함수
 */

import type { Comment, CommentWithPR } from '../types/pr';
import type { PRInfo } from '../contexts/CommentsContext';

/**
 * GitHub Reactions 객체를 표준 형식으로 변환
 * @param reactions GitHub API에서 받은 reactions 객체
 * @returns 표준화된 Reactions 객체 또는 undefined
 */
export function transformReactions(reactions: any) {
  if (!reactions) return undefined;

  return {
    '+1': reactions['+1'] || 0,
    '-1': reactions['-1'] || 0,
    laugh: reactions.laugh || 0,
    hooray: reactions.hooray || 0,
    confused: reactions.confused || 0,
    heart: reactions.heart || 0,
    rocket: reactions.rocket || 0,
    eyes: reactions.eyes || 0,
  };
}

/**
 * Comment 배열을 CommentWithPR 배열로 변환하고 필터링/정렬
 * @param comments 원본 댓글 배열
 * @param prInfo PR 정보
 * @param options 필터링 및 정렬 옵션
 * @returns PR 정보가 포함된 댓글 배열
 */
export function addPRInfoToComments(
  comments: Comment[],
  prInfo: PRInfo | null,
  options?: {
    filterReviewComments?: boolean;
    requireLineNumber?: boolean;
    requireLineOrText?: boolean; // lineNumber 또는 selectedText 필요
    sort?: boolean;
  }
): CommentWithPR[] {
  if (!prInfo || !comments) return [];

  let result = comments;

  // 필터링
  if (options?.filterReviewComments) {
    result = result.filter(c => c.type === 'review-comment');
  }
  if (options?.requireLineNumber) {
    result = result.filter(c => c.lineNumber);
  }
  if (options?.requireLineOrText) {
    result = result.filter(c => c.lineNumber || c.selectedText);
  }

  // PR 정보 추가
  const withPR = result.map(comment => ({
    ...comment,
    prNumber: prInfo.number,
    prTitle: prInfo.title,
    prUrl: prInfo.url,
  }));

  // 정렬
  return options?.sort ? sortCommentsByLine(withPR) : withPR;
}

/**
 * 댓글을 라인 번호별로 그룹화
 * @param comments 댓글 배열
 * @returns 라인 번호를 키로 하는 댓글 배열 객체
 */
export function groupCommentsByLine<T extends { lineNumber?: number }>(
  comments: T[]
): Record<number, T[]> {
  return comments.reduce((acc, comment) => {
    const lineNum = comment.lineNumber || 0;
    if (!acc[lineNum]) acc[lineNum] = [];
    acc[lineNum].push(comment);
    return acc;
  }, {} as Record<number, T[]>);
}

/**
 * Next.js pathname을 파일 경로로 변환
 * @param pathname Next.js pathname (예: /04장-변수/A)
 * @returns 파일 경로 (예: src/content/04장 변수/A.mdx)
 */
export function pathnameToFilePath(pathname: string): string {
  const pathParts = pathname.replace(/^\//, '').split('/');
  const convertedPath = pathParts
    .map(p => decodeURIComponent(p).replace(/-/g, ' '))
    .join('/');
  return `src/content/${convertedPath}.mdx`;
}

/**
 * 라인 번호로 댓글 정렬
 * @param comments 정렬할 댓글 배열
 * @returns 라인 번호순으로 정렬된 댓글 배열 (라인 번호 없는 댓글은 뒤로)
 */
export function sortCommentsByLine<T extends { lineNumber?: number }>(
  comments: T[]
): T[] {
  return [...comments].sort((a, b) => {
    if (!a.lineNumber) return 1;
    if (!b.lineNumber) return -1;
    return a.lineNumber - b.lineNumber;
  });
}
