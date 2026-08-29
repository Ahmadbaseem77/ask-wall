const { getMessagesStore, jsonResponse } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});
  if (event.httpMethod !== "GET") return jsonResponse(405, { error: "Method Not Allowed" });

  try {
    const store = getMessagesStore();
    const { blobs } = await store.list({ prefix: "msg_" });

    const messages = [];
    for (const item of blobs) {
      const record = await store.get(item.key, { type: "json" });
      if (record && record.is_published === true) {
        messages.push({
          id: record.id,
          message: record.message,
          reply: record.reply,
          created_at: record.created_at
        });
      }
    }

    messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return jsonResponse(200, { messages });
  } catch {
    return jsonResponse(500, { error: "تعذر جلب الرسائل" });
  }
};