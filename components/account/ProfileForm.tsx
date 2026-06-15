'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Calendar, Edit, Save, X, Lock } from 'lucide-react';
import type { SessionUser } from '@/lib/auth';

interface Props {
  user: SessionUser;
}

const cardCls = 'border border-zinc-800/50 bg-zinc-900/20';
const labelCls = 'text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold';
const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 outline-none px-3 py-2 text-sm text-zinc-200 transition-colors';

export default function ProfileForm({ user }: Props) {
  const router = useRouter();

  // ---- Profile (name / phone) ----
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setProfileError(data.error ?? 'Update failed');
        return;
      }
      setEditing(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      router.refresh();
    } catch {
      setProfileError('Something went wrong. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelEdit = () => {
    setName(user.name);
    setPhone(user.phone ?? '');
    setProfileError('');
    setEditing(false);
  };

  // ---- Password change ----
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPw(true);
    setPwError('');
    setPwSaved(false);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPwError(data.error ?? 'Password change failed');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch {
      setPwError('Something went wrong. Please try again.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-1">Profile</h2>
          <p className="text-xs text-zinc-600">Your personal information</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-800 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-300 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors"
          >
            <Edit size={11} aria-hidden="true" />
            Edit
          </button>
        )}
      </div>

      {profileSaved && (
        <p className="text-[10px] text-teal-400 font-bold">Profile updated.</p>
      )}

      {/* Info / edit card */}
      {editing ? (
        <div className={`${cardCls} p-6 flex flex-col gap-5`}>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="name">Full Name</label>
            <input id="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="phone">Phone Number</label>
            <input id="phone" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="—" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={labelCls}>Email Address</span>
            <p className="text-sm text-zinc-500">{user.email} <span className="text-[9px] text-zinc-700">(cannot be changed)</span></p>
          </div>
          {profileError && <p className="text-[10px] text-red-400">{profileError}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black text-[10px] font-black tracking-[0.15em] uppercase transition-colors"
            >
              <Save size={11} aria-hidden="true" />
              {savingProfile ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancelEdit}
              disabled={savingProfile}
              className="flex items-center gap-1.5 px-4 py-2 border border-zinc-800 text-zinc-400 text-[10px] font-bold tracking-[0.15em] uppercase"
            >
              <X size={11} aria-hidden="true" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`${cardCls} divide-y divide-zinc-800/50`}>
          {[
            { icon: User, label: 'Full Name', value: user.name },
            { icon: Mail, label: 'Email Address', value: user.email },
            { icon: Phone, label: 'Phone Number', value: user.phone ?? '—' },
            { icon: Calendar, label: 'Member Since', value: memberSince },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 shrink-0 flex items-center justify-center border border-zinc-800 bg-zinc-900">
                <Icon size={13} className="text-cyan-400" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className={labelCls}>{label}</span>
                <span className="text-sm text-zinc-200 font-medium truncate">{value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change password */}
      <div className={`${cardCls} p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Lock size={13} className="text-cyan-400" aria-hidden="true" />
          <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase">Change Password</h3>
        </div>
        <form onSubmit={changePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="currentPassword">Current Password</label>
            <input id="currentPassword" type="password" autoComplete="current-password" className={inputCls} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="newPassword">New Password</label>
            <input id="newPassword" type="password" autoComplete="new-password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="confirmPassword">Confirm New Password</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" className={inputCls} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          {pwError && <p className="text-[10px] text-red-400">{pwError}</p>}
          {pwSaved && <p className="text-[10px] text-teal-400 font-bold">Password updated.</p>}
          <button
            type="submit"
            disabled={savingPw || !currentPassword || !newPassword}
            className="self-start px-4 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-black text-[10px] font-black tracking-[0.15em] uppercase transition-colors"
          >
            {savingPw ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
