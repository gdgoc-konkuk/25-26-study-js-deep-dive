import nextra from 'nextra';

const isDevelopment = process.env.NODE_ENV === 'development';
const withNextra = nextra({});

export default withNextra({
  output: isDevelopment ? 'standalone' : 'export',
  basePath: isDevelopment ? '' : '/25-26-study-js-deep-dive',
  assetPrefix: isDevelopment ? '' : '/25-26-study-js-deep-dive',
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
