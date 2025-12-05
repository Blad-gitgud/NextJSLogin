'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

type AnyObj = Record<string, any>;

type DeleteConfirmState = {
  positionId: number | null;
  positionName: string;
  isOpen: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [positions, setPositions] = useState<AnyObj[]>([]);
  const [users, setUsers] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'positions'>('home');

  // New-position form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    positionId: null,
    positionName: '',
    isOpen: false,
  });
  const [deleting, setDeleting] = useState(false);

  // Load user info on mount (greeting / auth)
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) router.push('/login');
        return;
      }

      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      try {
        const res = await fetch('/api/user', { headers, credentials: 'include' });

        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (mounted) setUsername(data?.username || data?.email || null);
        } else if (res.status === 404) {
          const stored = localStorage.getItem('user');
          if (stored) {
            try {
              const u = JSON.parse(stored);
              if (mounted) setUsername(u.username || u.email || null);
            } catch {}
          } else if (token) {
            try {
              const parts = token.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                if (mounted) setUsername(payload.username || payload.sub || null);
              }
            } catch {}
          }
        } else if (res.status === 401) {
          localStorage.removeItem('token');
          if (mounted) router.push('/login');
          return;
        }
      } catch (err) {
        console.warn('User fetch failed:', err);
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const u = JSON.parse(stored);
            if (mounted) setUsername(u.username || u.email || null);
          } catch {}
        }
      }

      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  // Load positions when Positions tab is opened
  useEffect(() => {
    if (activeTab !== 'positions') return;

    let mounted = true;
    (async () => {
      setPositionsLoading(true);

      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const res = await fetch('/api/positions', { headers, credentials: 'include' });
        if (res.ok) {
          const list = await res.json().catch(() => []);
          if (mounted) setPositions(Array.isArray(list) ? list : []);
        } else if (res.status === 401) {
          localStorage.removeItem('token');
          if (mounted) router.push('/login');
          return;
        }
      } catch (err) {
        console.warn('Positions fetch failed', err);
        if (mounted) setPositions([]);
      } finally {
        if (mounted) setPositionsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [activeTab, router]);

  // Load users mapping (optional)
  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      try {
        const res = await fetch('/api/users', { headers, credentials: 'include' });
        if (res.ok) {
          const list = await res.json().catch(() => []);
          if (mounted && Array.isArray(list)) {
            const userMap = new Map<number, string>();
            list.forEach((u: AnyObj) => {
              const id = u.id ?? u.userId ?? u.uid;
              const uname = u.username ?? u.name ?? u.email ?? '';
              if (id) userMap.set(id, uname);
            });
            setUsers(userMap);
          }
        }
      } catch (err) {
        // ignore if not available
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  async function handleCreatePosition(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setCreateError(null);

    const code = (newCode || '').trim();
    const name = (newName || '').trim();

    if (!code || !name) {
      setCreateError('Both position code and name are required.');
      return;
    }

    setCreating(true);

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/positions', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          position_code: code,
          position_name: name,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `Creation failed (${res.status})`;
        setCreateError(String(msg));
        setCreating(false);
        return;
      }

      // Normalize created object and ensure timestamps are present immediately (optimistic)
      const created: Record<string, any> =
        (data && typeof data === 'object' && Object.keys(data).length > 0)
          ? { ...data }
          : {};

      // ensure canonical fields exist
      created.position_code = created.position_code ?? created.code ?? code;
      created.position_name = created.position_name ?? created.name ?? name;
      created.position_id = created.position_id ?? created.id ?? created.positionId ?? undefined;
      created.id = created.id ?? created.position_id ?? undefined;

      const now = new Date().toISOString();
      created.created_at = created.created_at ?? created.createdAt ?? created.created ?? now;
      created.updated_at = created.updated_at ?? created.updatedAt ?? created.updated ?? created.created_at ?? now;

      // Insert the created position at the top of the table
      setPositions((prev) => [created, ...prev]);

      // Clear form
      setNewCode('');
      setNewName('');
    } catch (err) {
      console.error('Create position error', err);
      setCreateError('Network error: could not create position.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePosition(positionId: number | null) {
    if (positionId === null) return;

    setDeleting(true);

    try {
      // Prepare token (avoid double "Bearer " prefix)
      let token = localStorage.getItem('token') || '';
      if (token && !/^Bearer\s+/i.test(token)) token = `Bearer ${token}`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = token;

      // Abort if backend takes longer than 30s (adjust as needed)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`/api/positions/${positionId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        // Try to parse backend message if any
        const data = await res.json().catch(() => null);
        const msg = (data && (data.message || data.error)) || `Delete failed (${res.status})`;
        alert(`Error: ${msg}`);
        setDeleting(false);
        return;
      }

      // Success — remove from UI
      setPositions((prev) => prev.filter((p) => (p.position_id ?? p.id) !== positionId));
      setDeleteConfirm({ positionId: null, positionName: '', isOpen: false });
    } catch (err: any) {
      console.error('Delete position error', err);

      // Fallback: re-check positions list from server. If the position is already gone, assume delete succeeded.
      try {
        const token = localStorage.getItem('token') || '';
        const headers: Record<string, string> = token && !/^Bearer\s+/i.test(token) ? { Authorization: `Bearer ${token}` } : token ? { Authorization: token } : {};
        const listRes = await fetch('/api/positions', { headers, credentials: 'include' });
        if (listRes.ok) {
          const list = await listRes.json().catch(() => []);
          const stillExists = Array.isArray(list) && list.some((p: any) => (p.position_id ?? p.id) === positionId);
          if (!stillExists) {
            setPositions((prev) => prev.filter((p) => (p.position_id ?? p.id) !== positionId));
            setDeleteConfirm({ positionId: null, positionName: '', isOpen: false });
            setDeleting(false);
            return;
          }
        }
      } catch (e) {
        // ignore fallback errors
      }

      alert('Network error: could not delete position.');
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteConfirm(positionId: number, positionName: string) {
    setDeleteConfirm({ positionId, positionName, isOpen: true });
  }

  function closeDeleteConfirm() {
    setDeleteConfirm({ positionId: null, positionName: '', isOpen: false });
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: "url('/dashboard-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className="relative z-10 flex items-center justify-center">
          <div className="w-full max-w-md p-8 rounded-3xl shadow-2xl bg-white/15 backdrop-blur-xl border border-white/20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mb-4"></div>
            <p className="text-center text-gray-100">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (raw: any) => {
    if (!raw) return '-';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw).slice(0, 24);
      return d.toLocaleString();
    } catch {
      return String(raw).slice(0, 24);
    }
  };

  // NOTE: put an image file named `dashboard-bg.jpg` inside /public, or change the URL below.
  return (
    <div
      className="min-h-screen fixed inset-0"
      style={{
        backgroundImage: "url('/dashboard-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Full-screen dark overlay — covers entire viewport */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"></div>

      {/* Page content above overlay */}
      <div className="relative z-10 w-full h-screen flex flex-col overflow-y-auto">
        {/* Header — fixed at top */}
        <header className="fixed top-0 left-0 right-0 z-20 bg-white/12 backdrop-blur-xl border-b border-white/20">
          <div className="max-w-7xl mx-auto px-10 py-5 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-200 mr-2">
                Hello, <span className="font-semibold">{username || 'User'}</span>
              </div>

              {/* Tab Buttons (pill style, monochrome) */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`rounded-full px-4 py-1 transition transform duration-200 border ${
                    activeTab === 'home'
                      ? 'bg-gray-800 text-white shadow-lg border-gray-700'
                      : 'bg-transparent text-gray-200 border-gray-600 hover:bg-white/5'
                  }`}
                >
                  Home
                </button>

                <button
                  onClick={() => setActiveTab('positions')}
                  className={`rounded-full px-4 py-1 transition transform duration-200 border ${
                    activeTab === 'positions'
                      ? 'bg-gray-800 text-white shadow-lg border-gray-700'
                      : 'bg-transparent text-gray-200 border-gray-600 hover:bg-white/5'
                  }`}
                >
                  Positions
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-10 py-8 space-y-6 mt-[5.5rem]">
          {error && <p className="text-red-400 mb-4 font-medium">{error}</p>}

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <>
              <Card className="mb-6 shadow-xl bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl">
                <CardContent className="pt-6 text-white">
                  <h2 className="text-3xl font-bold mb-2">Welcome, {username || 'User'}! 👋</h2>
                  <p className="text-gray-200 text-lg opacity-90">You are successfully logged in to the Dashboard.</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-lg hover:shadow-2xl transition-shadow bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl">
                  <CardContent className="pt-6 text-white">
                    <h3 className="text-xl font-bold mb-2">📊 Overview</h3>
                    <p className="text-gray-200">View key metrics and statistics about your account and positions.</p>
                    <button className="mt-4 w-full rounded-full px-4 py-1 bg-gray-800 text-white hover:bg-gray-700 transition transform duration-150 hover:-translate-y-0.5">
                      Learn More
                    </button>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-2xl transition-shadow bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl">
                  <CardContent className="pt-6 text-white">
                    <h3 className="text-xl font-bold mb-2">👥 Team</h3>
                    <p className="text-gray-200">Manage team members and view their positions and roles.</p>
                    <button className="mt-4 w-full rounded-full px-4 py-1 bg-gray-800 text-white hover:bg-gray-700 transition transform duration-150 hover:-translate-y-0.5">
                      Go to Positions
                    </button>
                  </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-2xl transition-shadow bg-white/15 backdrop-blur-lg border border-white/20 rounded-2xl">
                  <CardContent className="pt-6 text-white">
                    <h3 className="text-xl font-bold mb-2">⚙️ Settings</h3>
                    <p className="text-gray-200">Update your profile and account preferences.</p>
                    <button className="mt-4 w-full rounded-full px-4 py-1 bg-gray-800 text-white hover:bg-gray-700 transition transform duration-150 hover:-translate-y-0.5">
                      Go to Settings
                    </button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* POSITIONS TAB */}
          {activeTab === 'positions' && (
            <>
              <Card className="mb-6 shadow-xl bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl">
                <CardContent className="pt-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold">All Positions</h2>
                      <p className="text-lg text-gray-300 opacity-80 mt-1">List of positions tied to users</p>
                    </div>
                    <div className="text-sm text-gray-200">
                      {positionsLoading ? 'Loading...' : `${positions.length} positions`}
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                            Position ID
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                            Position Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                            User ID
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                            Username
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                            Updated
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-200 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/2 divide-y divide-white/10">
                        {positionsLoading ? (
                          <tr>
                            <td colSpan={8} className="px-3 py-6 text-center text-gray-200">
                              Loading positions...
                            </td>
                          </tr>
                        ) : positions.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-3 py-6 text-center text-gray-200">
                              No positions found.
                            </td>
                          </tr>
                        ) : (
                          positions.map((pos, idx) => {
                            const positionId = pos.position_id ?? pos.id ?? idx + 1;
                            const code = String(pos.position_code ?? pos.code ?? '-').slice(0, 20);
                            const positionName = String(pos.position_name ?? pos.name ?? '-').slice(0, 60);
                            const userId = pos.user_id ?? pos.userId ?? pos.id ?? '-';
                            const userUsername = users.get(userId) || pos.username || '-';
                            const createdDate = formatDate(pos.created_at ?? pos.createdAt ?? pos.created ?? null);
                            const updatedDate = formatDate(pos.updated_at ?? pos.updatedAt ?? pos.updated ?? null);

                            return (
                              <tr
                                key={String(positionId) + '-' + idx}
                                className="hover:bg-white/5 transition-colors group"
                              >
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-white font-medium">
                                  {positionId}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-white">{code}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-white font-semibold">
                                  {positionName}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-white">{userId}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-white font-medium">
                                  {userUsername}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-white">{createdDate}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-white">{updatedDate}</td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-right">
                                  <button
                                    onClick={() => openDeleteConfirm(positionId, positionName)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200"
                                    title="Delete position"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Create position form */}
                  <div className="mt-6 border-t border-white/10 pt-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">Create New Position</h3>

                    <form onSubmit={handleCreatePosition} className="flex flex-col md:flex-row md:items-center gap-3">
                      {/* Wider code input: responsive, fixed 320px on md+ */}
                      <Input
                        placeholder="Position code (e.g. VP)"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        disabled={creating}
                        className="bg-white/5 text-white placeholder-gray-300 rounded-lg w-full md:w-[320px]"
                      />

                      <Input
                        placeholder="Position name (e.g. Vice President)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        disabled={creating}
                        className="bg-white/5 text-white placeholder-gray-300 rounded-lg flex-1 w-full"
                      />

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={creating}
                          className="rounded-full px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 transition transform duration-150 hover:-translate-y-0.5"
                        >
                          {creating ? 'Creating...' : 'Create'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewCode('');
                            setNewName('');
                            setCreateError(null);
                          }}
                          disabled={creating}
                          className="rounded-full px-4 py-2 border border-gray-600 text-gray-200 hover:bg-white/5 transition transform duration-150 hover:-translate-y-0.5"
                        >
                          Clear
                        </button>
                      </div>
                    </form>

                    {createError && <p className="text-sm text-red-400 mt-2">{createError}</p>}
                    <p className="text-xs text-gray-300 mt-2">
                      The position will be created and tied to the currently logged-in user on the backend.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>

        {/* Bottom-right logout button (gray monochrome) */}
        <div className="fixed right-6 bottom-6">
          <button
            onClick={handleLogout}
            className="rounded-full px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 transform transition duration-150 hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDeleteConfirm}
          ></div>

          {/* Modal */}
          <div className="relative bg-white/15 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-2">Delete Position?</h3>
            <p className="text-gray-200 mb-6">
              Are you sure you want to delete <span className="font-semibold text-red-300">"{deleteConfirm.positionName}"</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className="flex-1 rounded-full px-4 py-2 border border-gray-600 text-gray-200 hover:bg-white/5 transition transform duration-150 hover:-translate-y-0.5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePosition(deleteConfirm.positionId)}
                disabled={deleting}
                className="flex-1 rounded-full px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition transform duration-150 hover:-translate-y-0.5 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}