'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { Comment } from '../types/pr';
import CommentReactions from './CommentReactions';
import { useComments } from '../contexts/CommentsContext';

interface CommentWithPR extends Comment {
  prNumber: number;
  prTitle: string;
  prUrl: string;
}

interface CodeBlockWithCommentsProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export default function CodeBlockWithComments({
  children,
  className,
  ...props
}: CodeBlockWithCommentsProps) {
  const pathname = usePathname();
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

  // 현재 파일 경로 계산
  const pathParts = pathname?.replace(/^\//, '').split('/') || [];
  const convertedPath = pathParts.map(p => decodeURIComponent(p).replace(/-/g, ' ')).join('/');
  const filePath = `src/content/${convertedPath}.mdx`;

  // useComments 훅으로 댓글 데이터 가져오기 (동적 API 사용)
  const { comments: rawComments, prInfo } = useComments(filePath);

  // 댓글에 PR 정보 추가 (CommentWithPR 타입으로 변환)
  const comments = useMemo<CommentWithPR[]>(() => {
    if (!prInfo || !rawComments) return [];

    // 인라인 리뷰 댓글만 필터링 (lineNumber가 있는 것만)
    return rawComments
      .filter(comment => comment.type === 'review-comment' && comment.lineNumber)
      .map(comment => ({
        ...comment,
        prNumber: prInfo.number,
        prTitle: prInfo.title,
        prUrl: prInfo.url,
      }));
  }, [rawComments, prInfo]);

  // 코드를 라인별로 분리
  // children이 React element일 수 있으므로 텍스트 추출
  let code = '';
  if (typeof children === 'string') {
    code = children;
  } else if (children && typeof children === 'object' && 'props' in children) {
    // React element인 경우 children.props.children에서 추출
    const innerChildren = (children as any).props?.children;
    code = typeof innerChildren === 'string' ? innerChildren : innerChildren?.toString() || '';
  } else {
    code = children?.toString() || '';
  }

  const lines = code.split('\n');

  // 각 라인에 달린 댓글 그룹화
  const commentsByLine = comments.reduce((acc, comment) => {
    const lineNum = comment.lineNumber || 0;
    if (!acc[lineNum]) acc[lineNum] = [];
    acc[lineNum].push(comment);
    return acc;
  }, {} as Record<number, CommentWithPR[]>);

  const toggleLine = (lineNum: number) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineNum)) {
      newExpanded.delete(lineNum);
    } else {
      newExpanded.add(lineNum);
    }
    setExpandedLines(newExpanded);
  };

  // 댓글이 없으면 일반 코드 블록 렌더링
  if (comments.length === 0) {
    return (
      <pre className={className} {...props}>
        <code>{children}</code>
      </pre>
    );
  }

  return (
    <div className="relative group">
      <pre className={className} {...props}>
        <code>
          {lines.map((line, index) => {
            const lineNum = index + 1;
            const lineComments = commentsByLine[lineNum] || [];
            const hasComments = lineComments.length > 0;
            const isExpanded = expandedLines.has(lineNum);

            return (
              <div key={index} className="relative">
                <div className="flex items-start">
                  {/* 라인 번호 */}
                  <span className="select-none text-gray-500 dark:text-gray-600 pr-4 text-right min-w-[3rem] inline-block">
                    {lineNum}
                  </span>

                  {/* 코드 라인 */}
                  <span
                    className={`flex-1 ${
                      hasComments ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                    }`}
                  >
                    {line}
                  </span>

                  {/* 댓글 인디케이터 */}
                  {hasComments && (
                    <button
                      onClick={() => toggleLine(lineNum)}
                      className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                      title={`${lineComments.length}개 댓글`}
                    >
                      💬 {lineComments.length}
                    </button>
                  )}
                </div>

                {/* 인라인 댓글 */}
                {hasComments && isExpanded && (
                  <div className="mt-2 mb-2 ml-12 mr-2 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-r">
                    {lineComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 border-b last:border-b-0 border-blue-200 dark:border-blue-800"
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
                            className="w-5 h-5 rounded-full"
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
                                className="bg-white dark:bg-gray-800 rounded p-2 text-xs"
                              >
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
        </code>
      </pre>
    </div>
  );
}
