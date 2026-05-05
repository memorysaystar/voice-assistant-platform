import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Mic, Music, Wand2, Settings, Shield, Plus, Trash2 } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { chatApi } from '../../api/chat';
import { useEffect } from 'react';

const navItems = [
  { path: '/', icon: MessageSquare, label: 'Chat' },
  { path: '/tts', icon: Mic, label: 'TTS' },
  { path: '/voice-clone', icon: Music, label: 'Voice Clone' },
  { path: '/voice-design', icon: Wand2, label: 'Voice Design' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { conversations, setConversations, currentConversation, setCurrentConversation, removeConversation } = useChatStore();

  useEffect(() => {
    chatApi.getConversations().then((r) => setConversations(r.data)).catch(() => {});
  }, [setConversations]);

  const handleNewChat = () => {
    setCurrentConversation(null);
    useChatStore.getState().setMessages([]);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await chatApi.deleteConversation(id);
    removeConversation(id);
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">Voice Assistant</h1>
        <p className="text-xs text-gray-400 mt-1">Welcome, {user?.username}</p>
      </div>

      <button onClick={handleNewChat} className="m-3 mb-1 flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors">
        <Plus size={16} /> New Chat
      </button>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-2 mb-2">Conversations</p>
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            to={`/conversations/${conv.id}`}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              currentConversation?.id === conv.id ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
            onClick={() => setCurrentConversation(conv)}
          >
            <span className="truncate flex-1">{conv.title}</span>
            <button
              onClick={(e) => handleDelete(conv.id, e)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity ml-2"
            >
              <Trash2 size={14} />
            </button>
          </Link>
        ))}
      </div>

      <nav className="border-t border-gray-700 p-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              location.pathname === item.path ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm mt-1 transition-colors ${
              location.pathname.startsWith('/admin') ? 'bg-gray-700 text-white' : 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-800'
            }`}
          >
            <Shield size={18} />
            Admin Panel
          </Link>
        )}
      </nav>
    </aside>
  );
}
