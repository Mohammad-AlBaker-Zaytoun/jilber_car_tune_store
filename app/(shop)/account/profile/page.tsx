import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { User, Mail, Phone, Calendar, Edit } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: false },
};
import { getSession } from '@/lib/session';
import AccountShell from '@/components/account/AccountShell';

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect('/signin?redirect=/account/profile');

  const fields = [
    { icon: User, label: 'Full Name', value: user.name },
    { icon: Mail, label: 'Email Address', value: user.email },
    { icon: Phone, label: 'Phone Number', value: user.phone ?? '—' },
    {
      icon: Calendar,
      label: 'Member Since',
      value: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    },
  ];

  return (
    <AccountShell user={user}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-1">
              Profile
            </h2>
            <p className="text-xs text-zinc-600">Your personal information</p>
          </div>
          <button
            disabled
            title="Edit profile — coming soon"
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-800 text-zinc-600 text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-200 cursor-not-allowed opacity-50"
          >
            <Edit size={11} aria-hidden="true" />
            Edit
          </button>
        </div>

        {/* Info card */}
        <div className="border border-zinc-800/50 bg-zinc-900/20 divide-y divide-zinc-800/50">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 shrink-0 flex items-center justify-center border border-zinc-800 bg-zinc-900">
                <Icon size={13} className="text-cyan-400" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
                  {label}
                </span>
                <span className="text-sm text-zinc-200 font-medium truncate">{value}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-zinc-700 border border-zinc-800/30 bg-zinc-900/10 px-5 py-3">
          Profile editing will be available in a future update. Contact us if you need to change
          your details.
        </p>
      </div>
    </AccountShell>
  );
}
