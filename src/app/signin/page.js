'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Spline from '@splinetool/react-spline';

export default function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg) setMessage(msg);
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    console.log('Starting sign-in process...');

    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        signal: controller.signal,
        credentials: 'include', // Ensure cookies are included
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Sign-in successful:', data);
        
        // CRITICAL FIX: Use window.location.href instead of router.push
        // This forces a full page reload and ensures cookies are properly set
        window.location.href = '/dashboard';
      } else {
        const data = await response.json();
        console.error('Sign-in failed:', data);
        setError(data.error || 'Sign in failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('A network error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative w-screen h-screen">
      {/* Spline Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <Spline scene="https://prod.spline.design/SQtHQFbNWGs6Fkrf/scene.splinecode" />
      </div>

      {/* Sign-In Card Overlay */}
      <div className="relative w-full h-full flex items-center justify-center z-10 p-4">
        <div className="w-full max-w-sm p-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg">
          <h2 className="text-3xl font-bold text-center text-white mb-6">Welcome Back</h2>

          {message && (
            <div className="mb-4 p-3 text-sm text-green-300 bg-green-900/50 border border-green-500/50 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/50 border border-red-500/50 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link href="/register" className="text-purple-400 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}