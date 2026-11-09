import { Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import { formatMinorUnits } from '../../utils/formatCurrency.js';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadCart() {
    setError('');
    try {
      const { data } = await api.get('/cart');
      setCart(data.cart);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCart(); }, []);

  async function update(productId, quantity) {
    try {
      const { data } = await api.patch(`/cart/items/${productId}`, { quantity });
      setCart(data.cart);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function remove(productId) {
    try {
      const { data } = await api.delete(`/cart/items/${productId}`);
      setCart(data.cart);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  if (loading) return <main className="page-shell page-state"><LoadingState /></main>;
  return (
    <main className="page-shell account-page">
      <span className="eyebrow">YOUR BAG</span>
      <h1>Shopping cart</h1>
      {error && <div className="form-error" role="alert">{error}</div>}
      {!cart?.items.length ? (
        <div className="state-card empty-state"><strong>Your bag is taking a breather.</strong><span>Find a few things from our independent shops.</span><Link className="button button-dark" to="/">Explore the marketplace</Link></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {cart.items.map(({ product, quantity, lineTotal }) => (
              <article className="cart-line" key={product._id}>
                <Link to={`/products/${product.slug}`} className="cart-line-image">
                  {product.images?.[0] ? <img src={product.images[0]} alt="" /> : <span>{product.name.slice(0, 1)}</span>}
                </Link>
                <div className="cart-line-copy">
                  <Link to={`/products/${product.slug}`}><strong>{product.name}</strong></Link>
                  <span>{formatMinorUnits(lineTotal, 'USD')}</span>
                  <div className="quantity-control">
                    <button aria-label={`Decrease ${product.name} quantity`} disabled={quantity <= 1} onClick={() => update(product._id, quantity - 1)}><Minus size={14} /></button>
                    <span>{quantity}</span>
                    <button aria-label={`Increase ${product.name} quantity`} disabled={quantity >= product.inventory} onClick={() => update(product._id, quantity + 1)}><Plus size={14} /></button>
                    <button className="remove-item" aria-label={`Remove ${product.name}`} onClick={() => remove(product._id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Order summary</h2>
            <div><span>Subtotal</span><strong>{formatMinorUnits(cart.subtotalMinor, 'USD')}</strong></div>
            <p>Shipping and any eligible discounts are calculated at checkout.</p>
            <Link to="/checkout" className="button button-dark">Continue to checkout</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
