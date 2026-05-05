import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { chatApi } from '../api/chat';
import { ttsApi } from '../api/tts';
import { Send, Volume2, X, Download } from 'lucide-react';
import SpinnerButton from '../components/common/SpinnerButton';
import type { Message } from '../api/chat';

const TTS_VOICES = [
  { name: '冰糖', desc: '甜美女声' },
  { name: '茉莉', desc: '温柔女声' },
  { name: '苏打', desc: '活泼女声' },
  { name: '白桦', desc: '沉稳男声' },
  { name: 'Mia', desc: 'EN female' },
  { name: 'Chloe', desc: 'EN female' },
  { name: 'Milo', desc: 'EN male' },
  { name: 'Dean', desc: 'EN male' },
];

// 单条消息组件，用 memo 避免流式更新时整列表重渲染
// Single message component, memo prevents full list re-render during streaming
const ChatMessage = memo(function ChatMessage({ msg, isLast, isStreaming }: { msg: Message; isLast: boolean; isStreaming: boolean }) {
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          msg.role === 'user'
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {msg.content || (isStreaming && isLast ? (
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : null)}
        </div>
        {msg.tool_calls && msg.tool_calls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
            {msg.tool_calls.map((tc: any, j: number) => (
              <div key={j}>🔧 {tc.name}({JSON.stringify(tc.args)})</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default function DashboardPage() {
  const { id } = useParams();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRaf = useRef<number>(0);
  const { messages, setMessages, isStreaming, currentConversation, setCurrentConversation } = useChatStore();
  const { sendMessage, isConnected } = useWebSocket();

  // TTS 状态 / TTS state
  const [ttsOpen, setTtsOpen] = useState(false);
  const [ttsText, setTtsText] = useState('');
  const [ttsVoice, setTtsVoice] = useState('冰糖');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (id) {
      const convId = parseInt(id);
      chatApi.getConversation(convId).then((r) => {
        setCurrentConversation(r.data);
        setMessages(r.data.messages);
      });
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [id, setCurrentConversation, setMessages]);

  // 流式更新时节流滚动，避免每帧都触发 layout / Throttle scroll during streaming
  useEffect(() => {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => { if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current); };
  }, [messages]);

  // blob URL 清理 / Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // audioUrl 变化后自动播放 / Auto-play when audioUrl changes
  useEffect(() => {
    if (audioUrl && audioReady && audioRef.current) {
      console.log('[TTS] 尝试自动播放 / Attempting auto-play');
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log('[TTS] 自动播放成功 / Auto-play succeeded'))
          .catch((err) => console.warn('[TTS] 自动播放被浏览器阻止，需用户点击 / Auto-play blocked by browser:', err));
      }
    }
  }, [audioUrl, audioReady]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const msg = input.trim();
    setInput('');
    sendMessage(msg, currentConversation?.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTTS = async () => {
    if (!ttsText.trim() || ttsLoading) return;
    setTtsLoading(true);
    setAudioReady(false);
    console.log('[TTS] 开始合成: 音色=%s, 文字=%s / Synthesis started: voice=%s, text=%s', ttsVoice, ttsText, ttsVoice, ttsText);
    try {
      // 清理旧的 blob URL / Cleanup old blob URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl('');
      }

      const res = await ttsApi.synthesize(ttsText, ttsVoice);
      console.log('[TTS] 响应收到: type=%s, size=%d / Response received: type=%s, size=%d', res.data.type, res.data.size, res.data.type, res.data.size);

      // 确保 blob 有正确的 MIME 类型 / Ensure blob has correct MIME type
      const audioBlob = new Blob([res.data], { type: 'audio/wav' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      console.log('[TTS] Blob URL 已创建: %s / Blob URL created: %s', url, url);
    } catch (err: any) {
      console.error('[TTS] 合成失败 / Synthesis failed:', err);
      alert('语音合成失败 / TTS failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTtsLoading(false);
    }
  };

  const handleClearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
      setAudioReady(false);
    }
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `tts_${ttsVoice}_${Date.now()}.wav`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 连接状态提示 / Connection status indicator */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-700 text-center">
          正在连接服务器... / Connecting to server...
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold text-gray-600">Voice Assistant Chat</h2>
            <p className="mt-2">Start a conversation with MIMO AI</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['What can you do?', 'Tell me a joke', 'Help me write code', 'Explain quantum computing'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={msg.id} msg={msg} isLast={i === messages.length - 1} isStreaming={isStreaming} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* TTS 音频播放器 / TTS Audio Player */}
      {audioUrl && (
        <div className="border-t border-gray-200 bg-green-50 px-4 py-3">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <Volume2 size={18} className="text-green-600 flex-shrink-0" />
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              preload="auto"
              className="flex-1 h-10"
              onCanPlay={() => {
                console.log('[TTS] 音频可播放 / Audio can play');
                setAudioReady(true);
              }}
              onError={(e) => {
                console.error('[TTS] 音频加载错误 / Audio load error:', e);
              }}
            />
            <button
              onClick={handleDownloadAudio}
              className="p-2 text-gray-500 hover:text-green-600 transition-colors"
              title="下载 / Download"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleClearAudio}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="关闭 / Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 底部输入区 / Bottom input area */}
      <div className="border-t border-gray-200 bg-white">
        {/* TTS 面板 / TTS Panel */}
        {ttsOpen && (
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">语音合成 / Text to Speech</span>
              </div>
              {/* 音色选择 / Voice selection */}
              <div className="grid grid-cols-4 gap-1.5">
                {TTS_VOICES.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setTtsVoice(v.name)}
                    className={`px-2 py-1.5 rounded-md border text-xs transition-colors ${
                      ttsVoice === v.name
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="font-medium">{v.name}</span>
                    <span className="text-gray-400 ml-1">{v.desc}</span>
                  </button>
                ))}
              </div>
              {/* TTS 输入 / TTS input */}
              <div className="flex gap-2">
                <input
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTTS(); } }}
                  placeholder="输入要合成的文字 / Enter text to synthesize..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
                <SpinnerButton
                  loading={ttsLoading}
                  icon={Volume2}
                  onClick={handleTTS}
                  disabled={!ttsText.trim() || ttsLoading}
                  iconSize={16}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {ttsLoading ? '合成中...' : '合成'}
                </SpinnerButton>
              </div>
            </div>
          </div>
        )}

        {/* 聊天输入区 / Chat input area */}
        <div className="p-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            {/* TTS 切换按钮 / TTS toggle button */}
            <button
              onClick={() => setTtsOpen(!ttsOpen)}
              className={`p-3 rounded-xl border transition-colors ${
                ttsOpen
                  ? 'bg-green-50 border-green-300 text-green-600'
                  : 'bg-white border-gray-300 text-gray-400 hover:text-green-600 hover:border-green-300'
              }`}
              title="语音合成 / Text to Speech"
            >
              <Volume2 size={20} />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none max-h-32"
              rows={1}
            />
            <SpinnerButton
              loading={isStreaming}
              icon={Send}
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              iconSize={20}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
