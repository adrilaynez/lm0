import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";

import { Callout } from "@/components/mdx/callout";
import { InteractiveGraph } from "@/components/mdx/interactive-graph";
import { MathBlock, MathInline } from "@/components/mdx/math-block";

import { NoteCard } from "./note-card";

const WIKILINK_RE = /\[\[([a-z0-9-]+)\]\]/gi;

const codeOptions = {
  theme: "github-dark",
  keepBackground: true,
};

interface MindMDXProps {
  source: string;
}

export function MindMDX({ source }: MindMDXProps) {
  // Transform [[wikilinks]] → <NoteLink slug="..." />
  // NoteCard (registered as NoteLink) resolves title/preview server-side at render time,
  // avoiding MDX prop injection issues with large string values.
  const transformed = source.replace(WIKILINK_RE, (_, rawSlug: string) =>
    `<NoteLink slug="${rawSlug.toLowerCase()}" />`
  );

  return (
    <MDXRemote
      source={transformed}
      options={{
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeSlug, rehypeKatex, [rehypePrettyCode, codeOptions]],
        },
      }}
      components={{
        Callout,
        MathBlock: (props) => <MathBlock {...props} />,
        MathInline: (props) => <MathInline {...props} />,
        InteractiveGraph: (props) => <InteractiveGraph {...props} />,
        NoteLink: NoteCard,
      }}
    />
  );
}
