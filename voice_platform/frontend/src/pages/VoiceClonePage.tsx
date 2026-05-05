import { useState, useRef } from 'react';
import { ttsApi } from '../api/tts';
import { Upload, Download, Music } from 'lucide-react';
import SpinnerButton from '../components/common/SpinnerButton';

export default function VoiceClonePage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleGenerate = async () => {
    if (!file || !text.trim()) return;
    setLoading(true);
    try {
      const res = await ttsApi.clone(file, text);
      const audioBlob = new Blob([res.data], { type: 'audio/wav' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
    } catch (err: any) {
      alert('Voice clone failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Voice Cloning</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Voice Sample</label>
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById('audio-input')?.click()}
          >
            <input id="audio-input" type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <Music size={24} className="text-blue-500" />
                <div>
                  <p className="font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Drop audio file here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Supports MP3, WAV, M4A, FLAC</p>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Text to Synthesize</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to speak in the cloned voice..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            rows={3}
          />
        </div>

        <SpinnerButton
          loading={loading}
          icon={Music}
          onClick={handleGenerate}
          disabled={!file || !text.trim() || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? 'Cloning Voice...' : 'Clone & Generate'}
        </SpinnerButton>

        {audioUrl && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Cloned Voice Output</p>
            <div className="flex items-center gap-4">
              <audio ref={audioRef} src={audioUrl} controls className="flex-1" />
              <a href={audioUrl} download="cloned_voice.wav" className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                <Download size={20} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
