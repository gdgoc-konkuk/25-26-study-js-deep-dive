'use client';

// 댓글 액션 버튼 (수정, 삭제, 답글)

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Comment } from '@/types/pr';

interface CommentActionsProps {
  comment: Comment;
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
}

export function CommentActions({ comment, onEdit, onDelete, onReply }: CommentActionsProps) {
  const { isAuthenticated, user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // 본인 댓글인지 확인
  const isOwner = isAuthenticated && user && comment.author.name === user.login;

  const handleDelete = async () => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/comments/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: comment.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '댓글 삭제에 실패했습니다.');
      }

      onDelete?.();
      alert('댓글이 삭제되었습니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* 답글 버튼 (모든 사용자) */}
      {onReply && (
        <button
          onClick={onReply}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          답글
        </button>
      )}

      {/* 수정 버튼 (본인만) */}
      {isOwner && onEdit && (
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          수정
        </button>
      )}

      {/* 삭제 버튼 (본인만) */}
      {isOwner && onDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 font-medium disabled:text-gray-400"
        >
          {isDeleting ? '삭제 중...' : '삭제'}
        </button>
      )}

      {/* GitHub 원본 링크 */}
      <a
        href={comment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:text-gray-700"
      >
        GitHub에서 보기 →
      </a>
    </div>
  );
}
