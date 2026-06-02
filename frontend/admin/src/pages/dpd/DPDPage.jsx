import TopBar from '../../components/TopBar.jsx';

export default function DPDPage() {
  return (
    <div className="main-content">
      <TopBar title="DPD Dashboard" />
      <div className="page-body">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Data View & Export</h1>
            <p>Data Processing Division workspace</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p>DPD specific tools will go here (Response grids, column masking, CSV/XLSX export).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
