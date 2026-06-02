import TopBar from '../../components/TopBar.jsx';

export default function CQCDPage() {
  return (
    <div className="main-content">
      <TopBar title="CQCD Dashboard" />
      <div className="page-body">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Publish Reports</h1>
            <p>Coordination, Quality Control & Data Division</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p>CQCD specific tools will go here (Raw report review, final publication workflow).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
