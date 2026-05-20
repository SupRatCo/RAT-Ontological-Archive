export function ToastList({ toasts }) {
  return (
    <div className="roa-toast-list" aria-live="polite">
      {toasts.map((toast) => (
        <div className="roa-toast" key={toast.id}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
