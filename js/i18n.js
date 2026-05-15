(function () {
  const dictionaries = {
    "es-latam": {
      settings: "Configuracion",
      general: "General",
      account: "Cuenta",
      appearance: "Apariencia",
      audio: "Audio",
      video: "Video",
      language: "Idioma",
      data: "Datos",
      projects: "Proyectos",
      accessibility: "Accesibilidad",
      server: "Servidor",
      save: "Guardar",
      disconnected: "Servidor desconectado"
    },
    "es-es": {
      settings: "Configuracion",
      general: "General",
      account: "Cuenta",
      appearance: "Apariencia",
      audio: "Audio",
      video: "Video",
      language: "Idioma",
      data: "Datos",
      projects: "Proyectos",
      accessibility: "Accesibilidad",
      server: "Servidor",
      save: "Guardar cambios",
      disconnected: "Servidor desconectado, vale"
    },
    en: {
      settings: "Settings",
      general: "General",
      account: "Account",
      appearance: "Appearance",
      audio: "Audio",
      video: "Video",
      language: "Language",
      data: "Data",
      projects: "Projects",
      accessibility: "Accessibility",
      server: "Server",
      save: "Save",
      disconnected: "Server disconnected"
    },
    pt: {
      settings: "Configuracoes",
      general: "Geral",
      account: "Conta",
      appearance: "Aparencia",
      audio: "Audio",
      video: "Video",
      language: "Idioma",
      data: "Dados",
      projects: "Projetos",
      accessibility: "Acessibilidade",
      server: "Servidor",
      save: "Salvar",
      disconnected: "Servidor desconectado"
    }
  };

  function lang() {
    const app = window.ROA.App;
    return (app && app.data && app.data.settings && app.data.settings.language) || "es-latam";
  }

  function t(key) {
    return (dictionaries[lang()] && dictionaries[lang()][key]) || dictionaries["es-latam"][key] || key;
  }

  window.ROA = window.ROA || {};
  window.ROA.I18n = { dictionaries, lang, t };
})();
