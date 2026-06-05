import type { MDXProps } from "mdx/types";

/* The shape of a compiled `.mdx` chapter body: a component that accepts a
   `components` map (which is exactly what labMdxComponents() returns).

   Each narrative shell statically imports its own two language bodies, e.g.
     import BigramEs from "@/content/lab/bigram.es.mdx";
     import BigramEn from "@/content/lab/bigram.en.mdx";
   and picks one by the active `language`. Static per-chapter imports keep
   Next's code-splitting intact — a central loader importing every chapter
   would bundle them all together, so we deliberately avoid one. */
export type MdxChapter = (props: MDXProps) => React.JSX.Element;
