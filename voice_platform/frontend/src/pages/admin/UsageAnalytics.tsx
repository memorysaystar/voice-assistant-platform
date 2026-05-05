import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import type { UsageByDay, UsageByAction } from '../../api/admin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function UsageAnalytics() {
  const [daily, setDaily] = useState<UsageByDay[]>([]);
  const [actions, setActions] = useState<UsageByAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getUsageByDay(30), adminApi.getUsageByAction()])
      .then(([d, a]) => { setDaily(d.data); setActions(a.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Usage Analytics</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily API Usage (Last 30 Days)</h2>
        {daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="API Calls" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-10">No usage data yet</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Usage by Action Type</h2>
        {actions.length > 0 ? (
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={actions}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  dataKey="count"
                  nameKey="action"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {actions.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-10">No usage data yet</p>
        )}
      </div>
    </div>
  );
}
