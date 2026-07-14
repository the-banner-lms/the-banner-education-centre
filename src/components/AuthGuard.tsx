import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/utils/supabase/queries';
import AuthGuardClient from './AuthGuardClient';

export default async function AuthGuard({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getUserProfile(supabase) : null;

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
