const { getProjectRole } = require("../services/permissions.service");
const { forbidden } = require("../utils/errors");

function projectIdFromRequest(req) {
  return req.params.projectId || req.params.id || req.body.project_id || req.body.projectId || req.query.projectId;
}

function requireProjectRole(roles = []) {
  return async (req, _res, next) => {
    try {
      const projectId = projectIdFromRequest(req);
      if (!projectId) throw forbidden("Falta projectId para validar permisos.");

      const role = await getProjectRole(projectId, req.user.id);
      if (!roles.includes(role)) throw forbidden("No tienes permisos suficientes para este proyecto.");

      req.projectRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireProjectAccess(req, res, next) {
  return requireProjectRole(["owner", "editor", "viewer"])(req, res, next);
}

function requireProjectEditor(req, res, next) {
  return requireProjectRole(["owner", "editor"])(req, res, next);
}

function requireProjectOwner(req, res, next) {
  return requireProjectRole(["owner"])(req, res, next);
}

module.exports = {
  requireProjectRole,
  requireProjectAccess,
  requireProjectEditor,
  requireProjectOwner
};
