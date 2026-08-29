const { getMessagesStore, jsonResponse } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});

  try {
    const store = getMessagesStore();
    const listResult = await store.list();
    const blobs = (listResult && listResult.blobs) ? listResult.blobs : [];

    let messages = [];
    if (blobs.length > 0) {
      const fetched = await Promise.all(
        blobs.map(async (item) => {
          try {
            return await store.get(item.key, { type: "json" });
          } catch {
            return null;
          }
        })
      );
      messages = fetched.filter((msg) => msg !== null && msg.id);
    }

    // ترتيب الرسائل من الأحدث للأقدم
    messages.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // تقسيم الرسائل لتشغيل العدادات في لوحة التحكم
    const pendingMessages = messages.filter(m => !m.is_published);
    const publishedMessages = messages.filter(m => m.is_published);

    return jsonResponse(200, {
      success: true,
      messages: messages,
      stats: {
        total: messages.length,
        pending: pendingMessages.length,
        published: publishedMessages.length
      },
      pending: pendingMessages,
      published: publishedMessages
    });

  } catch (err) {
    console.error("ADMIN_MESSAGES_ERROR:", err);
    return jsonResponse(500, { 
      error: "حدث خطأ في جلب الرسائل", 
      details: err.message 
    });
  }
};
