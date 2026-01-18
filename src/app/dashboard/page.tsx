'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  description: string | null;
}

export default function Dashboard() {
  const [userName, setUserName] = useState<string>('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } else if (user.email) {
        setUserName(user.email.split('@')[0]);
      }

      // Fetch user's trips
      const { data: tripsData, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching trips:', error);
      } else {
        setTrips(tripsData || []);
      }

      setLoading(false);
    };
    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back{userName ? `, ${userName}` : ''}!
            </h1>
            <p className="text-slate-600 mt-2">
              Plan your next adventure with friends and family.
            </p>
          </div>
          <Link
            href="/dashboard/create-trip"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg active:scale-95"
          >
            <span>+</span>
            <span>Create New Trip</span>
          </Link>
        </div>

        {/* Trips List or Empty State */}
        {trips.length === 0 ? (
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
                href="/dashboard/create-trip"
                className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg active:scale-95"
              >
                Create New Trip
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">✈️</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {trip.name}
                </h3>
                <p className="text-slate-600 text-sm mb-3">
                  {trip.destination}
                </p>
                <p className="text-slate-400 text-sm">
                  {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
