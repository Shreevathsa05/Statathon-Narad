import TopBar from '../../components/TopBar.jsx';
import { Database } from 'lucide-react';

export default function DPDPage() {
  return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg">
      <TopBar title="DPD Dashboard" />
      <div className="flex flex-col p-6 w-full max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">Data View & Export</h1>
            <p className="text-sm text-text-muted">Data Processing Division workspace</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface border border-dashed border-border rounded-md text-text-muted opacity-0 animate-fade-in-card">
          <Database size={48} className="opacity-20 mb-4" />
          <h3 className="font-semibold text-lg text-text-primary">Data Grid Pending</h3>
          <p className="text-sm max-w-md">DPD specific tools will go here (Response grids, column masking, CSV/XLSX export).</p>
        </div>
      </div>
    </div>
  );
}
