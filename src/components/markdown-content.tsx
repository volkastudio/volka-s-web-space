import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div className={`prose-volka max-w-[68ch] ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1
              className="mt-12 mb-6 font-display text-3xl font-light tracking-tight text-foreground md:text-4xl"
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              className="mt-10 mb-5 font-display text-2xl font-normal tracking-tight text-foreground md:text-3xl"
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              className="mt-8 mb-4 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl"
              {...props}
            />
          ),
          h4: ({ ...props }) => (
            <h4
              className="mt-6 mb-3 text-base font-semibold uppercase tracking-wider text-gold"
              {...props}
            />
          ),
          p: ({ ...props }) => (
            <p
              className="mb-6 text-base leading-relaxed text-foreground/80 md:text-lg md:leading-8"
              {...props}
            />
          ),
          strong: ({ ...props }) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          em: ({ ...props }) => (
            <em className="italic text-foreground/90 font-serif" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="my-8 rounded-r border-l-2 border-gold bg-card/40 py-4 pl-6 pr-4 font-serif text-lg italic text-foreground/90 md:text-xl"
              {...props}
            />
          ),
          ul: ({ ...props }) => (
            <ul
              className="mb-6 ml-6 list-disc space-y-2 text-base text-foreground/80 md:text-lg"
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <ol
              className="mb-6 ml-6 list-decimal space-y-2 text-base text-foreground/80 md:text-lg"
              {...props}
            />
          ),
          li: ({ ...props }) => <li className="pl-1 leading-relaxed" {...props} />,
          hr: () => <hr className="my-10 border-t border-border/60" />,
          a: ({ ...props }) => (
            <a
              className="font-medium text-gold underline underline-offset-4 transition-colors hover:text-gold/80"
              target={props.href?.startsWith("http") ? "_blank" : undefined}
              rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <div className="my-8 overflow-x-auto rounded border border-border">
              <table className="w-full text-left text-sm" {...props} />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead className="bg-card text-xs uppercase tracking-wider text-muted-foreground" {...props} />
          ),
          th: ({ ...props }) => <th className="px-4 py-3 font-medium border-b border-border" {...props} />,
          td: ({ ...props }) => <td className="px-4 py-3 border-b border-border/40 text-foreground/80" {...props} />,
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded bg-card px-1.5 py-0.5 font-mono text-sm text-gold"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-6 overflow-x-auto rounded bg-card p-4 font-mono text-sm leading-normal text-foreground">
                <code {...props}>{children}</code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
