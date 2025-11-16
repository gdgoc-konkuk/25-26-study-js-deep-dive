import type { NextApiRequest, NextApiResponse } from 'next';
import { getBotClient, getRepositoryInfo } from '../../../src/lib/github';
import { getOrCreateTargetPR } from '../../../src/lib/pr-manager';

/**
 * 특정 파일 또는 PR의 댓글 목록을 GitHub API에서 직접 가져오기
 * GET /api/comments/list?filePath=src/content/home.mdx
 * GET /api/comments/list?prNumber=123
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { prNumber: prNumberParam, filePath } = req.query;

  // filePath 또는 prNumber 중 하나는 필수
  if ((!prNumberParam && !filePath) ||
      (typeof prNumberParam !== 'string' && typeof filePath !== 'string')) {
    res.status(400).json({ error: 'filePath 또는 prNumber가 필요합니다.' });
    return;
  }

  try {
    const octokit = await getBotClient();
    const { owner, repo } = getRepositoryInfo();

    // filePath가 제공된 경우 PR 번호를 찾음
    let prNumber: number;
    if (filePath && typeof filePath === 'string') {
      console.log(`📋 파일에 대한 댓글 목록 조회: ${filePath}`);
      prNumber = await getOrCreateTargetPR(filePath);
      console.log(`✓ PR #${prNumber}의 댓글을 조회합니다`);
    } else {
      prNumber = parseInt(prNumberParam as string);
    }

    // PR 이슈 댓글 가져오기
    const { data: issueComments } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100,
    });

    // PR 리뷰 댓글 가져오기
    const { data: reviewComments } = await octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    // 댓글 데이터 변환
    const comments = [
      ...issueComments.map((comment) => ({
        id: comment.id,
        type: 'issue-comment',
        body: comment.body || '',
        author: {
          name: comment.user?.login || 'Unknown',
          avatarUrl: comment.user?.avatar_url || '',
          profileUrl: comment.user?.html_url || '',
        },
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        url: comment.html_url,
        reactions: comment.reactions
          ? {
              '+1': comment.reactions['+1'] || 0,
              '-1': comment.reactions['-1'] || 0,
              laugh: comment.reactions.laugh || 0,
              hooray: comment.reactions.hooray || 0,
              confused: comment.reactions.confused || 0,
              heart: comment.reactions.heart || 0,
              rocket: comment.reactions.rocket || 0,
              eyes: comment.reactions.eyes || 0,
            }
          : undefined,
      })),
      ...reviewComments.map((comment) => ({
        id: comment.id,
        type: 'review-comment',
        body: comment.body || '',
        author: {
          name: comment.user?.login || 'Unknown',
          avatarUrl: comment.user?.avatar_url || '',
          profileUrl: comment.user?.html_url || '',
        },
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        url: comment.html_url,
        filePath: comment.path,
        lineNumber: comment.line || comment.original_line,
        reactions: comment.reactions
          ? {
              '+1': comment.reactions['+1'] || 0,
              '-1': comment.reactions['-1'] || 0,
              laugh: comment.reactions.laugh || 0,
              hooray: comment.reactions.hooray || 0,
              confused: comment.reactions.confused || 0,
              heart: comment.reactions.heart || 0,
              rocket: comment.reactions.rocket || 0,
              eyes: comment.reactions.eyes || 0,
            }
          : undefined,
      })),
    ];

    // 시간순 정렬
    comments.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // PR 정보도 함께 반환
    const { data: prData } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    res.status(200).json({
      comments,
      prNumber,
      prTitle: prData.title,
      prUrl: prData.html_url,
    });
  } catch (error) {
    console.error('댓글 목록 조회 실패:', error);
    res.status(500).json({
      error: '댓글 목록 조회에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
}
