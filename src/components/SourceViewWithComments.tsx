'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Comment } from '../types/pr';
import CommentReactions from './CommentReactions';

interface CommentWithPR extends Comment {
  prNumber: number;
  prTitle: string;
  prUrl: string;
}

export default function SourceViewWithComments() {
  const pathname = usePathname();
  const [sourceCode, setSourceCode] = useState<string>('');
  const [comments, setComments] = useState<CommentWithPR[]>([]);
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());
  const [isSourceView, setIsSourceView] = useState(false);

  useEffect(() => {
    if (!pathname || !isSourceView) return;

    // URL 경로를 파일 경로로 변환
    const pathParts = pathname.replace(/^\//, '').split('/');
    const possiblePaths = [
      `src/content/${pathParts.join('/')}.mdx`,
      `src/content/${pathParts.map(p => decodeURIComponent(p).replace(/-/g, ' ')).join('/')}.mdx`,
      `src/content/${decodeURIComponent(pathname.replace(/^\//, ''))}.mdx`,
      `src/content/${decodeURIComponent(pathname.replace(/^\//, '')).replace(/-/g, ' ')}.mdx`,
    ];

    const basePath = process.env.NODE_ENV === 'production' ? '/25-26-study-js-deep-dive' : '';

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
      .catch((err) => {
        console.error('[SourceView] Error fetching comments:', err);
        setComments([]);
      });

    // MDX 소스 파일 가져오기
    // GitHub raw URL을 사용하거나 public 폴더에 있는 경우
    const repoUrl = 'https://raw.githubusercontent.com/gdgoc-konkuk/25-26-study-js-deep-dive/main';
    const filePath = possiblePaths[1]; // 두 번째 경로가 가장 정확

    fetch(`${repoUrl}/${filePath}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch source');
        return res.text();
      })
      .then(source => {
        setSourceCode(source);
      })
      .catch((err) => {
        console.error('[SourceView] Error fetching source:', err);
        setSourceCode('소스 파일을 불러올 수 없습니다.');
      });
  }, [pathname, isSourceView]);

  const toggleLine = (lineNum: number) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineNum)) {
      newExpanded.delete(lineNum);
    } else {
      newExpanded.add(lineNum);
    }
    setExpandedLines(newExpanded);
  };

  const lines = sourceCode.split('\n');
  const commentsByLine = comments.reduce((acc, comment) => {
    const lineNum = comment.lineNumber || 0;
    if (!acc[lineNum]) acc[lineNum] = [];
    acc[lineNum].push(comment);
    return acc;
  }, {} as Record<number, CommentWithPR[]>);

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsSourceView(!isSourceView)}
        className="fixed left-4 bottom-20 bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-all z-50 flex items-center gap-2"
        title={isSourceView ? '소스 보기 닫기' : '소스 보기 (PR 리뷰)'}
      >
        <span>📄</span>
        <span>{isSourceView ? '닫기' : '소스 보기'}</span>
      </button>

      {/* 오버레이 */}
      {isSourceView && (
        <div
          className="fixed inset-0 bg-black/10 z-30"
          onClick={() => setIsSourceView(false)}
        />
      )}

      {/* 사이드 패널 */}
      <div
        className={`fixed right-0 top-0 h-full w-1/2 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 z-40 overflow-hidden flex flex-col border-l ${
          isSourceView ? 'translate-x-0' : 'translate-x-full'
        }`}
      >

        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">📄 소스 보기 (PR 리뷰)</h2>
            <span className="text-sm text-gray-500">
              {comments.length}개 리뷰 댓글
            </span>
          </div>
          <button
            onClick={() => setIsSourceView(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* 소스 코드 뷰어 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="w-full">
          <pre className="text-sm font-mono bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {lines.map((line, index) => {
              const lineNum = index + 1;
              const lineComments = commentsByLine[lineNum] || [];
              const hasComments = lineComments.length > 0;
              const isExpanded = expandedLines.has(lineNum);

              return (
                <div key={index} className="group">
                  <div className="flex items-start hover:bg-gray-100 dark:hover:bg-gray-700">
                    {/* 라인 번호 */}
                    <span className="select-none text-gray-400 dark:text-gray-600 pr-4 text-right min-w-[4rem] inline-block sticky left-0 bg-gray-50 dark:bg-gray-800">
                      {lineNum}
                    </span>

                    {/* 소스 라인 */}
                    <span
                      className={`flex-1 whitespace-pre-wrap break-words ${
                        hasComments
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 pl-2'
                          : ''
                      }`}
                    >
                      {line || ' '}
                    </span>

                    {/* 댓글 인디케이터 */}
                    {hasComments && (
                      <button
                        onClick={() => toggleLine(lineNum)}
                        className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors sticky right-4 opacity-0 group-hover:opacity-100"
                        title={`${lineComments.length}개 댓글`}
                      >
                        💬 {lineComments.length}
                      </button>
                    )}
                  </div>

                  {/* 인라인 댓글 */}
                  {hasComments && isExpanded && (
                    <div className="ml-16 mb-4 mt-2 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-r">
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
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2 block"
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
                            {comment.type === 'review-comment' && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                                코드 리뷰
                              </span>
                            )}
                          </div>

                          {/* 댓글 내용 */}
                          <div
                            className="text-sm prose dark:prose-invert prose-sm max-w-none mb-2"
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
                                  className="bg-white dark:bg-gray-800 rounded p-3 text-xs"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <img
                                      src={reply.author.avatarUrl}
                                      alt={reply.author.name}
                                      className="w-5 h-5 rounded-full"
                                    />
                                    <span className="font-medium">{reply.author.name}</span>
                                    <span className="text-gray-500">
                                      {new Date(reply.createdAt).toLocaleDateString('ko-KR')}
                                    </span>
                                  </div>
                                  <div
                                    className="prose dark:prose-invert prose-xs max-w-none mb-1"
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
      </div>
      </div>
    </>
  );
}
