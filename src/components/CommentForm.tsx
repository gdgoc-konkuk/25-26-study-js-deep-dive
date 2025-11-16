'use client';

// 댓글 작성 폼 (핵심 컴포넌트!)

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { CreateCommentRequest } from '@/types/api';

interface CommentFormProps {
  filePath: string; // 현재 파일 경로
  lineNumber?: number; // 라인 번호 (코드 리뷰 댓글)
  selectedText?: string; // 선택된 텍스트 (텍스트 선택 댓글)
  inReplyTo?: number; // 답글인 경우 부모 댓글 ID
  onSuccess?: (commentId: number) => void; // 댓글 작성 성공 시 콜백
  onCancel?: () => void; // 취소 시 콜백
  placeholder?: string;
}

export function CommentForm({
  filePath,
  lineNumber,
  selectedText,
  inReplyTo,
  onSuccess,
  onCancel,
  placeholder = '댓글을 입력하세요... (마크다운 지원)',
}: CommentFormProps) {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [body, setBody] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!body.trim()) {
      setError('댓글 내용을 입력해주세요.');
      return;
    }

    // 비로그인 시 익명 이름 확인
    if (!isAuthenticated && !anonymousName.trim()) {
      setError('익명 이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: CreateCommentRequest = {
        filePath,
        body: body.trim(),
        lineNumber,
        selectedText,
        inReplyTo,
        anonymousName: !isAuthenticated ? anonymousName.trim() : undefined,
      };

      const response = await fetch('/api/comments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '댓글 작성에 실패했습니다.');
      }

      const data = await response.json();

      // 성공
      setBody('');
      setAnonymousName('');
      onSuccess?.(data.comment.id);

      toast.success('댓글이 작성되었습니다! 🎉');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 로그인된 사용자 프로필 표시 */}
        {isAuthenticated && user && (
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <img
                src={user.avatarUrl}
                alt={user.name || user.login}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.name || user.login}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  @{user.login}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              로그아웃
            </button>
          </div>
        )}

        {/* 비로그인 시 익명 이름 입력 */}
        {!isAuthenticated && (
          <div>
            <label htmlFor="anonymous-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              이름 (익명)
            </label>
            <input
              type="text"
              id="anonymous-name"
              value={anonymousName}
              onChange={(e) => setAnonymousName(e.target.value)}
              placeholder="익명"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* 댓글 입력 */}
        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            마크다운 형식을 사용할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {!isAuthenticated && (
              <p>
                <button
                  type="button"
                  onClick={login}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  GitHub로 로그인
                </button>
                하여 본인 이름으로 댓글을 작성하세요.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                취소
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !body.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '작성 중...' : '댓글 작성'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
