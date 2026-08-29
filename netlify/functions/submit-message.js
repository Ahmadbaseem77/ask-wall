const {
  getMessagesStore,
  getRateLimitStore,
  sanitizeText,
  getClientIp,
  jsonResponse
} = require("./_utils");
const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(200, {});
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method Not Allowed" });

  try {
    const data = JSON.parse(event.body || "{}");

    if (data.nickname) {
      return jsonResponse(200, { success: true });
    }

    const rawMsg = data.message;
    if (!rawMsg || typeof rawMsg !== "string") {
      return jsonResponse(400, { error: "الرسالة مطلوبة" });
    }

    const trimmed = rawMsg.trim();
    if (trimmed.length < 2) {
      return jsonResponse(400, { error: "الرسالة قصيرة جداً" });
    }
    if (trimmed.length > 500) {
      return jsonResponse(400, { error: "تجاوزت الحد الأقصى (500 حرف)" });
    }

    const ip = getClientIp(event);
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
    const rateStore = getRateLimitStore();
    const rateKey = `rate_${ipHash}`;
    
    const now = Date.now();
    let rateData = await rateStore.get(rateKey, { type: "json" });
    if (!rateData || !Array.isArray(rateData.timestamps)) {
      rateData = { timestamps: [] };
    }

    const fiveMinutes = 5 * 60 * 1000;
    rateData.timestamps = rateData.timestamps.filter(ts => now - ts < fiveMinutes);

    if (rateData.timestamps.length >= 3) {
      return jsonResponse(429, {
        error: "لقد أرسلت عدة رسائل في وقت قصير. يرجى الانتظار بضع دقائق."
      });
    }

    rateData.timestamps.push(now);
    await rateStore.setJSON(rateKey, rateData);

    const store = getMessagesStore();
    const id = `msg_${now}_${crypto.randomBytes(3).toString("hex")}`;
    
    const messageRecord = {
      id,
      message: sanitizeText(trimmed),
      reply: "",
      is_published: false,
      created_at: new Date().toISOString()
    };

    await store.setJSON(id, messageRecord);

    return jsonResponse(201, {
      success: true,
      message: "تم استلام رسالتك وستتم مراجعتها قبل ظهورها على الحائط."
    });
  } catch {
    return jsonResponse(500, { error: "تعذر إرسال الرسالة، يرجى المحاولة لاحقاً." });
  }
};