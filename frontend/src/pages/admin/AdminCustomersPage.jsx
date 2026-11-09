import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../api/client.js';
import LoadingState from '../../components/common/LoadingState.jsx';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function reload() {
    const { data } = await api.get('/admin/customers');
    setCustomers(data.customers);
  }
  useEffect(() => { reload().catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false)); }, []);
  async function toggle(user) {
    try {
      await api.patch(`/admin/customers/${user._id}/status`, { isActive: !user.isActive });
      await reload();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }
  if (loading) return <main className="page-shell page-state"><LoadingState /></main>;
  return <main className="page-shell account-page"><span className="eyebrow">MARKETPLACE OPERATIONS</span><h1>Customers</h1>{error && <div className="form-error" role="alert">{error}</div>}{customers.length ? <div className="data-list">{customers.map((user) => <article className="data-row" key={user._id}><span><strong>{user.name}</strong><small>{user.email}</small></span><span>{user.isActive ? 'Active' : 'Deactivated'}</span><button className="button button-outline" onClick={() => toggle(user)}>{user.isActive ? 'Deactivate' : 'Activate'}</button></article>)}</div> : <div className="state-card">No customer accounts yet.</div>}</main>;
}
