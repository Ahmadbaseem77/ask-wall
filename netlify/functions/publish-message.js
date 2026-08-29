const { getMessagesStore, jsonResponse, sanitizeText } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });

  try {
    const body = JSON.parse(event.body || "{}");
    const { id, reply, is_published } = body;

    if (!id) {
      return jsonResponse(400, { error: "معرف الرسالة مطلوب" });
    }

    const store = getMessagesStore();
    const messageRecord = await store.get(id, { type: "json" });

    if (!messageRecord) {
      return jsonResponse(404, { error: "الرسالة غير موجودة" });
    }

    if (reply !== undefined) {
      messageRecord.reply = sanitizeText ? sanitizeText(reply.trim()) : reply.trim();
      messageRecord.replied_at = new Date().toISOString();
    }

    messageRecord.is_published = is_published !== undefined ? is_published : true;

    await store.setJSON(id, messageRecord);

    return jsonResponse(200, {
      success: true,
      message: "تم نشر الرد بنجاح",
      data: messageRecord
    });
  } catch (err) {
    console.error("PUBLISH_ERROR:", err);
    return jsonResponse(500, { error: "تعذر تحديث الرسالة", details: err.message });
  }
};
