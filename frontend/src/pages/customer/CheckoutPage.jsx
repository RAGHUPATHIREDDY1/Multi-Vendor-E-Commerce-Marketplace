import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import LoadingState from '../../components/common/LoadingState.jsx';

const emptyAddress = { label: 'Home', recipient: '', phone: '', line1: '', line2: '', city: '', region: '', postalCode: '', country: '', isDefault: true };

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState(emptyAddress);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/addresses'), api.get('/cart')])
      .then(([addressResponse, cartResponse]) => {
        setAddresses(addressResponse.data.addresses);
        const preferred = addressResponse.data.addresses.find((item) => item.isDefault) || addressResponse.data.addresses[0];
        setSelectedAddress(preferred?._id || '');
        if (!cartResponse.data.cart.items.length) setError('Your cart is empty.');
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  function updateAddress(event) {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  }

  async function saveAddress(event) {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/addresses', address);
      setAddresses((current) => [data.address, ...current]);
      setSelectedAddress(data.address._id);
      setAddress(emptyAddress);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function placeOrder() {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/checkout', { addressId: selectedAddress, couponCode: couponCode.trim() || undefined });
      navigate(`/orders/${data.order._id}`, { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="page-shell page-state"><LoadingState label="Preparing checkout..." /></main>;
  return (
    <main className="page-shell account-page">
      <span className="eyebrow">ALMOST THERE</span>
      <h1>Checkout</h1>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="checkout-layout">
        <section>
          <h2>Delivery address</h2>
          {addresses.map((item) => (
            <label className={`address-option ${selectedAddress === item._id ? 'selected' : ''}`} key={item._id}>
              <input type="radio" name="address" checked={selectedAddress === item._id} onChange={() => setSelectedAddress(item._id)} />
              <span><strong>{item.label} · {item.recipient}</strong><small>{item.line1}, {item.city}, {item.region} {item.postalCode}, {item.country}</small></span>
            </label>
          ))}
          <details className="new-address">
            <summary>Add a new address</summary>
            <form className="address-form" onSubmit={saveAddress}>
              {['recipient', 'phone', 'line1', 'line2', 'city', 'region', 'postalCode', 'country'].map((field) => (
                <label key={field}>{field === 'line1' ? 'Street address' : field === 'line2' ? 'Apartment (optional)' : field.replace(/([A-Z])/g, ' $1')}
                  <input name={field} value={address[field]} onChange={updateAddress} required={!['line2'].includes(field)} />
                </label>
              ))}
              <button className="button button-outline" type="submit">Save address</button>
            </form>
          </details>
          <label className="coupon-input">Coupon code<input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter a code, if you have one" /></label>
        </section>
        <aside className="cart-summary">
          <h2>Payment</h2>
          <p>Checkout creates an order with payment pending. Verified test-mode payment is a separate step; no payment is being simulated here.</p>
          <button className="button button-dark" disabled={!selectedAddress || submitting} onClick={placeOrder}>{submitting ? 'Placing order...' : 'Place order'}</button>
        </aside>
      </div>
    </main>
  );
}
