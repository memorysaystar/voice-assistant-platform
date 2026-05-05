import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500">Voice Assistant Platform v1.0</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} />
          <span>{user?.username}</span>
          {user?.role === 'admin' && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Admin</span>
          )}
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
