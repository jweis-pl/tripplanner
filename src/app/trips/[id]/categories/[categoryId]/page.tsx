'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  icon: string;
  trip_id: string;
}

interface Trip {
  id: string;
  name: string;
}

interface Task {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
}

interface TripMember {
  user_id: string;
  email?: string | null;
  full_name?: string | null;
}

export default function CategoryDetail() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const categoryId = params.categoryId as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<Task>>({});
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // For adding new tasks inline
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: 'not_started' as Task['status'],
  });

  useEffect(() => {
    loadData();
  }, [tripId, categoryId]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch category
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (categoryError || !categoryData) {
      setError('Category not found');
      setLoading(false);
      return;
    }

    // Fetch trip
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('id, name')
      .eq('id', tripId)
      .single();

    if (tripError || !tripData) {
      setError('Trip not found');
      setLoading(false);
      return;
    }

    // Fetch tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    }

    // Fetch trip members for assignee dropdown (profiles join for display name)
    const { data: membersData } = await supabase
      .from('trip_members')
      .select('user_id, profiles(full_name, email)')
      .eq('trip_id', tripId);

    setCategory(categoryData);
    setTrip(tripData);
    setTasks(tasksData || []);
    setMembers(
      (membersData || []).map((member: { user_id: string; profiles?: { full_name?: string | null; email?: string | null }[] | { full_name?: string | null; email?: string | null } | null }) => {
        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
        return {
          user_id: member.user_id,
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
        };
      })
    );
    setLoading(false);
  };

  const startEditingTask = (task: Task, field: string) => {
    setEditingTaskId(task.id);
    setEditingField(field);
    setEditingValues({ ...task });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingField(null);
    setEditingValues({});
  };

  const saveFieldChange = async (task: Task, field: string) => {
    setSavingTaskId(task.id);

    const updateData: Record<string, any> = {
      [field]: field === 'description' || field === 'due_date' ? (editingValues[field as keyof Task] || null) : editingValues[field as keyof Task],
    };

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', task.id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, ...updateData } : t));
    }

    setSavingTaskId(null);
    cancelEditing();
  };

  const handleAddTask = async () => {
    if (!newTaskData.title.trim()) return;

    const { error } = await supabase
      .from('tasks')
      .insert({
        category_id: categoryId,
        title: newTaskData.title.trim(),
        description: newTaskData.description.trim() || null,
        due_date: newTaskData.due_date || null,
        status: newTaskData.status,
      });

    if (error) {
      console.error('Error adding task:', error);
      return;
    }

    setNewTaskData({
      title: '',
      description: '',
      due_date: '',
      status: 'not_started',
    });
    setIsAddingTask(false);
    loadData();
  };

  const handleDelete = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return;
    }

    setDeleteConfirm(null);
    loadData();
  };

  const toggleStatus = async (task: Task, newStatus: Task['status']) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating task status:', error);
      return;
    }

    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const handleAssigneeChange = async (task: Task, assigneeId: string) => {
    const nextAssignee = assigneeId === 'unassigned' ? null : assigneeId;
    const { error } = await supabase
      .from('tasks')
      .update({ assignee_id: nextAssignee })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating assignee:', error);
      return;
    }

    setTasks(tasks.map(t => t.id === task.id ? { ...t, assignee_id: nextAssignee } : t));
  };

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-600">Completed</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">In Progress</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">Not Started</span>;
    }
  };

  const getMemberLabel = (member?: TripMember) => {
    if (!member) return 'Unassigned';
    if (member.full_name?.trim()) return member.full_name;
    if (member.email?.trim()) return member.email;
    return 'Member';
  };

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

  if (error || !category || !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">{error || 'Not found'}</h1>
          <Link
            href={`/trips/${tripId}`}
            className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all"
          >
            Back to Trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <span>←</span>
            <span>Back to {trip.name}</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{category.icon}</span>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {category.name}
                </h1>
                <p className="text-slate-500">{trip.name}</p>
              </div>
            </div>
            <button
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg active:scale-95"
            >
              <span>+</span>
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {tasks.length === 0 && !isAddingTask ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-slate-200 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">No items yet</h2>
            <p className="text-slate-600 mb-6">
              Click &quot;Add Item&quot; to start planning your {category.name.toLowerCase()}.
            </p>
            <button
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
            >
              <span>+</span>
              <span>Add First Item</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Add New Task Inline */}
            {isAddingTask && (
              <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-purple-200 space-y-3">
                <input
                  autoFocus
                  type="text"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setNewTaskData({
                        title: '',
                        description: '',
                        due_date: '',
                        status: 'not_started',
                      });
                      setIsAddingTask(false);
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-400"
                  placeholder="Task title *"
                />
                <textarea
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-400 resize-none"
                  rows={2}
                  placeholder="Description (optional)"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={newTaskData.due_date}
                    onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                  <select
                    value={newTaskData.status}
                    onChange={(e) => setNewTaskData({ ...newTaskData, status: e.target.value as Task['status'] })}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setNewTaskData({
                        title: '',
                        description: '',
                        due_date: '',
                        status: 'not_started',
                      });
                      setIsAddingTask(false);
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskData.title.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            )}

            {/* Task List */}
            {tasks.map((task) => {
              const assignee = members.find(member => member.user_id === task.assignee_id);
              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-xl shadow-sm p-4 border border-slate-200 hover:shadow-md transition-all ${task.status === 'completed' ? 'opacity-75' : ''
                    }`}
                >
                <div className="flex items-start gap-4">
                  {/* Checkbox for completion */}
                  <button
                    onClick={() =>
                      toggleStatus(task, task.status === 'completed' ? 'not_started' : 'completed')
                    }
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${task.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-300 hover:border-purple-500'
                      }`}
                  >
                    {task.status === 'completed' && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Title - Click to edit */}
                        <div className="mb-2">
                          {editingTaskId === task.id && editingField === 'title' ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingValues.title || ''}
                              onChange={(e) => setEditingValues({ ...editingValues, title: e.target.value })}
                              onBlur={() => saveFieldChange(task, 'title')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveFieldChange(task, 'title');
                                if (e.key === 'Escape') cancelEditing();
                              }}
                              className="w-full px-3 py-1 border border-purple-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            />
                          ) : (
                            <h3
                              onClick={() => startEditingTask(task, 'title')}
                              className={`font-semibold cursor-pointer px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
                                }`}
                            >
                              {task.title}
                            </h3>
                          )}
                        </div>

                        {/* Description - Click to edit */}
                        <div className="mb-2">
                          {editingTaskId === task.id && editingField === 'description' ? (
                            <textarea
                              autoFocus
                              value={editingValues.description || ''}
                              onChange={(e) => setEditingValues({ ...editingValues, description: e.target.value })}
                              onBlur={() => saveFieldChange(task, 'description')}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') cancelEditing();
                              }}
                              className="w-full px-3 py-1 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                              rows={2}
                            />
                          ) : task.description ? (
                            <p
                              onClick={() => startEditingTask(task, 'description')}
                              className="text-slate-600 text-sm px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer line-clamp-2"
                            >
                              {task.description}
                            </p>
                          ) : (
                            <p
                              onClick={() => startEditingTask(task, 'description')}
                              className="text-slate-400 text-sm px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer italic"
                            >
                              Add description...
                            </p>
                          )}
                        </div>

                        {/* Status, Assignee, and Due Date */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {/* Status dropdown - inline */}
                          {editingTaskId === task.id && editingField === 'status' ? (
                            <select
                              autoFocus
                              value={editingValues.status || 'not_started'}
                              onChange={(e) =>
                                setEditingValues({
                                  ...editingValues,
                                  status: e.target.value as Task['status'],
                                })
                              }
                              onBlur={() => saveFieldChange(task, 'status')}
                              className="px-2 py-1 text-xs border border-purple-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white"
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          ) : (
                            <button
                              onClick={() => startEditingTask(task, 'status')}
                              className="hover:brightness-95 transition-all cursor-pointer"
                            >
                              {getStatusBadge(task.status)}
                            </button>
                          )}

                          {/* Assignee */}
                          <div className="flex items-center gap-2">
                            {task.assignee_id && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                                {getMemberLabel(assignee)}
                              </span>
                            )}
                            <div className="relative">
                              <select
                                value={task.assignee_id ?? 'unassigned'}
                                onChange={(e) => handleAssigneeChange(task, e.target.value)}
                                className="appearance-none px-3 py-1 text-xs border border-slate-200 rounded-full bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent hover:border-purple-200 transition-all pr-8"
                              >
                                <option value="unassigned">Unassigned</option>
                                {members.map((member) => (
                                  <option key={member.user_id} value={member.user_id}>
                                    {getMemberLabel(member)}
                                  </option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                                ▾
                              </span>
                            </div>
                          </div>

                          {/* Due Date - Click to edit */}
                          {editingTaskId === task.id && editingField === 'due_date' ? (
                            <input
                              autoFocus
                              type="date"
                              value={editingValues.due_date || ''}
                              onChange={(e) => setEditingValues({ ...editingValues, due_date: e.target.value })}
                              onBlur={() => saveFieldChange(task, 'due_date')}
                              className="px-3 py-1 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                            />
                          ) : task.due_date ? (
                            <span
                              onClick={() => startEditingTask(task, 'due_date')}
                              className="text-sm text-slate-500 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <span>📅</span>
                              {formatDate(task.due_date)}
                            </span>
                          ) : (
                            <button
                              onClick={() => startEditingTask(task, 'due_date')}
                              className="text-sm text-slate-400 px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer italic"
                            >
                              Add due date...
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setDeleteConfirm(task.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirm === task.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm text-slate-600">Delete this item?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
