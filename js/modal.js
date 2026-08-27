// js/modal.js - Final Version (API Lazy Load + Smart Icon Fallback)
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

  function formatPrice(sell, sellOther, iconBase) {
    var html = '<div class="d-flex gap-2 flex-wrap justify-content-center">';
    if (sell) {
      html += '<button class="btn btn-sm btn-outline-warning rounded-pill px-3">';
      html += '<i class="bi bi-coin me-1"></i>Sell: ' + esc(sell) + ' Spina';
      html += '</button>';
    }
    if (sellOther) {
      var clean = sellOther.trim();
      var match = clean.match(/^(\d+)\s+([a-zA-Z]+)$/);
      if (match) {
        var amount = match[1];
        var material = match[2].toLowerCase();
        var iconPath = iconBase + material + '_ico.png';
        html += '<button class="btn btn-sm btn-outline-success rounded-pill px-3">';
        html += '<i class="bi bi-gear me-1"></i>Process: ' + amount + ' ';
        html += '<img src="' + esc(iconPath) + '" onerror="this.style.display=\'none\'" style="width:16px;height:16px;vertical-align:middle;margin-right:4px">';
        html += material.charAt(0).toUpperCase() + material.slice(1);
        html += '</button>';
      }
    }
    html += '</div>';
    return html;
  }

  function buildEnhancementPath(item, allItems) {
    var recipe = item['Recipe'] || '';
    if (!recipe) return '<p class="text-muted text-center">No enhancement path available.</p>';
    
    var paths = [];
    var bracketMatches = recipe.match(/\[([^\]]+)\]/g);
    if (bracketMatches && bracketMatches.length > 0) {
      bracketMatches.forEach(function(path) {
        var content = path.replace(/[\[\]]/g, '').trim();
        var items = content.split(';').map(function(i) { return i.trim(); }).filter(Boolean);
        if (items.length > 0) paths.push(items);
      });
    } else if (recipe.includes(',')) {
      var items = recipe.split(',').map(function(i) { return i.trim(); }).filter(Boolean);
      if (items.length > 0) paths.push(items);
    } else if (recipe.includes(';')) {
      var items = recipe.split(';').map(function(i) { return i.trim(); }).filter(Boolean);
      if (items.length > 0) paths.push(items);
    } else {
      var trimmed = recipe.trim();
      if (trimmed) paths.push([trimmed]);
    }
    
    if (paths.length === 0) return '<p class="text-muted text-center">Invalid recipe format.</p>';
    
    var itemType = item['Type'] || '';
    var tLow = itemType.toLowerCase();
    var category = 'normal';
    if (tLow.indexOf('weapon') !== -1) category = 'weapon';
    else if (tLow.indexOf('armor') !== -1) category = 'armor';
    else if (tLow.indexOf('special') !== -1 || tLow.indexOf('ring') !== -1) category = 'special';
    else if (tLow.indexOf('additional') !== -1 || tLow.indexOf('add') !== -1) category = 'add';
    
    var iconBase = (window.location.pathname.indexOf('/pages/') !== -1) ? '../img/icons/' : 'img/icons/';
    
    var html = '<div class="enhancement-paths">';
    html += '<h6 class="fw-bold mb-3"><i class="bi bi-diagram-3 me-2"></i>Enhancement Paths</h6>';
    
    paths.forEach(function(pathItems, pathIndex) {
      if (pathItems.length === 0) return;
      html += '<div class="path-container mb-4">';
      if (paths.length > 1) html += '<div class="badge bg-primary mb-2">Path ' + (pathIndex + 1) + '</div>';
      html += '<div class="path-items d-flex flex-column gap-2">';
      
      pathItems.forEach(function(itemName, index) {
        var isFirst = index === 0;
        var isLast = index === pathItems.length - 1;
        var itemData = null;
        
        if (allItems) {
          itemData = allItems.find(function(i) { return (i['Name'] || '').toLowerCase() === itemName.toLowerCase(); });
        }
        
        var itemType = itemData ? (itemData['Type'] || '') : '';
        var itemLevel = itemData ? (itemData['Level'] || '') : '';
        var iconImg = isLast ? (iconBase + 'crysta_' + category + '_max.png') : (iconBase + 'crysta_' + category + '_up.png');
        
        html += '<div class="d-flex align-items-center">';
        if (index > 0) html += '<div class="me-2 text-muted" style="font-size: 1.2rem; width: 20px; text-align: center;">↓</div>';
        else html += '<div style="width: 20px;"></div>';
        
        html += '<div class="item-node p-2 rounded border flex-grow-1 d-flex align-items-center gap-2" style="background: ' + (isFirst ? '#e7f3ff' : '#f8f9fa') + '; ' + (isFirst ? 'border-primary' : 'border-secondary') + '">';
        html += '<img src="' + esc(iconImg) + '" onerror="this.src=\'' + iconBase + 'no_image.png\'" style="width: 40px; height: 40px; object-fit: contain;">';
        
        if (itemData) {
          html += '<div class="flex-grow-1">';
          html += '<div class="fw-bold small">' + esc(itemName) + '</div>';
          if (itemType || itemLevel) {
            html += '<div class="text-muted" style="font-size: 0.75rem;">';
            if (itemType) html += esc(itemType);
            if (itemType && itemLevel) html += ' • ';
            if (itemLevel) html += 'Lv.' + esc(itemLevel);
            html += '</div>';
          }
          html += '</div>';
          if (isFirst) html += '<span class="badge bg-success">Start</span>';
          else if (isLast) html += '<span class="badge bg-danger">Final</span>';
        } else {
          html += '<div class="flex-grow-1"><div class="fw-bold small">' + esc(itemName) + '</div><div class="text-muted" style="font-size: 0.75rem;">Not in database</div></div>';
          if (isFirst) html += '<span class="badge bg-success">Start</span>';
          else if (isLast) html += '<span class="badge bg-danger">Final</span>';
        }
        html += '</div></div>';
      });
      html += '</div></div>';
    });
    html += '</div>';
    return html;
  }

  function populate(item, allItems) {
    const nameEl = document.getElementById('modalName');
    const typeEl = document.getElementById('modalType');
    
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
    var sell2 = item['SellOther'] || '';
    var stats = item['Stats'] || '';
    var obt = item['Obtain'] || '';
    var rec = item['Recipe'] || '';
    
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
    // IMAGE: SMART FALLBACK KE ICON LOKAL
    // ==========================================
         // Image - DIRECT FALLBACK KE ICON LOKAL
    var imageEl = document.getElementById('modalImage');
    if (imageEl) {
      if (img) {
        // Tentukan fallback icon berdasarkan tipe item
        var t = (type || '').toLowerCase().trim();
        var fallbackIcon = 'img/icons/items_ico.png';
        
        if (t.includes('1-handed sword') || t.includes('one-hand sword')) fallbackIcon = 'img/icons/1h_ico.png';
        else if (t.includes('2-handed sword') || t.includes('two-hand sword')) fallbackIcon = 'img/icons/2h_ico.png';
        else if (t === 'katana') fallbackIcon = 'img/icons/ktn_ico.png';
        else if (t === 'bow') fallbackIcon = 'img/icons/bow_ico.png';
        else if (t === 'bowgun') fallbackIcon = 'img/icons/bwg_ico.png';
        else if (t === 'staff') fallbackIcon = 'img/icons/stf_ico.png';
        else if (t === 'magic device') fallbackIcon = 'img/icons/md_ico.png';
        else if (t === 'knuckles') fallbackIcon = 'img/icons/knu_ico.png';
        else if (t === 'halberd') fallbackIcon = 'img/icons/hb_ico.png';
        else if (t === 'dagger') fallbackIcon = 'img/icons/dagger_ico.png';
        else if (t.includes('armor')) fallbackIcon = 'img/icons/armor_ico.png';
        else if (t === 'shield') fallbackIcon = 'img/icons/shield_ico.png';
        else if (t === 'additional') fallbackIcon = 'img/icons/add_ico.png';
        else if (t === 'special' || t === 'ring') fallbackIcon = 'img/icons/special_ico.png';
        else if (t.indexOf('crysta') !== -1) {
          var crystaCat1 = 'normal';
          if (t.indexOf('weapon crysta') !== -1) crystaCat1 = 'weapon';
          else if (t.indexOf('armor crysta') !== -1) crystaCat1 = 'armor';
          else if (t.indexOf('special crysta') !== -1) crystaCat1 = 'special';
          else if (t.indexOf('additional crysta') !== -1 || t.indexOf('add crysta') !== -1) crystaCat1 = 'add';
          fallbackIcon = 'img/icons/crysta_' + crystaCat1 + '_base.png';
        }
        
        // Buat img element dengan onerror handler
        imageEl.innerHTML = '<img src="' + esc(img) + '" alt="' + esc(name) + '" onerror="this.onerror=null;this.src=\'' + fallbackIcon + '\';this.style.opacity=\'1\';" style="max-width:100%;max-height:200px;object-fit:contain">';
      } else if (typeof icon === 'string' && (icon.indexOf('/') !== -1 || icon.indexOf('.png') !== -1)) {
        imageEl.innerHTML = '<img src="' + esc(icon) + '" alt="' + esc(name) + '" onerror="this.onerror=null;this.src=\'img/icons/items_ico.png\';" style="max-width:100%;max-height:200px;object-fit:contain">';
      } else {
        // Langsung pakai icon lokal berdasarkan tipe
        var t = (type || '').toLowerCase().trim();
        var directIcon = 'img/icons/items_ico.png';
        
        if (t.includes('1-handed sword') || t.includes('one-hand sword')) directIcon = 'img/icons/1h_ico.png';
        else if (t.includes('2-handed sword') || t.includes('two-hand sword')) directIcon = 'img/icons/2h_ico.png';
        else if (t === 'katana') directIcon = 'img/icons/ktn_ico.png';
        else if (t === 'bow') directIcon = 'img/icons/bow_ico.png';
        else if (t === 'bowgun') directIcon = 'img/icons/bwg_ico.png';
        else if (t === 'staff') directIcon = 'img/icons/stf_ico.png';
        else if (t === 'magic device') directIcon = 'img/icons/md_ico.png';
        else if (t === 'knuckles') directIcon = 'img/icons/knu_ico.png';
        else if (t === 'halberd') directIcon = 'img/icons/hb_ico.png';
        else if (t === 'dagger') directIcon = 'img/icons/dagger_ico.png';
        else if (t.includes('armor')) directIcon = 'img/icons/armor_ico.png';
        else if (t === 'shield') directIcon = 'img/icons/shield_ico.png';
        else if (t === 'additional') directIcon = 'img/icons/add_ico.png';
        else if (t === 'special' || t === 'ring') directIcon = 'img/icons/special_ico.png';
        else if (t.indexOf('crysta') !== -1) {
          var crystaCat2 = 'normal';
          if (t.indexOf('weapon crysta') !== -1) crystaCat2 = 'weapon';
          else if (t.indexOf('armor crysta') !== -1) crystaCat2 = 'armor';
          else if (t.indexOf('special crysta') !== -1) crystaCat2 = 'special';
          else if (t.indexOf('additional crysta') !== -1 || t.indexOf('add crysta') !== -1) crystaCat2 = 'add';
          directIcon = 'img/icons/crysta_' + crystaCat2 + '_base.png';
        }
        
        imageEl.innerHTML = '<img src="' + directIcon + '" alt="' + esc(name) + '" style="max-width:100%;max-height:200px;object-fit:contain">';
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
        statsList.forEach(function(s) {
          var valStr = String(s.display || s.value);
          var cls = valStr.charAt(0) === '+' ? 'text-success fw-bold' : (valStr.charAt(0) === '-' ? 'text-danger fw-bold' : 'fw-semibold');
          html += '<div class="d-flex justify-content-between align-items-center py-2 border-bottom">';
          html += '<span class="text-muted">' + esc(s.name) + '</span>';
          html += '<span class="' + cls + '">' + esc(valStr) + '</span>';
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
          normalRows.forEach(function(r) {
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
          Object.keys(condGroups).forEach(function(label) {
            html += '<div class="mb-3 p-2 rounded" style="background:#f8f9fa">';
            html += '<div class="fw-bold text-primary small mb-2"><i class="bi bi-stars me-1"></i>' + esc(label) + '</div>';
            condGroups[label].forEach(function(statItem) {
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
        var noteLines = note.split(/\n|;/).map(function(line) { return line.trim(); }).filter(Boolean);
        noteLines.forEach(function(line) {
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

    // Enhancement Path / Recipe
    var recipeEl = document.getElementById('modalRecipe');
    if (recipeEl) {
      if (rec && allItems && allItems.length > 0) {
        recipeEl.innerHTML = buildEnhancementPath(item, allItems);
      } else {
        recipeEl.innerHTML = '<p class="text-muted text-center"><i class="bi bi-slash-circle me-1"></i>No enhancement path data available.</p>';
      }
    }
  }

  function open(itemName, rowIndex) {
    var requestTime = Date.now();
    lastOpenRequestTime = requestTime;

    var findAndPopulate = function(foundItem) {
      if (lastOpenRequestTime !== requestTime) return;
      
      // LAZY LOAD: Jika item tidak punya stats, ambil detail lengkapnya sekarang!
      if (foundItem && foundItem.ID && (!foundItem.StatsList || foundItem.StatsList.length === 0)) {
        console.log("Lazy loading full details for:", foundItem.Name);
        const statsEl = document.getElementById('modalStats');
        if (statsEl) statsEl.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted small">Loading complete stats...</p></div>';

        if (window.ToramSheets && window.ToramSheets.fetchItemFullDetails) {
          window.ToramSheets.fetchItemFullDetails(foundItem.ID).then(function(fullData) {
            if (fullData && fullData.stats) {
              foundItem.StatsList = fullData.stats.map(function(s) {
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
          }).catch(function(err) {
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
        setTimeout(function() { ensureItemDetailsLoaded(cb, retries - 1); }, 500);
      } else {
        console.warn("API data still not loaded after retries.");
        cb();
      }
      return;
    }

    if (sheetsCache) return cb();
    if (pendingItemDetailsFetch) {
      pendingItemDetailsFetch.then(cb).catch(function() { cb(); });
      return;
    }
    
    var s = window.ToramSheets.CONFIG.SHEETS.itemdetails;
    var sName = (s && s.name) ? s.name : 'ItemDetails';
    var sGid = (s && s.gid) ? s.gid : '';
    
    pendingItemDetailsFetch = window.ToramSheets.fetchSheet({ name: sName, gid: sGid })
      .then(function (csv) {
        sheetsCache = window.ToramSheets.parseCSV(csv);
        sheetsCache.forEach(function(r, i) { r._index = i; });
        pendingItemDetailsFetch = null;
        cb();
      })
      .catch(function (err) {
        console.error("Failed to load ItemDetails:", err);
        pendingItemDetailsFetch = null;
        if (retries > 0) setTimeout(function() { ensureItemDetailsLoaded(cb, retries - 1); }, 800);
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