'use client';

import { useEffect, useState } from 'react';
import type { PRSummary, Comment } from '../types/pr';
import CommentReactions from './CommentReactions';

interface PRWithDetails extends PRSummary {
  comments?: Comment[];
}

function CommentThread({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  return (
    <div className={`${depth > 0 ? 'ml-6 mt-3 border-l-2 border-gray-300 dark:border-gray-600 pl-3' : ''}`}>
      <div className="bg-white dark:bg-gray-800 rounded p-3 border">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.name}
            className="w-6 h-6 rounded-full"
          />
          <a
            href={comment.author.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm hover:underline"
          >
            {comment.author.name}
          </a>
          <span className="text-xs text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
          </span>
          {comment.type === 'review-comment' && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
              코드 리뷰
            </span>
          )}
        </div>

        {comment.filePath && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            📁 {comment.filePath}
            {comment.lineNumber && ` : Line ${comment.lineNumber}`}
          </div>
        )}

        <div
          className="text-sm prose dark:prose-invert prose-sm max-w-none mb-2"
          dangerouslySetInnerHTML={{ __html: comment.body.replace(/\n/g, '<br>') }}
        />

        {comment.reactions && <CommentReactions reactions={comment.reactions} />}

        <a
          href={comment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 mt-2 inline-block"
        >
          GitHub에서 보기 →
        </a>
      </div>

      {/* 답글 표시 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PRList() {
  const [prs, setPRs] = useState<PRWithDetails[]>([]);
  const [expandedPRs, setExpandedPRs] = useState<Set<number>>(new Set());
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());

  useEffect(() => {
    const basePath = process.env.NODE_ENV === 'production' ? '/prwiki' : '';
    fetch(`${basePath}/data/prs-recent.json`)
      .then(res => res.json())
      .then(setPRs)
      .catch(() => setPRs([]));
  }, []);

  const togglePR = async (prNumber: number) => {
    const newExpanded = new Set(expandedPRs);

    if (newExpanded.has(prNumber)) {
      newExpanded.delete(prNumber);
      setExpandedPRs(newExpanded);
      return;
    }

    // 댓글 로드
    const pr = prs.find(p => p.number === prNumber);
    if (pr && !pr.comments) {
      setLoadingComments(new Set(loadingComments).add(prNumber));

      try {
        const basePath = process.env.NODE_ENV === 'production' ? '/prwiki' : '';
        const response = await fetch(`${basePath}/data/prs-by-file.json`);
        const data = await response.json();

        // 이 PR과 관련된 모든 댓글 수집
        const allComments: Comment[] = [];
        Object.entries(data).forEach(([filePath, prList]: [string, any]) => {
          const prData = prList.find((item: any) => item.pr.number === prNumber);
          if (prData) {
            allComments.push(...prData.comments);
          }
        });

        // 중복 제거 (같은 댓글이 여러 파일에 매핑될 수 있음)
        const uniqueComments = Array.from(
          new Map(allComments.map(c => [c.id, c])).values()
        );

        // PR 데이터 업데이트
        setPRs(prs.map(p =>
          p.number === prNumber
            ? { ...p, comments: uniqueComments }
            : p
        ));
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setLoadingComments(prev => {
          const next = new Set(prev);
          next.delete(prNumber);
          return next;
        });
      }
    }

    newExpanded.add(prNumber);
    setExpandedPRs(newExpanded);
  };

  if (prs.length === 0) {
    return <div className="p-4">PR이 없습니다.</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {prs.map((pr) => {
        const isExpanded = expandedPRs.has(pr.number);
        const isLoading = loadingComments.has(pr.number);

        return (
          <div key={pr.number} className="border rounded-lg overflow-hidden">
            {/* PR 헤더 */}
            <div
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => togglePR(pr.number)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      #{pr.number} {pr.title}
                    </a>
                    <span className={`px-2 py-1 rounded text-xs ${
                      pr.state === 'merged' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30' :
                      pr.state === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900/30' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/30'
                    }`}>
                      {pr.state}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {pr.author.name} • {new Date(pr.createdAt).toLocaleDateString('ko-KR')}
                    {pr.mergedAt && ` • 병합: ${new Date(pr.mergedAt).toLocaleDateString('ko-KR')}`}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    💬 {pr.commentCount}개 댓글 • 📝 {pr.changedFiles.length}개 파일
                  </div>
                </div>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-transform"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▼
                </button>
              </div>
            </div>

            {/* 댓글 영역 */}
            {isExpanded && (
              <div className="border-t bg-gray-50 dark:bg-gray-900 p-4">
                {isLoading ? (
                  <div className="text-center text-gray-500 py-4">댓글 로딩 중...</div>
                ) : pr.comments && pr.comments.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm mb-3">💬 댓글 스레드 ({pr.commentCount})</h3>
                    {pr.comments.map((comment) => (
                      <CommentThread key={comment.id} comment={comment} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">댓글이 없습니다.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
