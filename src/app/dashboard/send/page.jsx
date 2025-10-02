// src/app/dashboard/send/page.jsx
import { Suspense } from 'react';
import SendEmail from './sendEmail'; // ✅ Remove .js extension

export default function SendEmailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SendEmail />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}