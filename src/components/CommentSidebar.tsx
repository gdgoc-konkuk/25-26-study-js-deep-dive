'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import type { PRWithComments, Comment } from '../types/pr';
import CommentReactions from './CommentReactions';
import { CommentForm } from './CommentForm';

interface CommentWithLine extends Comment {
  prNumber: number;
  prTitle: string;
  prUrl: string;
}

function CommentThreadSidebar({ comment, prUrl, prNumber, prTitle }: {
  comment: Comment;
  prUrl: string;
  prNumber: number;
  prTitle: string;
}) {
  return (
    <div>
      <div className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {/* PR 정보 */}
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2 block"
        >
          #{prNumber} {prTitle}
        </a>

        {/* 라인 정보 */}
        {comment.lineNumber && (
          <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded mb-2 inline-block">
            📍 Line {comment.lineNumber}
          </div>
        )}

        {/* 작성자 */}
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
            className="text-sm font-medium hover:underline"
          >
            {comment.author.name}
          </a>
          <span className="text-xs text-gray-500">
            {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* 댓글 타입 */}
        {comment.type === 'review-comment' && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded mb-2 inline-block">
            코드 리뷰
          </span>
        )}

        {/* 파일 경로 */}
        {comment.filePath && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate" title={comment.filePath}>
            📁 {comment.filePath}
          </div>
        )}

        {/* 댓글 내용 */}
        <div
          className="text-sm prose dark:prose-invert prose-sm max-w-none mb-2"
          dangerouslySetInnerHTML={{ __html: comment.body.replace(/\n/g, '<br>') }}
        />

        {/* Reactions */}
        {comment.reactions && <CommentReactions reactions={comment.reactions} />}

        {/* GitHub 링크 */}
        <a
          href={comment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 mt-2 inline-block"
        >
          GitHub에서 보기 →
        </a>
      </div>

      {/* 답글 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 mt-2 border-l-2 border-gray-300 dark:border-gray-600 pl-2 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="border rounded p-2 bg-gray-50 dark:bg-gray-900 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={reply.author.avatarUrl}
                  alt={reply.author.name}
                  className="w-4 h-4 rounded-full"
                />
                <span className="font-medium">{reply.author.name}</span>
                <span className="text-gray-500">
                  {new Date(reply.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div
                className="prose dark:prose-invert prose-xs max-w-none mb-1"
                dangerouslySetInnerHTML={{ __html: reply.body.replace(/\n/g, '<br>') }}
              />
              {reply.reactions && <CommentReactions reactions={reply.reactions} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSidebar() {
  const pathname = usePathname();
  const [comments, setComments] = useState<CommentWithLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [currentFilePath, setCurrentFilePath] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // URL 경로를 파일 경로로 변환
    // 예: /04장-변수/A -> src/content/04장 변수/A.mdx
    const pathParts = pathname.replace(/^\//, '').split('/');
    const possiblePaths = [
      `src/content/${pathParts.join('/')}.mdx`,
      `src/content/${pathParts.map(p => decodeURIComponent(p).replace(/-/g, ' ')).join('/')}.mdx`,
    ];

    console.log('[CommentSidebar] pathname:', pathname);
    console.log('[CommentSidebar] possiblePaths:', possiblePaths);

    const basePath = process.env.NODE_ENV === 'production' ? '/prwiki' : '';
    fetch(`${basePath}/data/prs-by-file.json`)
      .then(res => res.json())
      .then(data => {
        console.log('[CommentSidebar] data keys:', Object.keys(data));

        // 가능한 경로들 중에서 매칭되는 것 찾기
        let related: PRWithComments[] = [];
        let matchedPath = '';
        for (const path of possiblePaths) {
          if (data[path]) {
            related = data[path];
            matchedPath = path;
            console.log('[CommentSidebar] matched path:', path);
            break;
          }
        }

        // 매칭된 경로가 없으면 첫 번째 가능한 경로 사용 (새 파일의 경우)
        if (!matchedPath && possiblePaths.length > 0) {
          matchedPath = possiblePaths[0];
        }

        setCurrentFilePath(matchedPath);
        console.log('[CommentSidebar] related:', related);

        const allComments: CommentWithLine[] = [];

        related.forEach(({ pr, comments: prComments }) => {
          prComments.forEach((comment: Comment) => {
            allComments.push({
              ...comment,
              prNumber: pr.number,
              prTitle: pr.title,
              prUrl: pr.url,
            });
          });
        });

        // 라인 번호 순으로 정렬 (없으면 뒤로)
        allComments.sort((a, b) => {
          if (!a.lineNumber) return 1;
          if (!b.lineNumber) return -1;
          return a.lineNumber - b.lineNumber;
        });

        setComments(allComments);
        console.log('[CommentSidebar] final comments:', allComments);
      })
      .catch((err) => {
        console.error('[CommentSidebar] fetch error:', err);
        setComments([]);
      });
  }, [pathname]);

  const handleCommentSuccess = () => {
    setShowCommentForm(false);
    // 댓글 작성 후 GitHub에 반영되려면 시간이 걸리므로
    // 실시간 업데이트는 GitHub Actions workflow가 실행된 후 가능
  };

  // 임시로 항상 표시 (디버깅용)
  // if (comments.length === 0) return null;

  if (!mounted) return null;

  const content = (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 bottom-4 bg-blue-600 text-white rounded-full w-14 h-14 shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center justify-center"
        title={`${comments.length}개 댓글`}
      >
        <span className="text-xl">💬</span>
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
          {comments.length}
        </span>
      </button>

      {/* 사이드바 */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 z-40 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">💬 PR 댓글 ({comments.length})</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {comments.length > 0 && comments.map((comment) => (
            <CommentThreadSidebar
              key={comment.id}
              comment={comment}
              prUrl={comment.prUrl}
              prNumber={comment.prNumber}
              prTitle={comment.prTitle}
            />
          ))}

          {comments.length === 0 && !showCommentForm && (
            <div className="text-center text-gray-500 py-8">
              <p className="mb-2">아직 댓글이 없습니다.</p>
              <p className="text-sm">첫 댓글을 작성해보세요!</p>
            </div>
          )}

          {/* 댓글 작성 섹션 */}
          <div className="mt-4 pt-4 border-t">
            {!showCommentForm ? (
              <button
                onClick={() => setShowCommentForm(true)}
                className="w-full rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                disabled={!currentFilePath}
              >
                ✍️ 새 댓글 작성하기
              </button>
            ) : (
              currentFilePath && (
                <CommentForm
                  filePath={currentFilePath}
                  onSuccess={handleCommentSuccess}
                  onCancel={() => setShowCommentForm(false)}
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );

  return createPortal(content, document.body);
}
