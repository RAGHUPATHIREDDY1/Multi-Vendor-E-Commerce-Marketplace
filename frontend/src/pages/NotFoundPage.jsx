import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="page-shell not-found">
      <span className="eyebrow">404 · THIS PAGE WANDERED OFF</span>
      <h1>Nothing to see here.<br /><em>Yet, anyway.</em></h1>
      <p>Let's get you back to the good finds.</p>
      <Link className="button button-dark" to="/">Back to MarketHub</Link>
    </main>
  );
}
