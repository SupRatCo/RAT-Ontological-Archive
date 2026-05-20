export default function IconButton({ label, children, ...props }) {
  return (
    <button className="roa-icon-btn" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
