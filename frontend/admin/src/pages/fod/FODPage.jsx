import TopBar from '../../components/TopBar.jsx';

export default function FODPage() {
  return (
    <div className="main-content">
      <TopBar title="FOD Dashboard" />
      <div className="page-body">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Multichannel Delivery</h1>
            <p>Field Operations Division — Online Delivery Management</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p>FOD specific tools will go here (Telegram, WhatsApp, IVR stats).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
