window.MonsterModal = (function () {
  'use strict';

  var currentGroup = [];
  var currentVariant = null;
  var modalInstance = null;

  function getSafeId(str) {
    return (str || '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildModalHTML() {
    var container = document.getElementById('monsterModalContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'monsterModalContainer';
      document.body.appendChild(container);
    }
    
    // Menggunakan struktur Bootstrap 5 Modal yang sama persis dengan Item Modal agar konsisten
    container.innerHTML = `
      <div class="modal fade" id="monsterDetailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content" style="border: none; border-radius: var(--radius-lg); overflow: hidden;">
            <div class="modal-header border-0 pb-0" style="background: linear-gradient(135deg, var(--blue-soft), white);">
              <h5 class="modal-title fw-bold" style="color: var(--blue-dark);" id="monModalName">Loading...</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
              <div class="row g-4">
                <div class="col-md-4 text-center">
                  <div id="monModalImage" class="mb-3 p-3 bg-light rounded" style="min-height: 150px; display: flex; align-items: center; justify-content: center;">
                    <span class="placeholder-icon fs-1">👾</span>
                  </div>
                  <div id="monModalMainBadges" class="d-flex flex-column gap-2 align-items-center"></div>
                </div>
                <div class="col-md-8">
                  <ul class="nav nav-pills mb-3" id="modalTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                      <button class="nav-link active rounded-pill px-3" id="tab-info" data-bs-toggle="pill" data-bs-target="#panel-info" type="button" role="tab">Info</button>
                    </li>
                    <li class="nav-item" role="presentation">
                      <button class="nav-link rounded-pill px-3" id="tab-drops" data-bs-toggle="pill" data-bs-target="#panel-drops" type="button" role="tab">Drops</button>
                    </li>
                  </ul>
                  <div class="tab-content" id="modalTabContent">
                    <div class="tab-pane fade show active" id="panel-info" role="tabpanel">
                      <div id="monModalInfoRows" class="small"></div>
                      <div class="mt-3">
                        <strong class="d-block mb-2">Lokasi:</strong>
                        <span id="monModalLocation" class="text-muted"></span>
                      </div>
                    </div>
                    <div class="tab-pane fade" id="panel-drops" role="tabpanel">
                      <div id="monModalDrops" class="m-drop-list"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function populate(group, selectedVariant) {
    if (!group || !group.length) {
      document.getElementById('monModalName').textContent = 'Monster Not Found';
      return;
    }

    currentGroup = group;
    currentVariant = selectedVariant || group[0];

    try {
      var mon = currentVariant;
      var nameRAW = mon['Name'] || '';
      var name = esc(nameRAW);
      var difficulty = (mon['Difficulty'] || 'Normal').trim();
      var level = mon['Level'] || '';
      var el = mon['Element'] || 'Neutral';
      var hp = mon['HP'] || '';
      var location = mon['Location'] || 'Unknown';
      var drop = mon['Drop'] || '';
      var mType = mon['Type'] || 'Mob';

      document.getElementById('monModalName').textContent = name + (level ? ` (Lv. ${level})` : '');

      // Badges
      var badgesEl = document.getElementById('monModalMainBadges');
      var elLower = el.toLowerCase();
      var elemClass = 'bg-secondary';
      if (elLower === 'fire') elemClass = 'bg-danger';
      else if (elLower === 'water') elemClass = 'bg-primary';
      else if (elLower === 'wind') elemClass = 'bg-success';
      else if (elLower === 'earth') elemClass = 'bg-warning text-dark';
      else if (elLower === 'light') elemClass = 'bg-info text-dark';
      else if (elLower === 'dark') elemClass = 'bg-dark text-white';

      badgesEl.innerHTML = `
        <span class="badge ${elemClass} fs-6">${el}</span>
        <span class="badge bg-light text-dark border fs-6">HP: ${hp}</span>
        <span class="badge bg-secondary fs-6">${mType}</span>
      `;

      // Image (Placeholder, bisa dikembangkan jika kolom ImageURL ditambahkan di sheet Monsters)
      var imageEl = document.getElementById('monModalImage');
      imageEl.innerHTML = '<span class="placeholder-icon fs-1">👾</span>';

      // Info Rows
      var infoRows = document.getElementById('monModalInfoRows');
      infoRows.innerHTML = `
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted">Tipe</span>
          <span class="fw-bold">${esc(mType)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span class="text-muted">Difficulty</span>
          <span class="fw-bold">${esc(difficulty)}</span>
        </div>
      `;

      document.getElementById('monModalLocation').textContent = location;

      // Drops
      var drops = drop.split(';').map(function(d) { return d.trim(); }).filter(Boolean);
      var dropEl = document.getElementById('monModalDrops');
      dropEl.innerHTML = '';
      
      if (drops.length === 0) {
        dropEl.innerHTML = '<p class="text-muted">Tidak ada data drop.</p>';
      } else {
        drops.forEach(function(d) {
          var item = document.createElement('div');
          var safeId = getSafeId(d);
          item.className = 'd-flex align-items-center gap-2 mb-2 p-2 rounded bg-light';
          item.style.cursor = 'pointer';
          item.innerHTML = `
            <div class="m-drop-icon" id="drop-icon-${safeId}" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 6px;">
              📦
            </div>
            <span class="m-drop-text fw-semibold">${esc(d)}</span>
            <span class="ms-auto text-muted">→</span>
          `;
          
          dropEl.appendChild(item);

          // Fetch real icon dari Item Database dan buat bisa diklik
          if (window.ItemModal && window.ItemModal.getItem) {
            window.ItemModal.getItem(d, function(itemData) {
              var iconDiv = document.getElementById('drop-icon-' + safeId);
              if (!iconDiv) return;
              if (itemData && window.ToramSheets) {
                var iURL = (itemData['ImageURL'] || '').trim();
                var iIcon = itemData['Icon'] || '';
                var iType = itemData['Type'] || '';
                iconDiv.innerHTML = window.ToramSheets.iconHTML(iURL, iIcon, iType, d, 'contain');
              }
            });
          }

          // Klik drop item untuk membuka Item Modal
          item.onclick = function() {
            if (window.ItemModal) {
              // Tutup modal monster dulu
              var mModal = bootstrap.Modal.getInstance(document.getElementById('monsterDetailModal'));
              if (mModal) mModal.hide();
              
              // Buka modal item setelah jeda singkat agar animasi smooth
              setTimeout(function() {
                window.ItemModal.open(d);
              }, 200);
            }
          };
        });
      }

    } catch(err) {
      console.error('MonsterModal populate error:', err);
      document.getElementById('monModalName').textContent = 'Error Populating Data';
    }
  }

  function open(monsterName, difficulty, initialGroup) {
    if (!document.getElementById('monsterDetailModal')) {
      buildModalHTML();
    }

    var group = initialGroup || [];
    
    // Jika tidak ada initialGroup, cari di data state yang sudah dimuat
    if (!group.length) {
      if (window.ToramSheets && window.ToramSheets.dataState && window.ToramSheets.dataState.fullData && window.ToramSheets.dataState.pageType === 'monsters') {
        var data = window.ToramSheets.dataState.fullData;
        group = data.filter(function(r) { 
          var rname = (r['Name'] || '').trim().toLowerCase();
          return rname === (monsterName || '').trim().toLowerCase(); 
        });
      }
    }

    if (!group.length) {
      populate(null);
    } else {
      var selected = null;
      if (difficulty && group.length) {
        selected = group.find(function(v) { return (v['Difficulty'] || '').toLowerCase() === difficulty.toLowerCase(); });
      }
      populate(group, selected);
    }

    if (!modalInstance) {
      modalInstance = new bootstrap.Modal(document.getElementById('monsterDetailModal'));
    }
    modalInstance.show();
  }

  return { open: open };
}());