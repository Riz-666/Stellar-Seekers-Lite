// js/modal.js - Final Version (API Lazy Load + Unified Icon Detection)
window.ItemModal = (function () {
  'use strict';

  var sheetsCache = null;
  var pendingItemDetailsFetch = null;
  var lastOpenRequestTime = 0;
  var modalInstance = null;

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function iconBasePath() {
    return (window.location.pathname.indexOf('/pages/') !== -1) ? '../img/icons/' : 'img/icons/';
  }

  // Wrapper tipis ke fungsi terpusat di toram-api.js, biar gak ada logic duplikat.
  function resolveIconFile(type, name, tier, materialCategory) {
  if (window.ToramSheets && window.ToramSheets.getItemIconFile) {
    return window.ToramSheets.getItemIconFile(type, name, tier, materialCategory);
  }
  return 'items_ico.png';
}

  function getCrystaCategory(type) {
    if (window.ToramSheets && window.ToramSheets.getCrystaCategory) {
      return window.ToramSheets.getCrystaCategory(type);
    }
    return null;
  }

  // "Upgrade for" (effect_id 148) amount-nya bukan angka stat, tapi ID item crysta tujuan upgrade.
  // Fungsi ini nyari nama item aslinya dari ID tsb di list item yang lagi ke-load.
  function findItemById(id, allItems) {
    if (!allItems || id === undefined || id === null || id === '') return null;
    var idNum = Number(id);
    if (isNaN(idNum)) return null;
    for (var i = 0; i < allItems.length; i++) {
      if (Number(allItems[i]['ID']) === idNum) return allItems[i];
    }
    return null;
  }

  // ==========================================
  // ENHANCEMENT PATH (berdasarkan stat "Upgrade for" dari API, bukan kolom Recipe lama)
  // ==========================================

  // index 0 = tier terendah (base), index terakhir = tier tertinggi (max), sisanya = up
  function getCrystaTier(index, total) {
    if (total <= 1) return 'base';
    if (index === 0) return 'max';          // origin/no-ancestor -> MAX
    if (index === total - 1) return 'base'; // terminal/no own upgrade-for -> BASE
    return 'up';
  }

  function getNodeIconPath(type, iconBase, tier) {
    var cat = getCrystaCategory(type);
    if (!cat) return iconBase + 'items_ico.png';
    return iconBase + resolveIconFile(type, '', tier);
  }

  // "Upgrade for" bisa datang dalam 2 bentuk: dari StatsList item yg lagi dibuka ({effect_id,name,value})
  // atau langsung dari respons mentah API ({effect_id,effect_name,amount}) hasil fetchItemFullDetails.
  function extractUpgradeForId(stats) {
    if (!Array.isArray(stats)) return null;
    for (var i = 0; i < stats.length; i++) {
      var s = stats[i];
      var id = s.effect_id;
      var name = s.name || s.effect_name;
      var val = (s.value !== undefined) ? s.value : s.amount;
      if (id === 148 || String(name || '').toLowerCase() === 'upgrade for') {
        var n = Number(val);
        return isNaN(n) ? null : n;
      }
    }
    return null;
  }

  function getCachedFullDetails(id) {
    try {
      var cached = localStorage.getItem('coryn_item_full_' + id);
      if (cached) return JSON.parse(cached);
    } catch (e) { /* ignore */ }
    return null;
  }

  // Cari "parent" (item yang upgrade-nya mengarah ke targetId) TANPA nembak API baru —
  // cuma nyisir cache lokal item lain yang udah pernah dibuka sebelumnya. Zero biaya network,
  // tapi makin lengkap seiring makin banyak item di kategori yang sama pernah dibuka.
  function findParentIdFromCache(targetId, categoryPool) {
    for (var i = 0; i < categoryPool.length; i++) {
      var candidateId = categoryPool[i]['ID'];
      if (candidateId === undefined || Number(candidateId) === Number(targetId)) continue;
      var cached = getCachedFullDetails(candidateId);
      if (cached && Array.isArray(cached.stats)) {
        var upId = extractUpgradeForId(cached.stats);
        if (upId !== null && Number(upId) === Number(targetId)) return candidateId;
      }
    }
    return null;
  }

  function enhancementNodeHtml(node, iconBase, isCurrent, tier) {
    var icon = getNodeIconPath(node.type, iconBase, tier);
    var boxClass = isCurrent
      ? 'border border-primary border-2 bg-primary bg-opacity-10'
      : 'border bg-light';
    var clickAttr = (!isCurrent && node.name) ? ' style="cursor:pointer" onclick="window.ItemModal.open(\'' + esc(node.name) + '\')" title="Klik untuk lihat item ini"' : '';
    var html = '<div class="d-flex flex-column align-items-center text-center"' + clickAttr + '>';
    html += '<div class="p-2 rounded ' + boxClass + '" style="width:72px;height:72px;display:flex;align-items:center;justify-content:center;">';
    html += '<img src="' + esc(icon) + '" alt="' + esc(node.name) + '" style="width:44px;height:44px;object-fit:contain;" onerror="this.onerror=null;this.src=\'' + iconBase + 'items_ico.png\';">';
    html += '</div>';
    html += '<div class="small fw-semibold mt-1" style="max-width:110px;">' + esc(node.name) + '</div>';
    if (isCurrent) html += '<span class="badge bg-warning text-dark mt-1">Current</span>';
    html += '</div>';
    return html;
  }

  function renderEnhancementTree(nodes, currentIndex, iconBase) {
    var total = nodes.length;
    var tiers = nodes.map(function (node, idx) { return getCrystaTier(idx, total); });

    // Render dari tier tertinggi (max) di ATAS -> tier terendah (base) di BAWAH.
    // Panah mengarah ke bawah (↓) mengikuti urutan visual atas->bawah.
    var html = '<div class="enhancement-tree d-flex flex-column align-items-center py-2">';
    for (var pos = 0; pos < total; pos++) {
      var origIdx = total - 1 - pos;
      if (pos > 0) html += '<div class="text-muted" style="font-size:1.3rem;line-height:1.6;">↓</div>';
      html += enhancementNodeHtml(nodes[origIdx], iconBase, origIdx === currentIndex, tiers[origIdx]);
    }
    html += '</div>';
    return html;
  }

  // Async karena buat nyari item lanjutan (descendant) perlu fetch detail per-ID (di-cache otomatis
  // lewat fetchItemFullDetails). Ancestor (parent) dicari dari cache lokal aja, jadi instan.
  function renderEnhancementPathAsync(item, allItems, recipeEl, requestToken) {
    var currentId = item['ID'];
    var type = item['Type'] || '';
    var category = getCrystaCategory(type);

    if (!currentId || !category) {
      recipeEl.innerHTML = '<p class="text-muted text-center"><i class="bi bi-slash-circle me-1"></i>Enhancement path hanya tersedia untuk item Crysta.</p>';
      return;
    }

    recipeEl.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary" role="status"></div><p class="mt-2 text-muted small">Menyusun jalur enhancement...</p></div>';

    var iconBase = iconBasePath();

    // Kumpulan item satu kategori (dari list yang udah ke-load, TANPA fetch tambahan) buat basis pencarian parent
    var categoryPool = (allItems || []).filter(function (it) { return getCrystaCategory(it['Type'] || '') === category; });

    // 1. Susun ancestor (parent, grandparent, dst) dari cache lokal
    var ancestors = [];
    var probeId = currentId;
    for (var guardA = 0; guardA < 10; guardA++) {
      var parentId = findParentIdFromCache(probeId, categoryPool);
      if (!parentId) break;
      var parentMeta = findItemById(parentId, allItems);
      ancestors.unshift({ id: parentId, name: parentMeta ? parentMeta['Name'] : ('Item ' + parentId), type: parentMeta ? parentMeta['Type'] : type });
      probeId = parentId;
    }

    // 2. Susun descendant (child, grandchild, dst) lewat fetch detail per-ID (otomatis ke-cache)
    var descendants = [];
    var descStats = item['StatsList'];

    function stepDown() {
      var upId = extractUpgradeForId(descStats);
      if (!upId) return Promise.resolve();
      var meta = findItemById(upId, allItems);
      return window.ToramSheets.fetchItemFullDetails(upId).then(function (full) {
        descendants.push({
          id: upId,
          name: (meta && meta['Name']) || (full && full.name) || ('Item ' + upId),
          type: (meta && meta['Type']) || (full && full.type_label) || type
        });
        descStats = (full && Array.isArray(full.stats)) ? full.stats : null;
        if (descendants.length >= 10) return;
        return stepDown();
      }).catch(function () { /* stop rantai kalau fetch gagal */ });
    }

    stepDown().then(function () {
      // Guard: kalau modal udah pindah ke item lain sebelum fetch ini selesai, jangan timpa DOM
      if (requestToken !== lastOpenRequestTime) return;

      var currentNode = { id: currentId, name: item['Name'], type: type };
      var nodes = ancestors.concat([currentNode]).concat(descendants);
      var currentIndex = ancestors.length;

      var html = '<h6 class="fw-bold mb-3 text-center"><i class="bi bi-diagram-3 me-2"></i>Enhancement Path</h6>';
      html += renderEnhancementTree(nodes, currentIndex, iconBase);
      if (ancestors.length === 0) {
        html += '<p class="text-muted text-center small mt-2 mb-0"><i class="bi bi-info-circle me-1"></i>Item sebelum ini di rantai upgrade belum terdeteksi (mungkin item ini base tier, atau item sebelumnya belum pernah dibuka). Makin sering item lain dibuka, makin lengkap datanya.</p>';
      }
      recipeEl.innerHTML = html;
    });
  }

  function populate(item, allItems) {
    const nameEl = document.getElementById('modalName');
    const typeEl = document.getElementById('modalType');
    const thisRequestToken = lastOpenRequestTime;

    if (!nameEl) { console.error("ERROR: Modal elements not found!"); return; }

    if (!item) {
      nameEl.innerHTML = 'Loading…';
      if (typeEl) typeEl.textContent = '';
      document.getElementById('modalImage').innerHTML = '<div class="skeleton" style="height:150px;border-radius:8px"></div>';
      document.getElementById('modalPrices').innerHTML = '';
      document.getElementById('modalStats').innerHTML = '<div class="skeleton" style="height:100px"></div>';
      document.getElementById('modalObtain').innerHTML = '<p class="text-muted">Loading…</p>';
      document.getElementById('modalRecipe').innerHTML = '<p class="text-muted">Loading…</p>';
      return;
    }

    var name = item['Name'] || '';
    var type = item['Type'] || '';
    var level = item['Level'] || '';
    var img = item['ImageURL'] || '';
    var icon = item['Icon'] || '';
    var sell = item['SellSpina'] || '';
    var stats = item['Stats'] || '';

    var statsList = item['StatsList'] || [];
    var isEvent = item['IsEvent'] || false;
    var badge = item['Badge'] || '';
    var note = item['Note'] || '';
    var isUntradable = item['IsUntradable'] || false;
    var isCraftable = item['IsCraftable'] || false;
    var craftAmount = item['CraftAmount'] || 0;

    nameEl.innerHTML = esc(name);
    if (typeEl) {
      var levelText = level && level !== '0' ? ' · Lv.' + level : '';
      var eventText = isEvent && badge ? ' · <span class="text-warning">' + esc(badge) + '</span>' : '';
      typeEl.innerHTML = '<span class="text-muted">[' + esc(type) + ']' + levelText + eventText + '</span>';
    }

    // ==========================================
    // IMAGE: SMART FALLBACK KE ICON LOKAL (icon file ditentukan via toram-api.js)
    // ==========================================
    var imageEl = document.getElementById('modalImage');
    if (imageEl) {
      var localIcon = 'img/icons/' + resolveIconFile(type, name, null, item.MaterialCategory);
      if (img) {
        // Coba pakai gambar asli dulu, kalau gagal load baru fallback ke icon lokal berdasarkan tipe
        imageEl.innerHTML = '<img src="' + esc(img) + '" alt="' + esc(name) + '" onerror="this.onerror=null;this.src=\'' + localIcon + '\';this.style.opacity=\'1\';" style="max-width:100%;max-height:200px;object-fit:contain">';
      } else if (typeof icon === 'string' && (icon.indexOf('/') !== -1 || icon.indexOf('.png') !== -1)) {
        imageEl.innerHTML = '<img src="' + esc(icon) + '" alt="' + esc(name) + '" onerror="this.onerror=null;this.src=\'img/icons/items_ico.png\';" style="max-width:100%;max-height:200px;object-fit:contain">';
      } else {
        // Langsung pakai icon lokal berdasarkan tipe
        imageEl.innerHTML = '<img src="' + localIcon + '" alt="' + esc(name) + '" style="max-width:100%;max-height:200px;object-fit:contain">';
      }
    }

    // Prices
    var pricesEl = document.getElementById('modalPrices');
    if (pricesEl) {
      var priceHTML = '<div class="d-flex gap-2 flex-wrap justify-content-center">';
      if (sell) priceHTML += '<button class="btn btn-sm btn-outline-warning rounded-pill px-3"><i class="bi bi-coin me-1"></i>Sell: ' + esc(sell) + ' Spina</button>';
      if (isCraftable) priceHTML += '<button class="btn btn-sm btn-outline-success rounded-pill px-3"><i class="bi bi-gear me-1"></i>Process: ' + craftAmount + ' Materials</button>';
      if (isUntradable) priceHTML += '<button class="btn btn-sm btn-outline-danger rounded-pill px-3"><i class="bi bi-lock me-1"></i>Untradable</button>';
      priceHTML += '</div>';
      pricesEl.innerHTML = priceHTML;
    }

    // Stats
    var statsEl = document.getElementById('modalStats');
    if (statsEl) {
      if (statsList && statsList.length > 0) {
        var html = '<div class="stats-container"><div class="mb-3">';
        statsList.forEach(function (s) {
          var isUpgradeFor = s.effect_id === 148 || String(s.name || '').toLowerCase() === 'upgrade for';
          html += '<div class="d-flex justify-content-between align-items-center py-2 border-bottom">';
          html += '<span class="text-muted">' + esc(s.name) + '</span>';
          if (isUpgradeFor) {
            var targetItem = findItemById(s.value, allItems);
            if (targetItem) {
              var targetName = targetItem['Name'] || ('ID ' + s.value);
              html += '<span class="fw-semibold text-primary" style="cursor:pointer" onclick="window.ItemModal.open(\'' + esc(targetName) + '\')" title="Klik untuk lihat detail item">' + esc(targetName) + ' <i class="bi bi-box-arrow-up-right" style="font-size:0.7rem;"></i></span>';
            } else {
              html += '<span class="fw-semibold text-muted">Item ID ' + esc(s.value) + ' (tidak ditemukan)</span>';
            }
          } else {
            var valStr = String(s.display || s.value);
            var cls = valStr.charAt(0) === '+' ? 'text-success fw-bold' : (valStr.charAt(0) === '-' ? 'text-danger fw-bold' : 'fw-semibold');
            html += '<span class="' + cls + '">' + esc(valStr) + '</span>';
          }
          html += '</div>';
        });
        html += '</div></div>';
        statsEl.innerHTML = html;
      } else if (stats) {
        var html = '<div class="stats-container">';
        var normalRows = [], condGroups = {};
        stats.split(/;|(?=>)/).forEach(function (part) {
          part = part.trim();
          if (!part) return;
          if (part.charAt(0) === '>') {
            var content = part.substring(1).trim();
            var ci = content.indexOf(':');
            if (ci > 0) {
              var label = content.substring(0, ci).trim();
              var rest = content.substring(ci + 1).trim();
              var sci = rest.indexOf(':');
              if (sci > 0) {
                var sn = rest.substring(0, sci).trim();
                var sv = rest.substring(sci + 1).trim();
                if (!condGroups[label]) condGroups[label] = [];
                condGroups[label].push({ name: sn, value: sv });
              }
            }
          } else {
            var ci2 = part.indexOf(':');
            if (ci2 > 0) normalRows.push({ name: part.substring(0, ci2).trim(), value: part.substring(ci2 + 1).trim() });
          }
        });
        if (normalRows.length > 0) {
          html += '<div class="mb-3">';
          normalRows.forEach(function (r) {
            var cls = r.value.charAt(0) === '+' ? 'text-success fw-bold' : (r.value.charAt(0) === '-' ? 'text-danger fw-bold' : 'fw-semibold');
            html += '<div class="d-flex justify-content-between align-items-center py-2 border-bottom">';
            html += '<span class="text-muted">' + esc(r.name) + '</span>';
            html += '<span class="' + cls + '">' + esc(r.value) + '</span>';
            html += '</div>';
          });
          html += '</div>';
        }
        if (Object.keys(condGroups).length > 0) {
          html += '<div class="mt-3">';
          Object.keys(condGroups).forEach(function (label) {
            html += '<div class="mb-3 p-2 rounded" style="background:#f8f9fa">';
            html += '<div class="fw-bold text-primary small mb-2"><i class="bi bi-stars me-1"></i>' + esc(label) + '</div>';
            condGroups[label].forEach(function (statItem) {
              var cls = statItem.value.charAt(0) === '+' ? 'text-success fw-bold' : (statItem.value.charAt(0) === '-' ? 'text-danger fw-bold' : '');
              html += '<div class="d-flex justify-content-between align-items-center py-1">';
              html += '<span class="text-muted small">' + esc(statItem.name) + '</span>';
              html += '<span class="' + cls + ' small">' + esc(statItem.value) + '</span>';
              html += '</div>';
            });
            html += '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
        statsEl.innerHTML = html;
      } else {
        statsEl.innerHTML = '<p class="text-muted text-center">No stats available.</p>';
      }
    }

    // Obtain & Source Info
    var obtainEl = document.getElementById('modalObtain');
    if (obtainEl) {
      var obtHtml = '<div class="obtain-list">';
      if (isEvent && badge) {
        obtHtml += '<div class="mb-3 p-2 rounded bg-warning bg-opacity-10 border border-warning"><div class="fw-bold text-warning mb-1"><i class="bi bi-star-fill me-1"></i>Event Item</div><div class="small">' + esc(badge) + '</div></div>';
      }
      if (isUntradable) {
        obtHtml += '<div class="mb-3 p-2 rounded bg-danger bg-opacity-10 border border-danger"><div class="fw-bold text-danger"><i class="bi bi-lock me-1"></i>Untradable Item</div><div class="small text-muted">This item cannot be traded or sold to other players.</div></div>';
      }

      var hasSourceInfo = false;
      if (note) {
        obtHtml += '<div class="mb-3"><div class="fw-bold mb-2"><i class="bi bi-info-circle me-1"></i>Obtain Information</div><div class="p-2 rounded bg-light">';
        var noteLines = note.split(/\n|;/).map(function (line) { return line.trim(); }).filter(Boolean);
        noteLines.forEach(function (line) {
          var lineLower = line.toLowerCase();
          var obtIcon = 'bi-box', obtColor = 'secondary';
          if (lineLower.indexOf('dropped by') >= 0) { obtIcon = 'bi-bug'; obtColor = 'danger'; hasSourceInfo = true; }
          else if (lineLower.indexOf('quest') >= 0) { obtIcon = 'bi-journal-text'; obtColor = 'info'; hasSourceInfo = true; }
          else if (lineLower.indexOf('shop') >= 0 || lineLower.indexOf('npc') >= 0) { obtIcon = 'bi-shop'; obtColor = 'success'; hasSourceInfo = true; }
          else if (lineLower.indexOf('exchange') >= 0 || lineLower.indexOf('trade') >= 0) { obtIcon = 'bi-arrow-left-right'; obtColor = 'primary'; hasSourceInfo = true; }
          else if (lineLower.indexOf('collab') >= 0 || lineLower.indexOf('event') >= 0) { obtIcon = 'bi-calendar-event'; obtColor = 'warning'; hasSourceInfo = true; }
          else if (lineLower.indexOf('craft') >= 0 || lineLower.indexOf('process') >= 0) { obtIcon = 'bi-hammer'; obtColor = 'success'; hasSourceInfo = true; }
          obtHtml += '<div class="d-flex align-items-start gap-2 p-2 mb-2 rounded bg-white"><i class="bi ' + obtIcon + ' text-' + obtColor + ' fs-5 mt-1"></i><span class="small">' + esc(line) + '</span></div>';
        });
        obtHtml += '</div></div>';
      }

      if (isCraftable && !hasSourceInfo) {
        var craftType = 'Craft', craftIcon = 'bi-hammer', craftColor = 'success';
        if (name.toLowerCase().indexOf('collab') >= 0 || name.toLowerCase().indexOf('exchange') >= 0 || name.toLowerCase().indexOf('ticket') >= 0 || (badge && badge.toLowerCase().indexOf('collab') >= 0)) {
          craftType = 'Exchange'; craftIcon = 'bi-arrow-left-right'; craftColor = 'primary';
        }
        obtHtml += '<div class="mb-3 p-2 rounded bg-' + craftColor + ' bg-opacity-10 border border-' + craftColor + '"><div class="fw-bold text-' + craftColor + ' mb-1"><i class="bi ' + craftIcon + ' me-1"></i>' + craftType + 'able</div><div class="small">Requires ' + craftAmount + ' materials to ' + craftType.toLowerCase() + ' at NPC</div></div>';
        hasSourceInfo = true;
      }

      if (!hasSourceInfo && !isEvent && !note) {
        obtHtml += '<div class="text-center text-muted py-3"><i class="bi bi-question-circle fs-4 mb-2 d-block"></i><small>No obtain information available</small><br><small class="text-muted" style="font-size: 0.7rem;">Source data not found in database</small></div>';
      }
      obtHtml += '</div>';
      obtainEl.innerHTML = obtHtml;
    }

    // Enhancement Path (dari stat "Upgrade for", khusus item Crysta)
    var recipeEl = document.getElementById('modalRecipe');
    if (recipeEl) {
      renderEnhancementPathAsync(item, allItems, recipeEl, thisRequestToken);
    }
  }

  function open(itemName, rowIndex) {
    var requestTime = Date.now();
    lastOpenRequestTime = requestTime;

    var findAndPopulate = function (foundItem) {
      if (lastOpenRequestTime !== requestTime) return;

      // LAZY LOAD: Jika item tidak punya stats, ambil detail lengkapnya sekarang!
      if (foundItem && foundItem.ID && (!foundItem.StatsList || foundItem.StatsList.length === 0)) {
        console.log("Lazy loading full details for:", foundItem.Name);
        const statsEl = document.getElementById('modalStats');
        if (statsEl) statsEl.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted small">Loading complete stats...</p></div>';

        if (window.ToramSheets && window.ToramSheets.fetchItemFullDetails) {
          window.ToramSheets.fetchItemFullDetails(foundItem.ID).then(function (fullData) {
            if (fullData && fullData.stats) {
              foundItem.StatsList = fullData.stats.map(function (s) {
                return { effect_id: s.effect_id, name: s.effect_name, value: s.amount, applies_to: s.applies_to || 0, display: s.amount > 0 ? '+' + s.amount : s.amount };
              });
              foundItem.StatsString = foundItem.StatsList.map(s => s.name + ': ' + s.display).join('; ');
              foundItem.TotalStats = foundItem.StatsList.length;
              if (fullData.meta) {
                foundItem.Meta = fullData.meta;
                if (fullData.meta.note && !foundItem.Note) foundItem.Note = fullData.meta.note;
              }
            }
            populate(foundItem, sheetsCache);
          }).catch(function (err) {
            console.error("Failed to lazy load item details", err);
            populate(foundItem, sheetsCache);
          });
        } else {
          populate(foundItem, sheetsCache);
        }
      } else {
        populate(foundItem, sheetsCache);
      }

      if (!modalInstance) modalInstance = new bootstrap.Modal(document.getElementById('itemModal'));
      modalInstance.show();
    };

    var search = (itemName || '').trim().toLowerCase();
    var found = null;

    if (sheetsCache) {
      if (!isNaN(rowIndex) && sheetsCache[rowIndex] && (sheetsCache[rowIndex]['Name'] || '').trim().toLowerCase() === search) {
        found = sheetsCache[rowIndex];
      } else {
        for (var i = 0; i < sheetsCache.length; i++) {
          if ((sheetsCache[i]['Name'] || '').trim().toLowerCase() === search) { found = sheetsCache[i]; break; }
        }
      }
    }

    if (found) {
      findAndPopulate(found);
    } else {
      if (!modalInstance) modalInstance = new bootstrap.Modal(document.getElementById('itemModal'));
      modalInstance.show();
      populate(null, []);

      if (window.ToramSheets && window.ToramSheets.CONFIG.SHEET_ID === 'API_MODE_CORYN_CLUB') {
        if (window.ToramSheets.dataState.fullData.length > 0) {
          sheetsCache = window.ToramSheets.dataState.fullData;
          for (var i = 0; i < sheetsCache.length; i++) {
            if ((sheetsCache[i]['Name'] || '').trim().toLowerCase() === search) { found = sheetsCache[i]; break; }
          }
          if (found) findAndPopulate(found);
        }
      }
    }
  }

  function ensureItemDetailsLoaded(cb, retries) {
    if (window.ToramSheets && window.ToramSheets.CONFIG.SHEET_ID === 'API_MODE_CORYN_CLUB') {
      if (window.ToramSheets.dataState && window.ToramSheets.dataState.fullData && window.ToramSheets.dataState.fullData.length > 0) {
        sheetsCache = window.ToramSheets.dataState.fullData;
        return cb();
      }
      if (retries > 0) {
        setTimeout(function () { ensureItemDetailsLoaded(cb, retries - 1); }, 500);
      } else {
        console.warn("API data still not loaded after retries.");
        cb();
      }
      return;
    }

    if (sheetsCache) return cb();
    if (pendingItemDetailsFetch) {
      pendingItemDetailsFetch.then(cb).catch(function () { cb(); });
      return;
    }

    var s = window.ToramSheets.CONFIG.SHEETS.itemdetails;
    var sName = (s && s.name) ? s.name : 'ItemDetails';
    var sGid = (s && s.gid) ? s.gid : '';

    pendingItemDetailsFetch = window.ToramSheets.fetchSheet({ name: sName, gid: sGid })
      .then(function (csv) {
        sheetsCache = window.ToramSheets.parseCSV(csv);
        sheetsCache.forEach(function (r, i) { r._index = i; });
        pendingItemDetailsFetch = null;
        cb();
      })
      .catch(function (err) {
        console.error("Failed to load ItemDetails:", err);
        pendingItemDetailsFetch = null;
        if (retries > 0) setTimeout(function () { ensureItemDetailsLoaded(cb, retries - 1); }, 800);
        else cb();
      });
  }

  function getItem(itemName, callback) {
    var cache = sheetsCache || (window.ToramSheets ? window.ToramSheets.dataState.fullData : []);
    var found = null;
    var search = (itemName || '').trim().toLowerCase();
    for (var i = 0; i < cache.length; i++) {
      if ((cache[i]['Name'] || '').trim().toLowerCase() === search) { found = cache[i]; break; }
    }
    if (callback) callback(found);
    return found;
  }

  return { open: open, getItem: getItem };
}());