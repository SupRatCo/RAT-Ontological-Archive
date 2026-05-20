import Modal from "../ui/Modal";

export default function MediaViewer({ item, onClose }) {
  if (!item) return null;
  return (
    <Modal title={item.title || "Media"} onClose={onClose}>
      {item.media_type === "video" ? <video src={item.public_url} controls style={{ width: "100%" }} /> : <img src={item.public_url} alt="" style={{ width: "100%", borderRadius: 12 }} />}
    </Modal>
  );
}
