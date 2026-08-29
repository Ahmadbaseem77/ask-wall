const { getMessagesStore, jsonResponse } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });

  try {
    const body = JSON.parse(event.body || "{}");
    const { id } = body;

    if (!id) {
      return jsonResponse(400, { error: "معرف الرسالة مطلوب" });
    }

    const store = getMessagesStore();
    await store.delete(id);

    return jsonResponse(200, {
      success: true,
      message: "تم حذف الرسالة بنجاح"
    });
  } catch (err) {
    console.error("DELETE_ERROR:", err);
    return jsonResponse(500, { error: "تعذر حذف الرسالة", details: err.message });
  }
};
