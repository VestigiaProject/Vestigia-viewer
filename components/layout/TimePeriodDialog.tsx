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
          <DialogTitle>Choose Your Starting Point</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {timePeriods.map((period) => (
            <Button
              key={period.date}
              variant={period.enabled ? "default" : "outline"}
              className="w-full justify-start h-auto p-4 space-y-2"
              onClick={() => handleSelectPeriod(period)}
              disabled={!period.enabled}
            >
              <div className="text-left">
                <div className="font-semibold">{period.label}</div>
                <div className="text-sm text-muted-foreground">
                  {period.description}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(period.date), 'MMMM d, yyyy')}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}