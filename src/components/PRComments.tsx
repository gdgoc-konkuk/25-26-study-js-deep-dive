'use client';

import { useEffect, useState } from 'react';
import type { PRWithComments, Comment } from '../types/pr';

interface PRCommentsProps {
  filePath: string;
}

export default function PRComments({ filePath }: PRCommentsProps) {
  const [prComments, setPRComments] = useState<PRWithComments[]>([]);

  useEffect(() => {
    const basePath = process.env.NODE_ENV === 'production' ? '/25-26-study-js-deep-dive' : '';
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

  if (prComments.length === 0) return null;

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-2xl font-bold mb-4">💬 PR 댓글</h2>

      {prComments.map(({ pr, comments }) => (
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
            {comments.map((comment: Comment) => (
              <div key={comment.id} className="bg-white dark:bg-gray-900 rounded p-3 border">
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
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
