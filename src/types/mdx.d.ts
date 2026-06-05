// Lets TypeScript type static `import X from './foo.mdx'` as a React component.
// Backed by @types/mdx (the `mdx/types` module).
declare module "*.mdx" {
    import type { MDXProps } from "mdx/types";

    export default function MDXContent(props: MDXProps): JSX.Element;
}
