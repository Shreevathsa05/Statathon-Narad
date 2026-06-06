import { useState } from 'react';
import RoleBadge from './RoleBadge.jsx';
import { Users } from 'lucide-react';
import ConfirmModal from './ConfirmModal.jsx';

export default function UserTable({ users, onSuspend, onDelete }) {
  const [confirmModal, setConfirmModal] = useState(null);
  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface border border-dashed border-border rounded-md text-text-muted">
        <Users size={48} className="opacity-20 mb-4" />
        <h3 className="font-semibold text-lg text-text-primary">No users found</h3>
        <p className="text-sm">There are no users to display in this list.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg border border-border rounded-md p-5 shadow-sm overflow-x-auto">
      <table className="w-full border-collapse text-sm text-left">
        <thead>
          <tr>
            <th className="px-4 py-3 text-text-muted font-medium border-b border-border whitespace-nowrap">Name</th>
            <th className="px-4 py-3 text-text-muted font-medium border-b border-border whitespace-nowrap">Email</th>
            <th className="px-4 py-3 text-text-muted font-medium border-b border-border whitespace-nowrap">Role</th>
            <th className="px-4 py-3 text-text-muted font-medium border-b border-border whitespace-nowrap">Region</th>
            <th className="px-4 py-3 text-text-muted font-medium border-b border-border whitespace-nowrap">Status</th>
            <th className="px-4 py-3 text-text-muted font-medium border-b border-border whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => (
            <tr 
              key={u._id} 
              className={`border-b border-border opacity-0 animate-fade-in-card ${u.status === 'suspended' ? 'bg-black/5 [&>td]:opacity-60' : ''}`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
              <td className="px-4 py-3 font-mono text-text-muted">{u.email}</td>
              <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
              <td className="px-4 py-3">{u.region || <span className="text-text-secondary opacity-50">—</span>}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border uppercase tracking-wider ${
                  u.status === 'active' ? 'bg-geist-blue/10 text-geist-blue border-geist-blue/20' : 
                  u.status === 'pending_setup' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : 
                  'bg-geist-error/10 text-geist-error border-geist-error/20'
                }`}>
                  {u.status === 'pending_setup' ? 'Pending Setup' : u.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    className="inline-flex items-center justify-center px-3 h-7 text-xs font-medium rounded text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => setConfirmModal({
                      title: u.status === 'suspended' ? 'Reactivate User' : 'Suspend User',
                      message: `Are you sure you want to ${u.status === 'suspended' ? 'reactivate' : 'suspend'} ${u.name}?`,
                      confirmText: u.status === 'suspended' ? 'Reactivate' : 'Suspend',
                      isDanger: u.status !== 'suspended',
                      onConfirm: () => onSuspend(u._id)
                    })}
                    disabled={u.role === 'admin'}
                  >
                    {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                  </button>
                  <button 
                    className="inline-flex items-center justify-center px-3 h-7 text-xs font-medium rounded bg-geist-error/10 text-geist-error hover:bg-geist-error hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => setConfirmModal({
                      title: 'Delete User',
                      message: `Are you sure you want to permanently delete ${u.name}? This action cannot be undone.`,
                      confirmText: 'Delete',
                      isDanger: true,
                      onConfirm: () => onDelete(u._id)
                    })}
                    disabled={u.role === 'admin'}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          isDanger={confirmModal.isDanger}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
