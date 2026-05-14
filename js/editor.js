(function () {
  const { UI } = window.ROA;
  const recentKey = "roa_recent_emojis";
  let recognition = null;

  function editor() {
    return document.querySelector("#fileContent");
  }

  function insertAtCursor(textarea, before, after) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || "";
    textarea.setRangeText(`${before}${selected}${after || ""}`, start, end, "end");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
  }

  function toolbar() {
    return `
      <div class="editor-status-line"><span id="saveStatus">Guardado</span></div>
      <div class="editor-toolbar">
        <button class="ghost-action" type="button" data-action="editor-format" data-format="bold" title="Negrita">B</button>
        <button class="ghost-action" type="button" data-action="editor-format" data-format="italic" title="Cursiva">I</button>
        <button class="ghost-action" type="button" data-action="editor-format" data-format="underline" title="Subrayado">U</button>
        <button class="ghost-action" type="button" data-action="editor-format" data-format="strike" title="Tachado">S</button>
        <button class="ghost-action" type="button" data-action="editor-format" data-format="h1">Titulo</button>
        <button class="ghost-action" type="button" data-action="editor-format" data-format="h2">Subtitulo</button>
        <button class="ghost-action" type="button" data-action="editor-format" data-format="list">Lista</button>
        <button class="ghost-action" type="button" data-action="editor-format" data-format="quote">Cita</button>
        <button class="ghost-action" type="button" data-action="editor-format" data-format="hr">Separador</button>
        <button class="ghost-action" type="button" data-action="insert-internal-link">[[Wiki]]</button>
        <button class="ghost-action" type="button" data-action="insert-normal-link">Link</button>
        <button class="ghost-action" type="button" data-action="insert-gallery-image">Imagen</button>
        <button class="ghost-action" type="button" data-action="open-emoji-panel">😀 Emojis</button>
        <select class="toolbar-select" data-action="editor-font">
          ${["Default", "Arial", "Georgia", "Times New Roman", "Verdana", "Courier New", "Monospace", "Serif", "Fantasy", "Cursive"].map((font) => `<option value="${font}">${font}</option>`).join("")}
        </select>
        <select class="toolbar-select" data-action="editor-size">
          <option value="small">Pequeño</option>
          <option value="normal" selected>Normal</option>
          <option value="large">Grande</option>
          <option value="title">Titulo</option>
        </select>
        <button class="ghost-action" type="button" data-action="clear-text">Borrar texto</button>
        <button class="ghost-action" type="button" data-action="toggle-keyboard">⌨ Teclado</button>
        <button class="ghost-action" type="button" data-action="toggle-speech">🎙 Voz a texto</button>
        <button class="action" type="button" data-action="manual-save-current-file">Guardar</button>
        <button class="action" type="button" data-action="toggle-preview">Vista previa</button>
      </div>
      <div id="emojiPanel" class="floating-panel emoji-panel hidden"></div>
      <div id="virtualKeyboard" class="virtual-keyboard hidden"></div>
      <div id="speechStatus" class="pill-mini hidden">Escuchando...</div>
    `;
  }

  function markdownToHtml(text, project) {
    const lines = UI.escape(text || "").split("\n");
    let html = lines.map((line) => {
      if (/^# /.test(line)) return `<h1>${line.replace(/^# /, "")}</h1>`;
      if (/^## /.test(line)) return `<h2>${line.replace(/^## /, "")}</h2>`;
      if (/^> /.test(line)) return `<blockquote>${line.replace(/^&gt; /, "")}</blockquote>`;
      if (/^- /.test(line)) return `<li>${line.replace(/^- /, "")}</li>`;
      if (/^---+$/.test(line.trim())) return `<hr>`;
      return `<p>${line || "&nbsp;"}</p>`;
    }).join("");
    html = html
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/__([^_]+)__/g, "<u>$1</u>")
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      .replace(/<span data-font=&quot;([^&]+)&quot;>(.*?)<\/span>/g, '<span style="font-family:$1">$2</span>')
      .replace(/<span data-size=&quot;([^&]+)&quot;>(.*?)<\/span>/g, (_m, size, value) => `<span class="text-size-${size}">${value}</span>`)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img class="embedded-media" alt="$1" src="$2">')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    return html.replace(/\[\[([^\]]+)\]\]/g, (_match, name) => {
      const found = project.files.find((file) => file.title.toLowerCase() === name.trim().toLowerCase());
      const action = found ? "open-file" : "create-linked-file";
      const attr = found ? `data-file-id="${found.id}"` : `data-title="${UI.escape(name.trim())}"`;
      return `<button class="wiki-link" type="button" data-action="${action}" ${attr}>[[${UI.escape(name.trim())}]]</button>`;
    });
  }

  function applyFormat(format) {
    const formats = {
      bold: ["**", "**"],
      italic: ["*", "*"],
      underline: ["__", "__"],
      strike: ["~~", "~~"],
      h1: ["# ", ""],
      h2: ["## ", ""],
      list: ["- ", ""],
      quote: ["> ", ""],
      hr: ["\n---\n", ""]
    };
    const pair = formats[format];
    if (pair) insertAtCursor(editor(), pair[0], pair[1]);
  }

  function applyFont(font) {
    if (!font || font === "Default") return;
    insertAtCursor(editor(), `<span data-font="${font}">`, "</span>");
  }

  function applySize(size) {
    insertAtCursor(editor(), `<span data-size="${size}">`, "</span>");
  }

  function insertInternalLink() { insertAtCursor(editor(), "[[", "]]"); }
  function insertNormalLink() { insertAtCursor(editor(), "[texto](https://)", ""); }

  function insertGalleryImage() {
    const project = UI.currentProject();
    const images = project.gallery.filter((item) => item.kind !== "video");
    if (!images.length) return UI.toast("No hay imagenes en la galeria.");
    UI.openModal("Insertar imagen", `<div class="gallery-grid">${images.map((image) => `
      <button class="archive-card gallery-card" type="button" data-action="choose-editor-image" data-image-id="${image.id}">
        <img src="${UI.escape(image.src)}" alt="${UI.escape(image.name)}"><strong>${UI.escape(image.name)}</strong>
      </button>`).join("")}</div>`);
  }

  function chooseImage(imageId) {
    const project = UI.currentProject();
    const image = project.gallery.find((item) => item.id === imageId);
    UI.closeModal();
    if (image) insertAtCursor(editor(), `![${image.name}](${image.src})`, "");
  }

  function togglePreview() {
    const preview = document.querySelector("#wikiPreviewPanel");
    if (preview) preview.classList.toggle("hidden");
  }

  function emojiGroups() {
    const recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
    return {
      "Recientes": recent,
      "Caras": ["😀", "😁", "😂", "😊", "😍", "😎", "😢", "😡", "🤔", "😴"],
      "Símbolos": ["★", "✦", "✧", "∞", "⚠", "✓", "✕", "→", "←", "◆"],
      "Objetos": ["📚", "🗡️", "🛡️", "🔮", "🧭", "📜", "🧪", "💎", "🕯️", "🔑"],
      "Naturaleza": ["🌙", "☀️", "⭐", "🌌", "🔥", "🌊", "🌲", "🌹", "⚡", "❄️"],
      "Fantasía/Sci-fi": ["👁️", "🛸", "🚀", "🪐", "👑", "🐉", "🧙", "🧬", "🤖", "🌀"]
    };
  }

  function openEmojiPanel() {
    const panel = document.querySelector("#emojiPanel");
    if (!panel) return;
    const groups = emojiGroups();
    panel.innerHTML = Object.entries(groups).map(([name, items]) => `
      <section><strong>${name}</strong><div class="emoji-grid">${(items.length ? items : ["—"]).map((emoji) => `<button type="button" data-action="insert-emoji" data-emoji="${emoji}">${emoji}</button>`).join("")}</div></section>
    `).join("");
    panel.classList.toggle("hidden");
  }

  function insertEmoji(emoji) {
    if (!emoji || emoji === "—") return;
    insertAtCursor(editor(), emoji, "");
    const recent = JSON.parse(localStorage.getItem(recentKey) || "[]").filter((item) => item !== emoji);
    recent.unshift(emoji);
    localStorage.setItem(recentKey, JSON.stringify(recent.slice(0, 16)));
    const panel = document.querySelector("#emojiPanel");
    if (panel) panel.classList.add("hidden");
  }

  async function clearText() {
    const ok = await UI.confirm("Borrar texto", "¿Seguro que quieres borrar todo el texto de este archivo?", "Borrar texto", true);
    if (!ok) return;
    const node = editor();
    node.value = "";
    node.dispatchEvent(new Event("input", { bubbles: true }));
    UI.toast("Texto borrado.");
  }

  function toggleKeyboard() {
    const keyboard = document.querySelector("#virtualKeyboard");
    if (!keyboard) return;
    const rows = ["1234567890", "qwertyuiop", "asdfghjklñ", "zxcvbnm,.?"].map((row) => `<div>${row.split("").map((key) => `<button type="button" data-action="keyboard-key" data-key="${key}">${key}</button>`).join("")}</div>`).join("");
    keyboard.innerHTML = `${rows}<div><button data-action="keyboard-key" data-key=" ">Espacio</button><button data-action="keyboard-key" data-key="\\n">Enter</button><button data-action="keyboard-backspace">Borrar</button><button data-action="insert-emoji" data-emoji="✨">✨</button></div>`;
    keyboard.classList.toggle("hidden");
  }

  function keyboardKey(key) {
    insertAtCursor(editor(), key.replace("\\n", "\n"), "");
  }

  function keyboardBackspace() {
    const node = editor();
    if (!node) return;
    const start = node.selectionStart;
    if (start <= 0) return;
    node.setRangeText("", start - 1, start, "end");
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function toggleSpeech() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return UI.toast("Voz a texto no está disponible en este navegador.");
    const status = document.querySelector("#speechStatus");
    if (recognition) {
      recognition.stop();
      recognition = null;
      if (status) status.classList.add("hidden");
      return;
    }
    recognition = new Speech();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results).slice(event.resultIndex).map((result) => result[0].transcript).join(" ");
      insertAtCursor(editor(), `${text} `, "");
    };
    recognition.onend = () => {
      recognition = null;
      if (status) status.classList.add("hidden");
    };
    if (status) status.classList.remove("hidden");
    recognition.start();
  }

  window.ROA = window.ROA || {};
  window.ROA.Editor = {
    toolbar,
    markdownToHtml,
    applyFormat,
    applyFont,
    applySize,
    insertInternalLink,
    insertNormalLink,
    insertGalleryImage,
    chooseImage,
    togglePreview,
    openEmojiPanel,
    insertEmoji,
    clearText,
    toggleKeyboard,
    keyboardKey,
    keyboardBackspace,
    toggleSpeech
  };
})();
