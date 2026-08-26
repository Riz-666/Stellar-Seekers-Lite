let allMonsters = [];

// Tunggu data dari sheets.js siap
document.addEventListener('sheetsdataready', function(e) {
  if (e.detail.page === 'monsters') {
    allMonsters = e.detail.data;
    renderMonsters(allMonsters);
    console.log("Data monster berhasil dimuat:", allMonsters.length, "monster.");
  }
});

// Trigger load data HANYA dari sheet 'Monsters' (bukan 'Mob')
if (window.ToramSheets) {
  window.ToramSheets.load('monsters', 'monsterGrid');
}

function renderMonsters(monsters) {
  const grid = document.getElementById('monsterGrid');
  const emptyState = document.getElementById('emptyState');
  
  // Ambil nilai filter
  const search = document.getElementById('searchInput').value.toLowerCase();
  const element = document.getElementById('filterElement').value;
  const type = document.getElementById('filterType').value;

  // Filter data (Case-insensitive untuk key object)
  const filtered = monsters.filter(m => {
    const name = (m['Name'] || m['name'] || '').toLowerCase();
    const map = (m['Map'] || m['map'] || '').toLowerCase();
    const drops = (m['Drops'] || m['drops'] || '').toLowerCase();
    const elem = (m['Element'] || m['element'] || 'Neutral').trim();
    const mType = (m['Type'] || m['type'] || 'Mob').trim();

    const matchSearch = !search || name.includes(search) || map.includes(search) || drops.includes(search);
    const matchElement = element === 'all' || elem.toLowerCase() === element.toLowerCase();
    const matchType = type === 'all' || mType.toLowerCase().includes(type.toLowerCase());

    return matchSearch && matchElement && matchType;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('d-none');
    return;
  }
  emptyState.classList.add('d-none');

  // Render kartu monster
  filtered.forEach(m => {
    const name = m['Name'] || m['name'] || 'Unknown';
    const level = m['Level'] || m['level'] || '?';
    const elem = m['Element'] || m['element'] || 'Neutral';
    const map = m['Map'] || m['map'] || 'Unknown Map';
    const hp = m['HP'] || m['hp'] || '?';
    const dropsRaw = m['Drops'] || m['drops'] || '';
    const imgUrl = m['ImageURL'] || m['imageURL'] || '';
    const mType = m['Type'] || m['type'] || 'Boss';

    // Pisahkan drops berdasarkan koma, ambil 3 pertama
    const dropList = dropsRaw.split(',').map(d => d.trim()).filter(d => d.length > 0).slice(0, 3);
    const dropBadges = dropList.map(d => `<span class="badge bg-light text-dark border me-1 mb-1" style="font-size: 0.75rem;">${d}</span>`).join('');
    const moreDrops = dropList.length < dropsRaw.split(',').length ? `<span class="badge bg-secondary" style="font-size: 0.75rem;">+${dropsRaw.split(',').length - 3}</span>` : '';

    // Warna badge elemen
    let elemClass = 'bg-secondary';
    const elemLower = elem.toLowerCase();
    if (elemLower === 'fire') elemClass = 'bg-danger';
    else if (elemLower === 'water') elemClass = 'bg-primary';
    else if (elemLower === 'wind') elemClass = 'bg-success';
    else if (elemLower === 'earth') elemClass = 'bg-warning text-dark';
    else if (elemLower === 'light') elemClass = 'bg-light text-dark border';
    else if (elemLower === 'dark') elemClass = 'bg-dark text-white';

    // Render Gambar menggunakan helper dari sheets.js (akan fallback ke icon default jika ImageURL kosong)
    const imageHTML = window.ToramSheets 
      ? window.ToramSheets.iconHTML(imgUrl, '', mType, name, 'cover') 
      : `<img src="https://via.placeholder.com/150x150/1e3a8a/ffffff?text=Monster" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" />`;

    // Escape nama untuk onclick event
    const safeName = name.replace(/'/g, "\\'");

    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3 fade-in-up';
    col.innerHTML = `
      <div class="form-card h-100 p-3 d-flex flex-column" style="transition: transform 0.2s, box-shadow 0.2s;">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="fw-bold mb-0 text-truncate" style="color: var(--blue-dark); max-width: 70%;" title="${name}">${name}</h6>
          <span class="badge ${elemClass} rounded-pill">Lv. ${level}</span>
        </div>
        
        <!-- AREA GAMBAR -->
        <div class="text-center mb-3" style="height: 120px; background: #f8fafc; border-radius: 8px; overflow: hidden;">
          ${imageHTML}
        </div>
        
        <div class="small text-muted mb-2">
          <i class="bi bi-geo-alt-fill"></i> ${map}
        </div>
        
        <div class="small fw-semibold mb-2" style="color: var(--gray-700);">
          <i class="bi bi-heart-pulse"></i> HP: ${hp}
        </div>

        <div class="border-top pt-2 mt-auto">
          <div class="small text-muted mb-1">Drop:</div>
          <div class="mb-3">
            ${dropBadges}
            ${moreDrops}
          </div>
          
          <!-- TOMBOL LIHAT DETAIL -->
          <button class="btn btn-primary-custom w-100 btn-sm" onclick="window.MonsterModal.open('${safeName}', null, 'info', null)">
            <i class="bi bi-eye"></i> Lihat Detail
          </button>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
}

// Event Listeners untuk filter real-time
document.getElementById('searchInput').addEventListener('input', () => renderMonsters(allMonsters));
document.getElementById('filterElement').addEventListener('change', () => renderMonsters(allMonsters));
document.getElementById('filterType').addEventListener('change', () => renderMonsters(allMonsters));