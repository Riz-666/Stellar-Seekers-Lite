// ===== LOAD MEMBER =====
const memberGrid = document.getElementById('memberGrid');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
let allMembers = [];

async function loadMembers() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=list`);
    const data = await res.json();
    
    if (data.success) {
      allMembers = data.data || [];
      renderStats();
      renderMembers();
    } else {
      memberGrid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><h4>😕 Gagal memuat data</h4></div>`;
    }
  } catch (err) {
    console.error(err);
    memberGrid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><h4>⚠️ Koneksi ke server gagal. Cek konfigurasi API.</h4></div>`;
  }
}

function renderStats() {
  document.getElementById('totalMember').textContent = allMembers.length;
  document.getElementById('totalAktif').textContent = allMembers.filter(m => m.status === 'aktif').length;
  const jobs = new Set(allMembers.map(m => m.mainJob).filter(Boolean));
  document.getElementById('totalJob').textContent = jobs.size;
}

function renderMembers() {
  const query = searchInput.value.toLowerCase();
  const status = filterStatus.value;
  
  const filtered = allMembers.filter(m => {
    const matchQuery = !query || 
      (m.nickname || '').toLowerCase().includes(query) ||
      (m.mainJob || '').toLowerCase().includes(query);
    const matchStatus = status === 'all' || m.status === status;
    return matchQuery && matchStatus;
  });
  
  if (filtered.length === 0) {
    memberGrid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><h4>🔍 Tidak ada member ditemukan</h4></div>`;
    return;
  }
  
  memberGrid.innerHTML = filtered.map(m => {
    const initial = (m.nickname || '?').charAt(0).toUpperCase();
    const statusClass = m.status === 'aktif' ? 'text-success bg-success-subtle' : 'text-danger bg-danger-subtle';
    const statusText = m.status === 'aktif' ? 'Aktif' : 'Nonaktif';
    
    // Tambahkan badge khusus jika ini akun tuyul
    const tuyulBadge = m.jenisAkun === 'tuyul' 
      ? `<span class="badge bg-secondary ms-2" style="font-size: 0.7rem;"><i class="bi bi-controller"></i> Tuyul</span>` 
      : '';

    return `
      <div class="col-md-6 col-lg-4 fade-in-up">
        <div class="member-card">
          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="member-avatar">${initial}</div>
            <div>
              <h5 class="fw-bold mb-0" style="color: var(--blue-dark);">
                ${escapeHtml(m.nickname)} ${tuyulBadge}
              </h5>
              <small class="text-muted">${escapeHtml(m.mainJob || '-')}</small>
            </div>
          </div>
        <div class="member-card">
          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="member-avatar">${initial}</div>
            <div>
              <h5 class="fw-bold mb-0" style="color: var(--blue-dark);">${escapeHtml(m.nickname)}</h5>
              <small class="text-muted">${escapeHtml(m.mainJob || '-')}</small>
            </div>
          </div>
          <div class="d-flex flex-column gap-2 pt-3 border-top">
            <div class="d-flex justify-content-between">
              <span class="text-muted">Buff Land</span>
              <span class="fw-medium">${escapeHtml(m.buffLand || '-')}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted">Kode Land</span>
              <span class="fw-medium">${escapeHtml(m.kodeLand || '-')}</span>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-muted">Status</span>
              <span class="badge ${statusClass} rounded-pill px-3 py-2">${statusText}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted">Bergabung</span>
              <span class="fw-medium">${formatDate(m.tanggal)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

searchInput?.addEventListener('input', renderMembers);
filterStatus?.addEventListener('change', renderMembers);

loadMembers();