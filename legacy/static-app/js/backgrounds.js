(function () {
  const labels = {
    deepSpace: "Espacio profundo",
    nebula: "Nebulosa",
    starField: "Campo estelar simple",
    darkGradient: "Gradiente oscuro",
    techGrid: "Rejilla tecnica",
    darkArchive: "Archivo oscuro",
    plain: "Fondo plano basico",
    custom: "Fondo personalizado"
  };

  function apply(settings) {
    document.body.dataset.background = settings.background || "deepSpace";
    document.body.style.setProperty("--custom-background", settings.customBackground ? `url("${settings.customBackground}")` : "none");
    document.body.style.setProperty("--background-fit", settings.backgroundFit || "cover");
    document.body.style.setProperty("--background-overlay", `${(settings.backgroundOverlay == null ? 35 : settings.backgroundOverlay) / 100}`);
  }

  function setCustom(file) {
    const user = window.ROA.Auth.currentUser();
    if (!user || !file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const app = window.ROA.App;
      app.data.settings.customBackground = reader.result;
      app.data.settings.background = "custom";
      user.settings = Object.assign(user.settings || {}, app.data.settings);
      app.save();
      window.ROA.Settings.openSettings();
    };
    reader.readAsDataURL(file);
  }

  window.ROA = window.ROA || {};
  window.ROA.Backgrounds = { labels, apply, setCustom };
})();
