import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import { formatMinorUnits } from '../../utils/formatCurrency.js';

export default function VendorDashboardPage() {
  const [vendor, setVendor] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/vendor/me'), api.get('/vendor/analytics').catch(() => null)])
      .then(([profile, report]) => {
        setVendor(profile.data.vendor);
        setAnalytics(report?.data.analytics || null);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="page-shell page-state"><LoadingState label="Opening your seller studio..." /></main>;
  return (
    <main className="page-shell account-page">
      <span className="eyebrow">SELLER STUDIO</span>
      <h1>{vendor?.storeName || 'Your store'}</h1>
      {error && <div className="form-error" role="alert">{error}</div>}
      {vendor?.approvalStatus !== 'approved' && <div className="approval-notice"><strong>Application {vendor?.approvalStatus}</strong><p>{vendor?.approvalStatus === 'pending' ? 'Your store is waiting for admin review. You can start selling after approval.' : vendor?.rejectionReason || 'Please contact marketplace support for next steps.'}</p></div>}
      {analytics && <div className="dashboard-stats"><Stat label="Products" value={analytics.products} /><Stat label="Orders" value={analytics.orders} /><Stat label="Sales" value={formatMinorUnits(analytics.salesMinor)} /><Stat label="Net earnings" value={formatMinorUnits(analytics.earningsMinor)} /></div>}
      <div className="dashboard-links">
        <Link to="/vendor/products"><strong>Products</strong><span>Add, update, and manage your inventory.</span></Link>
        <Link to="/vendor/orders"><strong>Incoming orders</strong><span>Review customer orders and update shipment status.</span></Link>
      </div>
    </main>
  );
}

function Stat({ label, value }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong></article>;
}
