export default function LoadingState({ label = 'Finding good things...' }) {
  return <div className="state-card" role="status"><span className="spinner" />{label}</div>;
}
