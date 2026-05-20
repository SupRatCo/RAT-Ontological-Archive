import Modal from "../ui/Modal";

export default function CollaboratorInviteModal({ onClose }) {
  return (
    <Modal title="Invitar colaborador" onClose={onClose}>
      <p>Invitaciones de colaboradores listas en API; la UI completa se conecta en la siguiente iteración.</p>
    </Modal>
  );
}
