import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency.js';

function ProductImage({ product }) {
  const image = product.images?.[0];
  if (image) return <img src={image} alt={product.name} loading="lazy" />;

  return (
    <div className="product-placeholder" aria-label="No product photo available">
      <span>{product.category}</span>
      <strong>{product.name.slice(0, 1)}</strong>
    </div>
  );
}

export default function ProductCard({ product, index = 0 }) {
  return (
    <article className="product-card" style={{ '--card-delay': `${index * 45}ms` }}>
      <Link to={`/products/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
        <div className="product-image"><ProductImage product={product} /></div>
        <span className="image-arrow"><ArrowUpRight size={17} /></span>
      </Link>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <Link to={`/products/${product.slug}`} className="product-name">{product.name}</Link>
        <div className="product-card-bottom">
          <strong>{formatCurrency(product.price)}</strong>
          <span>{product.inventory > 0 ? 'Ready to ship' : 'Currently unavailable'}</span>
        </div>
      </div>
    </article>
  );
}
