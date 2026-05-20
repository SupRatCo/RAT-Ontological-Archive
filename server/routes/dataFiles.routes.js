const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const dataFilesService = require("../services/dataFiles.service");

const router = express.Router();

router.get("/project/:projectId", requireAuth, async (req, res, next) => {
  try {
    const dataFiles = await dataFilesService.listDataFiles(req.params.projectId, req.user.id);
    res.json({ ok: true, data: { dataFiles } });
  } catch (error) {
    next(error);
  }
});

router.post("/project/:projectId", requireAuth, async (req, res, next) => {
  try {
    const dataFile = await dataFilesService.createDataFile(req.params.projectId, req.user.id, req.body);
    res.status(201).json({ ok: true, data: { dataFile } });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const dataFile = await dataFilesService.getDataFile(req.params.id, req.user.id);
    res.json({ ok: true, data: { dataFile } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const dataFile = await dataFilesService.updateDataFile(req.params.id, req.user.id, req.body);
    res.json({ ok: true, data: { dataFile } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await dataFilesService.deleteDataFile(req.params.id, req.user.id);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/sections", requireAuth, async (req, res, next) => {
  try {
    const section = await dataFilesService.createSection(req.params.id, req.user.id, req.body);
    res.status(201).json({ ok: true, data: { section } });
  } catch (error) {
    next(error);
  }
});

router.patch("/sections/:sectionId", requireAuth, async (req, res, next) => {
  try {
    const section = await dataFilesService.updateSection(req.params.sectionId, req.user.id, req.body);
    res.json({ ok: true, data: { section } });
  } catch (error) {
    next(error);
  }
});

router.delete("/sections/:sectionId", requireAuth, async (req, res, next) => {
  try {
    const result = await dataFilesService.deleteSection(req.params.sectionId, req.user.id);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post("/sections/:sectionId/fields", requireAuth, async (req, res, next) => {
  try {
    const field = await dataFilesService.createField(req.params.sectionId, req.user.id, req.body);
    res.status(201).json({ ok: true, data: { field } });
  } catch (error) {
    next(error);
  }
});

router.patch("/fields/:fieldId", requireAuth, async (req, res, next) => {
  try {
    const field = await dataFilesService.updateField(req.params.fieldId, req.user.id, req.body);
    res.json({ ok: true, data: { field } });
  } catch (error) {
    next(error);
  }
});

router.delete("/fields/:fieldId", requireAuth, async (req, res, next) => {
  try {
    const result = await dataFilesService.deleteField(req.params.fieldId, req.user.id);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
