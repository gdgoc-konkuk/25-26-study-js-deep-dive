import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
};

const navbar = (
  <Navbar
    logo={
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img
          src="/images/logo.webp"
          alt="GDGoC Logo"
          style={{ height: '32px', width: 'auto' }}
        />
        <b>GDGoC Konkuk</b>
      </div>
    }
    // ... Your additional navbar options
  />
);
const footer = <Footer>{new Date().getFullYear()} GDGoC Konkuk</Footer>;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" dir="ltr" suppressHydrationWarning>
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/gdgoc-konkuk/25-26-study-js-deep-dive"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
