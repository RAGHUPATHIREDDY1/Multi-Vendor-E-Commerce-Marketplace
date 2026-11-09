import { ArrowDown, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ProductCard from '../components/products/ProductCard.jsx';
import { sampleProducts } from '../services/sampleProducts.js';

const categories = [
  { name: 'Home', note: 'Little comforts, lovely details', mark: '01' },
  { name: 'Accessories', note: 'Everyday things, done better', mark: '02' },
  { name: 'Kitchen', note: 'Made for gathering around', mark: '03' },
  { name: 'Wellness', note: 'A slower kind of self-care', mark: '04' },
];

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const [products, setProducts] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });

  useEffect(() => {
    let active = true;
    setState({ loading: true, error: '' });
    api.get('/products', { params: { q: query || undefined, category: category || undefined, limit: 12 } })
      .then(({ data }) => {
        if (active) setProducts(data.items);
      })
      .catch((error) => {
        if (active && import.meta.env.DEV) {
          setProducts(sampleProducts.filter((product) => {
            const matchesQuery = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query.toLowerCase());
            const matchesCategory = !category || product.category.toLowerCase() === category.toLowerCase();
            return matchesQuery && matchesCategory;
          }));
          setState({ loading: false, error: `Sample catalog shown for development. ${getErrorMessage(error)}` });
          return;
        }
        if (active) setState({ loading: false, error: getErrorMessage(error) });
      })
      .finally(() => {
        if (active) setState((current) => ({ ...current, loading: false }));
      });

    return () => { active = false; };
  }, [query, category]);

  return (
    <main>
      <section className="hero page-shell">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> GOOD FINDS, GOOD PEOPLE</span>
          <h1>Find the things<br />that feel <em>like you.</em></h1>
          <p>Thoughtful pieces from independent makers and small shops. Less scrolling, more finding your new favorite.</p>
          <a className="button button-dark" href="#products">Explore the collection <ArrowDown size={16} /></a>
          <div className="hero-footnote"><span className="dot" /> A marketplace made for discovering</div>
        </div>
        <div className="hero-art" aria-label="Colorful abstract shapes">
          <div className="art-sun" />
          <div className="art-shape art-shape-one" />
          <div className="art-shape art-shape-two" />
          <div className="art-shape art-shape-three" />
          <div className="art-label"><span>THE EVERYDAY EDIT</span><strong>Made to<br />make you smile.</strong><ArrowRight size={18} /></div>
          <span className="art-caption">a better kind of browsing ↗</span>
        </div>
        <div className="hero-index">01 <span /> 04</div>
      </section>

      <section className="trust-strip">
        <div className="page-shell trust-items">
          <span>MADE BY REAL PEOPLE</span><i />
          <span>SMALL SHOPS, BIG HEART</span><i />
          <span>GOOD THINGS, FOUND HERE</span>
        </div>
      </section>

      <section className="category-section page-shell" aria-labelledby="category-title">
        <div className="section-heading category-heading">
          <div>
            <span className="eyebrow">A GOOD PLACE TO START</span>
            <h2 id="category-title">Browse by feeling</h2>
          </div>
          <Link className="category-all" to="/#products">See all finds <ArrowRight size={15} /></Link>
        </div>
        <div className="category-grid">
          {categories.map((item) => (
            <Link className="category-tile" key={item.name} to={`/?category=${encodeURIComponent(item.name)}#products`}>
              <span>{item.mark} / SHOP</span>
              <strong>{item.name}</strong>
              <small>{item.note}</small>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="collection-section page-shell" id="products">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{query ? 'YOUR SEARCH' : 'THE MARKETPLACE'}</span>
            <h2>{query ? `Results for “${query}”` : category || 'A few things we love'}</h2>
            <p>Picked from shops worth knowing about.</p>
          </div>
          <span className="section-count">{products.length.toString().padStart(2, '0')} FINDS</span>
        </div>

        {state.loading ? <LoadingState /> : (
          <>
            {state.error && <div className="sample-notice" role="status">{state.error} <button className="text-button" onClick={() => window.location.reload()}>Retry</button></div>}
            {products.length ? <div className="product-grid">
            {products.map((product, index) => <ProductCard key={product._id} product={product} index={index} />)}
            </div> : <div className="state-card empty-state">
            <span className="empty-icon">✳</span>
            <strong>No finds just yet.</strong>
            <span>Try another search. We’re always adding new things.</span>
            <Link to="/" className="button button-outline">See everything</Link>
            </div>}
          </>
        )}
      </section>
    </main>
  );
}
