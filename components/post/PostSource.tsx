'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

type PostSourceProps = {
  source: string | null;
};

export function PostSource({ source }: PostSourceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!source) return null;

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between"
      >
        <span className="flex items-center">
          <LinkIcon className="h-4 w-4 mr-2" />
          {isExpanded ? 'Hide Source' : 'Show Source'}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2" />
        )}
      </Button>
      
      {isExpanded && (
        <Card className="mt-2 p-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                />
              ),
              p: ({ node, ...props }) => (
                <p {...props} className="mb-4 last:mb-0" />
              ),
              ul: ({ node, ...props }) => (
                <ul {...props} className="list-disc ml-6 mb-4" />
              ),
              ol: ({ node, ...props }) => (
                <ol {...props} className="list-decimal ml-6 mb-4" />
              ),
              h1: ({ node, ...props }) => (
                <h1 {...props} className="text-2xl font-bold mb-4" />
              ),
              h2: ({ node, ...props }) => (
                <h2 {...props} className="text-xl font-bold mb-3" />
              ),
              h3: ({ node, ...props }) => (
                <h3 {...props} className="text-lg font-bold mb-2" />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  {...props}
                  className="border-l-4 border-gray-200 pl-4 italic mb-4"
                />
              ),
              code: ({ node, ...props }) => (
                <code
                  {...props}
                  className="bg-gray-100 rounded px-1 py-0.5 text-sm"
                />
              ),
              pre: ({ node, ...props }) => (
                <pre
                  {...props}
                  className="bg-gray-100 rounded p-4 overflow-x-auto mb-4"
                />
              ),
            }}
          >
            {source}
          </ReactMarkdown>
        </Card>
      )}
    </div>
  );
}