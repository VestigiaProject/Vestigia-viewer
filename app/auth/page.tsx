'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleOneTap } from '@/lib/auth/google-one-tap';

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Historical Social</CardTitle>
          <CardDescription>
            Sign in to start your journey through history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Click the Google sign-in prompt to continue
          </p>
        </CardContent>
      </Card>
      <GoogleOneTap />
    </div>
  );
}