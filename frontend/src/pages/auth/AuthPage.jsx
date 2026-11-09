import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { clearSession, setUser } from '../../store/authSlice.js';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) return <main className="auth-page"><div className="state-card">Checking your account...</div></main>;
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const details = {
      email: form.get('email').toString().trim(),
      password: form.get('password').toString(),
    };
    if (isRegister) details.name = form.get('name').toString().trim();

    try {
      const { data } = await api.post(isRegister ? '/auth/register' : '/auth/login', details);
      localStorage.setItem('marketplaceToken', data.token);
      dispatch(setUser(data.user));
      const defaultDestination = data.user.role === 'admin' ? '/admin' : data.user.role === 'vendor' ? '/vendor' : '/';
      navigate(location.state?.from || defaultDestination, { replace: true });
    } catch (requestError) {
      dispatch(clearSession());
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Back to browsing</Link>
        <div className="auth-icon"><LockKeyhole size={21} /></div>
        <span className="eyebrow">{isRegister ? 'JOIN OUR MARKETPLACE' : 'WELCOME BACK'}</span>
        <h1>{isRegister ? 'Good things start here.' : 'Good to see you again.'}</h1>
        <p>{isRegister ? 'Create your customer account and keep all your favorite finds in one place.' : 'Sign in to pick up right where you left off.'}</p>

        <form className="auth-form" onSubmit={submit}>
          {isRegister && <label>Your name<input name="name" type="text" autoComplete="name" placeholder="Sam Example" minLength="2" maxLength="80" required /></label>}
          <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength="254" required /></label>
          <label>Password
            <span className="password-field">
              <input name="password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} maxLength="72" placeholder={isRegister ? 'At least 8 characters' : 'Your password'} required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-dark auth-submit" type="submit" disabled={saving}>
            {saving ? 'One moment...' : isRegister ? 'Create my account' : 'Sign in'} <ArrowRight size={17} />
          </button>
        </form>
        <div className="auth-switch">
          {isRegister ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New around here? <Link to="/register">Create an account</Link></>}
        </div>
        <div className="vendor-note">Looking to sell? <Link to="/vendor/register">Apply to open a store</Link>.</div>
      </div>
    </main>
  );
}
