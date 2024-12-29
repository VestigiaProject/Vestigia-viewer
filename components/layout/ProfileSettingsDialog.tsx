'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/lib/hooks/useTranslation';

type ProfileSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProfileSettingsDialog({
  open,
  onOpenChange,
}: ProfileSettingsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUsername(profile.username);
      setAvatarUrl(profile.avatar_url || '');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || loading || !username.trim()) return;

    setLoading(true);
    try {
      let newAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        newAvatarUrl = publicUrl;
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username: username.trim(),
          avatar_url: newAvatarUrl
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: t('settings.profile_updated'),
        description: t('settings.profile_updated_desc'),
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('error.generic'),
        description: t('error.profile_update_failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings.profile')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>
                {user?.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="w-full max-w-xs"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">{t('settings.username')}</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('settings.username_placeholder')}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || !username.trim()}
          >
            {loading ? t('settings.saving') : t('settings.save_changes')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}