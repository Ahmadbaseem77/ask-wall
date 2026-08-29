const { getMessagesStore, jsonResponse } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});

  try {
    const store = getMessagesStore();
    const listResult = await store.list();
    const blobs = (listResult && listResult.blobs) ? listResult.blobs : [];

    if (blobs.length === 0) {
      return jsonResponse(200, { messages: [] });
    }

    const messages = await Promise.all(
      blobs.map(async (item) => {
        try {
          return await store.get(item.key, { type: "json" });
        } catch {
          return null;
        }
      })
    );

    // جلب الرسائل المنشورة فقط وترتيبها
    const published = messages
      .filter((m) => m && (m.is_published === true || m.is_published === "true"))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return jsonResponse(200, {
      success: true,
      messages: published
    });
  } catch (err) {
    console.error("GET_MESSAGES_ERROR:", err);
    return jsonResponse(200, { messages: [] });
  }
};
