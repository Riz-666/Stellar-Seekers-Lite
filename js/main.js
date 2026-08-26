// ===== LOAD MEMBER =====
const memberGrid = document.getElementById('memberGrid');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
let allMembers = [];

// === PAGINATION STATE ===
let currentPage = 1;
const itemsPerPage = 6;

async function loadMembers() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=list`);
    const data = await res.json();
    
    if (data.success) {
      allMembers = data.data || [];
      renderStats();
      currentPage = 1; // reset ke halaman 1 setiap data baru dimuat
      renderMembers();
    } else {
      memberGrid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><h4>😕 Gagal memuat data</h4></div>`;
      renderPagination(0);
    }
  } catch (err) {
    console.error(err);
    memberGrid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><h4>⚠️ Koneksi ke server gagal. Cek konfigurasi API.</h4></div>`;
    renderPagination(0);
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
    renderPagination(0);
    return;
  }

  // Pastikan currentPage tidak out of range
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  // Ambil potongan data sesuai halaman aktif
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageMembers = filtered.slice(startIndex, startIndex + itemsPerPage);
  
  memberGrid.innerHTML = pageMembers.map(m => {
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

  renderPagination(totalPages);
}

// Render tombol pagination (Prev, nomor halaman, Next)
function renderPagination(totalPages) {
  const pagination = document.getElementById('memberPagination');
  if (!pagination) return;
  pagination.innerHTML = '';

  if (totalPages <= 1) return; // tidak perlu pagination kalau cuma 1 halaman atau kosong

  const createPageItem = (label, page, { disabled = false, active = false } = {}) => {
    const li = document.createElement('li');
    li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label;
    a.addEventListener('click', function(e) {
      e.preventDefault();
      if (disabled || active) return;
      currentPage = page;
      renderMembers();
      memberGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    li.appendChild(a);
    return li;
  };

  // Tombol Previous
  pagination.appendChild(createPageItem('«', currentPage - 1, { disabled: currentPage === 1 }));

  // Nomor halaman (dibatasi maksimal 5 nomor terlihat + ellipsis)
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    pagination.appendChild(createPageItem('1', 1));
    if (startPage > 2) {
      pagination.appendChild(createPageItem('...', currentPage, { disabled: true }));
    }
  }

  for (let p = startPage; p <= endPage; p++) {
    pagination.appendChild(createPageItem(String(p), p, { active: p === currentPage }));
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pagination.appendChild(createPageItem('...', currentPage, { disabled: true }));
    }
    pagination.appendChild(createPageItem(String(totalPages), totalPages));
  }

  // Tombol Next
  pagination.appendChild(createPageItem('»', currentPage + 1, { disabled: currentPage === totalPages }));
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

searchInput?.addEventListener('input', function() {
  currentPage = 1; // reset ke halaman 1 saat search berubah
  renderMembers();
});
filterStatus?.addEventListener('change', function() {
  currentPage = 1; // reset ke halaman 1 saat filter berubah
  renderMembers();
});

loadMembers();