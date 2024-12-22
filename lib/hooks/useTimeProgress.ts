'use client';

import { useState, useEffect } from 'react';
import { addDays, differenceInDays, parseISO } from 'date-fns';
import { useUserProfile } from './useUserProfile';

export function useTimeProgress(defaultStartDate: string) {
  const { profile } = useUserProfile();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Initialize with default start date
    return new Date(defaultStartDate);
  });

  useEffect(() => {
    if (profile?.start_date && profile?.created_at) {
      // Calculate elapsed time since user created their account
      const startDate = parseISO(profile.start_date);
      const createdAt = parseISO(profile.created_at);
      const now = new Date();
      
      // Calculate days elapsed since account creation
      const realDaysElapsed = differenceInDays(now, createdAt);
      
      // Add elapsed days to the historical start date
      const newDate = addDays(startDate, realDaysElapsed);
      setCurrentDate(newDate);
    } else {
      // If no profile is loaded, reset to default start date
      setCurrentDate(new Date(defaultStartDate));
    }
  }, [profile, defaultStartDate]);

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