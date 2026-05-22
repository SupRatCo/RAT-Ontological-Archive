import { useEffect, useState } from "react";
import { createPost as createForumPost, getPost, getPosts, toggleLike, toggleSave } from "../../services/forumService";
import Tabs from "../ui/Tabs";
import Input from "../ui/Input";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import ForumPostCard from "./ForumPostCard";
import ForumPostPage from "./ForumPostPage";
import ForumComposer from "./ForumComposer";
import useDebounce from "../../hooks/useDebounce";
import AppIcon from "../ui/AppIcon";

const tabs = [
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Popular" },
  { value: "saved", label: "Saved" },
  { value: "mine", label: "My Posts" }
];

export default function ForumFeed({ toast }) {
  const [section, setSection] = useState("community");
  const [filter, setFilter] = useState("recent");
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState({ offset: 0, hasMore: false });
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const debouncedQ = useDebounce(q, 350);

  async function load(offset = 0, append = false) {
    const data = await getPosts({ filter, section, q: debouncedQ, offset, limit: 20 });
    setPosts((current) => append ? [...current, ...data.posts] : data.posts);
    setPage(data.page);
  }

  useEffect(() => {
    load().catch((error) => toast(error.message));
  }, [filter, section, debouncedQ]);

  async function createPost(payload) {
    const data = await createForumPost({ ...payload, type: section === "projects" ? "project" : "community", sourceType: section === "projects" ? "project" : "normal" });
    setPosts((current) => [data.post, ...current]);
    setComposerOpen(false);
    toast("Publicado correctamente.");
  }

  async function like(post) {
    const previous = posts;
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, liked_by_current_user: !item.liked_by_current_user, likes_count: Number(item.likes_count || 0) + (item.liked_by_current_user ? -1 : 1) } : item));
    try {
      const data = await toggleLike(post.id);
      if (selectedPost?.id === post.id) setSelectedPost((current) => ({ ...current, liked_by_current_user: data.liked, likes_count: data.likesCount }));
    } catch (error) {
      setPosts(previous);
      toast(error.message);
    }
  }

  async function save(post) {
    try {
      const data = await toggleSave(post.id);
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, saved_by_current_user: data.saved } : item));
      if (selectedPost?.id === post.id) setSelectedPost((current) => ({ ...current, saved_by_current_user: data.saved }));
    } catch (error) {
      toast(error.message);
    }
  }

  async function openPost(post) {
    try {
      const data = await getPost(post.id);
      setSelectedPost(data.post);
    } catch (error) {
      toast(error.message || "No se pudo abrir la publicacion.");
    }
  }

  if (selectedPost) {
    return (
      <ForumPostPage
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onLike={like}
        onSave={save}
        toast={toast}
      />
    );
  }

  return (
    <section className="roa-panel">
      <div className="forum-topline">
        <header className="forum-header">
          <h1 className="forum-title">{section === "projects" ? "PROJECTS" : "COMMUNITY"}</h1>
          <p>Comparte ideas, proyectos y descubre contenido de otros escritores</p>
        </header>
        <Button variant="primary" onClick={() => setComposerOpen(true)}><AppIcon name="add" />{section === "projects" ? "Publicar proyecto" : "Nuevo Post"}</Button>
      </div>
      <div className="forum-section-tabs">
        <Button variant={section === "community" ? "primary" : "secondary"} onClick={() => { setSection("community"); setFilter("recent"); }}>Comunidad</Button>
        <Button variant={section === "projects" ? "primary" : "secondary"} onClick={() => { setSection("projects"); setFilter("recent"); }}>Proyectos</Button>
      </div>
      <div className="forum-toolbar">
        <Tabs tabs={tabs} value={filter} onChange={setFilter} />
        <Input placeholder="Buscar" value={q} onChange={(event) => setQ(event.target.value)} />
        <Button variant="primary" onClick={() => setComposerOpen(true)}><AppIcon name="add" />{section === "projects" ? "Publicar proyecto" : "Nuevo post"}</Button>
      </div>
      <div className="forum-feed">
        {posts.length ? posts.map((post) => <ForumPostCard key={post.id} post={post} onLike={like} onSave={save} onOpen={openPost} onComment={openPost} />) : (
          <EmptyState title={section === "projects" ? "NO PROJECTS" : "NO POSTS"} kicker="/YET/" message={section === "projects" ? "PUBLICA UN PROYECTO PARA LA COMUNIDAD" : "BE THE FIRST TO POST SOMETHING"} actionLabel={section === "projects" ? "Publicar proyecto" : "Crear primer post"} onAction={() => setComposerOpen(true)} />
        )}
      </div>
      {page.hasMore && <Button onClick={() => load(page.nextOffset, true)}>Cargar más</Button>}
      {composerOpen && (
        <ForumComposer
          title={section === "projects" ? "Publicar proyecto" : "Nuevo post"}
          submitLabel={section === "projects" ? "Publicar proyecto" : "Publicar"}
          onClose={() => setComposerOpen(false)}
          onPublish={createPost}
        />
      )}
    </section>
  );
}
