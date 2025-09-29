'use client';

import { useState } from 'react';
import Link from 'next/link';
import Spline from '@splinetool/react-spline';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => { e.preventDefault(); /* ... your form submission logic ... */ };

  return (
    <main className="relative w-screen h-screen">
      {/* 1. Spline Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <Spline
          scene="https://prod.spline.design/SQtHQFbNWGs6Fkrf/scene.splinecode" 
        />
      </div>

      {/* 2. Sign-In Card Overlay */}
      <div className="relative w-full h-full flex items-center justify-center z-10">
        <div className="w-full max-w-sm p-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300 mb-8">Sign in to access your account</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="email" 
                placeholder="Email" 
                required 
                className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" 
              />
              <input 
                type="password" 
                placeholder="Password" 
                required 
                className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400" 
              />
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors"
              >
                Sign In
              </button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">
              No account? <Link href="/register" className="text-purple-400 hover:underline">Register Here</Link>
            </p>
        </div>
      </div>
    </main>
  );
}