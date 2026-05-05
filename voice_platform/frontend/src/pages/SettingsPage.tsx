import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth';
import { Save } from 'lucide-react';
import SpinnerButton from '../components/common/SpinnerButton';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [apiKey, setApiKey] = useState(user?.mimo_api_key || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await authApi.updateMe({
        username: username !== user?.username ? username : undefined,
        email: email !== user?.email ? email : undefined,
        mimo_api_key: apiKey !== (user?.mimo_api_key || '') ? apiKey : undefined,
      });
      updateUser(res.data);
      setMsg('Settings saved successfully');
    } catch (err: any) {
      setMsg('Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom MIMO API Key (optional)</label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Leave empty to use system default"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">If you have your own MIMO API key, enter it here to use it instead of the system default.</p>
        </div>

        {msg && (
          <div className={`p-3 rounded-lg text-sm ${msg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {msg}
          </div>
        )}

        <SpinnerButton
          loading={loading}
          icon={Save}
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </SpinnerButton>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Account Info</h3>
          <div className="text-sm text-gray-500 space-y-1">
            <p>User ID: {user?.id}</p>
            <p>Role: <span className={`font-medium ${user?.role === 'admin' ? 'text-yellow-600' : 'text-gray-700'}`}>{user?.role}</span></p>
            <p>Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
