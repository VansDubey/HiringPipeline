function StatusIndicator({ label, tone = 'neutral' }) {
  return (
    <span className="status-indicator">
      <span className={`status-indicator-dot ${tone}`} aria-hidden="true" />
      {label}
    </span>
  )
}

export default StatusIndicator
