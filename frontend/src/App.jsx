import { useEffect } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import SiteHeader from './components/layout/SiteHeader.jsx';
import { api } from './api/client.js';
import { clearSession, finishSessionCheck, setUser } from './store/authSlice.js';
import AuthPage from './pages/auth/AuthPage.jsx';
import VendorRegistrationPage from './pages/auth/VendorRegistrationPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminVendorsPage from './pages/admin/AdminVendorsPage.jsx';
import AdminCustomersPage from './pages/admin/AdminCustomersPage.jsx';
import CartPage from './pages/customer/CartPage.jsx';
import CheckoutPage from './pages/customer/CheckoutPage.jsx';
import OrdersPage from './pages/customer/OrdersPage.jsx';
import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage.jsx';
import VendorProductsPage from './pages/vendor/VendorProductsPage.jsx';
import VendorOrdersPage from './pages/vendor/VendorOrdersPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!localStorage.getItem('marketplaceToken')) {
      dispatch(finishSessionCheck());
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => dispatch(setUser(data.user)))
      .catch(() => {
        localStorage.removeItem('marketplaceToken');
        dispatch(clearSession());
      });
  }, [dispatch]);

  return (
    <>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/vendor/register" element={<VendorRegistrationPage />} />
        <Route path="/cart" element={<ProtectedRoute roles={['customer']}><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute roles={['customer']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['customer']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:orderId" element={<ProtectedRoute roles={['customer']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/vendor" element={<ProtectedRoute roles={['vendor']}><VendorDashboardPage /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute roles={['vendor']}><VendorProductsPage /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute roles={['vendor']}><VendorOrdersPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/vendors" element={<ProtectedRoute roles={['admin']}><AdminVendorsPage /></ProtectedRoute>} />
        <Route path="/admin/customers" element={<ProtectedRoute roles={['admin']}><AdminCustomersPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <footer className="site-footer">
        <div className="page-shell footer-inner">
          <Link className="brand footer-brand" to="/"><span className="brand-mark">m</span><span>market<span className="brand-light">hub</span></span></Link>
          <span>Good finds from good people. © {new Date().getFullYear()} MarketHub.</span>
          <span>Built for thoughtful shopping.</span>
        </div>
      </footer>
    </>
  );
}
