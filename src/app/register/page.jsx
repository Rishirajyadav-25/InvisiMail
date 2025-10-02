'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Spline from '@splinetool/react-spline';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Register response status:', response.status);

      if (response.ok) {
        // Use window.location.href for consistent navigation
        window.location.href = '/signin?message=Registration successful! Please sign in.';
      } else {
        const data = await response.json();
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      
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

      {/* Registration Card Overlay */}
      <div className="relative w-full h-full flex items-center justify-center z-10 p-4">
        <div className="w-full max-w-md p-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg">
          <h2 className="text-3xl font-bold text-center text-white mb-6">Create an Account</h2>

          {error && (
            <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/50 border border-red-500/50 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            />
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
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={6}
              className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
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
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link href="/signin" className="text-purple-400 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}