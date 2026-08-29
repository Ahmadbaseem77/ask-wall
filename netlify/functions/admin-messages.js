const { getMessagesStore, jsonResponse } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(200, {});
  }

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

    const validMessages = messages
      .filter((msg) => msg !== null && msg.id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return jsonResponse(200, {
      success: true,
      messages: validMessages
    });
  } catch (err) {
    console.error("ADMIN_MESSAGES_ERROR:", err);
    return jsonResponse(200, { 
      messages: [], 
      warning: err.message 
    });
  }
};
