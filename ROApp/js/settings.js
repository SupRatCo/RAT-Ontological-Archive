(function () {
  const { UI, Storage } = window.ROA;

  const themeLabels = {
    gold: "Dorado",
    violet: "Violeta",
    green: "Verde",
    cyan: "Azul claro",
    red: "Rojo",
    black: "Negro",
    basicDark: "Oscuro basico"
  };

  function applySettings(settings) {
    document.body.dataset.theme = settings.theme || "gold";
    if (window.ROA.Backgrounds) window.ROA.Backgrounds.apply(settings);
    else document.body.dataset.background = settings.background || "deepSpace";
    document.body.style.setProperty("--app-brightness", `${settings.brightness || 100}%`);
    document.body.classList.toggle("animations-reduced", settings.animations === false);
  }

  function updateSetting(key, value) {
    const app = window.ROA.App;
    app.data.settings[key] = value;
    const user = window.ROA.Auth.currentUser();
    if (user) user.settings = Object.assign(user.settings || {}, app.data.settings);
    app.save();
    applySettings(app.data.settings);
  }

  function openSettings() {
    const app = window.ROA.App;
    const settings = app.data.settings;
    const projects = app.data.projects;
    const html = `
      <div class="settings-grid">
        <section class="panel">
          <h3>Interfaz</h3>
          <label class="field">Tema visual
            <select id="settingTheme">
              ${Object.entries(themeLabels).map(([key, label]) => `<option value="${key}" ${settings.theme === key ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <label class="field">Fondo
            <select id="settingBackground">
              ${Object.entries(window.ROA.Backgrounds.labels).map(([key, label]) => `<option value="${key}" ${settings.background === key ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <label class="field">Ajuste de fondo
            <select id="settingBackgroundFit">
              ${["cover", "contain", "repeat", "auto"].map((item) => `<option value="${item}" ${settings.backgroundFit === item ? "selected" : ""}>${item}</option>`).join("")}
            </select>
          </label>
          <label class="field">Oscurecer fondo: <span id="overlayValue">${settings.backgroundOverlay == null ? 35 : settings.backgroundOverlay}</span>%
            <input id="settingBackgroundOverlay" type="range" min="0" max="85" value="${settings.backgroundOverlay == null ? 35 : settings.backgroundOverlay}">
          </label>
          <button class="ghost-action" type="button" data-action="trigger-background-upload">Subir fondo personalizado</button>
          <label class="field">Brillo: <span id="brightnessValue">${settings.brightness}</span>%
            <input id="settingBrightness" type="range" min="50" max="150" value="${settings.brightness}">
          </label>
          <div class="switch-row">
            <strong>Animaciones</strong>
            <label class="pill-mini"><input id="settingAnimations" type="checkbox" ${settings.animations !== false ? "checked" : ""}> Activadas</label>
          </div>
        </section>

        <section class="panel">
          <h3>Gestion de proyectos</h3>
          <div class="item-list">
            ${projects.map((project) => `
              <article class="list-row">
                <div>
                  <strong>${UI.escape(project.name)}</strong>
                  <span class="meta">${UI.escape(project.visibility || "private")} / ${UI.formatDate(project.createdAt)}</span>
                </div>
                <div class="inline-actions">
                  <button class="action" type="button" data-action="select-project" data-project-id="${project.id}">Seleccionar</button>
                  <button class="ghost-action" type="button" data-action="toggle-project-visibility" data-project-id="${project.id}">${project.visibility === "public" ? "Hacer privado" : "Hacer publico"}</button>
                  <button class="ghost-action" type="button" data-action="export-project-by-id" data-project-id="${project.id}">Exportar</button>
                  <button class="danger-action" type="button" data-action="delete-project-by-id" data-project-id="${project.id}">Eliminar</button>
                </div>
              </article>
            `).join("") || `<p class="meta">No hay proyectos todavia.</p>`}
          </div>
        </section>

        <section class="panel">
          <h3>Sistema</h3>
          <label class="field">Volumen: <span id="volumeValue">${settings.volume}</span>%
            <input id="settingVolume" type="range" min="0" max="100" value="${settings.volume}">
          </label>
          <p class="meta">Ultimo guardado: ${UI.formatDate(settings.lastSavedAt)}</p>
          <div class="inline-actions">
            <button class="action" type="button" data-action="export-all">Exportar todos los datos</button>
            <button class="ghost-action" type="button" data-action="trigger-backup-import">Importar respaldo completo</button>
          </div>
        </section>

        <section class="panel danger-zone">
          <h3>Zona de borrado</h3>
          <p>Esta accion elimina todos los proyectos y configuraciones guardadas en este navegador.</p>
          <button class="danger-action" type="button" data-action="reset-all-data">Borrar todos los datos</button>
        </section>
      </div>
    `;
    UI.openModal("Configuracion", html);
    bindSettingsModal();
  }

  function bindSettingsModal() {
    UI.qs("#settingTheme").addEventListener("change", (event) => updateSetting("theme", event.target.value));
    UI.qs("#settingBackground").addEventListener("change", (event) => updateSetting("background", event.target.value));
    UI.qs("#settingBackgroundFit").addEventListener("change", (event) => updateSetting("backgroundFit", event.target.value));
    UI.qs("#settingBackgroundOverlay").addEventListener("input", (event) => {
      UI.qs("#overlayValue").textContent = event.target.value;
      updateSetting("backgroundOverlay", Number(event.target.value));
    });
    UI.qs("#settingBrightness").addEventListener("input", (event) => {
      UI.qs("#brightnessValue").textContent = event.target.value;
      updateSetting("brightness", Number(event.target.value));
    });
    UI.qs("#settingVolume").addEventListener("input", (event) => {
      UI.qs("#volumeValue").textContent = event.target.value;
      updateSetting("volume", Number(event.target.value));
    });
    UI.qs("#settingAnimations").addEventListener("change", (event) => updateSetting("animations", event.target.checked));
  }

  function exportAll() {
    const app = window.ROA.App;
    Storage.download(`rat-ontological-archive-backup-${Date.now()}.json`, Storage.exportAllData(app.data));
    UI.toast("Respaldo completo exportado.");
  }

  async function resetAllData() {
    const first = await UI.confirm("Borrar todo", "Seguro que quieres borrar todos los datos de R.O.A.?", "Continuar", true);
    if (!first) return;
    const second = await UI.promptFields("Confirmacion final", [
      { name: "confirm", label: "Escribe BORRAR para confirmar", required: true }
    ], "Borrar definitivamente");
    if (second.confirm !== "BORRAR") {
      UI.toast("Confirmacion incorrecta. No se borro nada.");
      return;
    }
    window.ROA.App.data = Storage.resetAppData();
    window.ROA.App.save();
    UI.closeModal();
    window.ROA.Auth.showLogin();
    UI.toast("Datos reiniciados.");
  }

  function importBackupFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        window.ROA.App.data = Storage.importAllData(reader.result);
        window.ROA.App.render();
        UI.toast("Respaldo completo importado.");
      } catch (error) {
        UI.toast("No se pudo importar el respaldo.");
        console.error(error);
      }
    };
    reader.readAsText(file);
  }

  function playSound(name) {
    const app = window.ROA.App;
    const volume = app && app.data ? app.data.settings.volume : 0;
    if (!volume) return;
    window.ROA.lastSoundRequest = { name, volume, at: Date.now() };
  }

  window.ROA.Settings = {
    applySettings,
    openSettings,
    exportAll,
    resetAllData,
    importBackupFile,
    playSound,
    themeLabels
  };
  window.playSound = playSound;
})();
