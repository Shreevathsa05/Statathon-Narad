import { useState, useEffect } from 'react';
import client from '../../api/client.js';
import TopBar from '../../components/TopBar.jsx';
import UserTable from '../../components/UserTable.jsx';
import InviteUserModal from '../../components/InviteUserModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      const res = await client.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSuspend = async (id) => {
    try {
      await client.patch(`/users/${id}/suspend`);
      toast.success('User suspension status updated');
      fetchUsers();
    } catch (err) { toast.error(err.message || 'Failed to update suspension status'); }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) { toast.error(err.message || 'Failed to delete'); }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg">
      <TopBar title="User Management" />
      <div className="flex flex-col p-6 w-full mx-auto" style={{ maxWidth: 'var(--max-w-content, 1200px)' }}>
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-text-primary leading-tight mb-1">Platform Users</h1>
            <p className="text-sm text-text-muted">Manage access across all NARAD divisions and field operations.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors" onClick={() => setShowInvite(true)}>
            Add User
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <span className="w-5 h-5 border-2 border-border border-t-text-primary rounded-full animate-spin" />
          </div>
        ) : (
          <UserTable 
            users={users} 
            onSuspend={handleSuspend} 
            onDelete={handleDelete} 
          />
        )}
      </div>

      {showInvite && (
        <InviteUserModal 
          onClose={() => { setShowInvite(false); fetchUsers(); }}
          onSuccess={() => fetchUsers()} 
        />
      )}
    </div>
  );
}
