// js/monsters.js - Hybrid Monster System (Sheets Boss + Coryn API Mini Boss/Mob)
document.addEventListener('DOMContentLoaded', function () {
  const CORYN_API_URL = 'https://coryn.club/api/v1/monsters.php?limit=100'; // 100 adalah cap maksimal server per request, sisanya di-loop pakai offset
  const CORYN_DETAIL_URL = 'https://coryn.club/api/v1/monsters.php'; // dipakai dengan ?id=X untuk ambil detail lengkap (termasuk drops)
  const MONSTERS_CACHE_KEY = 'coryn_all_monsters_v1';       // cache list mentah hasil pagination, biar ga fetch ulang tiap buka halaman
  const MONSTERS_CACHE_TIME_KEY = 'coryn_all_monsters_time_v1';
  const MONSTERS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 jam, sama kayak cache item di toram-api.js
  const DIFF_ORDER = { 'Easy': 1, 'Normal': 2, 'Hard': 3, 'Nightmare': 4, 'Ultimate': 5 };
  const itemsPerPage = 12;
  const ICON_BASE = 'img/icons/';
  const DEFAULT_MONSTER_ICON = ICON_BASE + 'monsters_ico.png'; // foto default utk Mini Boss/Mob dari Coryn

  // Mapping type_label item drop (dari Coryn) -> file ikon di img/icons/.
  // Coryn belum punya dokumentasi resmi utk semua type_id, jadi ini best-effort
  // berdasarkan kata kunci. Kalau ada type_label yang mismatch, tinggal tambah di sini.
  const DROP_ICON_KEYWORDS = [
    ['ore', 'ore_ico.png'],
    ['metal', 'metal_ico.png'],
    ['cloth', 'cloth_ico.png'],
    ['beast', 'beast_ico.png'],
    ['wood', 'wood_ico.png'],
    ['medicine', 'medicine_ico.png'],
    ['mana', 'mana_ico.png'],
    ['material', 'items_ico.png'],
    ['bowgun', 'bwg_ico.png'],
    ['bow', 'bow_ico.png'],
    ['staff', 'stf_ico.png'],
    ['magic device', 'md_ico.png'],
    ['knuckle', 'knu_ico.png'],
    ['katana', 'ktn_ico.png'],
    ['dagger', 'dagger_ico.png'],
    ['halberd', 'hb_ico.png'],
    ['one-handed sword', '1h_ico.png'],
    ['two-handed sword', '2h_ico.png'],
    ['arrow', 'arrow_ico.png'],
    ['shield', 'shield_ico.png'],
    ['additional', 'add_ico.png'],
    ['special', 'special_ico.png'],
    ['armor', 'armor_ico.png'],
    ['weapon', 'equip_ico.png'],
    ['crystal', 'crysta_normal_base.png'],
    ['scroll', 'scroll_ico.png'],
    ['pet', 'pets_ico.png'],
    ['quest', 'quest_ico.png'],
    ['skill', 'skills_ico.png'],
    ['map', 'maps_ico.png']
  ];

  function getDropIcon(typeLabel) {
    const t = (typeLabel || '').toLowerCase().replace(/[\[\]]/g, '').trim();
    for (let i = 0; i < DROP_ICON_KEYWORDS.length; i++) {
      if (t.indexOf(DROP_ICON_KEYWORDS[i][0]) !== -1) {
        return ICON_BASE + DROP_ICON_KEYWORDS[i][1];
      }
    }
    return ICON_BASE + 'items_ico.png'; // fallback generik
  }

  // List/bulk endpoint Coryn (limit+offset) ternyata tidak menyertakan detail lengkap
  // (drops, exp akurat, dst) — sama seperti pola items.php di toram-api.js. Jadi begitu
  // modal dibuka, kita fetch detail penuh per-ID lewat endpoint ?id=X, di-cache di localStorage.
  function fetchMonsterFullDetails(id) {
    const cacheKey = 'coryn_monster_full_' + id;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return Promise.resolve(JSON.parse(cached));
    } catch (e) { /* ignore cache read error */ }

    return fetch(CORYN_DETAIL_URL + '?id=' + id)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json.success && json.data) {
          try { localStorage.setItem(cacheKey, JSON.stringify(json.data)); } catch (e) { /* ignore cache write error */ }
          return json.data;
        }
        return null;
      })
      .catch(function (err) {
        console.error('Gagal ambil detail monster id=' + id + ':', err);
        return null;
      });
  }

  let bossMonsters = [];   // hasil dari Google Sheets (Type = Boss)
  let apiMonsters = [];    // hasil dari Coryn API (Mini Boss & Mob)
  let allMonsters = [];    // gabungan keduanya
  let groupedMonsters = {};
  let currentPage = 1;
  let isLoadingApi = false;
  let monsterModalInstance = null;

  const modalEl = document.getElementById('monsterDetailModal');
  if (modalEl && window.bootstrap) {
    monsterModalInstance = new bootstrap.Modal(modalEl);
  }

  console.log("🔍 [MONSTERS.JS] Script loaded, waiting for sheetsdataready...");

  // 1. Ambil data Boss dari Google Sheets
  document.addEventListener('sheetsdataready', function (e) {
    if (e.detail.page !== 'monsters') return;

    const sheetData = e.detail.data || [];
    bossMonsters = sheetData.filter(function (m) {
      const type = (m['Type'] || m['type'] || '').toLowerCase();
      return type === 'boss';
    });

    console.log("✅ Boss dari Sheets:", bossMonsters.length);
    fetchCorynMonsters();
  });

  if (window.ToramSheets) {
    console.log("🔄 Memulai load dari Google Sheets...");
    window.ToramSheets.load('monsters', 'monstersGrid');
  }

  // 2. Ambil Mini Boss & Mob dari Coryn API.
  //    API Coryn ternyata hard-cap max 100 data per request (walau limit diset gede),
  //    jadi kita loop pakai parameter 'offset' sampai semua data (~3000+) kebaca habis.
  function fetchCorynMonsters() {
    if (isLoadingApi) return;
    isLoadingApi = true;

    // Cek cache dulu — kalau masih fresh (< 24 jam), langsung pakai, ga usah fetch ulang ke API
    try {
      const cached = localStorage.getItem(MONSTERS_CACHE_KEY);
      const ts = parseInt(localStorage.getItem(MONSTERS_CACHE_TIME_KEY) || '0', 10);
      if (cached && (Date.now() - ts) < MONSTERS_CACHE_TTL) {
        const combinedCached = JSON.parse(cached);
        console.log("✅ Data monster dimuat dari Cache (Instan):", combinedCached.length);

        const nonBossCached = combinedCached.filter(function (m) {
          const typeLabel = (m.type_label || '').toLowerCase();
          return typeLabel !== 'boss';
        });
        apiMonsters = nonBossCached.map(transformCorynMonster);
        isLoadingApi = false;
        mergeAndRender();
        return;
      }
    } catch (e) { console.error("Cache monster error:", e); }

    console.log("🚀 Memulai fetch dari API Coryn (dengan pagination)...");

    const PAGE_SIZE = 100;
    const MAX_PAGES = 60; // pengaman: 60 x 100 = 6000, lebih dari cukup utk ~3.479 monster yang ada
    let combined = [];
    let previousFirstId = null;
    let page = 0;

    function fetchOnePage() {
      const offset = page * PAGE_SIZE;
      const url = CORYN_API_URL + '&offset=' + offset;

      return fetch(url)
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then(function (json) {
          if (!json.success || !Array.isArray(json.data)) throw new Error('Invalid API response');

          const data = json.data;
          if (data.length === 0) return false; // sudah habis, gak ada data lagi

          const firstId = data[0] && data[0].id;
          if (page > 0 && firstId === previousFirstId) {
            // Server sepertinya mengabaikan parameter offset (data yang balik sama terus).
            // Hentikan supaya gak infinite-loop / spam request ke server.
            console.warn("⚠️ API Coryn sepertinya tidak mendukung parameter 'offset' — hanya data batch pertama yang berhasil diambil (" + combined.length + " monster).");
            return false;
          }
          previousFirstId = firstId;

          combined = combined.concat(data);
          console.log("📥 Halaman " + (page + 1) + ": +" + data.length + " monster (total sementara: " + combined.length + ")");

          if (data.length < PAGE_SIZE) return false; // ini halaman terakhir
          page++;
          if (page >= MAX_PAGES) {
            console.warn("⚠️ Sudah mencapai batas aman " + MAX_PAGES + " halaman, berhenti fetch.");
            return false;
          }
          return true;
        });
    }

    function loop() {
      return fetchOnePage().then(function (shouldContinue) {
        if (shouldContinue) return loop();
      });
    }

    loop()
      .then(function () {
        console.log("✅ Total monster dari API (semua halaman):", combined.length);

        // Simpan hasil fetch ke cache biar buka halaman berikutnya ga fetch ulang dari nol
        try {
          localStorage.setItem(MONSTERS_CACHE_KEY, JSON.stringify(combined));
          localStorage.setItem(MONSTERS_CACHE_TIME_KEY, Date.now().toString());
        } catch (e) { console.error("Cache monster save error:", e); }

        const nonBoss = combined.filter(function (m) {
          const typeLabel = (m.type_label || '').toLowerCase();
          return typeLabel !== 'boss';
        });

        console.log("✅ Mini Boss & Mob setelah filter:", nonBoss.length);

        apiMonsters = nonBoss.map(transformCorynMonster);
        mergeAndRender();
      })
      .catch(function (err) {
        console.error("❌ Gagal load dari API Coryn:", err);
        apiMonsters = combined.length
          ? combined.filter(function (m) { return (m.type_label || '').toLowerCase() !== 'boss'; }).map(transformCorynMonster)
          : [];
        mergeAndRender();

        const grid = document.getElementById('monstersGrid');
        if (grid) {
          const warn = document.createElement('div');
          warn.className = 'col-12';
          warn.innerHTML = '<div class="alert alert-warning mt-3">⚠️ Gagal memuat sebagian data Mini Boss/Mob dari API Coryn.</div>';
          grid.appendChild(warn);
        }
      })
      .finally(function () {
        isLoadingApi = false;
      });
  }

  // 3. Transform 1 entri Coryn -> skema unified yang menyesuaikan format Sheets.
  //    Semua informasi yang tersedia dari Coryn ikut disimpan (bukan cuma sebagian).
  function transformCorynMonster(m) {
    const drops = Array.isArray(m.drops) ? m.drops : [];
    const dropStr = drops.map(function (d) { return d.name; }).filter(Boolean).join('; ');
    const meta = m.meta || {};

    return {
      // --- Field utama, mengikuti penamaan kolom di Sheets ---
      'Name': m.name || 'Unknown',
      'Level': m.level,
      'Type': m.type_label || 'Mob',
      'Element': m.element_label || 'Neutral',
      'HP': (m.hp === -1 || m.hp === undefined || m.hp === null) ? '?' : m.hp,
      'Location': m.map_name || 'Unknown',
      'Drop': dropStr,
      'Difficulty': m.mode || 'Normal',
      'ImageURL': DEFAULT_MONSTER_ICON, // Coryn tidak menyediakan gambar publik, pakai ikon default

      // --- Field tambahan dari Coryn, disimpan biar datanya lengkap ---
      'ID': m.id,
      'MapID': m.map_id,
      'TypeCode': m.type_code,
      'EXP': (m.exp === -1 || m.exp === undefined || m.exp === null) ? '?' : m.exp,
      'ElementID': m.element_id,
      'Tameable': !!m.tameable,
      'Limited': !!m.limited,
      'Badge': meta.badge || '',
      'Note': meta.note || '',
      'DropsDetail': drops, // array asli {id, name, type_id, type_label}
      'Source': 'coryn'
    };
  }

  // 4. Gabungkan Boss (Sheets) + Mini Boss/Mob (Coryn), lalu kelompokkan & render
  function mergeAndRender() {
    allMonsters = bossMonsters.concat(apiMonsters);
    console.log("📊 Total monster gabungan:", allMonsters.length,
      "(Boss:", bossMonsters.length, "+ Coryn:", apiMonsters.length + ")");

    groupedMonsters = {};
    allMonsters.forEach(function (m) {
      const name = m['Name'] || 'Unknown';
      if (!groupedMonsters[name]) groupedMonsters[name] = [];
      groupedMonsters[name].push(m);
    });

    for (const name in groupedMonsters) {
      groupedMonsters[name].sort(function (a, b) {
        const diffA = (a['Difficulty'] || 'Normal').trim();
        const diffB = (b['Difficulty'] || 'Normal').trim();
        return (DIFF_ORDER[diffA] || 99) - (DIFF_ORDER[diffB] || 99);
      });
    }

    currentPage = 1;
    renderGrid();
  }

  // 5. Render grid (markup & style sama persis seperti sebelumnya)
  function renderGrid() {
    const grid = document.getElementById('monstersGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) {
      console.error("❌ Element monstersGrid TIDAK DITEMUKAN!");
      return;
    }

    const search = (document.getElementById('searchInput') || {}).value;
    const searchLower = (search || '').toLowerCase();
    const filterElem = (document.getElementById('filterElement') || {}).value || 'all';

    grid.innerHTML = '';

    const filteredNames = [];
    for (const name in groupedMonsters) {
      const rep = groupedMonsters[name][0];
      const elem = (rep['Element'] || 'Neutral').toLowerCase();
      const loc = (rep['Location'] || '').toLowerCase();
      const nameLower = name.toLowerCase();

      const matchSearch = !searchLower || nameLower.includes(searchLower) || loc.includes(searchLower);
      const matchElem = filterElem === 'all' || elem === filterElem.toLowerCase();

      if (matchSearch && matchElem) filteredNames.push(name);
    }

    if (filteredNames.length === 0) {
      if (emptyState) emptyState.classList.remove('d-none');
      renderPagination(0);
      return;
    }
    if (emptyState) emptyState.classList.add('d-none');

    const totalPages = Math.max(1, Math.ceil(filteredNames.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageNames = filteredNames.slice(startIndex, startIndex + itemsPerPage);

    pageNames.forEach(function (name) {
      const rep = groupedMonsters[name][0];
      const elem = (rep['Element'] || 'Neutral').toLowerCase();
      const elemClass = 'elem-' + (elem.charAt(0).toUpperCase() + elem.slice(1));
      const imgUrl = rep['ImageURL'] || '';
      const imgHtml = imgUrl
        ? '<img src="' + imgUrl + '" alt="' + name + '" onerror="this.src=\'https://via.placeholder.com/150?text=No+Image\'">'
        : '<span style="font-size: 3rem; opacity: 0.3;">👾</span>';

      const card = document.createElement('div');
      card.className = 'col-md-6 col-lg-4 col-xl-3 fade-in-up';
      card.innerHTML = `
        <div class="monster-card" onclick="openMonsterModal('${name.replace(/'/g, "\\'")}')">
          <div class="monster-img-wrapper">
            ${imgHtml}
          </div>
          <div class="p-3">
            <h6 class="fw-bold mb-2 text-truncate" style="color: var(--blue-dark);" title="${name}">${name}</h6>
            <div class="d-flex flex-wrap gap-1 mb-2">
              <span class="badge bg-secondary">Lv. ${rep['Level'] || '?'}</span>
              <span class="badge ${elemClass}">${rep['Element'] || 'Neutral'}</span>
            </div>
            <small class="text-muted d-block text-truncate"><i class="bi bi-geo-alt-fill"></i> ${rep['Location'] || 'Unknown'}</small>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    renderPagination(totalPages);
    console.log("✅ Render selesai! Menampilkan", pageNames.length, "dari", filteredNames.length, "monster (halaman", currentPage, "/", totalPages, ")");
  }

  // 6. Pagination (sama persis seperti sebelumnya)
  function renderPagination(totalPages) {
    const pagination = document.getElementById('monstersPagination');
    if (!pagination) return;
    pagination.innerHTML = '';
    if (totalPages <= 1) return;

    const createPageItem = function (label, page, opts) {
      opts = opts || {};
      const disabled = !!opts.disabled;
      const active = !!opts.active;
      const li = document.createElement('li');
      li.className = 'page-item ' + (disabled ? 'disabled' : '') + ' ' + (active ? 'active' : '');
      const a = document.createElement('a');
      a.className = 'page-link';
      a.href = '#';
      a.textContent = label;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (disabled || active) return;
        currentPage = page;
        renderGrid();
        document.getElementById('monstersGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      li.appendChild(a);
      return li;
    };

    pagination.appendChild(createPageItem('«', currentPage - 1, { disabled: currentPage === 1 }));

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pagination.appendChild(createPageItem('1', 1));
      if (startPage > 2) pagination.appendChild(createPageItem('...', currentPage, { disabled: true }));
    }

    for (let p = startPage; p <= endPage; p++) {
      pagination.appendChild(createPageItem(String(p), p, { active: p === currentPage }));
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pagination.appendChild(createPageItem('...', currentPage, { disabled: true }));
      pagination.appendChild(createPageItem(String(totalPages), totalPages));
    }

    pagination.appendChild(createPageItem('»', currentPage + 1, { disabled: currentPage === totalPages }));
  }

  // 7. Modal detail, tab per Difficulty/Mode (styling sama persis seperti sebelumnya)

  // Render tab & isi modal dari data group yang sudah (atau belum) lengkap
  function renderModalContent(group) {
    let tabsHtml = '';
    let contentHtml = '';

    group.forEach(function (m, index) {
      const diff = m['Difficulty'] || 'Normal';
      const isActive = index === 0 ? 'active' : '';
      const show = index === 0 ? 'show active' : '';
      // index disertakan biar id tab tidak bentrok kalau ada beberapa entri dengan mode/difficulty sama
      const safeId = diff.replace(/\s+/g, '') + '-' + index;
      const tabId = 'tab-' + safeId;
      const contentId = 'content-' + safeId;

      tabsHtml += `
        <li class="nav-item" role="presentation">
          <button class="nav-link ${isActive}" id="${tabId}" data-bs-toggle="tab" data-bs-target="#${contentId}" type="button" role="tab">
            ${diff}
          </button>
        </li>
      `;

      let dropsHtml;
      if (m['_loadingDrops']) {
        dropsHtml = '<div class="text-center w-100 py-2"><div class="spinner-border spinner-border-sm text-primary" role="status"></div><span class="ms-2 text-muted small">Memuat data drop...</span></div>';
      } else if (Array.isArray(m['DropsDetail']) && m['DropsDetail'].length > 0) {
        // Data dari Coryn: tiap drop punya type_label -> tampilkan dengan ikon sesuai
        dropsHtml = m['DropsDetail'].map(function (d) {
          const icon = getDropIcon(d.type_label);
          return `<span class="badge bg-light text-dark border me-1 mb-1 p-2 d-inline-flex align-items-center gap-1">
                    <img src="${icon}" alt="${d.type_label || ''}" style="width:16px;height:16px;object-fit:contain;" onerror="this.style.display='none';">
                    ${d.name}
                  </span>`;
        }).join('');
      } else {
        // Data dari Sheets: cuma string drop biasa, tanpa info tipe per-item
        const dropsRaw = m['Drop'] || '';
        const dropsArray = dropsRaw.split(/,|;/).map(function (d) { return d.trim(); }).filter(function (d) { return d.length > 0; });
        dropsHtml = dropsArray.length > 0
          ? dropsArray.map(function (d) { return `<span class="badge bg-light text-dark border me-1 mb-1 p-2">${d}</span>`; }).join('')
          : '';
      }
      if (!dropsHtml) dropsHtml = '<span class="text-muted">Tidak ada data drop.</span>';

      const imgUrl = m['ImageURL'] || '';
      const imgHtml = imgUrl
        ? `<img src="${imgUrl}" class="img-fluid rounded" style="max-height: 150px; object-fit: contain; background: white; padding: 10px;" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">`
        : '<span style="font-size: 4rem; opacity: 0.3;">👾</span>';

      const hpVal = m['HP'];
      const hpDisplay = (hpVal === '?' || hpVal === undefined || hpVal === null || hpVal === '') ? '?' : Number(hpVal).toLocaleString();

      contentHtml += `
        <div class="tab-pane fade ${show}" id="${contentId}" role="tabpanel">
          <div class="row g-4">
            <div class="col-md-5 text-center">
              ${imgHtml}
              <div class="d-flex justify-content-center gap-2 mt-3 flex-wrap">
                <span class="badge bg-primary fs-6">Lv. ${m['Level'] || '?'}</span>
                <span class="badge bg-dark fs-6">${m['Element'] || 'Neutral'}</span>
              </div>
            </div>
            <div class="col-md-7">
              <ul class="list-unstyled mb-4">
                <li class="mb-2 d-flex justify-content-between border-bottom pb-2">
                  <span class="text-muted"><i class="bi bi-heart-pulse me-2"></i>HP</span>
                  <span class="fw-bold text-danger">${hpDisplay}</span>
                </li>
                <li class="mb-2 d-flex justify-content-between border-bottom pb-2">
                  <span class="text-muted"><i class="bi bi-geo-alt me-2"></i>Lokasi</span>
                  <span class="fw-bold text-end" style="max-width: 60%;">${m['Location'] || 'Unknown'}</span>
                </li>
                <li class="mb-2 d-flex justify-content-between border-bottom pb-2">
                  <span class="text-muted"><i class="bi bi-shield me-2"></i>Tipe</span>
                  <span class="fw-bold">${m['Type'] || 'Boss'}</span>
                </li>
              </ul>
              <h6 class="fw-bold mb-3"><i class="bi bi-gift me-2"></i>Drop List:</h6>
              <div class="d-flex flex-wrap">
                ${dropsHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    document.getElementById('modalTabs').innerHTML = tabsHtml;
    document.getElementById('modalTabContent').innerHTML = contentHtml;
  }

  window.openMonsterModal = function (monsterName) {
    const group = groupedMonsters[monsterName];
    if (!group || group.length === 0) return;

    document.getElementById('modalMonsterName').textContent = monsterName;

    // Tandai entri dari Coryn yang belum punya drop lengkap, lalu render dulu (dengan spinner drop)
    const needsFetch = [];
    group.forEach(function (m) {
      if (m['Source'] === 'coryn' && m['ID'] && (!Array.isArray(m['DropsDetail']) || m['DropsDetail'].length === 0)) {
        m['_loadingDrops'] = true;
        needsFetch.push(m);
      }
    });

    renderModalContent(group);
    if (monsterModalInstance) monsterModalInstance.show();

    if (needsFetch.length === 0) return;

    // Lazy load detail lengkap (termasuk drops) per-ID, mirip pola fetchItemFullDetails di modal.js
    Promise.all(needsFetch.map(function (m) {
      return fetchMonsterFullDetails(m['ID']).then(function (full) {
        m['_loadingDrops'] = false;
        if (full) {
          const drops = Array.isArray(full.drops) ? full.drops : [];
          m['DropsDetail'] = drops;
          m['Drop'] = drops.map(function (d) { return d.name; }).filter(Boolean).join('; ');
          if (full.hp !== undefined) m['HP'] = (full.hp === -1) ? '?' : full.hp;
          if (full.exp !== undefined) m['EXP'] = (full.exp === -1) ? '?' : full.exp;
          if (full.meta) {
            m['Badge'] = full.meta.badge || m['Badge'];
            m['Note'] = full.meta.note || m['Note'];
          }
        }
      });
    })).then(function () {
      // Re-render hanya kalau modal yang sedang dibuka masih monster yang sama
      if (document.getElementById('modalMonsterName').textContent === monsterName) {
        renderModalContent(group);
      }
    });
  };

  // 8. Event listener untuk search & filter (reset ke halaman 1 setiap berubah)
  const searchInput = document.getElementById('searchInput');
  const filterElement = document.getElementById('filterElement');

  if (searchInput) searchInput.addEventListener('input', function () { currentPage = 1; renderGrid(); });
  if (filterElement) filterElement.addEventListener('change', function () { currentPage = 1; renderGrid(); });
});