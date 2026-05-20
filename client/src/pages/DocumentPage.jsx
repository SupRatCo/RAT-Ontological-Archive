import { useEffect, useState } from "react";
import { documentsApi } from "../api/documents.api";
import { forumApi } from "../api/forum.api";
import DocumentList from "../components/documents/DocumentList";
import DocumentEditor from "../components/documents/DocumentEditor";
import PublishDocumentModal from "../components/documents/PublishDocumentModal";
import EmptyState from "../components/ui/EmptyState";

export default function DocumentPage({ project, toast }) {
  const [documents, setDocuments] = useState([]);
  const [active, setActive] = useState(null);
  const [publishContent, setPublishContent] = useState(null);

  async function load() {
    if (!project?.id) return;
    const data = await documentsApi.list(project.id);
    setDocuments(data.documents || []);
  }

  useEffect(() => {
    load().catch((error) => toast(error.message));
  }, [project?.id]);

  async function createDocument() {
    const title = prompt("Título del documento");
    if (!title) return;
    const data = await documentsApi.create(project.id, { title });
    setDocuments((current) => [data.document, ...current]);
    setActive(data.document);
  }

  async function saveDocument(payload) {
    const data = await documentsApi.update(active.id, payload);
    setActive(data.document);
    setDocuments((current) => current.map((doc) => doc.id === data.document.id ? data.document : doc));
    toast("Documento guardado.");
  }

  async function publish(payload) {
    const data = await forumApi.createPost(payload);
    setPublishContent(null);
    toast(`Publicado: ${data.post.title}`);
  }

  if (!project) return <EmptyState title="NO PROJECT" message="Selecciona un proyecto para abrir Documentos." />;

  return (
    <>
      {active ? (
        <DocumentEditor document={active} onSave={saveDocument} onPublish={setPublishContent} />
      ) : (
        <DocumentList documents={documents} onOpen={setActive} onCreate={createDocument} />
      )}
      {publishContent !== null && <PublishDocumentModal document={active} content={publishContent} onClose={() => setPublishContent(null)} onPublish={publish} />}
    </>
  );
}
