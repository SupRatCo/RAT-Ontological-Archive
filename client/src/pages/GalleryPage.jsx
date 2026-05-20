import { useEffect, useState } from "react";
import { mediaApi } from "../api/media.api";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import MediaGrid from "../components/gallery/MediaGrid";
import MediaUploadModal from "../components/gallery/MediaUploadModal";
import MediaViewer from "../components/gallery/MediaViewer";

export default function GalleryPage({ project, toast }) {
  const [media, setMedia] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewer, setViewer] = useState(null);

  async function load() {
    if (!project?.id) return;
    const data = await mediaApi.list(project.id);
    setMedia(data.media || []);
  }

  useEffect(() => {
    load().catch((error) => toast(error.message));
  }, [project?.id]);

  async function upload(file, metadata) {
    const data = await mediaApi.upload(project.id, file, metadata);
    setMedia((current) => [data.media, ...current]);
    setUploadOpen(false);
    toast("Media subida.");
  }

  if (!project) return <EmptyState title="NO PROJECT" message="Selecciona un proyecto para abrir Galería." />;

  return (
    <section className="roa-panel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h2 className="roa-panel-title">Galería</h2>
        <Button variant="primary" onClick={() => setUploadOpen(true)}>+ Subir</Button>
      </div>
      {media.length ? <MediaGrid media={media} onOpen={setViewer} /> : <EmptyState title="NO MEDIA" kicker="/YET/" message="Sube imágenes o videos a Supabase Storage." actionLabel="Subir media" onAction={() => setUploadOpen(true)} />}
      {uploadOpen && <MediaUploadModal onClose={() => setUploadOpen(false)} onUpload={upload} />}
      <MediaViewer item={viewer} onClose={() => setViewer(null)} />
    </section>
  );
}
