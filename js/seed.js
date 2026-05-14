(function () {
  function applySeedIfEmpty(data) {
    return data;
  }

  function createDemoProject() {
    return null;
  }

  window.ROA = window.ROA || {};
  window.ROA.Seed = { applySeedIfEmpty, createDemoProject };
})();
