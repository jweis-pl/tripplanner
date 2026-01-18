'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function Dashboard() {
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <span className="text-xl font-semibold text-slate-900">TripPlanner</span>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back{userName ? `, ${userName}` : ''}!
          </h1>
          <p className="text-slate-600 mt-2">
            Plan your next adventure with friends and family.
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
          <div className="text-center py-12">
            <div className="text-6xl mb-6">✈️</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              No trips yet
            </h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Start planning your first trip! Invite friends and family to collaborate on destinations, accommodations, and activities.
            </p>
            <Link
              href="/trips/new"
              className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg active:scale-95"
            >
              Create New Trip
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
