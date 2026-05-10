import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminShell from '@/components/admin/AdminShell';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Admin | JILBER Performance',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/signin?redirect=/admin');
  }
  if (session.role !== 'admin') {
    redirect('/account');
  }

  return <AdminShell user={session}>{children}</AdminShell>;
}
