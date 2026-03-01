import { MDXRemote } from "next-mdx-remote/rsc"

import rehypeKatex from "rehype-katex"
import rehypePrettyCode from "rehype-pretty-code"
import remarkMath from "remark-math"

import { Callout } from "@/components/mdx/callout"
import { InteractiveGraph } from "@/components/mdx/interactive-graph"
import { MathBlock, MathInline } from "@/components/mdx/math-block"

const options = {
    theme: "github-dark",
    keepBackground: true,
}

export function MDXContent({ source }: { source: string }) {
    return (
        <MDXRemote
            source={source}
            options={{
                parseFrontmatter: true,
                mdxOptions: {
                    remarkPlugins: [remarkMath],
                    rehypePlugins: [
                        rehypeKatex,
                        [rehypePrettyCode, options],
                    ],
                },
            }}
            components={{
                Callout,
                MathBlock: (props) => <MathBlock {...props} />,
                MathInline: (props) => <MathInline {...props} />,
                InteractiveGraph: (props) => <InteractiveGraph {...props} />,
                // Add more custom components here
            }}
        />
    )
}
