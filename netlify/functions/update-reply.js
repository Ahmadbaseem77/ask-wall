const { getMessagesStore, jsonResponse, sanitizeText } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });

  try {
    const body = JSON.parse(event.body || "{}");
    const { id, reply } = body;

    if (!id) {
      return jsonResponse(400, { error: "معرف الرسالة مطلوب" });
    }

    const store = getMessagesStore();
    const messageRecord = await store.get(id, { type: "json" });

    if (!messageRecord) {
      return jsonResponse(404, { error: "الرسالة غير موجودة" });
    }

    messageRecord.reply = reply ? (sanitizeText ? sanitizeText(reply.trim()) : reply.trim()) : "";
    messageRecord.is_published = true;
    messageRecord.replied_at = new Date().toISOString();

    await store.setJSON(id, messageRecord);

    return jsonResponse(200, {
      success: true,
      message: "تم حفظ الرد بنجاح",
      data: messageRecord
    });
  } catch (err) {
    console.error("UPDATE_REPLY_ERROR:", err);
    return jsonResponse(500, { error: "تعذر حفظ الرد", details: err.message });
  }
};
