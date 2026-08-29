const { getMessagesStore, verifyAdmin, jsonResponse } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});
  if (!verifyAdmin(event)) return jsonResponse(401, { error: "غير مصرح لك بالوصول" });

  try {
    const store = getMessagesStore();
    const { blobs } = await store.list({ prefix: "msg_" });

    const pending = [];
    const published = [];

    for (const item of blobs) {
      const record = await store.get(item.key, { type: "json" });
      if (!record) continue;

      if (record.is_published) {
        published.push(record);
      } else {
        pending.push(record);
      }
    }

    pending.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    published.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return jsonResponse(200, {
      stats: {
        pending: pending.length,
        published: published.length,
        total: pending.length + published.length
      },
      pending,
      published
    });
  } catch {
    return jsonResponse(500, { error: "تعذر تحميل البيانات" });
  }
};