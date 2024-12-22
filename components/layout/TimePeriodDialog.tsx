'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/hooks/useTranslation';

type TimePeriodOption = {
  date: string;
  labelKey: string;
  descriptionKey: string;
  enabled: boolean;
};

const timePeriods: TimePeriodOption[] = [
  {
    date: '1789-06-04',
    labelKey: 'time.period.estates_general',
    descriptionKey: 'time.period.estates_general_desc',
    enabled: true,
  },
  {
    date: '1790-07-14',
    labelKey: 'time.period.federation',
    descriptionKey: 'time.period.federation_desc',
    enabled: false,
  },
  {
    date: '1792-08-10',
    labelKey: 'time.period.monarchy_fall',
    descriptionKey: 'time.period.monarchy_fall_desc',
    enabled: false,
  },
];

type TimePeriodDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TimePeriodDialog({ open, onOpenChange }: TimePeriodDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSelectPeriod = async (period: TimePeriodOption) => {
    if (!user || !period.enabled) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          start_date: period.date,
          created_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: t('time.period_updated'),
        description: t('time.period_updated_desc', { date: format(new Date(period.date), 'MMMM d, yyyy') }),
      });

      onOpenChange(false);
      
      // Reload the page to reset the timeline
      window.location.reload();
    } catch (error) {
      console.error('Error updating time period:', error);
      toast({
        title: t('error.generic'),
        description: t('error.time_period_update_failed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-4">{t('time.choose_starting_point')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          {timePeriods.map((period) => (
            <div
              key={period.date}
              className={cn(
                "relative rounded-lg border p-4 transition-colors",
                period.enabled
                  ? "hover:bg-accent cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              )}
              onClick={() => period.enabled && handleSelectPeriod(period)}
            >
              <div className="space-y-1">
                <h3 className="font-medium leading-none">{t(period.labelKey)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(period.descriptionKey)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(period.date), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}