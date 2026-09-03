function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-rule" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  )
}

export default EmptyState
