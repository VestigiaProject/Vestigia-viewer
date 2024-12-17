'use client';

import { useState, useEffect } from 'react';
import { addDays, differenceInDays, parseISO } from 'date-fns';
import { useUserProfile } from './useUserProfile';

export function useTimeProgress(defaultStartDate: string) {
  const { profile } = useUserProfile();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Start with the default date until we load the user's profile
    const start = new Date(defaultStartDate);
    const elapsed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return addDays(start, elapsed);
  });

  useEffect(() => {
    if (profile?.start_date) {
      const startDate = parseISO(profile.start_date);
      const elapsed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      setCurrentDate(addDays(startDate, elapsed));
    }
  }, [profile]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(prev => addDays(prev, 1));
    }, 24 * 60 * 60 * 1000); // Update every 24 hours

    return () => clearInterval(timer);
  }, []);

  const daysElapsed = differenceInDays(
    currentDate,
    profile?.start_date ? parseISO(profile.start_date) : new Date(defaultStartDate)
  );

  return { currentDate, daysElapsed };
}