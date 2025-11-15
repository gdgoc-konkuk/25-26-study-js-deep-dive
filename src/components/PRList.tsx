'use client';

import { useEffect, useState } from 'react';
import type { PRSummary } from '../types/pr';

export default function PRList() {
  const [prs, setPRs] = useState<PRSummary[]>([]);

  useEffect(() => {
    const basePath = process.env.NODE_ENV === 'production' ? '/25-26-study-js-deep-dive' : '';
    fetch(`${basePath}/data/prs-recent.json`)
      .then(res => res.json())
      .then(setPRs)
      .catch(() => setPRs([]));
  }, []);

  if (prs.length === 0) {
    return <div className="p-4">PR이 없습니다.</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {prs.map((pr) => (
        <div key={pr.number} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <a
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold hover:underline"
              >
                #{pr.number} {pr.title}
              </a>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {pr.author.name} • {new Date(pr.createdAt).toLocaleDateString('ko-KR')}
                {pr.mergedAt && ` • 병합: ${new Date(pr.mergedAt).toLocaleDateString('ko-KR')}`}
              </div>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${
              pr.state === 'merged' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30' :
              pr.state === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900/30' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900/30'
            }`}>
              {pr.state}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            💬 {pr.commentCount}개 댓글 • 📝 {pr.changedFiles.length}개 파일
          </div>
        </div>
      ))}
    </div>
  );
}
