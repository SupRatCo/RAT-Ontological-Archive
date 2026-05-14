(function () {
  const { UI, Storage } = window.ROA;

  function localPosts() {
    const app = window.ROA.App;
    app.data.forumPosts = app.data.forumPosts || [];
    return app.data.forumPosts;
  }

  async function getPosts(filters) {
    if (window.ROA.Api.serverMode) {
      try {
        const data = await window.ROA.Api.getForumPosts(filters);
        return data.posts || [];
      } catch (error) {
        UI.toast("No se pudo cargar el foro desde servidor.");
      }
    }
    const q = String(filters && filters.q || "").toLowerCase();
    return localPosts().filter((post) => !q || `${post.title} ${post.content} ${post.summary} ${(post.tags || []).join(" ")}`.toLowerCase().includes(q));
  }

  async function renderFeed(filters) {
    const user = window.ROA.Auth.currentUser();
    const posts = await getPosts(filters || {});
    document.querySelector("#mainView").innerHTML = `
      <section class="forum-shell">
        <header class="forum-hero">
          <div>
            <span class="overline">R.O.A. MAIN FORUM</span>
            <h1>Menú Principal</h1>
            <p>Historias, universos públicos, comentarios y comunidad local de escritura.</p>
          </div>
          <button class="action" type="button" data-action="create-forum-post">+ Publicar historia</button>
        </header>
        <section class="forum-filters">
          <button class="ghost-action" data-action="open-forum" data-filter="recent">Recientes</button>
          <button class="ghost-action" data-action="open-forum" data-filter="popular">Populares</button>
          <button class="ghost-action" data-action="open-forum" data-filter="commented">Más comentadas</button>
          <button class="ghost-action" data-action="open-forum" data-filter="saved">Guardadas</button>
          <button class="ghost-action" data-action="open-forum" data-filter="mine">Mis publicaciones</button>
          <input id="forumSearch" placeholder="Buscar por título, autor, etiqueta o contenido" value="${UI.escape((filters && filters.q) || "")}">
        </section>
        <section class="forum-feed">
          ${posts.map((post) => renderPostCard(post, user)).join("") || `<article class="empty-state"><div><h2>No hay publicaciones todavía.</h2><p>Publica la primera historia o vincula un proyecto público.</p></div></article>`}
        </section>
      </section>
    `;
    const search = document.querySelector("#forumSearch");
    search.addEventListener("change", () => renderFeed({ q: search.value }));
  }

  function renderPostCard(post, user) {
    const author = post.author || { id: post.userId, username: post.authorName || "Autor", avatar_url: post.authorAvatar || "" };
    return `
      <article class="forum-card">
        <button class="forum-author" data-action="open-public-profile" data-user-id="${author.id}" type="button">
          <span class="forum-avatar" style="${author.avatar_url ? `background-image:url('${author.avatar_url}')` : ""}">${author.avatar_url ? "" : UI.escape((author.username || "A")[0])}</span>
          <span>${UI.escape(author.username || "Autor")}</span>
        </button>
        <h2>${UI.escape(post.title)}</h2>
        <p>${UI.escape(post.summary || (post.content || "").slice(0, 220))}</p>
        <div class="tag-list">${(post.tags || []).map((tag) => `<span class="pill-mini">${UI.escape(tag)}</span>`).join("")}</div>
        <footer class="forum-card-footer">
          <span>${UI.formatDate(post.createdAt)}</span>
          <button data-action="vote-forum" data-target-type="post" data-target-id="${post.id}" data-vote-type="up" type="button">▲ ${post.upvotes || 0}</button>
          <button data-action="open-forum-post" data-post-id="${post.id}" type="button">Comentarios ${post.commentsCount || (post.comments || []).length || 0}</button>
          <button data-action="save-forum-post" data-post-id="${post.id}" type="button">${post.saved ? "Guardada" : "Guardar"}</button>
          ${post.projectId ? `<button data-action="select-project" data-project-id="${post.projectId}" type="button">Abrir proyecto</button>` : ""}
        </footer>
      </article>
    `;
  }

  function openPostComposer() {
    const project = UI.currentProject();
    const publicProjects = window.ROA.App.data.projects.filter((item) => item.visibility === "public" && window.ROA.Permissions.canEdit(item));
    UI.openModal("Publicar historia", `
      <form id="forumPostForm" class="form-grid one">
        <label class="field">Título<input name="title" required></label>
        <label class="field">Resumen<textarea name="summary"></textarea></label>
        <label class="field">Contenido<textarea name="content" required></textarea></label>
        <label class="field">Etiquetas separadas por coma<input name="tags"></label>
        <label class="field">Proyecto público vinculado
          <select name="projectId"><option value="">Sin proyecto</option>${publicProjects.map((item) => `<option value="${item.id}" ${project && project.id === item.id ? "selected" : ""}>${UI.escape(item.name)}</option>`).join("")}</select>
        </label>
        <label class="field">Visibilidad<select name="visibility"><option value="public">Pública</option><option value="private">Privada</option></select></label>
        <button class="action" type="button" data-action="submit-forum-post">Publicar</button>
      </form>
    `);
  }

  async function submitPost() {
    const form = document.querySelector("#forumPostForm");
    const values = Object.fromEntries(new FormData(form).entries());
    const post = {
      id: Storage.uid("post"),
      userId: window.ROA.Auth.currentUser().id,
      author: { id: window.ROA.Auth.currentUser().id, username: window.ROA.Auth.currentUser().username, avatar_url: window.ROA.Auth.currentUser().avatar },
      title: values.title,
      content: values.content,
      summary: values.summary,
      projectId: values.projectId || null,
      visibility: values.visibility || "public",
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      upvotes: 0,
      comments: [],
      createdAt: Storage.now(),
      updatedAt: Storage.now()
    };
    if (window.ROA.Api.serverMode) {
      try { await window.ROA.Api.createForumPost(post); } catch (error) { UI.toast(error.message || "No se pudo publicar en servidor."); }
    } else {
      localPosts().unshift(post);
      window.ROA.App.save();
    }
    UI.closeModal();
    renderFeed({});
  }

  async function openPost(postId) {
    let post;
    let comments = [];
    if (window.ROA.Api.serverMode) {
      const data = await window.ROA.Api.getForumPost(postId);
      post = data.post;
      comments = data.comments || [];
    } else {
      post = localPosts().find((item) => item.id === postId);
      comments = post.comments || [];
    }
    UI.openModal(post.title, `
      <article class="forum-full">
        <p>${UI.escape(post.content)}</p>
        <div class="inline-actions">
          <button class="ghost-action" data-action="vote-forum" data-target-type="post" data-target-id="${post.id}" data-vote-type="up">Votar</button>
        </div>
      </article>
      <section class="panel">
        <h3>Comentarios</h3>
        <div class="item-list">${comments.map((comment) => `<article class="list-row"><div><strong>${UI.escape(comment.username || "Usuario")}</strong><span>${UI.escape(comment.content)}</span></div><button data-action="vote-forum" data-target-type="comment" data-target-id="${comment.id}" data-vote-type="up">▲</button></article>`).join("") || `<p class="meta">Sin comentarios.</p>`}</div>
        <label class="field">Nuevo comentario<textarea id="forumCommentText"></textarea></label>
        <button class="action" data-action="submit-forum-comment" data-post-id="${post.id}" type="button">Comentar</button>
      </section>
    `);
  }

  async function submitComment(postId, parentCommentId) {
    const text = document.querySelector("#forumCommentText").value.trim();
    if (!text) return;
    if (window.ROA.Api.serverMode) await window.ROA.Api.createForumComment(postId, { content: text, parentCommentId });
    else {
      const post = localPosts().find((item) => item.id === postId);
      post.comments = post.comments || [];
      post.comments.push({ id: Storage.uid("comment"), userId: window.ROA.Auth.currentUser().id, username: window.ROA.Auth.currentUser().username, content: text, createdAt: Storage.now() });
      window.ROA.Notifications.notify(post.userId, "Nuevo comentario", "Alguien comentó tu publicación.", { type: "forum-comment", postId });
      window.ROA.App.save();
    }
    openPost(postId);
  }

  async function vote(targetType, targetId, voteType) {
    if (window.ROA.Api.serverMode) await window.ROA.Api.voteForumItem(targetType, targetId, voteType);
    else UI.toast("Voto registrado.");
    renderFeed({});
  }

  async function savePost(postId) {
    if (window.ROA.Api.serverMode) await window.ROA.Api.saveForumPost(postId);
    else UI.toast("Publicación guardada.");
    renderFeed({});
  }

  async function openPublicProfile(userId) {
    if (window.ROA.Api.serverMode) {
      const data = await window.ROA.Api.getPublicUser(userId);
      UI.openModal(data.user.username, `<section class="panel"><h3>${UI.escape(data.user.username)}</h3><p class="meta">Desde ${UI.formatDate(data.user.createdAt)}</p></section><section class="panel"><h3>Publicaciones</h3>${data.posts.map((post) => `<p>${UI.escape(post.title)}</p>`).join("") || "Sin publicaciones públicas."}</section><section class="panel"><h3>Proyectos públicos</h3>${data.projects.map((project) => `<button class="list-row" data-action="select-project" data-project-id="${project.id}">${UI.escape(project.name)}</button>`).join("") || "Sin proyectos públicos."}</section>`);
      return;
    }
    UI.toast("Perfil público disponible en modo servidor.");
  }

  window.ROA = window.ROA || {};
  window.ROA.Forum = { renderFeed, openPostComposer, submitPost, openPost, submitComment, vote, savePost, openPublicProfile };
})();
