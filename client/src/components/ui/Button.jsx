export default function Button({ variant = "secondary", className = "", ...props }) {
  return <button className={`roa-btn ${variant} ${className}`.trim()} {...props} />;
}
