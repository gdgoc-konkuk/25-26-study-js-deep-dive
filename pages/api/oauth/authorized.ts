// GitHub OAuth callback 엔드포인트

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, saveSession } from '@/lib/session';
import {
  exchangeCodeForToken,
  getAuthenticatedUser,
  getTokenExpiry,
} from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: '지원하지 않는 메서드입니다.' });
    return;
  }

  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Authorization code가 필요합니다.' });
    return;
  }

  try {
    console.log('🔐 OAuth 콜백 시작:', { code: code.substring(0, 10) + '...' });

    // 1. Authorization code를 Access token으로 교환
    const accessToken = await exchangeCodeForToken(code);
    console.log('✅ Access Token 획득:', accessToken ? '성공' : '실패');

    // 2. Access token으로 사용자 정보 가져오기
    const user = await getAuthenticatedUser(accessToken);
    console.log('✅ 사용자 정보 획득:', user.login);

    // 3. 세션에 저장
    const session = await getSession(req, res);
    const expiresAt = getTokenExpiry();
    console.log('📦 세션 데이터:', {
      user: user.login,
      hasToken: !!accessToken,
      expiresAt: new Date(expiresAt).toISOString()
    });

    await saveSession(session, {
      user,
      accessToken,
      expiresAt,
    });
    console.log('✅ 세션 저장 완료');

    // 디버깅: 쿠키 헤더 확인
    console.log('🍪 [OAuth] 요청 쿠키:', req.headers.cookie || 'none');

    // 4. 원래 페이지로 리다이렉트 (또는 홈으로)
    const redirectUrl = req.cookies['pr-comments-redirect'] || '/';
    console.log('🔄 리다이렉트:', redirectUrl);
    // 리다이렉트 쿠키는 이미 max-age=600 (10분)으로 설정되어 자동 만료됨

    res.redirect(redirectUrl);
    return;
  } catch (error) {
    console.error('❌ OAuth 인증 실패:', error);
    res.status(500).json({
      error: 'OAuth 인증에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
}
