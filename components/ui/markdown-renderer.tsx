import React, { Suspense } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"
import { CopyButton } from "@/components/ui/copy-button"

interface MarkdownRendererProps {
  children: string
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <div className="space-y-3.5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </Markdown>
    </div>
  )
}

interface HighlightedPre extends React.HTMLAttributes<HTMLPreElement> {
  children: string
  language: string
}

const HighlightedPre = React.memo(
  async ({ children, language, ...props }: HighlightedPre) => {
    const { codeToTokens, bundledLanguages } = await import("shiki")

    if (!(language in bundledLanguages)) {
      return <pre {...props}>{children}</pre>
    }

    const { tokens } = await codeToTokens(children, {
      lang: language as keyof typeof bundledLanguages,
      defaultColor: false,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    })

    return (
      <pre {...props}>
        <code>
          {tokens.map((line, lineIndex) => (
            <>
              <span key={lineIndex}>
                {line.map((token, tokenIndex) => {
                  const style =
                    typeof token.htmlStyle === "string"
                      ? undefined
                      : token.htmlStyle

                  return (
                    <span
                      key={tokenIndex}
                      className="text-shiki-light bg-shiki-light-bg dark:text-shiki-dark dark:bg-shiki-dark-bg"
                      style={style}
                    >
                      {token.content}
                    </span>
                  )
                })}
              </span>
              {lineIndex !== tokens.length - 1 && "\n"}
            </>
          ))}
        </code>
      </pre>
    )
  }
)
HighlightedPre.displayName = "HighlightedCode"

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode
  className?: string
  language: string
}

const CodeBlock = ({
  children,
  className,
  language,
  ...restProps
}: CodeBlockProps) => {
  const code =
    typeof children === "string"
      ? children
      : childrenTakeAllStringContents(children)

  const preClass = cn(
    "anzen-scroll overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-[13px] leading-relaxed",
    className
  )

  return (
    <div className="group/code relative">
      <Suspense
        fallback={
          <pre className={preClass} {...restProps}>
            {children}
          </pre>
        }
      >
        <HighlightedPre language={language} className={preClass}>
          {code}
        </HighlightedPre>
      </Suspense>

      <div className="invisible absolute right-2 top-2 flex space-x-1 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
        <CopyButton content={code} copyMessage="Copied code to clipboard" />
      </div>
    </div>
  )
}

function childrenTakeAllStringContents(element: any): string {
  if (typeof element === "string") {
    return element
  }

  if (element?.props?.children) {
    let children = element.props.children

    if (Array.isArray(children)) {
      return children
        .map((child) => childrenTakeAllStringContents(child))
        .join("")
    } else {
      return childrenTakeAllStringContents(children)
    }
  }

  return ""
}

const COMPONENTS = {
  h1: withClass("h1", "mt-6 text-xl font-semibold tracking-tight first:mt-0"),
  h2: withClass("h2", "mt-6 text-lg font-semibold tracking-tight first:mt-0"),
  h3: withClass("h3", "mt-5 text-base font-semibold tracking-tight first:mt-0"),
  h4: withClass("h4", "mt-4 text-sm font-semibold tracking-tight first:mt-0"),
  h5: withClass("h5", "mt-4 text-sm font-medium first:mt-0"),
  strong: withClass("strong", "font-semibold text-foreground"),
  a: withClass(
    "a",
    "font-medium text-primary underline decoration-primary/40 underline-offset-[3px] transition-colors hover:decoration-primary"
  ),
  blockquote: withClass(
    "blockquote",
    "border-l-2 border-primary/60 pl-4 text-muted-foreground italic"
  ),
  code: ({ children, className, node, ...rest }: any) => {
    const match = /language-(\w+)/.exec(className || "")
    return match ? (
      <CodeBlock className={className} language={match[1]} {...rest}>
        {children}
      </CodeBlock>
    ) : (
      <code
        className={cn(
          "font-mono [:not(pre)>&]:rounded-md [:not(pre)>&]:border [:not(pre)>&]:border-border [:not(pre)>&]:bg-muted/60 [:not(pre)>&]:px-1.5 [:not(pre)>&]:py-0.5 [:not(pre)>&]:text-[0.875em]"
        )}
        {...rest}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }: any) => children,
  ol: withClass("ol", "list-decimal space-y-1.5 pl-5 marker:text-muted-foreground"),
  ul: withClass("ul", "list-disc space-y-1.5 pl-5 marker:text-muted-foreground"),
  li: withClass("li", "pl-1 leading-[1.7]"),
  table: ({ node, ...props }: any) => (
    <div className="anzen-scroll my-1 w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: withClass(
    "th",
    "border-b border-border bg-muted/50 px-3 py-2 text-left font-semibold [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  td: withClass(
    "td",
    "border-b border-border px-3 py-2 text-left align-top [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  tr: withClass("tr", "m-0 p-0 last:[&>td]:border-b-0"),
  p: withClass("p", "leading-[1.7] whitespace-pre-wrap"),
  hr: withClass("hr", "my-5 border-border"),
}

function withClass(Tag: keyof React.JSX.IntrinsicElements, classes: string) {
  const Component = ({ node, ...props }: any) => (
    <Tag className={classes} {...props} />
  )
  Component.displayName = String(Tag)
  return Component
}

export default MarkdownRenderer
