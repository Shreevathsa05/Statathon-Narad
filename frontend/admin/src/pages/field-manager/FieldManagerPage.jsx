import TopBar from '../../components/TopBar.jsx';

export default function FieldManagerPage() {
  return (
    <div className="main-content">
      <TopBar title="Field Manager Dashboard" />
      <div className="page-body">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Field Operations</h1>
            <p>Manage Field Agents and regional data collection</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p>Field Manager specific tools will go here (Agent assignment, progress tracking).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
