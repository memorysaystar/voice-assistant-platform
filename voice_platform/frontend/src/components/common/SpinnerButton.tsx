import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SpinnerButtonProps {
  loading: boolean;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  iconSize?: number;
}

/**
 * 按钮组件：loading时显示spinner，否则显示图标
 * 使用CSS visibility避免React DOM insertBefore错误
 *
 * Button component: shows spinner when loading, icon otherwise
 * Uses CSS visibility to avoid React DOM insertBefore errors
 */
export default function SpinnerButton({
  loading,
  icon: Icon,
  children,
  onClick,
  disabled,
  className = '',
  iconSize = 18,
}: SpinnerButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      <span className="relative inline-flex items-center justify-center" style={{ width: iconSize, height: iconSize }}>
        <Icon size={iconSize} className={loading ? 'invisible' : 'visible'} />
        {loading && (
          <Loader2 size={iconSize} className="animate-spin absolute inset-0" />
        )}
      </span>
      {children}
    </button>
  );
}
