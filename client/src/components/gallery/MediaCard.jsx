import Card from "../ui/Card";

export default function MediaCard({ item, onOpen }) {
  return (
    <Card className="media-card" onClick={() => onOpen?.(item)}>
      {item.media_type === "video" ? <video src={item.public_url} controls={false} /> : <img src={item.public_url} alt={item.title || ""} loading="lazy" />}
      <strong>{item.title || "Media"}</strong>
    </Card>
  );
}
