'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface FormData {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
  invitedEmails: string[];
  categories: { name: string; emoji: string; enabled: boolean }[];
}

const defaultCategories = [
  { name: 'Lodging', emoji: '🏠', enabled: true },
  { name: 'Activities', emoji: '🎯', enabled: true },
  { name: 'Food', emoji: '🍴', enabled: true },
  { name: 'Transportation', emoji: '🚗', enabled: true },
  { name: 'Home & Away', emoji: '🏡', enabled: true },
];

export default function CreateTrip() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    description: '',
    invitedEmails: [],
    categories: defaultCategories,
  });

  // Step 2 - Email input state
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');

  // Step 3 - Custom category state
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryEmoji, setCustomCategoryEmoji] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Auth result:', { user, authError });

      if (authError) {
        console.error('Auth error:', authError);
      }

      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('User authenticated:', user.id, user.email);
      setUserId(user.id);
    };
    checkAuth();
  }, [router]);

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Trip name is required');
      return false;
    }
    if (!formData.destination.trim()) {
      setError('Destination is required');
      return false;
    }
    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }
    if (!formData.endDate) {
      setError('End date is required');
      return false;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return false;
    }
    setError('');
    return true;
  };

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (formData.invitedEmails.includes(email)) {
      setEmailError('This email has already been added');
      return;
    }

    setFormData({
      ...formData,
      invitedEmails: [...formData.invitedEmails, email],
    });
    setEmailInput('');
    setEmailError('');
  };

  const handleRemoveEmail = (email: string) => {
    setFormData({
      ...formData,
      invitedEmails: formData.invitedEmails.filter((e) => e !== email),
    });
  };

  const toggleCategory = (index: number) => {
    const newCategories = [...formData.categories];
    newCategories[index].enabled = !newCategories[index].enabled;
    setFormData({ ...formData, categories: newCategories });
  };

  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) return;

    const emoji = customCategoryEmoji.trim() || '📌';
    setFormData({
      ...formData,
      categories: [
        ...formData.categories,
        { name: customCategoryName.trim(), emoji, enabled: true },
      ],
    });
    setCustomCategoryName('');
    setCustomCategoryEmoji('');
  };

  const handleCreateTrip = async () => {
    console.log('=== Starting trip creation ===');
    console.log('User ID:', userId);
    console.log('Form data:', formData);

    if (!userId) {
      setError('You must be logged in to create a trip');
      return;
    }

    const enabledCategories = formData.categories.filter((c) => c.enabled);
    if (enabledCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create the trip
      console.log('Step 1: Creating trip...');
      const tripData = {
        name: formData.name.trim(),
        destination: formData.destination.trim(),
        start_date: formData.startDate,
        end_date: formData.endDate,
        description: formData.description.trim() || null,
        created_by: userId,
      };
      console.log('Trip data to insert:', tripData);

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      console.log('Trip creation result:', { trip, tripError });

      if (tripError) {
        console.error('Trip creation failed:', tripError);
        throw new Error(`Failed to create trip: ${tripError.message}`);
      }

      // 2. Add creator as owner in trip_members
      console.log('Step 2: Adding trip member...');
      const memberData = {
        trip_id: trip.id,
        user_id: userId,
        role: 'owner',
      };
      console.log('Member data to insert:', memberData);

      const { error: memberError } = await supabase
        .from('trip_members')
        .insert(memberData);

      console.log('Member creation result:', { memberError });

      if (memberError) {
        console.error('Member creation failed:', memberError);
        throw new Error(`Failed to add trip member: ${memberError.message}`);
      }

      // 3. Create categories
      console.log('Step 3: Creating categories...');
      const categoryInserts = enabledCategories.map((cat) => ({
        trip_id: trip.id,
        name: cat.name,
        icon: cat.emoji,  // Database uses 'icon' column
      }));
      console.log('Categories to insert:', categoryInserts);

      const { error: categoryError } = await supabase
        .from('categories')
        .insert(categoryInserts);

      console.log('Category creation result:', { categoryError });

      if (categoryError) {
        console.error('Category creation failed:', categoryError);
        throw new Error(`Failed to create categories: ${categoryError.message}`);
      }

      // 4. Store invitations (for later invitation system)
      if (formData.invitedEmails.length > 0) {
        console.log('Step 4: Creating invitations...');
        const invitationInserts = formData.invitedEmails.map((email) => ({
          trip_id: trip.id,
          email,
          invited_by: userId,
          status: 'pending',
        }));

        const { error: inviteError } = await supabase
          .from('invitations')
          .insert(invitationInserts);

        console.log('Invitation creation result:', { inviteError });

        // Don't fail if invitations table doesn't exist yet
        if (inviteError) {
          console.warn('Could not save invitations (table may not exist):', inviteError);
        }
      }

      // 5. Redirect to dashboard (trip detail page coming soon)
      console.log('=== Trip creation successful! Trip ID:', trip.id);
      router.push('/dashboard');
    } catch (err) {
      console.error('=== Trip creation error ===', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create trip. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors">
            <span>←</span>
            <span className="text-2xl">✈️</span>
            <span className="text-xl font-semibold text-slate-900">TripPlanner</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Step {step} of 3</span>
            <span className="text-sm text-slate-400">
              {step === 1 && 'Trip Basics'}
              {step === 2 && 'Invite People'}
              {step === 3 && 'Categories'}
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-purple-700 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Trip Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Trip Basics</h2>
                <p className="text-slate-600">Let&apos;s start with the essentials for your trip.</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Trip Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-400"
                  placeholder="Summer Beach Getaway"
                />
              </div>

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-2">
                  Destination *
                </label>
                <input
                  id="destination"
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-400"
                  placeholder="Miami, Florida"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">
                    End Date *
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-400 resize-none"
                  placeholder="A fun week at the beach with the family..."
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg active:scale-95"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Invite People */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Invite People</h2>
                <p className="text-slate-600">Add friends and family to collaborate on this trip.</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="flex gap-3">
                  <input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setEmailError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-400"
                    placeholder="friend@example.com"
                  />
                  <button
                    onClick={handleAddEmail}
                    className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                  >
                    Add
                  </button>
                </div>
                {emailError && (
                  <p className="mt-2 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              {/* Added Emails List */}
              {formData.invitedEmails.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Invitations ({formData.invitedEmails.length})
                  </p>
                  <div className="space-y-2">
                    {formData.invitedEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg"
                      >
                        <span className="text-slate-700">{email}</span>
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.invitedEmails.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p>No invitations added yet.</p>
                  <p className="text-sm mt-1">You can always add people later.</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg active:scale-95"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Categories Setup */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Categories</h2>
                <p className="text-slate-600">Choose how you want to organize your trip planning.</p>
              </div>

              {/* Category Checkboxes */}
              <div className="space-y-3">
                {formData.categories.map((category, index) => (
                  <label
                    key={`${category.name}-${index}`}
                    className="flex items-center gap-4 px-4 py-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={category.enabled}
                      onChange={() => toggleCategory(index)}
                      className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-600 focus:ring-offset-0"
                    />
                    <span className="text-xl">{category.emoji}</span>
                    <span className="text-slate-700 font-medium">{category.name}</span>
                  </label>
                ))}
              </div>

              {/* Add Custom Category */}
              <div className="border-t border-slate-200 pt-6">
                <p className="text-sm font-medium text-slate-700 mb-3">Add Custom Category</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customCategoryEmoji}
                    onChange={(e) => setCustomCategoryEmoji(e.target.value)}
                    className="w-16 px-3 py-3 border border-slate-300 rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="📌"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomCategory())}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-400"
                    placeholder="Category name"
                  />
                  <button
                    onClick={handleAddCustomCategory}
                    className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateTrip}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Trip...' : 'Create Trip'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
