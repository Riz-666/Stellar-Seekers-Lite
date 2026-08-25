const loginForm = document.getElementById('loginForm');
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const alertBox = document.getElementById('alertBox');
const exportXlsxBtn = document.getElementById('exportXlsxBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');

let adminPassword = '';

function showAlert(type, message) {
  const bsType = type === 'error' ? 'danger' : type;
  alertBox.innerHTML = `<div class="alert alert-${bsType} fade show" role="alert">${message}</div>`;
}

// --- LOGIN LOGIC ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = loginForm.password.value;
  
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memverifikasi...';
  
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=verifyAdmin&password=${encodeURIComponent(pwd)}`);
    const result = await res.json();
    
    if (result.success) {
      adminPassword = pwd;
      loginView.style.display = 'none';
      dashboardView.style.display = 'block';
      alertBox.innerHTML = '';
    } else {
      showAlert('error', '❌ Password salah! Silakan coba lagi.');
      loginForm.password.value = '';
    }
  } catch (err) {
    showAlert('error', '❌ Koneksi ke server gagal.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Masuk';
  }
});

// --- LOGOUT LOGIC ---
logoutBtn.addEventListener('click', () => {
  adminPassword = '';
  loginForm.reset();
  loginView.style.display = 'block';
  dashboardView.style.display = 'none';
  alertBox.innerHTML = '';
});

// --- DATA FETCHING ---
async function fetchAllData() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=export&password=${encodeURIComponent(adminPassword)}`);
    const result = await res.json();
    
    if (!result.success) {
      showAlert('error', '❌ ' + (result.message || 'Gagal mengambil data'));
      return null;
    }
    return result.data || [];
  } catch (err) {
    showAlert('error', '❌ Koneksi ke server gagal.');
    return null;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID');
  } catch {
    return dateStr;
  }
}

// --- EXPORT XLSX ---
exportXlsxBtn.addEventListener('click', async () => {
  const originalText = exportXlsxBtn.innerHTML;
  exportXlsxBtn.disabled = true;
  exportXlsxBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sedang menyiapkan Excel...';

  const data = await fetchAllData();
  
  if (!data || data.length === 0) {
    exportXlsxBtn.disabled = false;
    exportXlsxBtn.innerHTML = originalText;
    return;
  }
  
  const rows = data.map(m => ({
    'ID': m.id,
    'Nickname': m.nickname,
    'Main Job': m.mainJob,
    'Buff Land': m.buffLand || '',
    'Kode Land': m.kodeLand || '',
    'WhatsApp': `'${m.whatsapp}`, // Trik agar angka 0 di depan tidak hilang di Excel
    'Status': m.status,
    'Alasan Nonaktif': m.alasanNonaktif || '',
    'Tanggal Bergabung': formatDate(m.tanggal)
  }));
  
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Members');
  
  const colWidths = Object.keys(rows[0]).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length)) + 2
  }));
  ws['!cols'] = colWidths;
  
  const filename = `StellarSeekers_Members_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  
  exportXlsxBtn.disabled = false;
  exportXlsxBtn.innerHTML = originalText;
});

// --- EXPORT CSV ---
exportCsvBtn.addEventListener('click', async () => {
  const originalText = exportCsvBtn.innerHTML;
  exportCsvBtn.disabled = true;
  exportCsvBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sedang menyiapkan CSV...';

  const data = await fetchAllData();
  
  if (!data || data.length === 0) {
    exportCsvBtn.disabled = false;
    exportCsvBtn.innerHTML = originalText;
    return;
  }
  
  const headers = ['ID', 'Nickname', 'Main Job', 'Buff Land', 'Kode Land', 'WhatsApp', 'Status', 'Alasan Nonaktif', 'Tanggal Bergabung'];
  const rows = data.map(m => [
    m.id, m.nickname, m.mainJob, m.buffLand || '', m.kodeLand || '',
    `'${m.whatsapp}`, m.status, m.alasanNonaktif || '', formatDate(m.tanggal)
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `StellarSeekers_Members_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  exportCsvBtn.disabled = false;
  exportCsvBtn.innerHTML = originalText;
});