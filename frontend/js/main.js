/* AYUSHI — main.js */

// Sidebar toggle (mobile)
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// Close sidebar on outside click (mobile)
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.querySelector('.sidebar-toggle');
  if (sidebar && !sidebar.contains(e.target) && toggle && !toggle.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// ── API helper ────────────────────────────────────────────────────────────────
const API = {
  token: () => document.cookie.match(/ayushi_token=([^;]+)/)?.[1] || '',

  async request(method, url, data) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };
    if (data) opts.body = JSON.stringify(data);
    const res = await fetch(url, opts);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  },

  get:    (url)       => API.request('GET', url),
  post:   (url, data) => API.request('POST', url, data),
  put:    (url, data) => API.request('PUT', url, data),
  delete: (url)       => API.request('DELETE', url),
  patch:  (url, data) => API.request('PATCH', url, data),
};

// ── Toast notifications ────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bg = type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#4a7c59';
  toast.style.cssText = `background:${bg};color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;box-shadow:0 4px 16px rgba(0,0,0,0.2);max-width:340px;`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────
function confirmAction(msg, callback) {
  if (window.confirm(msg)) callback();
}

// ── Status badge helper ────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    'Ongoing': 'badge-ongoing', 'Improved': 'badge-improved',
    'Cured': 'badge-cured', 'Left Treatment': 'badge-left',
  };
  return `<span class="status-badge ${map[status]||''}">${status||'—'}</span>`;
}

// ── Efficacy color ─────────────────────────────────────────────────────────────
function efficacyColor(score) {
  if (!score && score !== 0) return '#95a5a6';
  if (score >= 75) return '#27ae60';
  if (score >= 50) return '#f39c12';
  return '#e74c3c';
}

// ── Progress bar helper ────────────────────────────────────────────────────────
function progressBar(pct) {
  return `<div style="display:flex;align-items:center;gap:6px;">
    <div style="width:56px;background:#e0e0e0;border-radius:4px;height:6px;">
      <div style="width:${pct||0}%;background:#4a7c59;border-radius:4px;height:100%;"></div>
    </div>
    <span style="font-size:12px;">${pct||0}%</span>
  </div>`;
}

// ── Render markdown (AI reports) ───────────────────────────────────────────────
function renderMarkdown(text, containerId) {
  const el = document.getElementById(containerId);
  if (el && typeof marked !== 'undefined') {
    el.innerHTML = marked.parse(text || '');
    el.classList.add('ai-report-body');
  }
}

// ── Chart defaults ─────────────────────────────────────────────────────────────
if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = 'Inter, sans-serif';
  Chart.defaults.font.size   = 12;
  Chart.defaults.color       = '#6c757d';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
}

// ── AJAX form submit with loading state ───────────────────────────────────────
function ajaxForm(formId, url, method, onSuccess) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    const orig = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving…'; }
    try {
      const data = Object.fromEntries(new FormData(form));
      const result = await API[method.toLowerCase()](url, data);
      showToast(result.message || 'Saved successfully!');
      if (onSuccess) onSuccess(result);
    } catch (err) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = orig; }
    }
  });
}

// ── Modal helpers ──────────────────────────────────────────────────────────────
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) new bootstrap.Modal(modal).show();
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) bootstrap.Modal.getInstance(modal)?.hide();
}

// ── Delete with confirmation ────────────────────────────────────────────────
async function deleteRecord(url, onSuccess) {
  if (!confirm('Are you sure you want to remove this record?')) return;
  try {
    await API.delete(url);
    showToast('Removed successfully');
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Patient code formatter ─────────────────────────────────────────────────────
function patAvatar(name) {
  const letter = name ? name.charAt(0).toUpperCase() : '?';
  return `<div class="pat-avatar">${letter}</div>`;
}
