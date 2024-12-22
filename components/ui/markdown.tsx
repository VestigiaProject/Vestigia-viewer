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
        'prose-a:text-primary hover:prose-a:underline',
        'prose-code:bg-muted prose-code:rounded prose-code:px-1',
        'prose-pre:bg-muted prose-pre:rounded-lg',
        'prose-img:rounded-lg',
        'prose-headings:scroll-m-20',
        'prose-h1:text-3xl prose-h1:font-semibold prose-h1:tracking-tight',
        'prose-h2:text-2xl prose-h2:font-semibold prose-h2:tracking-tight',
        'prose-h3:text-xl prose-h3:font-semibold prose-h3:tracking-tight',
        'prose-h4:text-lg prose-h4:font-semibold prose-h4:tracking-tight',
        className
      )}
    >
      {content}
    </ReactMarkdown>
  );
} 