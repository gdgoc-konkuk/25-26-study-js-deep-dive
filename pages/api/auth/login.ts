// GitHub OAuth 로그인 엔드포인트

import type { NextApiRequest, NextApiResponse } from 'next';
import { getOAuthUrl } from '@/lib/auth';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: '지원하지 않는 메서드입니다.' });
    return;
  }

  try {
    // GitHub OAuth URL 생성 및 리다이렉트
    const oauthUrl = getOAuthUrl();
    res.redirect(oauthUrl);
  } catch (error) {
    console.error('OAuth URL 생성 실패:', error);
    res.status(500).json({
      error: 'OAuth URL 생성에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
}
