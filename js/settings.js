(function () {
  const { UI, Storage } = window.ROA;
  const themeLabels = { gold: "Dorado", violet: "Violeta", green: "Verde", cyan: "Azul", red: "Rojo", black: "Negro", basicDark: "Oscuro" };
  const languageLabels = { "es-latam": "Español LATAM", "es-es": "Español España", en: "English", pt: "Português" };

  function applySettings(settings) {
    document.body.dataset.theme = settings.theme || "gold";
    if (window.ROA.Backgrounds) window.ROA.Backgrounds.apply(settings);
    else document.body.dataset.background = settings.background || "deepSpace";
    document.body.style.setProperty("--app-brightness", `${settings.brightness || 100}%`);
    document.body.style.setProperty("--ui-font-scale", `${settings.uiFontScale || 100}%`);
    document.body.classList.toggle("animations-reduced", settings.animations === false);
    document.body.classList.toggle("performance-mode", !!settings.performanceMode);
    ["high", "medium", "low", "ultra-low"].forEach((quality) => {
      document.body.classList.toggle(`quality-${quality}`, (settings.visualQuality || "high") === quality);
    });
    document.body.classList.toggle("reduced-motion", !!settings.reducedMotion || settings.animations === false);
    document.body.classList.toggle("no-glow", !!settings.disableGlows || !!settings.performanceMode || settings.visualQuality === "ultra-low");
    document.body.classList.toggle("no-shadows", !!settings.disableShadows || settings.visualQuality === "low" || settings.visualQuality === "ultra-low");
    document.body.classList.toggle("no-transitions", !!settings.disableTransitions || settings.visualQuality === "ultra-low");
    document.body.classList.toggle("no-particles", !!settings.disableParticles || settings.performanceBackground === "plain" || settings.visualQuality === "low" || settings.visualQuality === "ultra-low");
    document.body.classList.toggle("static-background", settings.performanceBackground === "static" || settings.visualQuality === "low");
    document.body.classList.toggle("flat-background", settings.performanceBackground === "plain" || settings.visualQuality === "ultra-low");
  }

  async function updateSetting(key, value) {
    const app = window.ROA.App;
    app.data.settings[key] = value;
    const user = window.ROA.Auth.currentUser();
    if (user) user.settings = Object.assign(user.settings || {}, app.data.settings);
    app.save();
    applySettings(app.data.settings);
    if (user && window.ROA.Api && window.ROA.Api.serverMode) {
      window.ROA.Api.updateMe({ settings: user.settings }).catch((error) => console.warn("Settings sync failed", error));
    }
  }

  function tabButton(key, label, active) {
    return `<button class="settings-tab ${active === key ? "active" : ""}" type="button" data-action="settings-tab" data-settings-tab="${key}">${label}</button>`;
  }

  function openSettings(active) {
    const app = window.ROA.App;
    const settings = app.data.settings;
    const tab = active || settings.activeSettingsTab || "general";
    const t = window.ROA.I18n ? window.ROA.I18n.t : (key) => key;
    UI.openModal(t("settings"), `
      <div class="settings-layout">
        <nav class="settings-tabs">
          ${[
            ["general", t("general")],
            ["account", t("account")],
            ["appearance", t("appearance")],
            ["audio", t("audio")],
            ["video", t("video")],
            ["performance", "Rendimiento"],
            ["language", t("language")],
            ["data", t("data")],
            ["projects", t("projects")],
            ["accessibility", t("accessibility")],
            ["server", t("server")]
          ].map(([key, label]) => tabButton(key, label, tab)).join("")}
        </nav>
        <section class="settings-panel">${renderTab(tab, settings, app.data.projects)}</section>
      </div>
    `);
    settings.activeSettingsTab = tab;
    bindSettingsModal(tab);
  }

  function renderTab(tab, settings, projects) {
    if (tab === "account") return `
      <div class="panel flat"><h3>Cuenta</h3><p class="meta">Edita perfil, avatar y banner desde el boton de usuario.</p><button class="action" data-action="open-profile" type="button">Abrir perfil</button><button class="danger-action" data-action="logout" type="button">Cerrar sesion</button></div>`;
    if (tab === "appearance") return `
      <div class="panel flat"><h3>Apariencia</h3>
        <label class="field">Tema<select id="settingTheme">${Object.entries(themeLabels).map(([key, label]) => `<option value="${key}" ${settings.theme === key ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label class="field">Fondo<select id="settingBackground">${Object.entries(window.ROA.Backgrounds.labels).map(([key, label]) => `<option value="${key}" ${settings.background === key ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label class="field">Brillo <span id="brightnessValue">${settings.brightness}</span>%<input id="settingBrightness" type="range" min="50" max="150" value="${settings.brightness}"></label>
        <button class="ghost-action" type="button" data-action="trigger-background-upload">Subir fondo</button>
      </div>`;
    if (tab === "audio") return `<div class="panel flat"><h3>Audio</h3><label class="field">Volumen <span id="volumeValue">${settings.volume}</span>%<input id="settingVolume" type="range" min="0" max="100" value="${settings.volume}"></label></div>`;
    if (tab === "video") return `<div class="panel flat"><h3>Video</h3><label class="field">Overlay <span id="overlayValue">${settings.backgroundOverlay}</span>%<input id="settingBackgroundOverlay" type="range" min="0" max="85" value="${settings.backgroundOverlay}"></label><label class="field">Ajuste<select id="settingBackgroundFit">${["cover", "contain", "repeat", "auto"].map((item) => `<option value="${item}" ${settings.backgroundFit === item ? "selected" : ""}>${item}</option>`).join("")}</select></label></div>`;
    if (tab === "performance") return `
      <div class="panel flat"><h3>Rendimiento</h3>
        <label class="switch-row"><strong>Modo rendimiento</strong><input id="settingPerformanceMode" type="checkbox" ${settings.performanceMode ? "checked" : ""}></label>
        <label class="field">Calidad visual
          <select id="settingVisualQuality">
            ${[["high", "Alta"], ["medium", "Media"], ["low", "Baja"], ["ultra-low", "Ultra baja"]].map(([key, label]) => `<option value="${key}" ${(settings.visualQuality || "high") === key ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label class="field">Fondo
          <select id="settingPerformanceBackground">
            ${[["animated", "Animado"], ["static", "Estatico"], ["plain", "Color plano"]].map(([key, label]) => `<option value="${key}" ${(settings.performanceBackground || "animated") === key ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label class="switch-row"><strong>Reducir movimiento</strong><input id="settingReducedMotion" type="checkbox" ${settings.reducedMotion ? "checked" : ""}></label>
        <label class="switch-row"><strong>Desactivar glows</strong><input id="settingDisableGlows" type="checkbox" ${settings.disableGlows ? "checked" : ""}></label>
        <label class="switch-row"><strong>Desactivar sombras grandes</strong><input id="settingDisableShadows" type="checkbox" ${settings.disableShadows ? "checked" : ""}></label>
        <label class="switch-row"><strong>Desactivar transiciones</strong><input id="settingDisableTransitions" type="checkbox" ${settings.disableTransitions ? "checked" : ""}></label>
        <label class="switch-row"><strong>Desactivar particulas</strong><input id="settingDisableParticles" type="checkbox" ${settings.disableParticles ? "checked" : ""}></label>
        <label class="switch-row"><strong>Silenciar sonidos UI</strong><input id="settingMuteSounds" type="checkbox" ${settings.muteSounds ? "checked" : ""}></label>
      </div>`;
    if (tab === "language") return `<div class="panel flat"><h3>Idioma</h3><label class="field">Idioma<select id="settingLanguage">${Object.entries(languageLabels).map(([key, label]) => `<option value="${key}" ${settings.language === key ? "selected" : ""}>${label}</option>`).join("")}</select></label></div>`;
    if (tab === "data") return `<div class="panel flat"><h3>Datos</h3><p class="meta">Ultimo guardado: ${UI.formatDate(settings.lastSavedAt)}</p><button class="action" data-action="export-all" type="button">Exportar</button><button class="ghost-action" data-action="trigger-backup-import" type="button">Importar</button><button class="danger-action" data-action="reset-all-data" type="button">Borrar todo</button></div>`;
    if (tab === "projects") return `<div class="panel flat"><h3>Proyectos</h3><div class="item-list">${projects.map((project) => `<article class="list-row"><strong>${UI.escape(project.name)}</strong><span class="meta">${UI.escape(project.visibility || "private")}</span><div class="inline-actions"><button class="action" data-action="select-project" data-project-id="${project.id}">Abrir</button><button class="ghost-action" data-action="toggle-project-visibility" data-project-id="${project.id}">Visibilidad</button><button class="danger-action" data-action="delete-project-by-id" data-project-id="${project.id}">Eliminar</button></div></article>`).join("") || "<p class='meta'>Sin proyectos.</p>"}</div></div>`;
    if (tab === "accessibility") return `<div class="panel flat"><h3>Accesibilidad</h3><label class="field">Tamaño UI <span id="uiFontScaleValue">${settings.uiFontScale || 100}</span>%<input id="settingUiFontScale" type="range" min="85" max="125" value="${settings.uiFontScale || 100}"></label><label class="switch-row"><strong>Reducir movimiento</strong><input id="settingAnimations" type="checkbox" ${settings.animations === false ? "checked" : ""}></label></div>`;
    if (tab === "server") return `<div class="panel flat"><h3>Servidor</h3><p class="meta">API: ${UI.escape(window.ROA.Api.baseUrl || "Sin configurar")}</p><p class="meta">Health: ${UI.escape(window.ROA.Api.healthUrl ? window.ROA.Api.healthUrl() : "Sin configurar")}</p><div class="inline-actions"><button class="action" type="button" data-action="test-server">Probar conexion</button><button class="ghost-action" type="button" data-action="clear-server-errors">Limpiar historial de errores</button></div><div id="serverStatus" class="server-diagnostics meta">${renderServerDiagnostics()}</div></div>`;
    return `<div class="panel flat"><h3>General</h3><label class="switch-row"><strong>Autoguardado</strong><input id="settingAutosave" type="checkbox" ${settings.autosave !== false ? "checked" : ""}></label></div>`;
  }

  function bindSettingsModal(tab) {
    const bind = (id, event, fn) => { const node = UI.qs(`#${id}`); if (node) node.addEventListener(event, fn); };
    bind("settingTheme", "change", (event) => updateSetting("theme", event.target.value));
    bind("settingBackground", "change", (event) => updateSetting("background", event.target.value));
    bind("settingBrightness", "input", (event) => { UI.qs("#brightnessValue").textContent = event.target.value; updateSetting("brightness", Number(event.target.value)); });
    bind("settingVolume", "input", (event) => { UI.qs("#volumeValue").textContent = event.target.value; updateSetting("volume", Number(event.target.value)); });
    bind("settingBackgroundOverlay", "input", (event) => { UI.qs("#overlayValue").textContent = event.target.value; updateSetting("backgroundOverlay", Number(event.target.value)); });
    bind("settingBackgroundFit", "change", (event) => updateSetting("backgroundFit", event.target.value));
    bind("settingPerformanceMode", "change", (event) => updateSetting("performanceMode", event.target.checked));
    bind("settingVisualQuality", "change", (event) => updateSetting("visualQuality", event.target.value));
    bind("settingPerformanceBackground", "change", (event) => updateSetting("performanceBackground", event.target.value));
    bind("settingReducedMotion", "change", (event) => updateSetting("reducedMotion", event.target.checked));
    bind("settingDisableGlows", "change", (event) => updateSetting("disableGlows", event.target.checked));
    bind("settingDisableShadows", "change", (event) => updateSetting("disableShadows", event.target.checked));
    bind("settingDisableTransitions", "change", (event) => updateSetting("disableTransitions", event.target.checked));
    bind("settingDisableParticles", "change", (event) => updateSetting("disableParticles", event.target.checked));
    bind("settingMuteSounds", "change", (event) => updateSetting("muteSounds", event.target.checked));
    bind("settingLanguage", "change", (event) => { updateSetting("language", event.target.value); openSettings("language"); });
    bind("settingUiFontScale", "input", (event) => { UI.qs("#uiFontScaleValue").textContent = event.target.value; updateSetting("uiFontScale", Number(event.target.value)); });
    bind("settingAnimations", "change", (event) => updateSetting("animations", !event.target.checked));
    bind("settingAutosave", "change", (event) => updateSetting("autosave", event.target.checked));
  }

  async function testServer() {
    const node = UI.qs("#serverStatus");
    const healthUrl = window.ROA.Api.healthUrl ? window.ROA.Api.healthUrl() : "";
    if (node) node.innerHTML = `<p>Probando: ${UI.escape(healthUrl || "URL no configurada")}</p>`;
    const started = performance.now();
    try {
      const health = await window.ROA.Api.health();
      const ms = Math.round(performance.now() - started);
      Object.assign(window.ROA.Api.connection, {
        checked: true,
        ok: true,
        message: "Servidor conectado.",
        latency: ms,
        mode: health.mode || "api",
        lastSuccessfulAt: new Date().toISOString(),
        lastTestedUrl: healthUrl
      });
      if (window.ROA.Api.clearHealthErrors) window.ROA.Api.clearHealthErrors();
      if (node) node.innerHTML = renderServerDiagnostics({ ok: true, mode: health.mode || "api", latency: ms, testedUrl: healthUrl, successAt: window.ROA.Api.connection.lastSuccessfulAt });
    } catch (error) {
      const lastError = window.ROA.Api.recentErrors && window.ROA.Api.recentErrors[0];
      const friendly = lastError && lastError.status === 404 ? "Ruta de health incorrecta." : (error.message || "No se pudo conectar con el servidor.");
      if (node) node.innerHTML = renderServerDiagnostics({ ok: false, error: friendly, testedUrl: healthUrl });
    }
  }

  function renderServerDiagnostics(result) {
    const errors = (window.ROA.Api && window.ROA.Api.recentErrors || []).slice(0, 5);
    const connection = window.ROA.Api ? window.ROA.Api.connection || {} : {};
    const effective = result || (connection.checked ? connection : null);
    const healthUrl = result && result.testedUrl ? result.testedUrl : (connection.lastTestedUrl || (window.ROA.Api.healthUrl ? window.ROA.Api.healthUrl() : ""));
    const detailParts = [];
    if (effective && effective.latency) detailParts.push(`${effective.latency} ms`);
    if (effective && effective.mode) detailParts.push(UI.escape(effective.mode));
    if (effective && effective.error) detailParts.push(UI.escape(effective.error));
    if (effective && !effective.ok && effective.message) detailParts.push(UI.escape(effective.message));
    const successAt = (result && result.successAt) || connection.lastSuccessfulAt || "";
    const current = effective
      ? `<p><strong>Estado actual: ${effective.ok ? "Conectado" : "Desconectado"}</strong>${detailParts.length ? ` · ${detailParts.join(" · ")}` : ""}</p>`
      : `<p><strong>Sin probar</strong></p>`;
    return `
      ${current}
      ${successAt ? `<p>Ultima prueba exitosa: ${UI.formatDate(successAt)}</p>` : ""}
      <p>URL base: ${UI.escape(window.ROA.Api.baseUrl || "No configurada")}</p>
      <p>Health URL: ${UI.escape(healthUrl || "No configurada")}</p>
      <details class="diagnostic-list">
        <summary>Errores anteriores (${errors.length})</summary>
        ${errors.map((item) => `<span>${UI.escape(item.at)} · ${UI.escape(item.url || item.path || "")} · ${UI.escape(item.message || item.type || "error")}</span>`).join("") || "<span>Sin errores recientes.</span>"}
      </details>
    `;
  }

  function clearServerErrors() {
    if (window.ROA.Api && window.ROA.Api.clearErrors) window.ROA.Api.clearErrors();
    const node = UI.qs("#serverStatus");
    if (node) node.innerHTML = renderServerDiagnostics();
    UI.toast("Historial de errores limpiado.");
  }

  function exportAll() {
    Storage.download(`rat-ontological-archive-backup-${Date.now()}.json`, Storage.exportAllData(window.ROA.App.data));
    UI.toast("Respaldo exportado.");
  }

  async function resetAllData() {
    const ok = await UI.confirm("Borrar todo", "Seguro que quieres borrar los datos locales?", "Borrar", true);
    if (!ok) return;
    window.ROA.App.data = Storage.resetAppData();
    window.ROA.App.save();
    UI.closeModal();
    window.ROA.Auth.showLogin();
  }

  function importBackupFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        window.ROA.App.data = Storage.importAllData(reader.result);
        window.ROA.App.render();
        UI.toast("Respaldo importado.");
      } catch (error) {
        UI.toast("No se pudo importar.");
      }
    };
    reader.readAsText(file);
  }

  function playSound(name) {
    const volume = window.ROA.App && window.ROA.App.data ? window.ROA.App.data.settings.volume : 0;
    const muted = window.ROA.App && window.ROA.App.data && window.ROA.App.data.settings.muteSounds;
    if (volume && !muted) window.ROA.lastSoundRequest = { name, volume, at: Date.now() };
  }

  window.ROA.Settings = { applySettings, openSettings, exportAll, resetAllData, importBackupFile, playSound, themeLabels, testServer, clearServerErrors };
  window.playSound = playSound;
})();
