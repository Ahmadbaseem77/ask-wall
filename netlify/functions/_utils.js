const { getStore } = require("@netlify/blobs");

const SITE_ID = process.env.SITE_ID || "253ddb2e-5d67-44c2-8b2c-387738dccf08";
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;

function getMessagesStore() {
  return getStore({
    name: "messages",
    siteID: SITE_ID,
    token: TOKEN
  });
}

function getRateLimitStore() {
  return getStore({
    name: "ratelimit",
    siteID: SITE_ID,
    token: TOKEN
  });
}

function sanitizeText(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getClientIp(event) {
  const headers = event.headers || {};
  return (
    headers["x-nf-client-connection-ip"] ||
    headers["client-ip"] ||
    headers["x-forwarded-for"] ||
    "127.0.0.1"
  );
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

module.exports = {
  getMessagesStore,
  getRateLimitStore,
  sanitizeText,
  getClientIp,
  jsonResponse
};
