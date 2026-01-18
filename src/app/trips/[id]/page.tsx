'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  description: string | null;
  created_by: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  trip_id: string;
  task_count?: number;
}

type TabType = 'planning' | 'itinerary' | 'settings';

export default function TripDetail() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('planning');

  useEffect(() => {
    const loadTripData = async () => {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch trip data
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError || !tripData) {
        console.error('Error fetching trip:', tripError);
        setError('Trip not found');
        setLoading(false);
        return;
      }

      // Check if user is a member of this trip
      const { data: memberData, error: memberError } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .single();

      if (memberError || !memberData) {
        console.error('Not a member of this trip');
        router.push('/dashboard');
        return;
      }

      // Get member count
      const { count } = await supabase
        .from('trip_members')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', tripId);

      setMemberCount(count || 1);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true });

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      // Fetch task counts for each category
      let categoriesWithCounts: Category[] = categoriesData || [];
      if (categoriesData && categoriesData.length > 0) {
        const { data: taskCounts } = await supabase
          .from('tasks')
          .select('category_id')
          .in('category_id', categoriesData.map(c => c.id));

        if (taskCounts) {
          const countMap = taskCounts.reduce((acc, task) => {
            acc[task.category_id] = (acc[task.category_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          categoriesWithCounts = categoriesData.map(cat => ({
            ...cat,
            task_count: countMap[cat.id] || 0,
          }));
        }
      }

      setTrip(tripData);
      setCategories(categoriesWithCounts);
      setLoading(false);
    };

    loadTripData();
  }, [tripId, router]);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const yearOptions: Intl.DateTimeFormatOptions = { year: 'numeric' };

    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    const year = end.toLocaleDateString('en-US', yearOptions);

    if (start.getFullYear() === end.getFullYear()) {
      return `${startStr} - ${endStr}, ${year}`;
    }
    return `${startStr}, ${start.getFullYear()} - ${endStr}, ${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Loading trip...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Trip not found</h1>
          <p className="text-slate-600 mb-6">This trip doesn&apos;t exist or you don&apos;t have access.</p>
          <Link
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Back
            </Link>
          </div>

          {/* Trip Info */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                {trip.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-600">
                <span className="flex items-center gap-1">
                  <span>📍</span>
                  {trip.destination}
                </span>
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  {formatDateRange(trip.start_date, trip.end_date)}
                </span>
                <span className="flex items-center gap-1">
                  <span>👥</span>
                  {memberCount} {memberCount === 1 ? 'person' : 'people'}
                </span>
              </div>
            </div>
            <button
              className="px-4 py-2 border-2 border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
            >
              Edit Trip
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 border-b border-slate-200 -mb-px">
            <button
              onClick={() => setActiveTab('planning')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'planning'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Planning
            </button>
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'itinerary'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Itinerary
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'settings'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'planning' && (
          <>
            {/* Categories Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Categories</h2>
              </div>

              {categories.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 text-center">
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-slate-600">No categories yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/trips/${tripId}/categories/${category.id}`}
                      className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 hover:shadow-md hover:border-purple-200 transition-all group"
                    >
                      <div className="text-4xl mb-3">{category.icon}</div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {category.task_count || 0} {category.task_count === 1 ? 'item' : 'items'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all text-sm">
                  + Add Item
                </button>
                <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all text-sm">
                  Invite People
                </button>
                <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all text-sm">
                  Export Trip
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'itinerary' && (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 text-center">
            <div className="text-6xl mb-4">🗓️</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Itinerary</h2>
            <p className="text-slate-600 mb-6">Day-by-day planning coming soon!</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 text-center">
            <div className="text-6xl mb-4">⚙️</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">Trip Settings</h2>
            <p className="text-slate-600 mb-6">Manage trip settings, members, and more coming soon!</p>
          </div>
        )}
      </main>
    </div>
  );
}
