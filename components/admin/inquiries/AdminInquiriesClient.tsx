'use client';

import { useState, useEffect, useMemo } from 'react';
import { MessageSquareDot, AlertCircle, RefreshCw, Search, CheckCheck, Eye, Reply } from 'lucide-react';
import type { ContactInquiry, InquiryStatus } from '@/types/admin';

const STATUS_COLORS: Record<InquiryStatus, string> = {
  new: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
  read: 'text-zinc-400 border-zinc-600/30 bg-zinc-800/30',
  replied: 'text-green-400 border-green-400/30 bg-green-400/10',
};

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
};

async function fetchInquiries(): Promise<ContactInquiry[]> {
  const r = await fetch('/api/admin/inquiries');
  if (!r.ok) throw new Error(`${r.status}`);
  const data = (await r.json()) as ContactInquiry[];
  return Array.isArray(data) ? data : [];
}

async function patchInquiry(id: string, updates: { status?: InquiryStatus; adminNotes?: string }): Promise<ContactInquiry> {
  const r = await fetch('/api/admin/inquiries', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json() as Promise<ContactInquiry>;
}

export default function AdminInquiriesClient() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries()
      .then((data) => {
        setInquiries(data);
        setFetchError('');
      })
      .catch((err: unknown) => {
        console.error(err);
        setFetchError('Failed to load inquiries.');
      })
      .finally(() => setLoading(false));
  }, [retryCount]);

  const load = () => {
    setLoading(true);
    setFetchError('');
    setRetryCount((n) => n + 1);
  };

  const counts = useMemo(() => ({
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === 'new').length,
    read: inquiries.filter((i) => i.status === 'read').length,
    replied: inquiries.filter((i) => i.status === 'replied').length,
  }), [inquiries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return inquiries.filter((i) => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (q && !i.name.toLowerCase().includes(q) && !i.email.toLowerCase().includes(q) && !(i.vehicle ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inquiries, search, statusFilter]);

  const handleStatusChange = async (inquiry: ContactInquiry, status: InquiryStatus) => {
    setActionError(null);
    try {
      const updated = await patchInquiry(inquiry.id, { status });
      setInquiries((prev) => prev.map((i) => (i.id === inquiry.id ? updated : i)));
    } catch (err) {
      console.error(err);
      setActionError('Failed to update status. Please try again.');
    }
  };

  const handleSaveNotes = async (inquiry: ContactInquiry) => {
    const notes = noteDrafts[inquiry.id] ?? inquiry.adminNotes ?? '';
    setSavingNotes(inquiry.id);
    setActionError(null);
    try {
      const updated = await patchInquiry(inquiry.id, { adminNotes: notes });
      setInquiries((prev) => prev.map((i) => (i.id === inquiry.id ? updated : i)));
    } catch (err) {
      console.error(err);
      setActionError('Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(null);
    }
  };

  const toggleExpand = (id: string, inquiry: ContactInquiry) => {
    const next = expanded === id ? null : id;
    setExpanded(next);
    // Auto-mark as read when first opened
    if (next && inquiry.status === 'new') {
      void handleStatusChange(inquiry, 'read');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xs text-zinc-600 tracking-widest uppercase animate-pulse">Loading…</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5">
        <div className="w-12 h-12 flex items-center justify-center border border-red-500/30 bg-red-500/5">
          <AlertCircle size={20} className="text-red-400" aria-hidden="true" />
        </div>
        <p className="text-sm text-red-400 text-center max-w-xs">{fetchError}</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-xs font-black tracking-widest uppercase transition-all duration-200"
        >
          <RefreshCw size={11} aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {actionError && (
        <div className="flex items-center gap-3 px-4 py-3 border border-red-500/30 bg-red-500/5 text-xs text-red-400">
          <AlertCircle size={13} aria-hidden="true" />
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-auto text-red-400/60 hover:text-red-400 transition-colors" aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* Stat chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([['All', '', counts.all, 'text-zinc-300'], ['New', 'new', counts.new, 'text-cyan-400'], ['Read', 'read', counts.read, 'text-zinc-400'], ['Replied', 'replied', counts.replied, 'text-green-400']] as const).map(([label, val, count, color]) => (
          <button
            key={label}
            onClick={() => setStatusFilter(val as InquiryStatus | '')}
            className={`border p-4 text-left transition-colors ${statusFilter === val ? 'border-zinc-600 bg-zinc-900/40' : 'border-zinc-800/50 bg-zinc-900/20 hover:border-zinc-700'}`}
          >
            <p className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{count}</p>
          </button>
        ))}
      </div>

      {/* Search + refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search name, email, vehicle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs pl-8 pr-4 py-2.5 outline-none focus:border-cyan-400/50 transition-colors"
          />
        </div>
        <button
          onClick={load}
          className="p-2.5 border border-zinc-800 hover:border-zinc-700 text-zinc-600 hover:text-zinc-300 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={12} aria-hidden="true" />
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="border border-zinc-800/50 bg-zinc-900/20 p-10 text-center">
          <MessageSquareDot size={24} className="text-zinc-700 mx-auto mb-3" aria-hidden="true" />
          <p className="text-xs text-zinc-600">No inquiries found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((inquiry) => {
            const isExpanded = expanded === inquiry.id;
            const draft = noteDrafts[inquiry.id] ?? inquiry.adminNotes ?? '';
            return (
              <div key={inquiry.id} className={`border transition-colors ${inquiry.status === 'new' ? 'border-cyan-400/20 bg-zinc-900/30' : 'border-zinc-800/50 bg-zinc-900/10'}`}>
                {/* Row header */}
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer hover:bg-zinc-900/30 transition-colors"
                  onClick={() => toggleExpand(inquiry.id, inquiry)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-black text-white">{inquiry.name}</p>
                      <span className={`text-[9px] font-black tracking-widest uppercase border px-1.5 py-0.5 ${STATUS_COLORS[inquiry.status]}`}>
                        {STATUS_LABELS[inquiry.status]}
                      </span>
                      {inquiry.service && (
                        <span className="text-[9px] text-zinc-500 border border-zinc-800 px-1.5 py-0.5">{inquiry.service}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{inquiry.email}{inquiry.phone ? ` · ${inquiry.phone}` : ''}</p>
                    {inquiry.vehicle && <p className="text-[10px] text-zinc-600 mt-0.5">{inquiry.vehicle}</p>}
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/50 p-4 flex flex-col gap-4">
                    {inquiry.message && (
                      <div>
                        <p className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-1.5">Message</p>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
                      </div>
                    )}

                    {/* Status actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Mark as:</p>
                      {(['new', 'read', 'replied'] as InquiryStatus[]).map((s) => (
                        <button
                          key={s}
                          disabled={inquiry.status === s}
                          onClick={() => void handleStatusChange(inquiry, s)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black tracking-widest uppercase border transition-all ${
                            inquiry.status === s
                              ? 'border-zinc-700 text-zinc-600 cursor-default'
                              : 'border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400'
                          }`}
                        >
                          {s === 'read' ? <Eye size={9} aria-hidden="true" /> : s === 'replied' ? <Reply size={9} aria-hidden="true" /> : <CheckCheck size={9} aria-hidden="true" />}
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>

                    {/* Admin notes */}
                    <div>
                      <p className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-1.5">Admin Notes</p>
                      <textarea
                        rows={3}
                        value={draft}
                        onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                        placeholder="Internal notes…"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-300 text-xs px-3 py-2 outline-none resize-none transition-colors"
                      />
                      <button
                        onClick={() => void handleSaveNotes(inquiry)}
                        disabled={savingNotes === inquiry.id}
                        className="mt-2 px-4 py-2 border border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-[10px] font-black tracking-widest uppercase transition-all disabled:opacity-50"
                      >
                        {savingNotes === inquiry.id ? 'Saving…' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
