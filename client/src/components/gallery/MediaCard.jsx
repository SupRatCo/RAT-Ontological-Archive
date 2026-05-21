import Card from "../ui/Card";
import AppIcon from "../ui/AppIcon";

export default function MediaCard({ item, onOpen }) {
  return (
    <Card className="media-card" onClick={() => onOpen?.(item)}>
      {item.media_type === "video" ? <video src={item.public_url} controls={false} /> : <img src={item.public_url} alt={item.title || ""} loading="lazy" />}
      <strong><AppIcon name={item.media_type === "video" ? "video" : "gallery"} size={18} />{item.title || "Media"}</strong>
    </Card>
  );
}
