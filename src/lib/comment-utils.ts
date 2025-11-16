/**
 * 댓글 관련 유틸리티 함수
 */

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
 * PR 요약 정보 객체 생성
 * @param prNumber PR 번호
 * @param prTitle PR 제목
 * @param prUrl PR URL
 * @returns PRInfo 객체
 */
export function buildPRSummary(
  prNumber: number,
  prTitle: string,
  prUrl: string
): PRInfo {
  return {
    number: prNumber,
    title: prTitle,
    url: prUrl,
  };
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
