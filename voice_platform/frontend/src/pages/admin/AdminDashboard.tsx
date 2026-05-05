import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import type { AnalyticsOverview, UsageByDay } from '../../api/admin';
import { Users, MessageSquare, Activity, TrendingUp, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [usage, setUsage] = useState<UsageByDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getOverview(), adminApi.getUsageByDay(14)])
      .then(([ov, us]) => { setOverview(ov.data); setUsage(us.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

  const stats = overview ? [
    { label: 'Total Users', value: overview.total_users, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Users', value: overview.active_users, icon: Activity, color: 'bg-green-500' },
    { label: 'Conversations', value: overview.total_conversations, icon: MessageSquare, color: 'bg-purple-500' },
    { label: 'API Calls Today', value: overview.calls_today, icon: TrendingUp, color: 'bg-orange-500' },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/admin/users" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Users size={16} className="inline mr-1" /> Users
          </Link>
          <Link to="/admin/config" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Settings size={16} className="inline mr-1" /> Config
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">API Usage (Last 14 Days)</h2>
        {usage.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-10">No usage data yet</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/admin/users" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <Users size={24} className="text-blue-500 mb-2" />
          <h3 className="font-semibold text-gray-800">User Management</h3>
          <p className="text-sm text-gray-500">View and manage user accounts</p>
        </Link>
        <Link to="/admin/analytics" className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <TrendingUp size={24} className="text-purple-500 mb-2" />
          <h3 className="font-semibold text-gray-800">Usage Analytics</h3>
          <p className="text-sm text-gray-500">Detailed usage statistics and reports</p>
        </Link>
      </div>
    </div>
  );
}
