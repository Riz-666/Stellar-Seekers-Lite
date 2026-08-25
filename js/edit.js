const form = document.getElementById('editForm');
const alertBox = document.getElementById('alertBox');
const submitBtn = document.getElementById('submitBtn');
const loadingState = document.getElementById('loadingState');
const statusSelect = form.querySelector('[name="status"]');
const alasanGroup = document.getElementById('alasanGroup');

const params = new URLSearchParams(window.location.search);
const memberId = params.get('id');

function showAlert(type, message) {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

statusSelect.addEventListener('change', () => {
  alasanGroup.style.display = statusSelect.value === 'nonaktif' ? 'block' : 'none';
});

async function loadMember() {
  if (!memberId) {
    loadingState.innerHTML = `<div class="alert alert-error">❌ Link tidak valid. ID member tidak ditemukan.</div>`;
    return;
  }
  
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=get&id=${encodeURIComponent(memberId)}`);
    const result = await res.json();
    
    if (!result.success) {
      loadingState.innerHTML = `<div class="alert alert-error">❌ ${result.message || 'Data tidak ditemukan'}</div>`;
      return;
    }
    
    const m = result.data;
    document.getElementById('memberId').value = m.id;
    form.nickname.value = m.nickname || '';
    form.mainJob.value = m.mainJob || '';
    form.buffLand.value = m.buffLand || '';
    form.kodeLand.value = m.kodeLand || '';
    form.whatsapp.value = m.whatsapp || '';
    form.status.value = m.status || 'aktif';
    form.alasanNonaktif.value = m.alasanNonaktif || '';
    alasanGroup.style.display = m.status === 'nonaktif' ? 'block' : 'none';
    
    loadingState.style.display = 'none';
    form.style.display = 'block';
  } catch (err) {
    loadingState.innerHTML = `<div class="alert alert-error">❌ Gagal memuat data</div>`;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loader"></span> Menyimpan...';
  
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  try {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'update', ...data }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    const result = await res.json();
    
    if (result.success) {
      showAlert('success', '✅ Data berhasil diupdate!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showAlert('error', `❌ ${result.message || 'Gagal update'}`);
    }
  } catch (err) {
    showAlert('error', '❌ Koneksi gagal.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Simpan Perubahan';
  }
});

loadMember();