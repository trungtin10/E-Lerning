import React, { useState } from 'react';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('auth/login', { email, password });
      const { token, fullName, roles } = response.data;

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ fullName, roles }));

      // Redirect based on role
      if (roles.includes('SuperAdmin')) {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-5">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-[1.75rem] font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", letterSpacing: '-0.03em', lineHeight: 1.35, fontWeight: 700 }}>
            Chào mừng trở lại
          </h2>
          <p className="mt-2 text-[0.9375rem] text-slate-500 font-normal leading-relaxed mx-auto" style={{ letterSpacing: '0.02em' }}>
            Đăng nhập để tiếp tục truy{'\u00A0'}cập hệ thống
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <p className="text-sm font-medium text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" style={{ letterSpacing: '0.01em' }}>
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-[0.9375rem] font-medium text-slate-800 placeholder:text-slate-400 transition-all"
                  placeholder="admin@elearning.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" style={{ letterSpacing: '0.01em' }}>
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-[0.9375rem] font-medium text-slate-800 placeholder:text-slate-400 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-700">
                Ghi nhớ đăng nhập
              </label>
            </div>
            <div>
              <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Quên mật khẩu?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-[0.9375rem] font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/30"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
