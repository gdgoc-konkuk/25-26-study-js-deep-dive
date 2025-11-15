// 로그아웃 API

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, destroySession } from '@/lib/session';
import type { LogoutResponse } from '@/types/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false });
    return;
  }

  try {
    const session = await getSession(req, res);
    await destroySession(session);

    res.json({ success: true });
  } catch (error) {
    console.error('로그아웃 실패:', error);
    res.status(500).json({ success: false });
  }
}
