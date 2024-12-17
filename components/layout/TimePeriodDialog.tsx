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

type TimePeriodOption = {
  date: string;
  label: string;
  description: string;
  enabled: boolean;
};

const timePeriods: TimePeriodOption[] = [
  {
    date: '1789-06-01',
    label: 'The Estates General',
    description: 'Start from the beginning of the French Revolution',
    enabled: true,
  },
  {
    date: '1790-07-14',
    label: 'Fête de la Fédération',
    description: 'First anniversary of the storming of the Bastille (Coming Soon)',
    enabled: false,
  },
  {
    date: '1792-08-10',
    label: 'The Fall of the Monarchy',
    description: 'Beginning of the radical phase of the Revolution (Coming Soon)',
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
        title: 'Time Period Updated',
        description: `Your journey will now start from ${format(new Date(period.date), 'MMMM d, yyyy')}.`,
      });

      onOpenChange(false);
      
      // Reload the page to reset the timeline
      window.location.reload();
    } catch (error) {
      console.error('Error updating time period:', error);
      toast({
        title: 'Error',
        description: 'Failed to update time period. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-4">Choose Your Starting Point</DialogTitle>
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
                <h3 className="font-medium leading-none">{period.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {period.description}
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