const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const projectsService = require("../services/projects.service");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const projects = await projectsService.listProjects(req.user.id);
    res.json({ ok: true, data: { projects } });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const project = await projectsService.createProject(req.user.id, req.body);
    res.status(201).json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const project = await projectsService.getProject(req.params.id, req.user.id);
    res.json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const project = await projectsService.updateProject(req.params.id, req.user.id, req.body);
    res.json({ ok: true, data: { project } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await projectsService.deleteProject(req.params.id, req.user.id, req.body.confirmationName);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
