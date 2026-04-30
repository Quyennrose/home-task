import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Home, User, Briefcase, Info, LogOut, ShieldCheck, Bell, RotateCcw, CalendarDays, UserRound, Activity } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { appConfig, isBackendConfigured } from '@/app/config/appConfig';
import { localApi } from '@/app/utils/localApi';
import { clearDemoData } from '@/app/utils/notificationStorage';
import type { AppNotification } from '@/app/utils/notificationStorage';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationsVersion, setNotificationsVersion] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    let active = true;
    localApi.notifications.listByUser(user?.id).then((nextNotifications) => {
      if (active) {
        setNotifications(nextNotifications.slice(0, 5));
      }
    });

    return () => {
      active = false;
    };
  }, [user?.id, notificationsVersion, showUserMenu]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleReadNotifications = () => {
    localApi.notifications.markRead(user?.id).then(() => {
      setNotificationsVersion((version) => version + 1);
    });
  };

  const handleResetDemoData = () => {
    clearDemoData();
    setShowUserMenu(false);
    window.location.reload();
  };

  const customerNavItems = [
    { path: '/home', label: 'Trang chủ', icon: Home },
    { path: '/bookings', label: 'Lịch', icon: CalendarDays },
    { path: '/services', label: 'Dịch vụ', icon: Briefcase },
    { path: '/helpers', label: 'Nhân viên', icon: User },
  ];
  const helperNavItems = [
    { path: '/home', label: 'Tổng quan', icon: Home },
    { path: '/helper/jobs', label: 'Công việc', icon: Briefcase },
    { path: '/helper/profile', label: 'Hồ sơ', icon: UserRound },
    { path: '/about', label: 'Quy trình', icon: Info },
  ];
  const adminNavItems = [
    { path: '/admin/applications', label: 'Hồ sơ', icon: ShieldCheck },
    { path: '/admin/bookings', label: 'Lịch', icon: CalendarDays },
    { path: '/admin/audit-logs', label: 'Log', icon: Activity },
    { path: '/about', label: 'Quy trình', icon: Info },
  ];
  const navItems = user?.userType === 'admin'
    ? adminNavItems
    : user?.userType === 'helper'
      ? helperNavItems
      : customerNavItems;

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-20 max-w-[430px] mx-auto relative shadow-xl">
      {/* Mobile App Header */}
      <header className="bg-gradient-to-r from-[#1A365D] to-[#2C5282] sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-xl">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white text-lg font-bold">HomeTask</h1>
                <p className="text-[#E2E8F0] text-xs">
                  {user?.userType === 'admin'
                    ? 'Bảng quản trị vận hành'
                    : user?.userType === 'helper'
                      ? 'Bảng việc người giúp việc'
                      : 'Dọn dẹp chuyên nghiệp'}
                </p>
              </div>
            </Link>

            {user && (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors"
              >
                <User className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* User Menu Dropdown */}
          {showUserMenu && user && (
            <div className="mt-3 bg-white rounded-xl p-3 shadow-lg">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                <div className="bg-[#F0F4F8] p-2 rounded-lg">
                  <User className="w-4 h-4 text-[#1A365D]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A365D]">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {!isBackendConfigured && (
                    <p className="text-[10px] text-yellow-700 font-medium mt-0.5">Local mode</p>
                  )}
                  <p className="text-[10px] text-[#6366F1] font-medium mt-0.5">
                    {user.userType === 'admin' ? 'Quản trị' : user.userType === 'helper' ? 'Người giúp việc' : 'Khách hàng'}
                  </p>
                </div>
              </div>
              <div className="mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#1A365D]">
                    <Bell className="w-4 h-4" />
                    <span className="text-sm font-semibold">Thông báo</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReadNotifications}
                    className="text-[10px] text-[#6366F1] font-semibold"
                  >
                    Đã đọc
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notification) => (
                    <div key={notification.id} className={`rounded-lg p-2 ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                      <p className="text-xs font-semibold text-[#1A365D]">{notification.title}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">{notification.message}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-500">Chưa có thông báo.</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetDemoData}
                className={`w-full items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-2 ${appConfig.enableLocalReset ? 'flex' : 'hidden'}`}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm font-medium">Reset dữ liệu demo</span>
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-140px)]">{children}</main>

      {/* Bottom Navigation (Mobile App Style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-[430px] mx-auto shadow-2xl">
        <div className={`${navItems.length === 2 ? 'grid-cols-2' : navItems.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} grid gap-1 px-2 py-2`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#6366F1]/10 text-[#6366F1]'
                    : 'text-gray-600 hover:text-[#6366F1] hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
