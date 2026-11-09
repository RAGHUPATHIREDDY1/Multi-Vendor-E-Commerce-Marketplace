import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../api/client.js';
import LoadingState from '../../components/common/LoadingState.jsx';

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function reload() {
    const { data } = await api.get('/admin/vendors');
    setVendors(data.vendors);
  }

  useEffect(() => { reload().catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false)); }, []);

  async function setStatus(vendorId, approvalStatus) {
    const rejectionReason = approvalStatus === 'rejected' ? window.prompt('Reason for rejecting this application?') : undefined;
    if (approvalStatus === 'rejected' && !rejectionReason) return;
    try {
      await api.patch(`/admin/vendors/${vendorId}/status`, { approvalStatus, rejectionReason });
      await reload();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  if (loading) return <main className="page-shell page-state"><LoadingState /></main>;
  return <main className="page-shell account-page"><span className="eyebrow">MARKETPLACE OPERATIONS</span><h1>Seller applications</h1>{error && <div className="form-error" role="alert">{error}</div>}{vendors.length ? <div className="data-list">{vendors.map((vendor) => <article className="vendor-review" key={vendor._id}><div><strong>{vendor.storeName}</strong><small>{vendor.userId?.name} · {vendor.userId?.email}</small><p>{vendor.description}</p><span className="status-pill">{vendor.approvalStatus}</span></div><div className="vendor-review-actions">{vendor.approvalStatus !== 'approved' && <button className="button button-dark" onClick={() => setStatus(vendor._id, 'approved')}>Approve</button>}{vendor.approvalStatus === 'pending' && <button className="button button-outline" onClick={() => setStatus(vendor._id, 'rejected')}>Reject</button>}{vendor.approvalStatus === 'approved' && <button className="button button-outline" onClick={() => setStatus(vendor._id, 'suspended')}>Suspend</button>}</div></article>)}</div> : <div className="state-card">No seller applications yet.</div>}</main>;
}
