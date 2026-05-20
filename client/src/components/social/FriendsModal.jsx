import Modal from "../ui/Modal";
import UserSearch from "./UserSearch";

export default function FriendsModal({ onClose }) {
  return (
    <Modal title="Social" onClose={onClose}>
      <p>Sistema social preparado: amigos, solicitudes, búsqueda de usuarios y colaboradores.</p>
      <UserSearch />
    </Modal>
  );
}
