// 댓글 삭제 API

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, isSessionValid, getSessionToken, getSessionUser } from '@/lib/session';
import { getAuthenticatedClient, getRepositoryInfo } from '@/lib/github';
import type { DeleteCommentRequest, DeleteCommentResponse, ApiError } from '@/types/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteCommentResponse | ApiError>
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: '지원하지 않는 메서드입니다.' });
  }

  const { commentId }: DeleteCommentRequest = req.body;

  // 필수 파라미터 검증
  if (!commentId) {
    return res.status(400).json({ error: 'commentId는 필수입니다.' });
  }

  try {
    const session = await getSession(req, res);
    const { owner, repo } = getRepositoryInfo();

    // 로그인 필수
    if (!isSessionValid(session)) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const token = getSessionToken(session);
    const user = getSessionUser(session);

    if (!token || !user) {
      return res.status(401).json({ error: '인증 정보가 유효하지 않습니다.' });
    }

    const octokit = getAuthenticatedClient(token);

    // 1. 기존 댓글 가져오기 (권한 검증용)
    const { data: existingComment } = await octokit.issues.getComment({
      owner,
      repo,
      comment_id: commentId,
    });

    // 2. 본인 댓글인지 확인
    if (existingComment.user?.login !== user.login) {
      return res.status(403).json({ error: '본인 댓글만 삭제할 수 있습니다.' });
    }

    // 3. 댓글 삭제
    await octokit.issues.deleteComment({
      owner,
      repo,
      comment_id: commentId,
    });

    // 4. 응답
    return res.json({ success: true });
  } catch (error) {
    console.error('댓글 삭제 실패:', error);
    return res.status(500).json({
      error: '댓글 삭제에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
}
