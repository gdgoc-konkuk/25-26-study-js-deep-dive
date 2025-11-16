// 댓글 작성 API (핵심!)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, isSessionValid, getSessionToken } from '@/lib/session';
import { getAuthenticatedClient, getBotClient, getRepositoryInfo } from '@/lib/github';
import { getOrCreateTargetPR } from '@/lib/pr-manager';
import type { CreateCommentRequest, CreateCommentResponse, ApiError } from '@/types/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateCommentResponse | ApiError>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: '지원하지 않는 메서드입니다.' });
    return;
  }

  const { filePath, body, lineNumber, selectedText, inReplyTo, anonymousName }: CreateCommentRequest = req.body;

  // 필수 파라미터 검증
  if (!filePath || !body) {
    res.status(400).json({ error: 'filePath와 body는 필수입니다.' });
    return;
  }

  try {
    const session = await getSession(req, res);
    const { owner, repo } = getRepositoryInfo();

    // 1. PR 자동 매칭 (기존 PR 찾기 또는 새로 생성&병합)
    const prNumber = await getOrCreateTargetPR(filePath);

    // 2. 세션 확인 (로그인 여부)
    const isAuthenticated = isSessionValid(session);
    let octokit;
    let commentBody = body;

    if (isAuthenticated) {
      // OAuth 로그인 사용자: 본인 이름으로 댓글 작성
      const token = getSessionToken(session);
      if (!token) {
        res.status(401).json({ error: '토큰이 유효하지 않습니다.' });
        return;
      }
      octokit = getAuthenticatedClient(token);
    } else {
      // 비로그인 사용자: Bot으로 댓글 작성
      octokit = await getBotClient();

      // 댓글 본문에 작성자 정보 추가
      const author = anonymousName || '익명';
      const timestamp = new Date().toISOString();
      commentBody = `> **작성자**: ${author}
> **작성 시각**: ${timestamp}

${body}`;
    }

    // 3. 메타데이터 구성
    let metadata = `_파일: \`${filePath}\``;
    if (lineNumber) {
      metadata += `, 라인: ${lineNumber}`;
    }
    if (selectedText) {
      metadata += `_\n> ${selectedText}\n\n`;
    } else {
      metadata += '_\n\n';
    }

    // 4. 댓글 작성
    let comment;

    if (lineNumber || selectedText) {
      // 코드 리뷰 댓글 또는 텍스트 선택 댓글
      // 주의: 코드 리뷰 댓글은 PR이 open 상태일 때만 가능
      // merged PR에는 일반 댓글만 추가 가능
      const { data } = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `${metadata}${commentBody}`,
      });
      comment = data;
    } else if (inReplyTo) {
      // 답글 (일반 댓글에 답글)
      const { data } = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody,
      });
      comment = data;
    } else {
      // 일반 댓글
      const { data } = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody,
      });
      comment = data;
    }

    // 4. 응답
    res.status(201).json({
      success: true,
      comment: {
        id: comment.id,
        prNumber,
        htmlUrl: comment.html_url,
        createdAt: comment.created_at,
      },
    });
  } catch (error) {
    console.error('댓글 작성 실패:', error);
    res.status(500).json({
      error: '댓글 작성에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
}
