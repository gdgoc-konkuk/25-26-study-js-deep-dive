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
  }, []);

  // 로그인 (GitHub OAuth)
  const login = () => {
    // 현재 페이지 URL 저장 (리다이렉트용)
    const currentUrl = window.location.pathname;
    document.cookie = `pr-comments-redirect=${currentUrl}; path=/; max-age=600`; // 10분

    // GitHub OAuth URL로 이동
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

    if (!clientId) {
      console.error('GITHUB_CLIENT_ID가 설정되지 않았습니다.');
      alert('GitHub OAuth 설정이 필요합니다. .env.local을 확인해주세요.');
      return;
    }

    const redirectUri = `${siteUrl}/api/oauth/authorized`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_repo`;

    window.location.href = authUrl;
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
