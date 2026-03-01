/**
 * 인증 미들웨어
 *
 * - API_KEY: /generate 등 일반 API 보호
 * - ADMIN_KEY: /meta 등 관리자 API 보호
 */

const API_KEY = process.env.API_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;

/**
 * 일반 API용 API Key 검증 미들웨어
 */
function requireApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!API_KEY || apiKey !== API_KEY) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or missing API key.",
      },
    });
  }
  next();
}

/**
 * 관리자용 Admin Key 검증 미들웨어
 */
function requireAdminKey(req, res, next) {
  const adminKey = req.headers["x-admin-key"];

  if (!ADMIN_KEY || adminKey !== ADMIN_KEY) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or missing admin key.",
      },
    });
  }
  next();
}

module.exports = {
  requireApiKey,
  requireAdminKey,
};
