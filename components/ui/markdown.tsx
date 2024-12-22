'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-p:my-1 prose-p:leading-[1.3]',
        'prose-a:text-primary hover:prose-a:underline',
        'prose-code:bg-muted/50 prose-code:rounded prose-code:px-1 prose-code:text-sm',
        'prose-pre:bg-muted/50 prose-pre:rounded-lg',
        'prose-img:rounded-lg',
        'prose-headings:scroll-m-20 prose-headings:font-medium',
        'prose-h1:text-xl prose-h1:tracking-tight',
        'prose-h2:text-lg prose-h2:tracking-tight',
        'prose-h3:text-base prose-h3:tracking-tight',
        'prose-h4:text-sm prose-h4:tracking-tight',
        'prose-strong:font-semibold',
        'prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5',
        'prose-blockquote:my-1 prose-blockquote:border-l-2 prose-blockquote:pl-4',
        className
      )}
    >
      {content}
    </ReactMarkdown>
  );
} 