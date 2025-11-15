'use client';

import { useEffect, useState } from 'react';
import type { PRWithComments, Comment } from '../types/pr';
import CommentReactions from './CommentReactions';
import { CommentForm } from './CommentForm';

interface PRCommentsProps {
  filePath: string;
}

/**
 * 개별 댓글을 렌더링하는 컴포넌트
 */
function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  // Tailwind의 동적 클래스 생성 문제를 방지하기 위해 고정된 클래스 매핑 사용
  const getIndentClass = (depth: number) => {
    if (depth === 0) return '';
    const classes = 'border-l-2 border-gray-300 dark:border-gray-600 pl-4';
    const marginClasses = ['', 'ml-4', 'ml-8', 'ml-12'];
    const marginClass = marginClasses[Math.min(depth, 3)];
    return `${marginClass} ${classes}`;
  };

  return (
    <div className={getIndentClass(depth)}>
      <div className="bg-white dark:bg-gray-900 rounded p-3 border mb-3">
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
            className="font-medium hover:underline"
          >
            {comment.author.name}
          </a>
          <span className="text-xs text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
          </span>
          {comment.type === 'review-comment' && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
              코드 리뷰
            </span>
          )}
          {comment.type === 'review' && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
              리뷰
            </span>
          )}
        </div>

        {comment.filePath && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            📁 {comment.filePath}
            {comment.lineNumber && ` : ${comment.lineNumber}`}
          </div>
        )}

        <div
          className="prose dark:prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: comment.body.replace(/\n/g, '<br>') }}
        />

        {/* GitHub 호환 이모티콘 반응 표시 */}
        <CommentReactions reactions={comment.reactions} />
      </div>

      {/* 답글 (스레드) 렌더링 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PRComments({ filePath }: PRCommentsProps) {
  const [prComments, setPRComments] = useState<PRWithComments[]>([]);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    const basePath = process.env.NODE_ENV === 'production' ? '/prwiki' : '';
    fetch(`${basePath}/data/prs-by-file.json`)
      .then(res => res.json())
      .then(data => {
        // 현재 파일과 관련된 PR 찾기
        const related = data[filePath] || [];
        // 댓글이 있는 PR만 필터링
        const withComments = related.filter((item: PRWithComments) => item.comments.length > 0);
        setPRComments(withComments);
      })
      .catch(() => setPRComments([]));
  }, [filePath]);

  const handleCommentSuccess = () => {
    setShowCommentForm(false);
    // 댓글 작성 후 GitHub에 반영되려면 시간이 걸리므로
    // 실시간 업데이트는 GitHub Actions workflow가 실행된 후 가능
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-2xl font-bold mb-4">💬 PR 댓글</h2>

      {prComments.length > 0 && prComments.map(({ pr, comments }) => (
        <div key={pr.number} className="mb-6 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <a
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold hover:underline mb-3 block"
          >
            #{pr.number} {pr.title}
          </a>

          <div className="space-y-3">
            {/* 최상위 댓글만 렌더링 (답글은 CommentItem 내부에서 재귀적으로 렌더링) */}
            {comments.map((comment: Comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      ))}

      {/* 댓글 작성 섹션 */}
      <div className="mt-6">
        {!showCommentForm ? (
          <button
            onClick={() => setShowCommentForm(true)}
            className="w-full rounded-md border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            ✍️ 새 댓글 작성하기
          </button>
        ) : (
          <div>
            <CommentForm
              filePath={filePath}
              onSuccess={handleCommentSuccess}
              onCancel={() => setShowCommentForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
