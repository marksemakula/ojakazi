import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { apiClient } from '../../api/client';
import { AuthUser } from '../../types';
import { Badge } from '../ui/Badge';

export const OrganizationMembers: React.FC = () => {
  const [members, setMembers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get<AuthUser[]>('/users/org/members')
      .then((r) => setMembers(r.data))
      .catch(() => setError('Failed to load members.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Users size={18} className="text-brand-600" />
        <h3 className="font-semibold text-gray-800">Team Members</h3>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={m.role === 'admin' ? 'blue' : 'gray'}>
                      {m.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && (
            <p className="text-center py-6 text-sm text-gray-400">No members found.</p>
          )}
        </div>
      )}
    </div>
  );
};
