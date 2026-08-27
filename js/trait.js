// js/trait.js - Halaman Database Trait (data lokal dari json/trait.json)
document.addEventListener('DOMContentLoaded', function () {
  const TRAIT_JSON_URL = 'json/trait.json';
  const itemsPerPage = 24; // trait card lebih kecil (teks doang), jadi bisa lebih banyak per halaman

  let rawData = null;
  let allTraits = [];       // semua trait, sudah dikasih _id unik
  let filteredTraits = [];  // hasil setelah search + filter tier
  let currentPage = 1;

  const grid = document.getElementById('traitsGrid');
  const emptyState = document.getElementById('emptyState');
  const pagination = document.getElementById('traitsPagination');
  const searchInput = document.getElementById('searchInput');
  const filterTier = document.getElementById('filterTier');
  const sourceInfoEl = document.getElementById('traitSourceInfo');

  // 1. Ambil data trait dari file JSON lokal
  fetch(TRAIT_JSON_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      rawData = data;
      const list = Array.isArray(data.traits) ? data.traits : [];
      allTraits = list.map(function (t, idx) {
        return {
          _id: idx,
          name: t.name || 'Unknown Trait',
          tier: (t.tier === undefined || t.tier === null) ? 0 : t.tier,
          description: t.description || 'Tidak ada deskripsi.'
        };
      });

      renderSourceInfo(data.metadata);
      renderRulesInfo(data.rules_and_mechanics);
      applyFilters();
    })
    .catch(function (err) {
      console.error('❌ Gagal memuat json/trait.json:', err);
      if (grid) {
        grid.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-exclamation-triangle fs-1 text-danger"></i><p class="text-muted mt-3">Gagal memuat data trait. Pastikan file json/trait.json tersedia.</p></div>';
      }
      if (sourceInfoEl) sourceInfoEl.textContent = '';

      const rulesBody = document.getElementById('rulesModalBody');
      if (rulesBody) {
        rulesBody.innerHTML = '<p class="text-muted mb-0">Gagal memuat data rules & mechanics.</p>';
      }
    });

  // 2. Tampilkan info sumber data + versi (penting untuk kredit sumber)
  function renderSourceInfo(meta) {
    if (!sourceInfoEl || !meta) return;
    const parts = [];
    if (meta.total_traits) parts.push(meta.total_traits + ' trait');
    if (meta.version) parts.push('v' + meta.version);
    if (meta.source) parts.push('Sumber: ' + meta.source);
    sourceInfoEl.textContent = parts.join(' • ');
  }

  // 2b. Isi modal "Rules & Mechanics" dari data JSON (rules_and_mechanics)
  function renderRulesInfo(rules) {
    const el = document.getElementById('rulesModalBody');
    if (!el) return;

    if (!rules || Object.keys(rules).length === 0) {
      el.innerHTML = '<p class="text-muted mb-0">Tidak ada data rules & mechanics.</p>';
      return;
    }

    const sections = [
      { icon: 'bi-shield-lock', title: 'Batasan Slot Senjata & Zirah', text: rules.item_restriction },
      { icon: 'bi-layers', title: 'Stacking Ability', text: rules.stacking },
      { icon: 'bi-arrow-left-right', title: 'Tingkat Keberhasilan Transfer', text: rules.transfer_rate },
      { icon: 'bi-diagram-3', title: 'Batasan Transfer', text: rules.transfer_restriction },
      { icon: 'bi-exclamation-triangle', title: 'Jika Transfer Gagal', text: rules.transfer_failure }
    ].filter(function (s) { return !!s.text; });

    let html = sections.map(function (s) {
      return `
        <div class="mb-3 pb-3 border-bottom">
          <h6 class="fw-bold d-flex align-items-center gap-2 mb-1" style="color: var(--blue-dark);">
            <i class="bi ${s.icon}"></i> ${escapeHtml(s.title)}
          </h6>
          <p class="mb-0 text-muted" style="font-size: 0.92rem;">${escapeHtml(s.text)}</p>
        </div>
      `;
    }).join('');

    const hit = rules.hit_restrictions;
    if (hit) {
      const hitItems = [
        { title: 'Damage Aktif (menambah stack)', text: hit.active_damage },
        { title: 'Menerima Damage (memicu efek)', text: hit.taking_damage },
        { title: 'Trigger MISS', text: hit.miss_trigger }
      ].filter(function (i) { return !!i.text; });

      if (hitItems.length > 0) {
        html += `
          <div>
            <h6 class="fw-bold d-flex align-items-center gap-2 mb-2" style="color: var(--blue-dark);">
              <i class="bi bi-bullseye"></i> Batasan Trigger Hit
            </h6>
            ${hitItems.map(function (i) {
              return `
                <div class="mb-2 ps-3" style="border-left: 3px solid var(--blue-soft);">
                  <div class="fw-semibold small">${escapeHtml(i.title)}</div>
                  <div class="text-muted small">${escapeHtml(i.text)}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    el.innerHTML = html || '<p class="text-muted mb-0">Tidak ada data rules & mechanics.</p>';
  }

  // 3. Filter berdasarkan search & tier, lalu render ulang grid dari halaman 1
  function applyFilters() {
    const search = (searchInput && searchInput.value ? searchInput.value : '').toLowerCase().trim();
    const tierVal = filterTier ? filterTier.value : 'all';

    filteredTraits = allTraits.filter(function (t) {
      const nameLower = t.name.toLowerCase();
      const descLower = t.description.toLowerCase();
      const matchSearch = !search || nameLower.includes(search) || descLower.includes(search);
      const matchTier = tierVal === 'all' || String(t.tier) === tierVal;
      return matchSearch && matchTier;
    });

    currentPage = 1;
    renderGrid();
  }

  // 4. Render grid kartu trait untuk halaman aktif
  function renderGrid() {
    if (!grid) return;
    grid.innerHTML = '';

    if (filteredTraits.length === 0) {
      if (emptyState) emptyState.classList.remove('d-none');
      renderPagination(0);
      return;
    }
    if (emptyState) emptyState.classList.add('d-none');

    const totalPages = Math.max(1, Math.ceil(filteredTraits.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageItems = filteredTraits.slice(startIndex, startIndex + itemsPerPage);

    pageItems.forEach(function (t) {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-4 fade-in-up';
      col.innerHTML = `
        <div class="trait-card">
          <div class="trait-card-header" onclick="window.toggleTrait(${t._id})">
            <h6 class="fw-bold mb-0" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</h6>
            <div class="d-flex align-items-center gap-2">
              <span class="badge tier-${t.tier}">Tier ${t.tier}</span>
              <i class="bi bi-chevron-down trait-chevron" id="chevron-${t._id}"></i>
            </div>
          </div>
          <div class="trait-card-body" id="trait-body-${t._id}">
            <p class="mb-0">${escapeHtml(t.description)}</p>
          </div>
        </div>
      `;
      grid.appendChild(col);
    });

    renderPagination(totalPages);
  }

  // 5. Toggle collapse deskripsi saat kartu diklik (independen per kartu)
  window.toggleTrait = function (id) {
    const body = document.getElementById('trait-body-' + id);
    const chevron = document.getElementById('chevron-' + id);
    if (!body) return;

    const isOpen = body.classList.contains('open');
    if (isOpen) {
      body.classList.remove('open');
      if (chevron) chevron.classList.remove('rotated');
    } else {
      body.classList.add('open');
      if (chevron) chevron.classList.add('rotated');
    }
  };

  // 6. Pagination (pola sama seperti halaman Monster)
  function renderPagination(totalPages) {
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
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  // 7. Helper: escape HTML biar aman kalau ada karakter aneh di nama/deskripsi
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
  }

  // 8. Event listener untuk search & filter tier (reset ke halaman 1 setiap berubah)
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterTier) filterTier.addEventListener('change', applyFilters);
});