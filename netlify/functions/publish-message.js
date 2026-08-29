const { getMessagesStore, sanitizeText, verifyAdmin, jsonResponse } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});
  if (!verifyAdmin(event)) return jsonResponse(401, { error: "غير مصرح لك بالوصول" });
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });

  try {
    const { id, reply } = JSON.parse(event.body || "{}");
    if (!id || !reply || typeof reply !== "string" || !reply.trim()) {
      return jsonResponse(400, { error: "يرجى كتابة الرد قبل النشر." });
    }

    const store = getMessagesStore();
    const record = await store.get(id, { type: "json" });
    if (!record) return jsonResponse(404, { error: "الرسالة غير موجودة" });

    record.reply = sanitizeText(reply.trim());
    record.is_published = true;
    record.updated_at = new Date().toISOString();

    await store.setJSON(id, record);
    return jsonResponse(200, { success: true, message: "تم النشر بنجاح" });
  } catch {
    return jsonResponse(500, { error: "فشل نشر الرسالة" });
  }
};