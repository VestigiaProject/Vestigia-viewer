export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  startDate: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}