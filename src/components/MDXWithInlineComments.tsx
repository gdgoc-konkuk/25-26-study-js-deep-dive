'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Comment } from '../types/pr';
import CommentReactions from './CommentReactions';
import { CommentForm } from './CommentForm';

interface CommentWithPR extends Comment {
  prNumber: number;
  prTitle: string;
  prUrl: string;
}

interface MDXWithInlineCommentsProps {
  children: React.ReactNode;
  sourceCode?: string;
}

export default function MDXWithInlineComments({ children, sourceCode }: MDXWithInlineCommentsProps) {
  const pathname = usePathname();
  const [comments, setComments] = useState<CommentWithPR[]>([]);
  const [showReviews, setShowReviews] = useState(true); // 리뷰 표시/숨김
  const [showSource, setShowSource] = useState(false); // 소스 코드 뷰 (디버그용)
  const [selectedLine, setSelectedLine] = useState<{ start: number; end: number } | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);

  // 텍스트 선택 관련 state
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showCommentButton, setShowCommentButton] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // sourceCode를 라인별로 분리
  const sourceLines = sourceCode ? sourceCode.split('\n') : [];

  // 현재 파일 경로 계산
  const pathParts = pathname?.replace(/^\//, '').split('/') || [];
  const convertedPath = pathParts.map(p => decodeURIComponent(p).replace(/-/g, ' ')).join('/');
  const filePath = `src/content/${convertedPath}.mdx`;

  useEffect(() => {
    if (!pathname) return;

    const possiblePaths = [
      `src/content/${pathParts.join('/')}.mdx`,
      `src/content/${pathParts.map(p => decodeURIComponent(p).replace(/-/g, ' ')).join('/')}.mdx`,
      `src/content/${decodeURIComponent(pathname.replace(/^\//, ''))}.mdx`,
      `src/content/${decodeURIComponent(pathname.replace(/^\//, '')).replace(/-/g, ' ')}.mdx`,
    ];

    const basePath = process.env.NODE_ENV === 'production' ? '/prwiki' : '';

    // PR 댓글 가져오기
    fetch(`${basePath}/data/prs-by-file.json`)
      .then(res => res.json())
      .then(data => {
        let related: any[] = [];
        for (const path of possiblePaths) {
          if (data[path]) {
            related = data[path];
            break;
          }
        }

        const fileComments: CommentWithPR[] = [];
        related.forEach(({ pr, comments: prComments }) => {
          prComments.forEach((comment: Comment) => {
            if (comment.type === 'review-comment' && comment.lineNumber) {
              fileComments.push({
                ...comment,
                prNumber: pr.number,
                prTitle: pr.title,
                prUrl: pr.url,
              });
            }
          });
        });

        setComments(fileComments);
      })
      .catch(() => setComments([]));
  }, [pathname]);

  // 댓글 작성 성공 핸들러
  const handleCommentSuccess = () => {
    setSelectedLine(null);
    setDragStart(null);
    setIsDragging(false);
    // 댓글 목록 새로고침을 위해 페이지 리로드 (임시)
    window.location.reload();
  };

  // 드래그 시작
  const handleMouseDown = (lineNum: number) => {
    setDragStart(lineNum);
    setIsDragging(true);
    setSelectedLine({ start: lineNum, end: lineNum });
  };

  // 드래그 중
  const handleMouseEnter = (lineNum: number) => {
    setHoveredLine(lineNum);
    if (isDragging && dragStart !== null) {
      const start = Math.min(dragStart, lineNum);
      const end = Math.max(dragStart, lineNum);
      setSelectedLine({ start, end });
    }
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 선택 취소
  const handleCancelSelection = () => {
    setSelectedLine(null);
    setDragStart(null);
    setIsDragging(false);
  };

  // 라인이 선택된 범위에 있는지 확인
  const isLineSelected = (lineNum: number) => {
    if (!selectedLine) return false;
    return lineNum >= selectedLine.start && lineNum <= selectedLine.end;
  };

  // 텍스트 선택 핸들러
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);

      // 선택 영역의 위치 계산
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10, // 선택 영역 위에 버튼 표시
        });
        setShowCommentButton(true);
      }
    } else {
      setShowCommentButton(false);
      setSelectedText('');
      setSelectionPosition(null);
    }
  };

  // 댓글 작성 시작
  const handleStartComment = () => {
    setShowCommentButton(false);
    setShowCommentForm(true);
  };

  // 댓글 작성 취소
  const handleCancelComment = () => {
    setShowCommentForm(false);
    setSelectedText('');
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  // 댓글 작성 완료
  const handleTextCommentSuccess = () => {
    setShowCommentForm(false);
    setSelectedText('');
    setSelectionPosition(null);
    window.getSelection()?.removeAllRanges();
    // 댓글 목록 새로고침
    window.location.reload();
  };

  const commentsByLine = comments.reduce((acc, comment) => {
    const lineNum = comment.lineNumber || 0;
    if (!acc[lineNum]) acc[lineNum] = [];
    acc[lineNum].push(comment);
    return acc;
  }, {} as Record<number, CommentWithPR[]>);

  // 소스 코드가 없으면 일반 렌더링만
  if (!sourceCode) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* 리뷰 모드 토글 */}
      {(comments.length > 0 || showSource) && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {comments.length > 0 ? `리뷰 댓글 ${comments.length}개` : '리뷰 모드'}
                </h3>
              </div>
            </div>
            <div className="flex gap-2">
              {comments.length > 0 && (
                <button
                  onClick={() => setShowReviews(!showReviews)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showReviews ? '💬 리뷰 숨기기' : '💬 리뷰 보기'}
                </button>
              )}
              {sourceCode && (
                <button
                  onClick={() => setShowSource(!showSource)}
                  className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {showSource ? '📄 렌더링 보기' : '🔧 소스 보기'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 소스 코드 뷰 (디버그용) */}
      {showSource && sourceLines.length > 0 && (
        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-2 border-b flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              📄 MDX 소스 (PR 리뷰 포함)
            </span>
            {selectedLine && (
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Line {selectedLine.start}
                {selectedLine.end !== selectedLine.start && `-${selectedLine.end}`} 선택됨
              </span>
            )}
          </div>
          <pre
            className="text-sm font-mono bg-white dark:bg-gray-900 p-4 overflow-x-auto select-none"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {sourceLines.map((line, index) => {
              const lineNum = index + 1;
              const lineComments = commentsByLine[lineNum] || [];
              const hasComments = lineComments.length > 0;

              const isSelected = isLineSelected(lineNum);
              const isSelectionStart = selectedLine && lineNum === selectedLine.start;
              const isSelectionEnd = selectedLine && lineNum === selectedLine.end;
              // 드래그가 완료된 후(isDragging === false)에만 댓글 폼 표시
              const shouldShowCommentForm = !isDragging && selectedLine && lineNum === selectedLine.end;

              return (
                <div key={index}>
                  <div
                    className={`group flex items-start relative cursor-pointer ${
                      hasComments ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                    } ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : hoveredLine === lineNum ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    } ${
                      isSelectionStart ? 'border-t-2 border-blue-500' : ''
                    } ${
                      isSelectionEnd ? 'border-b-2 border-blue-500' : ''
                    }`}
                    onMouseDown={() => handleMouseDown(lineNum)}
                    onMouseEnter={() => handleMouseEnter(lineNum)}
                  >
                    {/* 라인 번호 */}
                    <span className={`select-none pr-4 text-right min-w-[3rem] inline-block ${
                      isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {lineNum}
                    </span>

                    {/* 소스 라인 */}
                    <span className={`flex-1 whitespace-pre-wrap break-words ${
                      hasComments ? 'border-l-4 border-yellow-400 pl-2' : ''
                    } ${
                      isSelected ? 'border-l-4 border-blue-500 pl-2' : ''
                    }`}>
                      {line || ' '}
                    </span>

                    {/* 댓글 카운트 */}
                    {hasComments && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        💬 {lineComments.length}
                      </span>
                    )}

                    {/* 선택 취소 버튼 */}
                    {isSelected && hoveredLine === lineNum && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelSelection();
                        }}
                        className="ml-2 text-sm font-bold w-6 h-6 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                        title="선택 취소"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* 댓글 작성 폼 */}
                  {shouldShowCommentForm && (
                    <div className="ml-12 my-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-r p-4">
                      <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3">
                        📝 Line {selectedLine.start}
                        {selectedLine.end !== selectedLine.start && `-${selectedLine.end}`}에 리뷰 댓글 작성
                      </h4>
                      <CommentForm
                        filePath={filePath}
                        lineNumber={selectedLine.start}
                        onSuccess={handleCommentSuccess}
                        onCancel={handleCancelSelection}
                        placeholder={
                          selectedLine.end !== selectedLine.start
                            ? `Line ${selectedLine.start}-${selectedLine.end}에 대한 리뷰 댓글을 작성하세요...`
                            : '이 라인에 대한 리뷰 댓글을 작성하세요...'
                        }
                      />
                    </div>
                  )}

                  {/* 인라인 댓글 표시 */}
                  {hasComments && (
                    <div className="ml-12 my-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-r">
                      {lineComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-4 border-b last:border-b-0 border-blue-200 dark:border-blue-800"
                        >
                          {/* PR 정보 */}
                          <a
                            href={comment.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2 block font-semibold"
                          >
                            #{comment.prNumber} {comment.prTitle}
                          </a>

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

                          {/* 댓글 내용 */}
                          <div
                            className="text-sm prose dark:prose-invert prose-sm max-w-none mb-2 bg-white dark:bg-gray-800 p-3 rounded"
                            dangerouslySetInnerHTML={{
                              __html: comment.body.replace(/\n/g, '<br>'),
                            }}
                          />

                          {/* 반응 */}
                          <CommentReactions reactions={comment.reactions} />

                          {/* 답글 */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600 space-y-2">
                              {comment.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="bg-white dark:bg-gray-800 rounded p-3"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <img
                                      src={reply.author.avatarUrl}
                                      alt={reply.author.name}
                                      className="w-5 h-5 rounded-full"
                                    />
                                    <span className="text-sm font-medium">{reply.author.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(reply.createdAt).toLocaleDateString('ko-KR')}
                                    </span>
                                  </div>
                                  <div
                                    className="text-sm prose dark:prose-invert prose-sm max-w-none mb-1"
                                    dangerouslySetInnerHTML={{
                                      __html: reply.body.replace(/\n/g, '<br>'),
                                    }}
                                  />
                                  <CommentReactions reactions={reply.reactions} />
                                </div>
                              ))}
                            </div>
                          )}

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
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </pre>
        </div>
      )}

      {/* 렌더링된 MDX (항상 표시) */}
      <div
        className="rendered-mdx"
        onMouseUp={handleTextSelection}
      >
        {children}
      </div>

      {/* Floating 댓글 버튼 */}
      {showCommentButton && selectionPosition && (
        <button
          onClick={handleStartComment}
          className="fixed z-50 bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          style={{
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          💬 댓글 작성
        </button>
      )}

      {/* 댓글 작성 폼 (Floating) */}
      {showCommentForm && selectionPosition && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-md"
          style={{
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y + 20}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              선택된 텍스트에 댓글 작성
            </h4>
            <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border-l-4 border-blue-500">
              <span className="text-gray-600 dark:text-gray-400 italic">"{selectedText}"</span>
            </div>
          </div>
          <CommentForm
            filePath={filePath}
            selectedText={selectedText}
            onSuccess={handleTextCommentSuccess}
            onCancel={handleCancelComment}
            placeholder="선택한 텍스트에 대한 댓글을 작성하세요..."
          />
        </div>
      )}
    </div>
  );
}
