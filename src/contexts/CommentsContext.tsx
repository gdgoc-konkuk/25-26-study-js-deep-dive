'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { Comment } from '../types/pr';

// PR 정보 타입
export interface PRInfo {
  number: number;
  title: string;
  url: string;
}

// 댓글 데이터 상태
interface CommentData {
  comments: Comment[];
  prInfo: PRInfo | null;
  isLoading: boolean;
  error: string | null;
}

// Context 타입
interface CommentsContextType {
  // filePath별로 댓글 데이터를 관리
  getComments: (filePath: string) => CommentData;
  loadComments: (filePath: string) => Promise<void>;
  clearComments: (filePath: string) => void;
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

export function CommentsProvider({ children }: { children: ReactNode }) {
  // filePath를 키로 하는 댓글 데이터 맵
  const [commentsMap, setCommentsMap] = useState<Map<string, CommentData>>(new Map());

  // 기본 데이터 구조
  const getDefaultData = (): CommentData => ({
    comments: [],
    prInfo: null,
    isLoading: false,
    error: null,
  });

  // 특정 filePath의 댓글 데이터 가져오기
  const getComments = useCallback((filePath: string): CommentData => {
    return commentsMap.get(filePath) || getDefaultData();
  }, [commentsMap]);

  // 댓글 로드 함수
  const loadComments = useCallback(async (filePath: string) => {
    console.log(`[CommentsContext] 댓글 로드 시작: ${filePath}`);

    // 로딩 상태 설정
    setCommentsMap(prev => new Map(prev).set(filePath, {
      ...(prev.get(filePath) || getDefaultData()),
      isLoading: true,
      error: null,
    }));

    try {
      const response = await fetch(`/api/comments/list?filePath=${encodeURIComponent(filePath)}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[CommentsContext] 댓글 로드 성공:`, data.comments?.length || 0, '개');

      // 성공 시 데이터 업데이트
      setCommentsMap(prev => new Map(prev).set(filePath, {
        comments: data.comments || [],
        prInfo: {
          number: data.prNumber,
          title: data.prTitle,
          url: data.prUrl,
        },
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error(`[CommentsContext] 댓글 로드 실패:`, error);

      // 실패 시 에러 상태 설정
      setCommentsMap(prev => new Map(prev).set(filePath, {
        comments: [],
        prInfo: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  // 댓글 데이터 클리어
  const clearComments = useCallback((filePath: string) => {
    setCommentsMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(filePath);
      return newMap;
    });
  }, []);

  return (
    <CommentsContext.Provider value={{ getComments, loadComments, clearComments }}>
      {children}
    </CommentsContext.Provider>
  );
}

// useComments 훅
export function useComments(filePath: string) {
  const context = useContext(CommentsContext);

  if (!context) {
    throw new Error('useComments must be used within CommentsProvider');
  }

  const { getComments, loadComments, clearComments } = context;
  const data = getComments(filePath);

  // 새로고침 함수
  const refetch = useCallback(async () => {
    await loadComments(filePath);
  }, [filePath, loadComments]);

  // 초기 로드 - useEffect로 이동
  useEffect(() => {
    // 데이터가 없고, 로딩 중이 아니고, 에러가 없으면 로드
    if (data.comments.length === 0 && !data.isLoading && !data.error) {
      loadComments(filePath);
    }
  }, [filePath]); // filePath 변경 시에만 재실행

  return {
    comments: data.comments,
    prInfo: data.prInfo,
    isLoading: data.isLoading,
    error: data.error,
    refetch,
    clear: () => clearComments(filePath),
  };
}
