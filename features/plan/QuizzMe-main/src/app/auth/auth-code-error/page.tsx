'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F3EE] p-4">
      <div className="w-full max-w-md p-8 bg-white border border-[#E6E0D8] rounded-3xl shadow-xl text-center">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="text-red-500" size={32} />
            </div>
        </div>
        <h1 className="serif text-2xl text-[#0E1B33] mb-4">Authentication Failed</h1>
        <p className="text-sm text-[#5A6477] mb-8 leading-relaxed">
           The magic link was invalid or has expired. This can happen if the link was already used or if it timed out.
        </p>
        <Link 
            href="/login"
            className="inline-block px-8 py-4 bg-[#0E1B33] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-[#1a2c4e] transition-colors"
        >
            Try Again
        </Link>
      </div>
    </div>
  );
}
