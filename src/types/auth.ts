// 인증 관련 타입 정의

/**
 * GitHub 사용자 정보
 */
export interface User {
  login: string; // GitHub 사용자명
  name: string | null; // 표시 이름
  email: string | null; // 이메일
  avatarUrl: string; // 프로필 이미지 URL
  profileUrl: string; // GitHub 프로필 URL
}

/**
 * 인증 상태
 */
export interface AuthStatus {
  isAuthenticated: boolean; // 로그인 여부
  user: User | null; // 사용자 정보 (로그인 시에만)
  isLoading: boolean; // 로딩 중 여부
}

/**
 * 세션 데이터 (iron-session)
 */
export interface SessionData {
  user?: User;
  accessToken?: string; // GitHub OAuth access token
  expiresAt?: number; // 토큰 만료 시각 (timestamp)
}

/**
 * OAuth 토큰 교환 응답
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}
