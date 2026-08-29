const crypto = require("crypto");
const { jsonResponse } = require("./_utils");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const AUTH_SECRET = process.env.AUTH_SECRET || "ask_wall_default_auth_secret_key_2026";

function generateToken() {
  const payload = {
    role: "admin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // صالح لمدة 7 أيام
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method Not Allowed" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const enteredPassword = body.password || body.pin || "";

    if (!enteredPassword) {
      return jsonResponse(400, { error: "يرجى إدخال رمز المرور" });
    }

    if (!ADMIN_PASSWORD) {
      return jsonResponse(500, { error: "لم يتم ضبط كلمة مرور المسؤول في المتغيرات" });
    }

    // مقارنة كلمة المرور
    if (enteredPassword.trim() !== ADMIN_PASSWORD.trim()) {
      return jsonResponse(401, { error: "رمز المرور غير صحيح" });
    }

    // توليد التوكن
    const token = generateToken();

    return jsonResponse(200, {
      success: true,
      token,
      message: "تم تسجيل الدخول بنجاح"
    });
  } catch (err) {
    console.error("ADMIN_LOGIN_ERROR:", err);
    return jsonResponse(500, {
      error: "خطأ أثناء محاولة تسجيل الدخول",
      details: err.message
    });
  }
};
