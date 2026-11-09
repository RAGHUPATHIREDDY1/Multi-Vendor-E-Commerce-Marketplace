import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../../api/client.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';

const initialProduct = { name: '', description: '', category: '', price: '', inventory: '', sku: '', status: 'active' };

export default function VendorProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialProduct);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function reload() {
    const [productResponse, categoryResponse] = await Promise.all([api.get('/vendor/products'), api.get('/categories')]);
    setProducts(productResponse.data.products);
    setCategories(categoryResponse.data.categories);
  }

  useEffect(() => {
    reload().catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false));
  }, []);

  async function createProduct(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/vendor/products', { ...form, price: Number(form.price), inventory: Number(form.inventory) });
      setForm(initialProduct);
      await reload();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Remove this product from your store?')) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      setProducts((current) => current.filter((product) => product._id !== id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  if (loading) return <main className="page-shell page-state"><LoadingState /></main>;
  return (
    <main className="page-shell account-page">
      <span className="eyebrow">SELLER STUDIO</span><h1>Your products</h1>
      {error && <div className="form-error" role="alert">{error}</div>}
      <form className="product-create-form" onSubmit={createProduct}>
        <h2>Add a product</h2>
        <label>Product name<input value={form.name} minLength="2" maxLength="160" onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Description<textarea value={form.description} rows="3" minLength="5" maxLength="5000" onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label>
        <div className="form-row">
          <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required><option value="">Choose category</option>{categories.map((category) => <option key={category._id}>{category.name}</option>)}</select></label>
          <label>Price<input type="number" step="0.01" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label>
          <label>Stock<input type="number" min="0" step="1" value={form.inventory} onChange={(event) => setForm({ ...form, inventory: event.target.value })} required /></label>
          <label>SKU<input value={form.sku} maxLength="64" onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label>
        </div>
        <button className="button button-dark">Create product</button>
      </form>
      <div className="data-list">{products.map((product) => <article className="data-row" key={product._id}><span><strong>{product.name}</strong><small>{product.category} · {product.inventory} in stock · {product.status}</small></span><strong>{formatCurrency(product.price)}</strong><button className="text-button" onClick={() => deleteProduct(product._id)}>Delete</button></article>)}</div>
    </main>
  );
}
