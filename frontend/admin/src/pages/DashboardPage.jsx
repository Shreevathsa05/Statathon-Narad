import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Route based on role
    switch (user.role) {
      case 'admin':         navigate('/admin/users', { replace: true }); break;
      case 'sdrd':          navigate('/sdrd', { replace: true }); break;
      case 'fod':           navigate('/fod', { replace: true }); break;
      case 'field_manager': navigate('/fod-manager', { replace: true }); break;
      case 'field_agent':   navigate('/field-agent', { replace: true }); break;
      case 'dpd':           navigate('/dpd', { replace: true }); break;
      case 'cqcd':          navigate('/cqcd', { replace: true }); break;
      default:              navigate('/login', { replace: true }); break;
    }
  }, [user, navigate]);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <span className="spinner" />
    </div>
  );
}
