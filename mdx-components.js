import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs';
import CodeBlockWithComments from './src/components/CodeBlockWithComments';

const themeComponents = getThemeComponents();

export function useMDXComponents(components) {
  return {
    ...themeComponents,
    // Override code blocks to add inline comments
    pre: (props) => <CodeBlockWithComments {...props} />,
    ...components,
  };
}
