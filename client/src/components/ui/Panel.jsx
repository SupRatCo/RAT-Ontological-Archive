export default function Panel({ title, children, className = "" }) {
  return (
    <section className={`roa-panel ${className}`.trim()}>
      {title && <h2 className="roa-panel-title">{title}</h2>}
      {children}
    </section>
  );
}
