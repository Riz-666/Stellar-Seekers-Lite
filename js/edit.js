const form = document.getElementById('editForm');
const alertBox = document.getElementById('alertBox');
const submitBtn = document.getElementById('submitBtn');
const loadingState = document.getElementById('loadingState');
const statusSelect = form.querySelector('[name="status"]');
const alasanGroup = document.getElementById('alasanGroup');

// Ambil ID member dari URL
const params = new URLSearchParams(window.location.search);
const memberId = params.get('id');

// Fungsi Alert (Sama persis dengan daftar.js)
function showAlert(type, message) {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

// Toggle alasan field
statusSelect.addEventListener('change', () => {
  alasanGroup.style.display = statusSelect.value === 'nonaktif' ? 'block' : 'none';
});

// Fungsi buat load data member saat halaman dibuka
async function loadMember() {
  if (!memberId) {
    loadingState.innerHTML = `<div class="alert alert-danger">❌ Link tidak valid. ID member tidak ditemukan.</div>`;
    return;
  }
  
  try {
    const res = await fetch(`${CONFIG.API_URL}?action=get&id=${encodeURIComponent(memberId)}`);
    const result = await res.json();
    
    if (!result.success) {
      loadingState.innerHTML = `<div class="alert alert-danger">❌ ${result.message || 'Data tidak ditemukan'}</div>`;
      return;
    }
    
    const m = result.data;
    
    // Isi form dengan data yang ada
    document.getElementById('memberId').value = m.id;
    form.nickname.value = m.nickname || '';
    form.mainJob.value = m.mainJob || '';
    form.buffLand.value = m.buffLand || '';
    form.kodeLand.value = m.kodeLand || '';
    form.whatsapp.value = m.whatsapp || '';
    form.status.value = m.status || 'aktif';
    form.alasanNonaktif.value = m.alasanNonaktif || '';
    
    // Tampilkan field alasan kalau statusnya nonaktif
    alasanGroup.style.display = m.status === 'nonaktif' ? 'block' : 'none';
    
    // Sembunyikan loading, tampilkan form
    loadingState.style.display = 'none';
    form.style.display = 'block';
    
  } catch (err) {
    console.error(err);
    loadingState.innerHTML = `<div class="alert alert-danger">❌ Gagal memuat data. Cek koneksi internet lo.</div>`;
  }
}

// Fungsi Submit Update
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Menyimpan...';
  
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
      showAlert('success', '✅ <strong>Berhasil!</strong> Data member lo udah diupdate.');
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas biar alert kebaca
      
      // Kembalikan tombol ke kondisi semula setelah 2 detik
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Perubahan';
      }, 2000);
    } else {
      showAlert('error', `❌ ${result.message || 'Gagal mengupdate data'}`);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan Perubahan';
    }
  } catch (err) {
    showAlert('error', '❌ Koneksi ke server gagal. Coba lagi nanti.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Simpan Perubahan';
  }
});

// Jalankan fungsi load saat halaman siap
loadMember();