const { getMessagesStore, verifyAdmin, jsonResponse } = require("./_utils");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});
  if (!verifyAdmin(event)) return jsonResponse(401, { error: "غير مصرح لك بالوصول" });
  if (event.httpMethod !== "DELETE") return jsonResponse(405, { error: "Method Not Allowed" });

  try {
    const { id } = JSON.parse(event.body || "{}");
    if (!id) return jsonResponse(400, { error: "معرف الرسالة مطلوب" });

    const store = getMessagesStore();
    await store.delete(id);
    return jsonResponse(200, { success: true, message: "تم الحذف بنجاح" });
  } catch {
    return jsonResponse(500, { error: "فشل حذف الرسالة" });
  }
};