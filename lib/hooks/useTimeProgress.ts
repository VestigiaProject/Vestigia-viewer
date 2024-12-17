'use client';

import { useState, useEffect } from 'react';
import { addDays, differenceInDays } from 'date-fns';

export function useTimeProgress(startDate: string) {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const start = new Date(startDate);
    const elapsed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return addDays(start, elapsed);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(prev => addDays(prev, 1));
    }, 24 * 60 * 60 * 1000); // Update every 24 hours

    return () => clearInterval(timer);
  }, []);

  const daysElapsed = differenceInDays(currentDate, new Date(startDate));

  return { currentDate, daysElapsed };
}