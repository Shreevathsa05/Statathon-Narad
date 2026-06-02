import TopBar from '../../components/TopBar.jsx';

export default function FieldAgentPage() {
  return (
    <div className="main-content">
      <TopBar title="Field Agent Portal" />
      <div className="page-body">
        <div className="page-header">
          <div className="page-header-left">
            <h1>My Surveys</h1>
            <p>Assigned surveys for CAPI on-ground data collection</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p>Field Agent specific tools will go here (CAPI response entry form).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
