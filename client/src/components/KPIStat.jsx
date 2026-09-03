function KPIStat({ label, value, detail, accent = false }) {
  return (
    <div className={`kpi-stat${accent ? ' accent' : ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </div>
  )
}

export default KPIStat
