import { useEffect } from "react";
import Button from "./Button";

export default function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="roa-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="roa-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="roa-modal-header">
          <h2>{title}</h2>
          <Button onClick={onClose}>X</Button>
        </header>
        {children}
      </section>
    </div>
  );
}
