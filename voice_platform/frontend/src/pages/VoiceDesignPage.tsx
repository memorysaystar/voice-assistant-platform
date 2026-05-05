import { useState, useRef } from 'react';
import { ttsApi } from '../api/tts';
import { Wand2, Download } from 'lucide-react';
import SpinnerButton from '../components/common/SpinnerButton';

const examples = [
  'A warm, gentle female voice, speaking slowly with care',
  'A deep, magnetic male voice with a slight rasp',
  'An energetic teenage voice, speaking quickly and cheerfully',
  'A professional news anchor voice, clear and authoritative',
];

export default function VoiceDesignPage() {
  const [voicePrompt, setVoicePrompt] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    if (!voicePrompt.trim() || !text.trim()) return;
    setLoading(true);
    try {
      const res = await ttsApi.design(voicePrompt, text);
      const audioBlob = new Blob([res.data], { type: 'audio/wav' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
    } catch (err: any) {
      alert('Voice design failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Voice Design</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Describe the Voice</label>
          <textarea
            value={voicePrompt}
            onChange={(e) => setVoicePrompt(e.target.value)}
            placeholder="Describe the voice you want in natural language..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            rows={3}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setVoicePrompt(ex)}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Text to Synthesize</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to speak in the designed voice..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            rows={3}
          />
        </div>

        <SpinnerButton
          loading={loading}
          icon={Wand2}
          onClick={handleGenerate}
          disabled={!voicePrompt.trim() || !text.trim() || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Designing Voice...' : 'Design & Generate'}
        </SpinnerButton>

        {audioUrl && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Designed Voice Output</p>
            <div className="flex items-center gap-4">
              <audio ref={audioRef} src={audioUrl} controls className="flex-1" />
              <a href={audioUrl} download="designed_voice.wav" className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Download size={20} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
