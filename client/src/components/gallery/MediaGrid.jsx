import MediaCard from "./MediaCard";

export default function MediaGrid({ media = [], onOpen }) {
  return (
    <div className="media-grid">
      {media.map((item) => <MediaCard key={item.id} item={item} onOpen={onOpen} />)}
    </div>
  );
}
