import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import type { ConfigItem } from '../../api/admin';
import { Save } from 'lucide-react';
import SpinnerButton from '../../components/common/SpinnerButton';

export default function SystemConfig() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    adminApi.getConfig().then((r) => setConfigs(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSaving(key);
    try {
      await adminApi.updateConfig(key, value);
      setConfigs((prev) => prev.map((c) => c.key === key ? { ...c, value } : c));
    } catch (err: any) {
      alert('Failed to update: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving('');
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">System Configuration</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {configs.map((config) => (
          <ConfigRow key={config.key} config={config} saving={saving === config.key} onSave={handleUpdate} />
        ))}
      </div>
    </div>
  );
}

function ConfigRow({ config, saving, onSave }: { config: ConfigItem; saving: boolean; onSave: (key: string, value: string) => void }) {
  const [value, setValue] = useState(config.value);

  return (
    <div className="p-4 flex items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{config.key}</p>
        {config.description && <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>}
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-64 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
      {value !== config.value && (
        <SpinnerButton
          loading={saving}
          icon={Save}
          onClick={() => onSave(config.key, value)}
          disabled={saving}
          iconSize={14}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Save
        </SpinnerButton>
      )}
    </div>
  );
}
