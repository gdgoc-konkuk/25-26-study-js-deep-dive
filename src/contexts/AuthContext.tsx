'use client';

// 인증 Context 및 Provider

import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthStatus } from '@/types/auth';

interface AuthContextValue extends AuthStatus {
  login: () => void;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  // 인증 상태 가져오기
  const fetchAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();

      setAuthStatus({
        isAuthenticated: data.isAuthenticated,
        user: data.user || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      setAuthStatus({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  };

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    fetchAuthStatus();

    // 페이지 포커스 시 인증 상태 재확인 (OAuth 리다이렉트 후 돌아왔을 때)
    const handleFocus = () => {
      fetchAuthStatus();
    };

    // 페이지 visibility 변경 시 인증 상태 재확인
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAuthStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 로그인 (GitHub OAuth)
  const login = () => {
    // 현재 페이지 URL 저장 (리다이렉트용)
    const currentUrl = window.location.pathname;
    document.cookie = `pr-comments-redirect=${currentUrl}; path=/; max-age=600`; // 10분

    // 서버의 /api/auth/login 엔드포인트로 이동 (OAuth URL 생성 및 리다이렉트)
    window.location.href = '/api/auth/login';
  };

  // 로그아웃
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });

      setAuthStatus({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const value: AuthContextValue = {
    ...authStatus,
    login,
    logout,
    refetch: fetchAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
