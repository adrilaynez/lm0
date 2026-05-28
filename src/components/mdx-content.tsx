import type { ReactNode } from "react"
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

function toAnchor(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function nodeText(children: ReactNode): string {
    if (typeof children === "string") return children
    if (Array.isArray(children)) return children.map((c) => nodeText(c as ReactNode)).join("")
    return ""
}

function H2({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    const id = toAnchor(nodeText(children))
    return <h2 id={id} {...props}>{children}</h2>
}

function H3({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    const id = toAnchor(nodeText(children))
    return <h3 id={id} {...props}>{children}</h3>
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
                h2: H2,
                h3: H3,
            }}
        />
    )
}
