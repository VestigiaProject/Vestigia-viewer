'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import { useState } from 'react';

type PostSourceProps = {
  source?: string;
};

export function PostSource({ source }: PostSourceProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!source) return null;

  return (
    <div className="mt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <span>Source</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isExpanded && (
        <Card className="p-4 mt-2">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown
              options={{
                overrides: {
                  a: {
                    props: {
                      className: 'text-blue-500 hover:underline',
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    },
                  },
                },
              }}
            >
              {source}
            </Markdown>
          </div>
        </Card>
      )}
    </div>
  );
}