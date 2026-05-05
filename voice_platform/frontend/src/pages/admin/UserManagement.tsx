import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import type { UserListItem } from '../../api/admin';
import { Search, Shield, ShieldOff, UserX } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    setLoading(true);
    adminApi.getUsers(0, 100, search).then((r) => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const toggleRole = async (user: UserListItem) => {
    await adminApi.updateUser(user.id, { role: user.role === 'admin' ? 'user' : 'admin' });
    loadUsers();
  };

  const toggleActive = async (user: UserListItem) => {
    await adminApi.updateUser(user.id, { is_active: !user.is_active });
    loadUsers();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          Search
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversations</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Calls</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.username}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    u.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>{u.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.conversation_count}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.usage_count}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleRole(u)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 transition-colors"
                      title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                    >
                      {u.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title={u.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <UserX size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
