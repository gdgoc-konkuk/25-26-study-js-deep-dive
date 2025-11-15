import nextra from 'nextra';

const isDevelopment = process.env.NODE_ENV === 'development';
const withNextra = nextra({
  defaultShowCopyCode: true,
});

export default withNextra({
  // API Routes를 사용하기 위해 export 모드 제거
  // Vercel 배포 시 basePath/assetPrefix 불필요
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,
      },
    ];
  },
});
