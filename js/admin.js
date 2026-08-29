document.addEventListener("DOMContentLoaded", () => {
  const tokenKey = "ask_wall_auth_token";
  let token = sessionStorage.getItem(tokenKey);

  const loginScreen = document.getElementById("loginScreen");
  const adminDashboard = document.getElementById("adminDashboard");
  const loginForm = document.getElementById("loginForm");
  const passwordInput = document.getElementById("passwordInput");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  const statPending = document.getElementById("statPending");
  const statPublished = document.getElementById("statPublished");
  const statTotal = document.getElementById("statTotal");
  const countPending = document.getElementById("countPending");
  const countPublished = document.getElementById("countPublished");

  const tabButtons = document.querySelectorAll(".tab-button");
  const pendingSection = document.getElementById("pendingSection");
  const publishedSection = document.getElementById("publishedSection");
  const pendingMessages = document.getElementById("pendingMessages");
  const publishedMessages = document.getElementById("publishedMessages");

  if (token) {
    showDashboard();
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.style.display = "none";
    const password = passwordInput.value.trim();
    if (!password) return;

    loginBtn.disabled = true;

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "رمز المرور غير صحيح");

      token = data.token;
      sessionStorage.setItem(tokenKey, token);
      showDashboard();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = "block";
    } finally {
      loginBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(tokenKey);
    token = null;
    adminDashboard.classList.add("hidden");
    loginScreen.classList.remove("hidden");
    passwordInput.value = "";
  });

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      if (btn.dataset.tab === "pending") {
        pendingSection.classList.remove("hidden");
        publishedSection.classList.add("hidden");
      } else {
        pendingSection.classList.add("hidden");
        publishedSection.classList.remove("hidden");
      }
    });
  });

  function showDashboard() {
    loginScreen.classList.add("hidden");
    adminDashboard.classList.remove("hidden");
    fetchData();
  }

  async function fetchData() {
    try {
      const res = await fetch("/api/admin-messages", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.status === 401) {
        logoutBtn.click();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      statPending.textContent = data.stats.pending;
      statPublished.textContent = data.stats.published;
      statTotal.textContent = data.stats.total;
      countPending.textContent = data.stats.pending;
      countPublished.textContent = data.stats.published;

      renderPending(data.pending || []);
      renderPublished(data.published || []);
    } catch (err) {
      console.error(err);
    }
  }

  function renderPending(items) {
    if (items.length === 0) {
      pendingMessages.innerHTML = `
        <div class="admin-empty">
          <div>✓</div>
          <h3>لا توجد رسائل معلقة</h3>
          <p>تمت مراجعة والرد على كافة الرسائل الواردة.</p>
        </div>
      `;
      return;
    }

    pendingMessages.innerHTML = items.map(item => `
      <div class="admin-message" id="msg-${item.id}">
        <div class="admin-date">${formatDate(item.created_at)}</div>
        <div class="admin-question">${item.message}</div>
        <textarea id="reply-${item.id}" class="reply-input" placeholder="اكتب ردك هنا..."></textarea>
        <div class="admin-buttons">
          <button class="publish-btn" onclick="window.publishMessage('${item.id}')">نشر السؤال مع الرد</button>
          <button class="delete-btn" onclick="window.deleteMessage('${item.id}')">حذف</button>
        </div>
      </div>
    `).join("");
  }

  function renderPublished(items) {
    if (items.length === 0) {
      publishedMessages.innerHTML = `
        <div class="admin-empty">
          <div>💬</div>
          <h3>لا توجد رسائل منشورة</h3>
          <p>الرسائل المنشورة ستظهر هنا لتتمكن من تعديل الردود أو حذفها.</p>
        </div>
      `;
      return;
    }

    publishedMessages.innerHTML = items.map(item => `
      <div class="admin-message" id="msg-${item.id}">
        <div class="admin-date">${formatDate(item.created_at)}</div>
        <div class="admin-question">${item.message}</div>
        <textarea id="edit-reply-${item.id}" class="reply-input">${item.reply}</textarea>
        <div class="admin-buttons">
          <button class="update-btn" onclick="window.updateReply('${item.id}')">حفظ التعديل</button>
          <button class="delete-btn" onclick="window.deleteMessage('${item.id}')">حذف نهائي</button>
        </div>
      </div>
    `).join("");
  }

  window.publishMessage = async (id) => {
    const input = document.getElementById(`reply-${id}`);
    const reply = input.value.trim();
    if (!reply) {
      alert("يرجى كتابة نص الرد قبل النشر.");
      return;
    }

    try {
      const res = await fetch("/api/publish-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id, reply })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  window.updateReply = async (id) => {
    const input = document.getElementById(`edit-reply-${id}`);
    const reply = input.value.trim();
    if (!reply) {
      alert("الرد لا يمكن أن يكون فارغاً.");
      return;
    }

    try {
      const res = await fetch("/api/update-reply", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id, reply })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("تم حفظ التعديل بنجاح");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  window.deleteMessage = async (id) => {
    if (!confirm("هل تريد حذف هذه الرسالة نهائياً؟")) return;

    try {
      const res = await fetch("/api/delete-message", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  function formatDate(isoDate) {
    try {
      const d = new Date(isoDate);
      return d.toLocaleString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }
});