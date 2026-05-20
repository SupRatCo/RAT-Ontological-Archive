export default function RightPanel({ children }) {
  return children ? <aside className="roa-panel">{children}</aside> : null;
}
