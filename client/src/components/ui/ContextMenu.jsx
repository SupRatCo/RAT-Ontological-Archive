import { useEffect } from "react";

export default function ContextMenu({ menu, onClose }) {
  useEffect(() => {
    const close = () => onClose?.();
    const onKey = (event) => event.key === "Escape" && close();
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!menu) return null;

  return (
    <div className="roa-card" style={{ position: "fixed", zIndex: 60, top: menu.y, left: menu.x, minWidth: 190 }}>
      {menu.items.map((item) => (
        <button className="roa-btn" style={{ width: "100%", marginBottom: 8 }} key={item.label} onClick={item.onClick}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
