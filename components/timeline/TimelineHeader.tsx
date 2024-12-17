'use client';

import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

type TimelineHeaderProps = {
  currentDate: Date | null;
  daysElapsed: number;
};

export function TimelineHeader({ currentDate, daysElapsed }: TimelineHeaderProps) {
  if (!currentDate) return null;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-semibold">Timeline</h1>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(currentDate, 'MMMM d, yyyy')}</span>
          <span className="text-xs">({daysElapsed} days elapsed)</span>
        </div>
      </div>
    </div>
  );
}