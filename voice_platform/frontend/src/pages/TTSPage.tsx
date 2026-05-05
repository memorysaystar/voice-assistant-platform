import { useState, useRef } from 'react';
import { ttsApi } from '../api/tts';
import { Download, Volume2 } from 'lucide-react';
import SpinnerButton from '../components/common/SpinnerButton';

const voices = [
  { name: '冰糖', desc: 'Sweet & bright female' },
  { name: '茉莉', desc: 'Gentle & elegant female' },
  { name: '苏打', desc: 'Lively & cute female' },
  { name: '白桦', desc: 'Steady & grand male' },
  { name: 'Mia', desc: 'English female' },
  { name: 'Chloe', desc: 'English female' },
  { name: 'Milo', desc: 'English male' },
  { name: 'Dean', desc: 'English male' },
];

export default function TTSPage() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('冰糖');
  const [style, setStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await ttsApi.synthesize(text, voice, style || undefined);
      const audioBlob = new Blob([res.data], { type: 'audio/wav' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
    } catch (err: any) {
      alert('TTS failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'tts_output.wav';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Text to Speech</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
          <div className="grid grid-cols-4 gap-2">
            {voices.map((v) => (
              <button
                key={v.name}
                onClick={() => setVoice(v.name)}
                className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                  voice === v.name
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{v.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{v.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Style (optional)</label>
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder='e.g., "cheerful tone, slightly faster"'
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <SpinnerButton
          loading={loading}
          icon={Volume2}
          onClick={handleGenerate}
          disabled={!text.trim() || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Generating...' : 'Generate Speech'}
        </SpinnerButton>

        {audioUrl && (
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
            <audio ref={audioRef} src={audioUrl} controls className="flex-1" />
            <button onClick={handleDownload} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
              <Download size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
