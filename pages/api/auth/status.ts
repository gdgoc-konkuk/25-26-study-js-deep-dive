// 현재 인증 상태 확인 API

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, isSessionValid } from '@/lib/session';
import type { AuthStatusResponse } from '@/types/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthStatusResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).json({ isAuthenticated: false });
    return;
  }

  try {
    const session = await getSession(req, res);
    console.log('🔍 세션 확인:', {
      hasUser: !!session.user,
      hasToken: !!session.accessToken,
      expiresAt: session.expiresAt ? new Date(session.expiresAt).toISOString() : 'null',
      isExpired: session.expiresAt ? session.expiresAt < Date.now() : 'no-expiry',
    });

    // 세션 유효성 확인
    if (!isSessionValid(session)) {
      console.log('❌ 세션 무효');
      res.json({ isAuthenticated: false });
      return;
    }

    // 사용자 정보 반환
    console.log('✅ 세션 유효:', session.user?.login);
    res.json({
      isAuthenticated: true,
      user: session.user,
    });
  } catch (error) {
    console.error('❌ 세션 확인 실패:', error);
    res.json({ isAuthenticated: false });
  }
}
