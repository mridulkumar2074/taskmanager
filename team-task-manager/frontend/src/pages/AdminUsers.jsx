import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import client from '../api/client';
import { RoleBadge } from '../components/Badge.jsx';
import { formatDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/users', { params: { q: search || undefined } });
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [search]);

  const updateRole = async (u, role) => {
    try {
      await client.put(`/users/${u.id}/role`, { role });
      setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, role } : x)));
      toast.success(`${u.name} is now ${role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update role');
    }
  };

  const deleteUser = async (u) => {
    const confirmed = window.confirm(
      `Delete ${u.name}?\n\nThis will permanently remove the account, ` +
        `delete every project they own (and all tasks in those projects), ` +
        `and unassign them from any other tasks.\n\nThis cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await client.delete(`/users/${u.id}`);
      setUsers((arr) => arr.filter((x) => x.id !== u.id));
      toast.success(`${u.name} deleted`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete user');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Users</h1>
        <p className="text-slate-600 mt-1">Manage user accounts and roles across the workspace.</p>
      </header>

      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-left">
              <th className="px-5 py-3 font-semibold text-slate-600">User</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Role</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Joined</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-5 py-4">
                    <div className="h-6 bg-slate-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {u.id !== me.id ? (
                        <>
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u, e.target.value)}
                            className="text-xs border border-slate-200 rounded-md py-1 px-2 bg-white"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <button
                            onClick={() => deleteUser(u)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md p-1.5 transition"
                            title={`Delete ${u.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
                            </svg>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
