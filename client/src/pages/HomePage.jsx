import EmptyState from "../components/ui/EmptyState";

export default function HomePage({ onCreateProject }) {
  return (
    <EmptyState
      title="NO PROJECT"
      kicker="/YET/"
      message="Crea tu primer archivo narrativo online-first."
      actionLabel="Crear proyecto"
      onAction={onCreateProject}
    />
  );
}
