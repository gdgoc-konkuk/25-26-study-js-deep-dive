// iron-session 설정 및 세션 관리

import { getIronSession, type IronSession } from 'iron-session';
import type { SessionData } from '@/types/auth';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * iron-session 설정
 */
const sessionOptions = {
  password: process.env.AUTH_SECRET as string,
  cookieName: 'pr-comments-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7일
  },
};

/**
 * API Routes에서 세션 가져오기
 * @param req - Next.js API Request
 * @param res - Next.js API Response
 * @returns 세션 인스턴스
 */
export async function getSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<IronSession<SessionData>> {
  if (!process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET 환경 변수가 설정되지 않았습니다.');
  }

  return getIronSession<SessionData>(req, res, sessionOptions);
}

/**
 * 세션에서 사용자 정보 가져오기
 * @param session - iron-session 인스턴스
 * @returns 사용자 정보 또는 null
 */
export function getSessionUser(session: IronSession<SessionData>) {
  return session.user || null;
}

/**
 * 세션에서 Access Token 가져오기
 * @param session - iron-session 인스턴스
 * @returns Access Token 또는 null
 */
export function getSessionToken(session: IronSession<SessionData>) {
  return session.accessToken || null;
}

/**
 * 세션이 유효한지 확인
 * @param session - iron-session 인스턴스
 * @returns 유효 여부
 */
export function isSessionValid(session: IronSession<SessionData>): boolean {
  const { user, accessToken, expiresAt } = session;

  if (!user || !accessToken) {
    return false;
  }

  // 토큰 만료 확인
  if (expiresAt && expiresAt < Date.now()) {
    return false;
  }

  return true;
}

/**
 * 세션 저장
 * @param session - iron-session 인스턴스
 * @param data - 저장할 세션 데이터
 */
export async function saveSession(
  session: IronSession<SessionData>,
  data: SessionData
): Promise<void> {
  session.user = data.user;
  session.accessToken = data.accessToken;
  session.expiresAt = data.expiresAt;

  await session.save();
}

/**
 * 세션 삭제 (로그아웃)
 * @param session - iron-session 인스턴스
 */
export async function destroySession(
  session: IronSession<SessionData>
): Promise<void> {
  session.destroy();
  await session.save();
}
