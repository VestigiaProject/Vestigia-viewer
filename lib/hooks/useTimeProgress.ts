'use client';

import { useState, useEffect } from 'react';
import { addDays, differenceInDays } from 'date-fns';
import { useUserProfile } from './useUserProfile';

export function useTimeProgress() {
  const { profile } = useUserProfile();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [daysElapsed, setDaysElapsed] = useState(0);

  useEffect(() => {
    if (!profile?.start_date) return;

    const startDate = new Date(profile.start_date);
    const now = new Date();
    const elapsedDays = Math.floor((now.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    const historicalDate = addDays(startDate, elapsedDays);

    setCurrentDate(historicalDate);
    setDaysElapsed(elapsedDays);

    const timer = setInterval(() => {
      const newElapsedDays = Math.floor((new Date().getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (newElapsedDays !== elapsedDays) {
        setCurrentDate(addDays(startDate, newElapsedDays));
        setDaysElapsed(newElapsedDays);
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [profile?.start_date]);

  return { currentDate, daysElapsed };
}