import Button from "./Button";

export default function EmptyState({ title = "NO DATA", kicker = "/YET/", message, actionLabel, onAction }) {
  return (
    <div className="roa-empty">
      <div>
        <h2>{title}</h2>
        <strong>{kicker}</strong>
        {message && <p>{message}</p>}
        {actionLabel && <Button variant="primary" onClick={onAction}>{actionLabel}</Button>}
      </div>
    </div>
  );
}
