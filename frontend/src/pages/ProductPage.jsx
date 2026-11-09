import { ArrowLeft, PackageCheck, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import LoadingState from '../components/common/LoadingState.jsx';
import { sampleProducts } from '../services/sampleProducts.js';
import { useSelector } from 'react-redux';
import { formatCurrency } from '../utils/formatCurrency.js';

export default function ProductPage() {
  const { slug } = useParams();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [state, setState] = useState({ loading: true, error: '' });
  const [cartMessage, setCartMessage] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    setState({ loading: true, error: '' });
    api.get(`/products/${encodeURIComponent(slug)}`)
      .then(({ data }) => { if (active) setProduct(data.product); })
      .catch((error) => {
        if (!active) return;
        const sampleProduct = import.meta.env.DEV && sampleProducts.find((item) => item.slug === slug);
        if (sampleProduct) {
          setProduct(sampleProduct);
          setState({ loading: false, error: `Sample product details shown for development. ${getErrorMessage(error)}` });
          return;
        }
        setState({ loading: false, error: getErrorMessage(error) });
      })
      .finally(() => { if (active) setState((current) => ({ ...current, loading: false })); });
    return () => { active = false; };
  }, [slug]);

  if (state.loading) return <main className="page-shell page-state"><LoadingState label="Opening the details..." /></main>;
  if (state.error && !product) return <main className="page-shell page-state"><div className="state-card error-state">{state.error}<Link to="/" className="button button-outline">Back to the marketplace</Link></div></main>;

  const image = product.images?.[0];
  async function addToCart() {
    if (!user) {
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }
    if (product._id.startsWith('sample-')) {
      setCartMessage('Sample products are for browsing only. Connect MongoDB and seed the catalog to add real items.');
      return;
    }
    setAdding(true);
    setCartMessage('');
    try {
      await api.post('/cart/items', { productId: product._id, quantity: 1 });
      setCartMessage('Added to your cart.');
    } catch (requestError) {
      setCartMessage(getErrorMessage(requestError));
    } finally {
      setAdding(false);
    }
  }
  return (
    <main className="page-shell product-detail">
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to the marketplace</Link>
      {state.error && <div className="sample-notice" role="status">{state.error}</div>}
      <div className="detail-layout">
        <div className="detail-image">
          {image ? <img src={image} alt={product.name} /> : <div className="product-placeholder"><span>{product.category}</span><strong>{product.name.slice(0, 1)}</strong></div>}
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.category} · INDEPENDENT FIND</span>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatCurrency(product.price)}</p>
          <p className="detail-description">{product.description}</p>
          <div className="availability"><PackageCheck size={18} /> {product.inventory > 0 ? `${product.inventory} available from this shop` : 'Currently out of stock'}</div>
          <button className="button button-dark add-cart-button" disabled={product.inventory < 1 || adding} onClick={addToCart}>
            <ShoppingBag size={18} /> {adding ? 'Adding...' : product.inventory < 1 ? 'Out of stock' : 'Add to cart'}
          </button>
          {cartMessage && <p className="detail-note" role="status">{cartMessage} {cartMessage === 'Added to your cart.' && <Link to="/cart">View cart</Link>}</p>}
          <p className="detail-note">Orders are created with payment pending; payment is not available until verified test-mode payment is configured.</p>
        </div>
      </div>
    </main>
  );
}
