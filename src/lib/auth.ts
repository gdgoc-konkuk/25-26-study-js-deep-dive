// GitHub OAuth 헬퍼 함수

import type { User, OAuthTokenResponse } from '@/types/auth';

/**
 * GitHub OAuth URL 생성
 * @param redirectUri - 리다이렉트 URI (callback URL)
 * @returns GitHub OAuth 인증 URL
 */
export function getOAuthUrl(redirectUri?: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID 환경 변수가 설정되지 않았습니다.');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const callback = redirectUri || `${siteUrl}/api/oauth/authorized`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback,
    scope: 'public_repo', // PR 댓글 작성에 필요한 권한
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Authorization code를 Access token으로 교환
 * @param code - GitHub OAuth authorization code
 * @returns Access token
 */
export async function exchangeCodeForToken(
  code: string
): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'GITHUB_CLIENT_ID 및 GITHUB_CLIENT_SECRET 환경 변수가 설정되지 않았습니다.'
    );
  }

  const response = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Access token 교환 실패');
  }

  const data: OAuthTokenResponse = await response.json();

  if (!data.access_token) {
    throw new Error('Access token을 받지 못했습니다.');
  }

  return data.access_token;
}

/**
 * Access token으로 GitHub 사용자 정보 가져오기
 * @param token - GitHub OAuth access token
 * @returns 사용자 정보
 */
export async function getAuthenticatedUser(token: string): Promise<User> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('사용자 정보 가져오기 실패');
  }

  const data = await response.json();

  return {
    login: data.login,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    profileUrl: data.html_url,
  };
}

/**
 * 토큰 만료 시각 계산 (기본 7일)
 * @returns 만료 시각 (timestamp)
 */
export function getTokenExpiry(): number {
  const days = parseInt(process.env.TOKEN_VALIDITY_DAYS || '7', 10);
  return Date.now() + days * 24 * 60 * 60 * 1000;
}
