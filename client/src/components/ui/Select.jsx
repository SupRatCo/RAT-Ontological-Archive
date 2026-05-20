export default function Select({ children, ...props }) {
  return (
    <select className="roa-select" {...props}>
      {children}
    </select>
  );
}
