import { useState } from 'react';
import { X } from 'lucide-react';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

// Which roles can invite which
const INVITABLE_BY = {
  admin:         ['sdrd', 'fod', 'dpd', 'cqcd', 'field_manager', 'field_agent'],
  fod:           ['field_manager'],
  field_manager: ['field_agent'],
};

const ROLE_LABELS = {
  sdrd: 'SDRD',
  fod: 'FOD',
  field_manager: 'Field Manager',
  field_agent: 'Field Agent',
  dpd: 'DPD',
  cqcd: 'CQCD',
};

const ROLE_PREFIXES = {
  sdrd: 'sdrd',
  fod: 'fod',
  field_manager: 'fm',
  field_agent: 'fa',
  dpd: 'dpd',
  cqcd: 'cqcd',
};

function previewEmail(name, role) {
  if (!name || !role) return '';
  const slug = name.toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '');
  if (!slug) return '';
  const prefix = ROLE_PREFIXES[role];
  return prefix ? `${prefix}.${slug}@mospi.gov` : '';
}

export default function InviteUserModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', role: '', region: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const availableRoles = INVITABLE_BY[user?.role] || [];
  const emailPreview = previewEmail(form.name, form.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!form.role) return setError('Please select a role');

    setLoading(true);
    try {
      const res = await client.post('/users/invite', {
        name: form.name.trim(),
        role: form.role,
        region: form.region || undefined,
      });
      setCreated(res.data.user);
      onSuccess?.(res.data.user);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={onClose}>
        <div className="bg-bg border border-border rounded-md shadow-lg w-full max-w-[480px] flex flex-col animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold m-0 text-text-primary">User Created</h2>
            <button className="inline-flex items-center justify-center w-8 h-8 rounded text-text-muted hover:bg-surface hover:text-text-primary transition-colors" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="p-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-start px-4 py-3 rounded-md text-sm border border-geist-blue/20 bg-geist-blue/10 text-geist-blue mb-4">
              <strong>{created.name}</strong>&nbsp;has been added successfully.
            </div>
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-sm font-medium text-text-primary">Share this email with the user</label>
              <input
                className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm font-mono text-text-primary focus:outline-none focus:border-geist-blue transition-colors"
                value={created.email}
                readOnly
                onClick={e => e.target.select()}
              />
              <span className="text-xs text-text-muted">
                They can set their password by going to the login page and entering this email.
              </span>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-border bg-surface-alt rounded-b-md flex items-center justify-end gap-3">
            <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-bg border border-border rounded-md shadow-lg w-full max-w-[480px] flex flex-col animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold m-0 text-text-primary">Add User</h2>
          <button className="inline-flex items-center justify-center w-8 h-8 rounded text-text-muted hover:bg-surface hover:text-text-primary transition-colors" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-5 max-h-[70vh] overflow-y-auto flex flex-col gap-4">
            {error && <div className="flex items-start px-4 py-3 rounded-md text-sm border border-geist-error/20 bg-geist-error/10 text-geist-error">{error}</div>}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Full Name</label>
              <input
                className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-geist-blue transition-colors"
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Division / Role</label>
              <select
                className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-geist-blue transition-colors"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="">Select role…</option>
                {availableRoles.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            {emailPreview && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Generated Email</label>
                <input className="w-full h-10 px-3 bg-surface-alt border border-border rounded-md text-sm font-mono text-text-muted focus:outline-none cursor-not-allowed" value={emailPreview} readOnly />
                <span className="text-xs text-text-muted">Auto-generated — this is what the user will use to log in.</span>
              </div>
            )}

            {(form.role === 'field_manager' || form.role === 'field_agent') && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">NSS Region Code <span className="text-text-muted font-normal">(optional)</span></label>
                <input
                  className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-geist-blue transition-colors"
                  placeholder="e.g. NSS-07"
                  value={form.region}
                  onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                />
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-border bg-surface-alt rounded-b-md flex items-center justify-end gap-3">
            <button type="button" className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface transition-colors" onClick={onClose}>Cancel</button>
            <button type="submit" className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50" disabled={loading}>
              {loading ? <><span className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin mr-2" /> Adding…</> : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
