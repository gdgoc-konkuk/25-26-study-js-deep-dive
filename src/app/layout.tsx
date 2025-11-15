import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';
import './globals.css';
import PRBanner from '../components/PRBanner';
import CommentSidebar from '../components/CommentSidebar';
import { AuthProvider } from '../contexts/AuthContext';
import { AuthButton } from '../components/AuthButton';

export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
};

const basePath =
  process.env.NODE_ENV === 'production' ? '/prwiki' : '';

const navbar = (
  <Navbar
    logo={
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img
          src={`${basePath}/images/logo.webp`}
          alt="PRwiki Logo"
          style={{ height: '32px', width: 'auto' }}
        />
        <b>PRwiki</b>
      </div>
    }
    extraContent={<AuthButton />}
    // ... Your additional navbar options
  />
);
const footer = <Footer>{new Date().getFullYear()} PRwiki</Footer>;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" dir="ltr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Layout
            navbar={navbar}
            pageMap={await getPageMap()}
            docsRepositoryBase="https://github.com/gdgoc-konkuk/prwiki/home"
            footer={footer}
            banner={<PRBanner />}
          >
            {children}
          </Layout>
          <CommentSidebar />
        </AuthProvider>
      </body>
    </html>
  );
}
