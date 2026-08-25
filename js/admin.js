const loginForm = document.getElementById('loginForm');
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const alertBox = document.getElementById('alertBox');
const exportXlsxBtn = document.getElementById('exportXlsxBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const logoutBtn = document.getElementById('logoutBtn');

let adminPassword = '';

function showAlert(type, message) {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = loginForm.password.value;
  
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=verifyAdmin&password=${encodeURIComponent(pwd)}`);
    const result = await res.json();
    
    if (result.success) {
      adminPassword = pwd;
      loginView.style.display = 'none';
      dashboardView.style.display = 'block';
    } else {
      showAlert('error', '❌ Password salah!');
    }
  } catch (err) {
    showAlert('error', '❌ Koneksi gagal.');
  }
});

logoutBtn.addEventListener('click', () => {
  adminPassword = '';
  loginForm.reset();
  loginView.style.display = 'block';
  dashboardView.style.display = 'none';
  alertBox.innerHTML = '';
});

async function fetchAllData() {
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=export&password=${encodeURIComponent(adminPassword)}`);
    const result = await res.json();
    
    if (!result.success) {
      showAlert('error', '❌ ' + (result.message || 'Gagal ambil data'));
      return null;
    }
    return result.data || [];
  } catch (err) {
    showAlert('error', '❌ Koneksi gagal.');
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

// Export XLSX
exportXlsxBtn.addEventListener('click', async () => {
  const data = await fetchAllData();
  if (!data || data.length === 0) return;
  
  const rows = data.map(m => ({
    'ID': m.id,
    'Nickname': m.nickname,
    'Main Job': m.mainJob,
    'Buff Land': m.buffLand || '',
    'Kode Land': m.kodeLand || '',
    'WhatsApp': m.whatsapp,
    'Status': m.status,
    'Alasan Nonaktif': m.alasanNonaktif || '',
    'Tanggal Bergabung': formatDate(m.tanggal)
  }));
  
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Members');
  
  // Auto-width kolom
  const colWidths = Object.keys(rows[0]).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length)) + 2
  }));
  ws['!cols'] = colWidths;
  
  const filename = `member-export-${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, filename);
});

// Export CSV
exportCsvBtn.addEventListener('click', async () => {
  const data = await fetchAllData();
  if (!data || data.length === 0) return;
  
  const headers = ['ID', 'Nickname', 'Main Job', 'Buff Land', 'Kode Land', 'WhatsApp', 'Status', 'Alasan Nonaktif', 'Tanggal Bergabung'];
  const rows = data.map(m => [
    m.id, m.nickname, m.mainJob, m.buffLand || '', m.kodeLand || '',
    m.whatsapp, m.status, m.alasanNonaktif || '', formatDate(m.tanggal)
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `member-export-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});