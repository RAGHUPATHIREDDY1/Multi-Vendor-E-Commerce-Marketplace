import { Search, ShoppingBag, Store, UserRound } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { clearSession } from '../../store/authSlice.js';

export default function SiteHeader() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function searchProducts(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q')?.toString().trim();
    navigate(query ? `/?q=${encodeURIComponent(query)}#products` : '/#products');
  }

  return (
    <>
      <div className="top-note">A little more personal. Shop independent sellers on MarketHub.</div>
      <header className="site-header">
        <div className="header-main page-shell">
          <Link className="brand" to="/" aria-label="MarketHub home">
            <span className="brand-mark">m</span>
            <span>market<span className="brand-light">hub</span></span>
          </Link>
          <form className="search-form" onSubmit={searchProducts} role="search">
            <Search size={19} aria-hidden="true" />
            <input name="q" placeholder="Search for something you love..." aria-label="Search products" />
            <button type="submit">Search</button>
          </form>
          <nav className="header-actions" aria-label="Account navigation">
            {user ? (
              <>
                <span className="welcome-user"><UserRound size={17} /> Hi, {user.name.split(' ')[0]}</span>
                <button className="text-button" onClick={() => {
                  localStorage.removeItem('marketplaceToken');
                  dispatch(clearSession());
                }}>Sign out</button>
              </>
            ) : (
              <Link className="header-link" to="/login"><UserRound size={18} /> Sign in</Link>
            )}
            <Link className="header-link" to="/cart"><ShoppingBag size={19} /> <span>Cart</span></Link>
          </nav>
        </div>
        <nav className="category-nav" aria-label="Shop departments">
          <div className="page-shell category-links">
            <Link to="/#products">Discover</Link>
            <Link to="/?category=Home#products">Home & living</Link>
            <Link to="/?category=Accessories#products">Accessories</Link>
            <Link to="/?category=Kitchen#products">Kitchen</Link>
            <Link to="/?category=Wellness#products">Wellness</Link>
            <Link className="sell-link" to="/vendor/register"><Store size={15} /> Sell with us</Link>
          </div>
        </nav>
      </header>
    </>
  );
}
