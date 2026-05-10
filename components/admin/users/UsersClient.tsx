'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Shield, User, Users } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { StoredUser } from '@/lib/users.dev';
import { useAuth } from '@/components/auth/AuthProvider';

type SafeUser = Omit<StoredUser, 'passwordHash'>;

export default function UsersClient() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pendingRole, setPendingRole] = useState<{ user: SafeUser; newRole: 'user' | 'admin' } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data: SafeUser[]) => setUsers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleRoleChange = async () => {
    if (!pendingRole) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/users/${pendingRole.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingRole.newRole }),
      });
      setPendingRole(null);
      load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="py-20 text-center text-xs text-zinc-600 animate-pulse">Loading…</div>;

  return (
    <>
      <ConfirmDialog
        open={!!pendingRole}
        title="Change User Role"
        message={`Change ${pendingRole?.user.name}'s role to "${pendingRole?.newRole}"?`}
        confirmLabel="Confirm"
        loading={saving}
        onConfirm={handleRoleChange}
        onCancel={() => setPendingRole(null)}
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs pl-9 pr-4 py-2.5 outline-none transition-colors placeholder:text-zinc-600"
          />
        </div>
        <span className="text-[10px] text-zinc-600 ml-auto">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center py-16 gap-4">
          <Users size={32} className="text-zinc-700" aria-hidden="true" />
          <p className="text-xs text-zinc-600">No users found.</p>
        </div>
      ) : (
        <div className="border border-zinc-800/50 bg-zinc-900/20 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">User</th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Role</th>
                <th className="text-right px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">Joined</th>
                <th className="text-right px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isMe = u.id === me?.id;
                const initials = u.name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <tr key={u.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 shrink-0 flex items-center justify-center border border-zinc-800 bg-zinc-900">
                          <span className="text-[9px] font-black text-zinc-500">{initials}</span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-zinc-200">
                            {u.name}
                            {isMe && <span className="ml-2 text-[9px] text-cyan-400 font-bold">(You)</span>}
                          </p>
                          <p className="text-[10px] text-zinc-600 sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-zinc-500">{u.email}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase border px-2 py-0.5 ${
                        u.role === 'admin'
                          ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5'
                          : 'text-zinc-500 border-zinc-700 bg-zinc-900/30'
                      }`}>
                        {u.role === 'admin' ? <Shield size={8} aria-hidden="true" /> : <User size={8} aria-hidden="true" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right hidden md:table-cell">
                      <span className="text-[10px] text-zinc-600">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!isMe && (
                        <button
                          onClick={() => setPendingRole({ user: u, newRole: u.role === 'admin' ? 'user' : 'admin' })}
                          className="text-[10px] border border-zinc-700 hover:border-cyan-400/40 text-zinc-500 hover:text-cyan-400 px-3 py-1.5 font-bold tracking-widest uppercase transition-all duration-200"
                        >
                          {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
