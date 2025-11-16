#!/usr/bin/env node

/**
 * 빌드 타임 PR 데이터 생성 스크립트
 * 1. GitHub API에서 merged PR 데이터를 가져와 src/data/prs/ 디렉토리에 저장
 * 2. 저장된 PR 데이터를 읽어서 클라이언트가 사용할 정적 JSON 파일 생성
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PR_DATA_DIR = join(projectRoot, 'src', 'data', 'prs');
const OUTPUT_DIR = join(projectRoot, 'public', 'data');

// GitHub repository 정보 (환경변수 또는 기본값)
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'gdgoc-konkuk/prwiki';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

/**
 * PR 데이터를 요약 형태로 변환
 */
function transformToPRSummary(data) {
  const { pr, comments, reviewComments, reviews, files } = data;

  return {
    number: pr.number,
    title: pr.title,
    state: pr.merged ? 'merged' : pr.state,
    author: {
      name: pr.user.login,
      avatarUrl: pr.user.avatar_url,
      profileUrl: pr.user.html_url,
    },
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at || null,
    url: pr.html_url,
    labels: pr.labels,
    commentCount: comments.length + reviewComments.length + reviews.filter(r => r.body).length,
    reviewCount: reviews.length,
    changedFiles: files.map((f) => f.filename),
    additions: pr.additions,
    deletions: pr.deletions,
  };
}

/**
 * 댓글 본문에서 메타데이터 파싱
 */
function parseCommentMetadata(body) {
  const metadata = {};

  // 메타데이터 형식: _파일: `경로`, 라인: 123_
  // 또는: _파일: `경로`_
  const metadataMatch = body.match(/^_파일: `([^`]+)`(?:, 라인: (\d+))?_/);

  if (metadataMatch) {
    metadata.filePath = metadataMatch[1];
    if (metadataMatch[2]) {
      metadata.lineNumber = parseInt(metadataMatch[2], 10);
    }

    // 메타데이터 다음에 인용문(선택된 텍스트)이 있는지 확인
    // 형식: > 선택된 텍스트
    const quotedTextMatch = body.match(/^_파일: `[^`]+`(?:, 라인: \d+)?_\n> (.+?)(?:\n\n|$)/s);
    if (quotedTextMatch) {
      metadata.selectedText = quotedTextMatch[1].trim();
    }

    // 메타데이터를 제외한 실제 댓글 내용 추출
    metadata.cleanBody = body.replace(/^_파일: `[^`]+`(?:, 라인: \d+)?_\n(?:> .+?\n\n)?/s, '').trim();
  } else {
    metadata.cleanBody = body;
  }

  return metadata;
}

/**
 * PR의 모든 댓글을 통합 형태로 변환 (스레드별 정리 포함)
 */
function transformToComments(data) {
  const { comments, reviewComments, reviews } = data;
  const commentsMap = new Map();

  // 일반 댓글
  comments.forEach((comment) => {
    const metadata = parseCommentMetadata(comment.body);

    commentsMap.set(comment.id, {
      id: comment.id,
      author: {
        name: comment.user.login,
        avatarUrl: comment.user.avatar_url,
        profileUrl: comment.user.html_url,
      },
      body: metadata.cleanBody || comment.body,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      url: comment.html_url,
      type: metadata.lineNumber || metadata.selectedText ? 'review-comment' : 'comment',
      ...(metadata.filePath && { filePath: metadata.filePath }),
      ...(metadata.lineNumber && { lineNumber: metadata.lineNumber }),
      ...(metadata.selectedText && { selectedText: metadata.selectedText }),
      reactions: comment.reactions || {
        '+1': 0,
        '-1': 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 0,
        rocket: 0,
        eyes: 0,
      },
      replies: [],
      inReplyToId: null,
    });
  });

  // 리뷰 댓글 (스레드 정보 포함)
  reviewComments.forEach((comment) => {
    const metadata = parseCommentMetadata(comment.body);

    commentsMap.set(comment.id, {
      id: comment.id,
      author: {
        name: comment.user.login,
        avatarUrl: comment.user.avatar_url,
        profileUrl: comment.user.html_url,
      },
      body: metadata.cleanBody || comment.body,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      url: comment.html_url,
      type: 'review-comment',
      filePath: comment.path,
      lineNumber: comment.line || comment.original_line,
      ...(metadata.selectedText && { selectedText: metadata.selectedText }),
      reactions: comment.reactions || {
        '+1': 0,
        '-1': 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 0,
        rocket: 0,
        eyes: 0,
      },
      replies: [],
      inReplyToId: comment.in_reply_to_id || null,
    });
  });

  // 리뷰 본문
  reviews
    .filter((review) => review.body && review.body.trim() !== '')
    .forEach((review) => {
      commentsMap.set(review.id, {
        id: review.id,
        author: {
          name: review.user.login,
          avatarUrl: review.user.avatar_url,
          profileUrl: review.user.html_url,
        },
        body: review.body || '',
        createdAt: review.submitted_at,
        updatedAt: review.submitted_at,
        url: review.html_url,
        type: 'review',
        reactions: {
          '+1': 0,
          '-1': 0,
          laugh: 0,
          hooray: 0,
          confused: 0,
          heart: 0,
          rocket: 0,
          eyes: 0,
        },
        replies: [],
        inReplyToId: null,
      });
    });

  // 스레드 구조 생성
  const rootComments = [];
  commentsMap.forEach((comment) => {
    if (comment.inReplyToId && commentsMap.has(comment.inReplyToId)) {
      // 답글인 경우 부모 댓글의 replies에 추가
      const parent = commentsMap.get(comment.inReplyToId);
      parent.replies.push(comment);
    } else {
      // 최상위 댓글
      rootComments.push(comment);
    }
  });

  return rootComments;
}

/**
 * GitHub API에서 데이터 가져오기
 */
async function fetchFromGitHub(url) {
  const headers = {
    'Accept': 'application/vnd.github+json',
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * 모든 merged PR 가져오기
 */
async function fetchAllMergedPRs() {
  console.log('📥 Fetching merged PRs from GitHub API...');

  const mergedPRs = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/pulls?state=closed&per_page=${perPage}&page=${page}`;
    const prs = await fetchFromGitHub(url);

    if (prs.length === 0) break;

    // merged된 PR만 필터링
    const merged = prs.filter(pr => pr.merged_at !== null);
    mergedPRs.push(...merged);

    console.log(`   Page ${page}: Found ${merged.length} merged PRs (${prs.length} total closed)`);

    if (prs.length < perPage) break;
    page++;
  }

  console.log(`✅ Total merged PRs found: ${mergedPRs.length}`);
  return mergedPRs;
}

/**
 * 특정 PR의 전체 데이터 가져오기
 */
async function fetchPRDetails(prNumber) {
  const [pr, comments, reviewComments, reviews, files] = await Promise.all([
    fetchFromGitHub(`https://api.github.com/repos/${GITHUB_REPO}/pulls/${prNumber}`),
    fetchFromGitHub(`https://api.github.com/repos/${GITHUB_REPO}/issues/${prNumber}/comments`),
    fetchFromGitHub(`https://api.github.com/repos/${GITHUB_REPO}/pulls/${prNumber}/comments`),
    fetchFromGitHub(`https://api.github.com/repos/${GITHUB_REPO}/pulls/${prNumber}/reviews`),
    fetchFromGitHub(`https://api.github.com/repos/${GITHUB_REPO}/pulls/${prNumber}/files`),
  ]);

  return {
    pr,
    comments,
    reviewComments,
    reviews,
    files,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 로컬에 저장된 PR 데이터 확인
 */
async function getExistingPRNumbers() {
  try {
    const files = await readdir(PR_DATA_DIR);
    return files
      .filter(f => f.startsWith('pr-') && f.endsWith('.json'))
      .map(f => parseInt(f.match(/pr-(\d+)\.json/)[1]));
  } catch {
    return [];
  }
}

/**
 * GitHub에서 merged PR 데이터를 가져와서 로컬에 저장
 */
async function syncMergedPRs() {
  console.log('🔄 Syncing merged PRs from GitHub...');

  if (!GITHUB_TOKEN) {
    console.log('ℹ️  No GitHub token found. Using unauthenticated API (rate limit: 60 requests/hour)');
    console.log('   For higher rate limits, set GITHUB_TOKEN or GH_TOKEN environment variable.');
  }

  // PR 데이터 디렉토리 생성
  await mkdir(PR_DATA_DIR, { recursive: true });

  const existingPRNumbers = await getExistingPRNumbers();
  const mergedPRs = await fetchAllMergedPRs();

  // 로컬에 없는 merged PR만 가져오기
  const missingPRs = mergedPRs.filter(pr => !existingPRNumbers.includes(pr.number));

  if (missingPRs.length === 0) {
    console.log('✅ All merged PRs are already synced.');
    return;
  }

  console.log(`📥 Fetching details for ${missingPRs.length} missing PRs...`);

  for (const pr of missingPRs) {
    try {
      console.log(`   Fetching PR #${pr.number}: ${pr.title}`);
      const prData = await fetchPRDetails(pr.number);
      const filePath = join(PR_DATA_DIR, `pr-${pr.number}.json`);
      await writeFile(filePath, JSON.stringify(prData, null, 2));
      console.log(`   ✅ Saved: pr-${pr.number}.json`);
    } catch (error) {
      console.error(`   ❌ Failed to fetch PR #${pr.number}:`, error.message);
    }
  }

  console.log('✅ PR sync complete!');
}

async function main() {
  console.log('🚀 Starting PR data generation...');

  // 1. GitHub에서 merged PR 동기화
  try {
    await syncMergedPRs();
  } catch (error) {
    console.log('⚠️  Failed to sync from GitHub, using local data only:', error.message);
  }

  // 2. output 디렉토리 생성
  await mkdir(OUTPUT_DIR, { recursive: true });

  // 3. PR 데이터 파일 읽기
  let prFiles;
  try {
    prFiles = await readdir(PR_DATA_DIR);
    prFiles = prFiles.filter(f => f.startsWith('pr-') && f.endsWith('.json'));
  } catch (error) {
    console.log('⚠️  No PR data found. Creating empty data files...');
    prFiles = [];
  }

  const allPRs = [];
  const prsByFile = {};

  // 각 PR 데이터 처리
  for (const file of prFiles) {
    const filePath = join(PR_DATA_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const prData = JSON.parse(content);

    // PR 요약 생성
    const summary = transformToPRSummary(prData);
    const comments = transformToComments(prData);

    allPRs.push(summary);

    // 파일별 PR 매핑 생성
    prData.files.forEach((changedFile) => {
      const fileName = changedFile.filename;
      if (!prsByFile[fileName]) {
        prsByFile[fileName] = [];
      }
      prsByFile[fileName].push({
        pr: summary,
        comments: comments,
      });
    });
  }

  // 최근 업데이트 순으로 정렬
  allPRs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  // prs-recent.json 생성
  const recentPRsPath = join(OUTPUT_DIR, 'prs-recent.json');
  await writeFile(recentPRsPath, JSON.stringify(allPRs, null, 2));
  console.log(`✅ Generated: ${recentPRsPath} (${allPRs.length} PRs)`);

  // prs-by-file.json 생성
  const prsByFilePath = join(OUTPUT_DIR, 'prs-by-file.json');
  await writeFile(prsByFilePath, JSON.stringify(prsByFile, null, 2));
  console.log(`✅ Generated: ${prsByFilePath} (${Object.keys(prsByFile).length} files)`);

  console.log('🎉 PR data generation complete!');
}

main().catch((error) => {
  console.error('❌ Error generating PR data:', error);
  process.exit(1);
});
