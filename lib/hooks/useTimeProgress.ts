'use client';

import { useState, useEffect } from 'react';

const MILLISECONDS_PER_HISTORICAL_SECOND = 1000; // 1 real second = 1 historical second

export function useTimeProgress(startDate: string) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(startDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        newDate.setSeconds(newDate.getSeconds() + 1);
        return newDate;
      });
    }, MILLISECONDS_PER_HISTORICAL_SECOND);

    return () => clearInterval(interval);
  }, []);

  return currentDate;
}