import { generateStaticParamsFor, importPage } from 'nextra/pages';
import { useMDXComponents as getMDXComponents } from '../../../mdx-components';
import PageWrapper from '../../components/PageWrapper';

export const generateStaticParams = generateStaticParamsFor('mdxPath');

export async function generateMetadata(props) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props) {
  const params = await props.params;
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode,
  } = await importPage(params.mdxPath);
  return (
    <Wrapper toc={toc} metadata={metadata}>
      <PageWrapper sourceCode={sourceCode}>
        <MDXContent {...props} params={params} />
      </PageWrapper>
    </Wrapper>
  );
}
