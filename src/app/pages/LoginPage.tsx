import { useState } from 'react';
import { motion } from 'motion/react';
import { Home, Mail, Lock, Chrome, Briefcase, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router';

import { appConfig, isBackendConfigured } from '@/app/config/appConfig';
import { useAuth } from '@/app/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, loginAsDemoHelper, loginAsDemoAdmin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/home');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/home');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelperDemoLogin = async () => {
    setLoading(true);
    try {
      await loginAsDemoHelper();
      navigate('/helper/jobs');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDemoLogin = async () => {
    setLoading(true);
    try {
      await loginAsDemoAdmin();
      navigate('/admin/applications');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 max-w-[430px] mx-auto">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="rounded-xl bg-blue-600 p-2">
              <Home className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">HomeTask</h1>
          </div>

          <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="mb-6 text-center text-sm text-gray-600">Chào mừng bạn trở lại với HomeTask</p>

          {!isBackendConfigured && (
            <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
              Đang chạy ở chế độ local. Khi cấu hình `VITE_API_BASE_URL`, ứng dụng sẽ gọi backend qua lớp API.
            </div>
          )}

          {(!isBackendConfigured || appConfig.enableDemoTools) && (
            <button
              data-testid="login-google-demo"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-300 px-5 py-3 font-medium text-gray-700 transition-all hover:border-blue-600 hover:text-blue-600 disabled:opacity-50"
            >
              <Chrome className="h-5 w-5" />
              Đăng nhập với Google
            </button>
          )}

          {appConfig.enableDemoTools && (
            <>
              <button
                data-testid="login-helper-demo"
                onClick={handleHelperDemoLogin}
                disabled={loading}
                className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#6366F1] bg-[#6366F1]/5 px-5 py-3 font-medium text-[#6366F1] transition-all hover:bg-[#6366F1]/10 disabled:opacity-50"
              >
                <Briefcase className="h-5 w-5" />
                Xem demo người giúp việc
              </button>

              <button
                data-testid="login-admin-demo"
                onClick={handleAdminDemoLogin}
                disabled={loading}
                className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-300 px-5 py-3 font-medium text-gray-700 transition-all hover:border-[#1A365D] hover:text-[#1A365D] disabled:opacity-50"
              >
                <ShieldCheck className="h-5 w-5" />
                Xem demo quản trị
              </button>
            </>
          )}

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Hoặc đăng nhập với email</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-600">Ghi nhớ</span>
              </label>
              <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
                Quên mật khẩu?
              </a>
            </div>

            <button
              data-testid="login-email-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-gray-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Đăng ký ngay
            </Link>
            <div className="mt-2">
              <Link to="/register?role=helper" className="font-semibold text-[#6366F1] hover:text-[#4F46E5]">
                Nộp đơn làm người giúp việc
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
