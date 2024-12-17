'use client';

import { useState, useEffect } from 'react';
import { addDays, differenceInDays, parseISO } from 'date-fns';
import { useUserProfile } from './useUserProfile';

export function useTimeProgress(defaultStartDate: string) {
  const { profile } = useUserProfile();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Start with the default date until we load the user's profile
    return new Date(defaultStartDate);
  });

  useEffect(() => {
    if (profile?.start_date) {
      // Calculate elapsed days since user started
      const startDate = parseISO(profile.start_date);
      const now = new Date();
      const elapsedDays = Math.floor(differenceInDays(now, startDate) / 365); // Slow down time by making 1 real day = 1 year
      setCurrentDate(addDays(startDate, elapsedDays));
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