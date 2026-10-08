export default function LoadingState({ label = 'Loading your workspace…' }) {
  return <div className="loading-state" role="status" aria-live="polite">
    <span className="loader" aria-hidden="true" />
    <p>{label}</p>
  </div>
}
