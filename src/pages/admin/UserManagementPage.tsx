import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EmptyState } from '../../components/EmptyState';
import type { Profile, Cohort, UserRole } from '../../types';
import { Users, Loader2, UserPlus, AlertCircle } from 'lucide-react';

export function UserManagementPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [coaches, setCoaches] = useState<Profile[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, cohortsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('cohorts').select('*').order('name'),
      ]);

      const allUsers = (usersRes.data as Profile[]) || [];
      setUsers(allUsers);
      setCoaches(allUsers.filter((u) => u.role === 'coach' || u.role === 'admin'));
      setCohorts((cohortsRes.data as Cohort[]) || []);
    } catch {
      setError('Failed to load user data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingUser(userId);
    setUpdateError(null);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (updateErr) throw updateErr;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      setUpdateError(`Failed to update role for user.`);
    } finally {
      setUpdatingUser(null);
    }
  }

  async function handleCoachChange(userId: string, coachId: string | null) {
    setUpdatingUser(userId);
    setUpdateError(null);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ assigned_coach_id: coachId || null })
        .eq('id', userId);
      if (updateErr) throw updateErr;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, assigned_coach_id: coachId || null } : u)));
    } catch {
      setUpdateError(`Failed to assign coach.`);
    } finally {
      setUpdatingUser(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="Unable to load users"
        description={error}
        action={
          <button onClick={fetchData} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">{users.length} users</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {updateError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-sm text-danger-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{updateError}</span>
        </div>
      )}

      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No users"
          description="No users have been created yet."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-400">Name</th>
                <th className="hidden px-4 py-3 font-medium text-slate-400 sm:table-cell">Email</th>
                <th className="px-4 py-3 font-medium text-slate-400">Role</th>
                <th className="hidden px-4 py-3 font-medium text-slate-400 md:table-cell">Cohort</th>
                <th className="hidden px-4 py-3 font-medium text-slate-400 lg:table-cell">Assigned Coach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/50">
              {users.map((user) => {
                const userCohort = cohorts.find((c) => c.id === user.cohort_id);
                const isUpdating = updatingUser === user.id;

                return (
                  <tr key={user.id} className={isUpdating ? 'opacity-50' : ''}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.id.slice(0, 8)}...</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="text-xs text-slate-400">{user.id.slice(0, 8)}@placeholder</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={isUpdating}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                      >
                        <option value="apprentice">Apprentice</option>
                        <option value="coach">Coach</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-xs text-slate-400">
                        {userCohort?.name || 'None'}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <select
                        value={user.assigned_coach_id || ''}
                        onChange={(e) => handleCoachChange(user.id, e.target.value || null)}
                        disabled={isUpdating || user.role !== 'apprentice'}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-brand-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">No coach</option>
                        {coaches.map((coach) => (
                          <option key={coach.id} value={coach.id}>
                            {coach.full_name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
