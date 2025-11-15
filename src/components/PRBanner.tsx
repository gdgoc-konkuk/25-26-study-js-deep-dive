'use client';

import { useEffect, useState } from 'react';
import type { PRSummary } from '../types/pr';

export default function PRBanner() {
  const [prs, setPRs] = useState<PRSummary[]>([]);

  useEffect(() => {
    const basePath = process.env.NODE_ENV === 'production' ? '/25-26-study-js-deep-dive' : '';
    fetch(`${basePath}/data/prs-recent.json`)
      .then(res => res.json())
      .then(data => setPRs(data.slice(0, 3)))
      .catch(() => setPRs([]));
  }, []);

  if (prs.length === 0) return null;

  return (
    <div className="w-full bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-semibold">최근 PR:</span>
        {prs.map((pr) => (
          <a
            key={pr.number}
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            #{pr.number} {pr.title} ({pr.commentCount}개 댓글)
          </a>
        ))}
      </div>
    </div>
  );
}
