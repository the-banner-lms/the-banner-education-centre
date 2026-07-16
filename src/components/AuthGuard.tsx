import { getCurrentAuth } from '@/utils/supabase/auth';
import AuthGuardClient from './AuthGuardClient';

export default async function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentAuth();

  const isPending = profile?.approval_status === 'pending';
  const isRejected = profile?.approval_status === 'rejected';

  if (user) {
    return (
      <AuthGuardClient isPending={isPending} isRejected={isRejected}>
        {children}
      </AuthGuardClient>
    );
  }

  return <>{children}</>;
}
