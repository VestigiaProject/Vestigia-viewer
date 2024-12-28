'use client';

import { useState, useEffect } from 'react';
import { addDays, differenceInDays, parseISO } from 'date-fns';
import { useUserProfile } from './useUserProfile';

export function useTimeProgress(defaultStartDate: string) {
  const { profile } = useUserProfile();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Initialize with default start date
    if (profile?.start_date && profile?.created_at) {
      const startDate = parseISO(profile.start_date);
      const createdAt = parseISO(profile.created_at);
      const now = new Date();
      const realDaysElapsed = differenceInDays(now, createdAt);
      return addDays(startDate, realDaysElapsed);
    }
    return new Date(defaultStartDate);
  });

  // Update current date whenever profile changes or real time passes
  useEffect(() => {
    function updateCurrentDate() {
      if (profile?.start_date && profile?.created_at) {
        const startDate = parseISO(profile.start_date);
        const createdAt = parseISO(profile.created_at);
        const now = new Date();
        const realDaysElapsed = differenceInDays(now, createdAt);
        setCurrentDate(addDays(startDate, realDaysElapsed));
      } else {
        setCurrentDate(new Date(defaultStartDate));
      }
    }

    // Update immediately
    updateCurrentDate();

    // Update every minute to catch day changes
    const timer = setInterval(updateCurrentDate, 60 * 1000);

    return () => clearInterval(timer);
  }, [profile, defaultStartDate]);

  const daysElapsed = differenceInDays(
    currentDate,
    profile?.start_date ? parseISO(profile.start_date) : new Date(defaultStartDate)
  );

  return { currentDate, daysElapsed };
}