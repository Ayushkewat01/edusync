import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, User, ArrowRight, Eye, EyeOff, BookOpen, Users } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', joinCode: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password, form.role, form.joinCode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex">
      {/* Left: Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #06B6D4)' }}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <span className="text-3xl font-bold">EduSync</span>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Join the Future<br />of Learning
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              Create your account and experience smart classroom management with QR attendance, 
              AI-powered assignments, and real-time collaboration.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: '📱', text: 'QR-based instant attendance' },
                { icon: '🤖', text: 'AI-powered quiz generation' },
                { icon: '📊', text: 'Real-time performance analytics' },
              ].map((feature) => (
                <div key={feature.text} className="flex items-center gap-3 text-white/90">
                  <span className="text-xl">{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-40 -right-10 w-40 h-40 bg-white/5 rounded-full" />
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background dark:bg-background-dark">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              EduSync
            </span>
          </div>

          <h2 className="text-3xl font-bold mb-2 dark:text-text-dark">Create account</h2>
          <p className="text-text-muted mb-6">Get started with your free account</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role toggle */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-text-dark">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: 'student', icon: BookOpen, label: 'Student' },
                  { role: 'teacher', icon: Users, label: 'Teacher' },
                ].map(({ role, icon: Icon, label }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ ...form, role })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.role === role
                        ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10'
                        : 'border-border dark:border-border-dark text-text-muted hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-text-dark">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="register-name"
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  required
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-text-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-text-dark">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="register-email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-text-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-text-dark">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-text-dark"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {form.role === 'student' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-medium mb-2 dark:text-text-dark">Class Join Code <span className="text-text-muted">(optional)</span></label>
                <input
                  id="register-joincode"
                  type="text"
                  value={form.joinCode}
                  onChange={update('joinCode')}
                  placeholder="e.g., ABC123"
                  className="w-full px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all dark:text-text-dark uppercase tracking-widest text-center font-mono"
                  maxLength={6}
                />
              </motion.div>
            )}

            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
