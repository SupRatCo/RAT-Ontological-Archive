export default function Card({ children, className = "", ...props }) {
  return (
    <article className={`roa-card ${className}`.trim()} {...props}>
      {children}
    </article>
  );
}
