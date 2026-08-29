const { generateAdminToken, jsonResponse } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });

  try {
    const { password } = JSON.parse(event.body || "{}");
    const serverPassword = process.env.ADMIN_PASSWORD;
    const authSecret = process.env.AUTH_SECRET || "fallback_ask_wall_secret_key";

    if (!serverPassword) {
      return jsonResponse(500, { error: "لم يتم ضبط ADMIN_PASSWORD في Environment Variables." });
    }

    if (!password || password !== serverPassword) {
      return jsonResponse(401, { error: "رمز المرور غير صحيح." });
    }

    const token = generateAdminToken(serverPassword, authSecret);
    return jsonResponse(200, { success: true, token });
  } catch {
    return jsonResponse(500, { error: "خطأ أثناء محاولة تسجيل الدخول." });
  }
};