import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AccountShell from '@/components/account/AccountShell';
import ProfileForm from '@/components/account/ProfileForm';

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect('/signin?redirect=/account/profile');

  return (
    <AccountShell user={user}>
      <ProfileForm user={user} />
    </AccountShell>
  );
}
