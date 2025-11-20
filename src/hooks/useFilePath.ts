'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { pathnameToFilePath } from '../lib/comment-utils';

/**
 * 현재 pathname을 파일 경로로 변환하는 훅
 * @returns 현재 페이지의 파일 경로 (예: src/content/04장 변수/A.mdx)
 */
export function useFilePath(): string {
  const pathname = usePathname();

  return useMemo(() => pathnameToFilePath(pathname), [pathname]);
}
