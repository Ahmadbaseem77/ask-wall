document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("askForm");
  const messageInput = document.getElementById("messageInput");
  const charCount = document.getElementById("charCount");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const alertSuccess = document.getElementById("alertSuccess");
  const alertError = document.getElementById("alertError");
  const wallMessages = document.getElementById("wallMessages");
  const publishedCount = document.getElementById("publishedCount");
  const honeypot = document.getElementById("honeypot");

  messageInput.addEventListener("input", () => {
    charCount.textContent = messageInput.value.length;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlerts();

    const msg = messageInput.value.trim();
    if (!msg) return;

    setLoading(true);

    try {
      const res = await fetch("/api/submit-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          nickname: honeypot.value
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ، حاول مرة أخرى.");

      alertSuccess.style.display = "flex";
      messageInput.value = "";
      charCount.textContent = "0";
    } catch (err) {
      alertError.textContent = err.message;
      alertError.style.display = "block";
    } finally {
      setLoading(false);
    }
  });

  async function loadPublishedWall() {
    try {
      const res = await fetch("/api/get-messages");
      const data = await res.json();
      const list = data.messages || [];

      publishedCount.textContent = `${list.length} رسالة منشورة`;

      if (list.length === 0) {
        wallMessages.innerHTML = `
          <div class="empty-wall">
            <div class="empty-icon">💬</div>
            <h3>لا توجد رسائل منشورة بعد</h3>
            <p>كن أول من يطرح سؤالاً على الحائط!</p>
          </div>
        `;
        return;
      }

      wallMessages.innerHTML = list.map(item => `
        <article class="message-card">
          <div class="message-content">
            <div class="message-top">
              <span class="anonymous">👤 مجهول</span>
              <time class="date">${formatDate(item.created_at)}</time>
            </div>
            <div class="question-text">${item.message}</div>
          </div>
          <div class="reply">
            <div class="reply-label">رد مالك الحائط</div>
            <div class="reply-text">${item.reply}</div>
          </div>
        </article>
      `).join("");
    } catch {
      wallMessages.innerHTML = `
        <div class="empty-wall">
          <div class="empty-icon">⚠️</div>
          <h3>تعذر تحميل الرسائل</h3>
          <p>يرجى إعادة تحميل الصفحة لاحقاً.</p>
        </div>
      `;
    }
  }

  function formatDate(isoDate) {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return "";
    }
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.textContent = isLoading ? "جاري الإرسال..." : "إرسال الرسالة";
  }

  function hideAlerts() {
    alertSuccess.style.display = "none";
    alertError.style.display = "none";
  }

  loadPublishedWall();
});