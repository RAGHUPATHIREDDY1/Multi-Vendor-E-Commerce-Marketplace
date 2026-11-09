import { Store } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { setUser } from '../../store/authSlice.js';

export default function VendorRegistrationPage() {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const details = Object.fromEntries(['name', 'email', 'password', 'storeName', 'description'].map((key) => [key, form.get(key).toString().trim()]));
    try {
      const { data } = await api.post('/auth/vendor/register', details);
      localStorage.setItem('marketplaceToken', data.token);
      dispatch(setUser(data.user));
      navigate('/vendor', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link to="/" className="back-link">← Back to browsing</Link>
        <div className="auth-icon"><Store size={20} /></div>
        <span className="eyebrow">SELL WITH MARKETPLACE</span>
        <h1>Open your little corner.</h1>
        <p>Tell us about your shop. A marketplace admin reviews new store applications before products can be published.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>Your name<input name="name" minLength="2" maxLength="80" autoComplete="name" required /></label>
          <label>Email address<input name="email" type="email" maxLength="254" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" minLength="8" maxLength="72" autoComplete="new-password" required /></label>
          <label>Store name<input name="storeName" minLength="2" maxLength="120" required /></label>
          <label>What do you make or sell?<textarea name="description" minLength="10" maxLength="2000" rows="3" required /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-dark auth-submit" disabled={saving}>{saving ? 'Submitting...' : 'Apply to become a seller'}</button>
        </form>
        <div className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></div>
      </section>
    </main>
  );
}
