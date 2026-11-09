import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../api/client.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import { formatMinorUnits } from '../../utils/formatCurrency.js';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function OrdersPage() {
  const { orderId } = useParams();
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const request = orderId ? api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data.order)) : api.get('/orders').then(({ data }) => setOrders(data.orders));
    request.catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false));
  }, [orderId]);

  async function payForOrder() {
    setPaying(true);
    setError('');
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay checkout could not be loaded. Please try again.');
      const { data } = await api.post('/payments/orders', { orderId: order._id });
      const options = {
        key: data.payment.keyId,
        amount: data.payment.amount,
        currency: data.payment.currency,
        name: 'MarketHub',
        description: `Order ${data.payment.orderNumber}`,
        order_id: data.payment.providerOrderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              orderId: order._id,
              providerOrderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            const refreshed = await api.get(`/orders/${order._id}`);
            setOrder(refreshed.data.order);
          } catch (requestError) {
            setError(getErrorMessage(requestError));
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: '#252820' },
      };
      new window.Razorpay(options).open();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setPaying(false);
    }
  }

  if (loading) return <main className="page-shell page-state"><LoadingState label="Finding your orders..." /></main>;
  return (
    <main className="page-shell account-page">
      <span className="eyebrow">YOUR ACCOUNT</span>
      <h1>{orderId ? `Order ${order?.orderNumber || ''}` : 'Your orders'}</h1>
      {error && <div className="form-error" role="alert">{error}</div>}
      {order ? (
        <div className="order-detail-card">
          {error && <div className="form-error" role="alert">{error}</div>}
          <p>Status: <strong>{order.status}</strong> · Payment: <strong>{order.paymentStatus}</strong></p>
          <p>Total: <strong>{formatMinorUnits(order.totalMinor)}</strong></p>
          {order.paymentStatus === 'PENDING' && <button className="button button-dark" onClick={payForOrder} disabled={paying}>{paying ? 'Connecting to Razorpay...' : 'Pay securely with Razorpay test mode'}</button>}
          <h2>Seller shipments</h2>
          {order.vendorOrders?.map((shipment) => <div className="shipment-row" key={shipment._id}><strong>{shipment.vendor?.name || 'Marketplace seller'}</strong><span>{shipment.status}</span><span>{formatMinorUnits(shipment.vendorNetMinor)}</span></div>)}
          <Link className="back-link" to="/orders">Back to all orders</Link>
        </div>
      ) : orders.length ? (
        <div className="order-list">{orders.map((item) => <Link className="order-row" key={item._id} to={`/orders/${item._id}`}><span><strong>{item.orderNumber}</strong><small>{new Date(item.createdAt).toLocaleDateString()}</small></span><span>{item.status}</span><strong>{formatMinorUnits(item.totalMinor)}</strong></Link>)}</div>
      ) : <div className="state-card empty-state"><strong>No orders yet.</strong><span>Your purchases will show up here.</span><Link className="button button-outline" to="/">Find something good</Link></div>}
    </main>
  );
}
