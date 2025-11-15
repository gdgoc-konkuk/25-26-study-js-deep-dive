'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import MDXWithInlineComments from './MDXWithInlineComments';
import PRComments from './PRComments';

interface PageWrapperProps {
  children: ReactNode;
  sourceCode?: string;
}

export default function PageWrapper({ children, sourceCode }: PageWrapperProps) {
  const pathname = usePathname();

  // 특수 페이지에서는 댓글을 표시하지 않음
  const shouldShowComments =
    pathname &&
    !pathname.includes('/prs') &&
    !pathname.includes('/home') &&
    pathname !== '/';

  if (!shouldShowComments) {
    return <>{children}</>;
  }

  // URL 경로를 파일 경로로 변환
  const pathParts = pathname.replace(/^\//, '').split('/');
  const convertedPath = pathParts.map(p => decodeURIComponent(p).replace(/-/g, ' ')).join('/');
  const filePath = `src/content/${convertedPath}.mdx`;

  return (
    <>
      <MDXWithInlineComments sourceCode={sourceCode}>{children}</MDXWithInlineComments>
      <PRComments filePath={filePath} />
    </>
  );
}
