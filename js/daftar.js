const form = document.getElementById('daftarForm');
const alertBox = document.getElementById('alertBox');
const submitBtn = document.getElementById('submitBtn');
const statusSelect = form.querySelector('[name="status"]');
const alasanGroup = document.getElementById('alasanGroup');

// Toggle alasan field
statusSelect.addEventListener('change', () => {
  alasanGroup.style.display = statusSelect.value === 'nonaktif' ? 'block' : 'none';
});

function showAlert(type, message) {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loader"></span> Memproses...';
  
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  try {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'register', ...data }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    const result = await res.json();
    
    if (result.success) {
      // 🔥 TRIK AMPUH: Ambil base URL direktori saat ini secara otomatis
      // Ini bakal otomatis nambahin nama repository kalau di GitHub Pages
      const baseUrl = new URL('.', window.location.href).href;
      const editLink = `${baseUrl}edit.html?id=${result.memberId}`;
      
      showAlert('success', `✅ Pendaftaran berhasil! Simpan link pribadi lo buat update data nanti:<br><br><strong style="word-break:break-all; color: var(--blue-dark);">${editLink}</strong>`);
      
      form.reset();
      alasanGroup.style.display = 'none';
    } else {
      showAlert('error', `❌ ${result.message || 'Gagal mendaftar'}`);
    }
  } catch (err) {
    showAlert('error', '❌ Koneksi gagal. Coba lagi.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Daftar Sekarang';
  }
});