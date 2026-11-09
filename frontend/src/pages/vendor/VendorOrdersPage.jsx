import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../api/client.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import { formatMinorUnits } from '../../utils/formatCurrency.js';

const nextStatus = { PLACED: 'CONFIRMED', CONFIRMED: 'PACKED', PACKED: 'SHIPPED', SHIPPED: 'DELIVERED' };

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function reload() {
    const { data } = await api.get('/vendor/orders');
    setOrders(data.orders);
  }

  useEffect(() => {
    reload().catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false));
  }, []);

  async function advance(order) {
    const status = nextStatus[order.status];
    if (!status) return;
    try {
      await api.patch(`/vendor/orders/${order._id}/status`, { status });
      await reload();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  if (loading) return <main className="page-shell page-state"><LoadingState /></main>;
  return <main className="page-shell account-page"><span className="eyebrow">SELLER STUDIO</span><h1>Incoming orders</h1>{error && <div className="form-error" role="alert">{error}</div>}{orders.length ? <div className="data-list">{orders.map((order) => <article className="data-row" key={order._id}><span><strong>{order.order?.orderNumber}</strong><small>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</small></span><span>{order.status}</span><strong>{formatMinorUnits(order.vendorNetMinor)}</strong>{nextStatus[order.status] && <button className="button button-outline" onClick={() => advance(order)}>Mark {nextStatus[order.status].toLowerCase()}</button>}</article>)}</div> : <div className="state-card">No orders yet.</div>}</main>;
}
