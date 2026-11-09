import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import { formatMinorUnits } from '../../utils/formatCurrency.js';

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setDashboard(data.dashboard)).catch((requestError) => setError(getErrorMessage(requestError)));
  }, []);
  if (!dashboard && !error) return <main className="page-shell page-state"><LoadingState label="Loading marketplace overview..." /></main>;
  return <main className="page-shell account-page"><span className="eyebrow">MARKETPLACE OPERATIONS</span><h1>Admin overview</h1>{error && <div className="form-error" role="alert">{error}</div>}{dashboard && <div className="dashboard-stats"><Stat label="Customers" value={dashboard.customers} /><Stat label="Vendors" value={dashboard.vendors} /><Stat label="Approved sellers" value={dashboard.approvedVendors} /><Stat label="Pending applications" value={dashboard.pendingVendors} /><Stat label="Orders" value={dashboard.orders} /><Stat label="Paid sales" value={formatMinorUnits(dashboard.salesMinor)} /><Stat label="Commission ledger" value={formatMinorUnits(dashboard.commissionsMinor)} /></div>}<div className="dashboard-links"><Link to="/admin/vendors"><strong>Vendor applications</strong><span>Review and approve seller stores.</span></Link><Link to="/admin/customers"><strong>Customers</strong><span>Review accounts and access status.</span></Link></div></main>;
}

function Stat({ label, value }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong></article>;
}
