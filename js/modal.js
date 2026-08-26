// js/modal.js - Improved Item Modal
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
  
  // Parse berbagai format recipe
  var paths = [];
  
  // Format 1: [Item1; Item2] [Item1; Item3] - Multiple paths dengan bracket
  var bracketMatches = recipe.match(/\[([^\]]+)\]/g);
  if (bracketMatches && bracketMatches.length > 0) {
    bracketMatches.forEach(function(path) {
      var content = path.replace(/[\[\]]/g, '').trim();
      var items = content.split(';').map(function(i) { return i.trim(); }).filter(Boolean);
      if (items.length > 0) paths.push(items);
    });
  } 
  // Format 2: Item1, Item2, Item3 - Comma separated (single path)
  else if (recipe.includes(',')) {
    var items = recipe.split(',').map(function(i) { return i.trim(); }).filter(Boolean);
    if (items.length > 0) paths.push(items);
  }
  // Format 3: Item1; Item2; Item3 - Semicolon separated tanpa bracket (single path)
  else if (recipe.includes(';')) {
    var items = recipe.split(';').map(function(i) { return i.trim(); }).filter(Boolean);
    if (items.length > 0) paths.push(items);
  }
  // Format 4: Single item tanpa separator
  else {
    var trimmed = recipe.trim();
    if (trimmed) paths.push([trimmed]);
  }
  
  if (paths.length === 0) {
    return '<p class="text-muted text-center">Invalid recipe format.</p>';
  }
  
  // Determine item type for icons
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
    if (paths.length > 1) {
      html += '<div class="badge bg-primary mb-2">Path ' + (pathIndex + 1) + '</div>';
    }
    html += '<div class="path-items d-flex flex-column gap-2">';
    
    pathItems.forEach(function(itemName, index) {
      var isFirst = index === 0;
      var isLast = index === pathItems.length - 1;
      var itemData = null;
      
      // Find item in database
      if (allItems) {
        itemData = allItems.find(function(i) { 
          return (i['Name'] || '').toLowerCase() === itemName.toLowerCase(); 
        });
      }
      
      var imgUrl = itemData ? (itemData['ImageURL'] || '') : '';
      var itemType = itemData ? (itemData['Type'] || '') : '';
      var itemLevel = itemData ? (itemData['Level'] || '') : '';
      
      // Determine icon based on position and category
      var iconImg = '';
      if (isLast) {
        // Max level - gunakan icon max
        iconImg = iconBase + 'crysta_' + category + '_max.png';
      } else {
        // Not max - gunakan icon up
        iconImg = iconBase + 'crysta_' + category + '_up.png';
      }
      
      html += '<div class="d-flex align-items-center">';
      
      // Arrow connector (except for first item)
      if (index > 0) {
        html += '<div class="me-2 text-muted" style="font-size: 1.2rem; width: 20px; text-align: center;">↓</div>';
      } else {
        html += '<div style="width: 20px;"></div>';
      }
      
      // Item card
      html += '<div class="item-node p-2 rounded border flex-grow-1 d-flex align-items-center gap-2" style="background: ' + (isFirst ? '#e7f3ff' : '#f8f9fa') + '; ' + (isFirst ? 'border-primary' : 'border-secondary') + '">';
      
      // Icon image
      html += '<img src="' + esc(iconImg) + '" onerror="this.src=\'' + iconBase + 'no_image.png\'" style="width: 40px; height: 40px; object-fit: contain;">';
      
      // Item info (if available)
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
        
        if (isFirst) {
          html += '<span class="badge bg-success">Start</span>';
        } else if (isLast) {
          html += '<span class="badge bg-danger">Final</span>';
        }
      } else {
        // Item not found in database
        html += '<div class="flex-grow-1">';
        html += '<div class="fw-bold small">' + esc(itemName) + '</div>';
        html += '<div class="text-muted" style="font-size: 0.75rem;">Not in database</div>';
        html += '</div>';
        
        if (isFirst) {
          html += '<span class="badge bg-success">Start</span>';
        } else if (isLast) {
          html += '<span class="badge bg-danger">Final</span>';
        }
      }
      
      html += '</div>'; // End item-node
      html += '</div>'; // End flex container
    });
    
    html += '</div>'; // End path-items
    html += '</div>'; // End path-container
  });
  
  html += '</div>'; // End enhancement-paths
  
  return html;
}

  function populate(item, allItems) {
    const nameEl = document.getElementById('modalName');
    const typeEl = document.getElementById('modalType');
    
    if (!nameEl) {
      console.error("ERROR: Modal elements not found!");
      return;
    }

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

    // Name & Type
    nameEl.innerHTML = esc(name);
    if (typeEl) {
      typeEl.innerHTML = '<span class="text-muted">[' + esc(type) + ']' + (level && level !== '0' ? ' · Lv.' + level : '') + '</span>';
    }
    
    // Image
    var modalIconBase = (window.location.pathname.indexOf('/pages/') !== -1) ? '../img/icons/' : 'img/icons/';
    var imageEl = document.getElementById('modalImage');
    var errHandler = 'onerror="this.onerror=null;this.src=\'img/icons/no_image.png\';"';
    
    if (imageEl) {
      if (img) {
        imageEl.innerHTML = '<img src="' + esc(img) + '" alt="' + esc(name) + '" ' + errHandler + ' style="max-width:100%;max-height:200px;object-fit:contain">';
      } else if (typeof icon === 'string' && (icon.indexOf('/') !== -1 || icon.indexOf('.png') !== -1)) {
        imageEl.innerHTML = '<img src="' + esc(icon) + '" alt="' + esc(name) + '" ' + errHandler + ' style="max-width:100%;max-height:200px;object-fit:contain">';
      } else {
        imageEl.innerHTML = '<div class="d-flex align-items-center justify-content-center" style="height:150px;background:#f8f9fa;border-radius:8px"><i class="bi bi-box-seam fs-1 text-muted"></i></div>';
      }
    }

    // Prices
    var pricesEl = document.getElementById('modalPrices');
    if (pricesEl) {
      pricesEl.innerHTML = formatPrice(sell, sell2, modalIconBase);
    }

    // Stats
    var statsEl = document.getElementById('modalStats');
    if (statsEl) {
      if (stats) {
        var html = '<div class="stats-container">';
        var normalRows = [];
        var condGroups = {};
        
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
            if (ci2 > 0) {
              normalRows.push({ name: part.substring(0, ci2).trim(), value: part.substring(ci2 + 1).trim() });
            }
          }
        });

        // Normal stats
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

        // Conditional stats
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

    // Obtain
    var obtainEl = document.getElementById('modalObtain');
    if (obtainEl) {
      if (obt) {
        var obtHtml = '<div class="obtain-list">';
        obt.split(';').forEach(function (op) {
          op = op.trim();
          if (!op) return;
          var opLow = op.toLowerCase();
          var obtIcon = 'bi-box';
          var obtColor = 'secondary';
          
          if (opLow.indexOf('drop') >= 0) { obtIcon = 'bi-bug'; obtColor = 'danger'; }
          else if (opLow.indexOf('quest') >= 0) { obtIcon = 'bi-journal-text'; obtColor = 'info'; }
          else if (opLow.indexOf('shop') >= 0 || opLow.indexOf('npc') >= 0) { obtIcon = 'bi-shop'; obtColor = 'success'; }
          else if (opLow.indexOf('craft') >= 0) { obtIcon = 'bi-hammer'; obtColor = 'warning'; }

          obtHtml += '<div class="d-flex align-items-start gap-2 p-2 mb-2 rounded bg-light">';
          obtHtml += '<i class="bi ' + obtIcon + ' text-' + obtColor + ' fs-5 mt-1"></i>';
          obtHtml += '<span class="small">' + esc(op) + '</span>';
          obtHtml += '</div>';
        });
        obtHtml += '</div>';
        obtainEl.innerHTML = obtHtml;
      } else {
        obtainEl.innerHTML = '<p class="text-muted text-center">No obtain info.</p>';
      }
    }

    // Enhancement Path / Recipe
    var recipeEl = document.getElementById('modalRecipe');
    if (recipeEl) {
      if (allItems && allItems.length > 0) {
        recipeEl.innerHTML = buildEnhancementPath(item, allItems);
      } else {
        recipeEl.innerHTML = '<p class="text-muted text-center">Loading enhancement path...</p>';
      }
    }
  }

  function open(itemName, rowIndex) {
    var requestTime = Date.now();
    lastOpenRequestTime = requestTime;

    var findAndPopulate = function() {
      if (lastOpenRequestTime !== requestTime) return;
      var found = null;
      var search = (itemName || '').trim().toLowerCase();
      
      if (sheetsCache) {
        if (!isNaN(rowIndex) && sheetsCache[rowIndex] && (sheetsCache[rowIndex]['Name'] || '').trim().toLowerCase() === search) {
          found = sheetsCache[rowIndex];
        } else {
          for (var i = 0; i < sheetsCache.length; i++) {
            if ((sheetsCache[i]['Name'] || '').trim().toLowerCase() === search) {
              found = sheetsCache[i];
              break;
            }
          }
        }
      }
      
      populate(found, sheetsCache);
      
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(document.getElementById('itemModal'));
      }
      modalInstance.show();
    };

    if (window.ToramSheets && window.ToramSheets.CONFIG.SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID') {
      if (sheetsCache) {
        findAndPopulate();
      } else {
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(document.getElementById('itemModal'));
        }
        modalInstance.show();
        populate(null, []); 
        
        ensureItemDetailsLoaded(function() { 
          findAndPopulate(); 
        }, 2);
      }
    } else {
      populate(null, []);
      if (!modalInstance) modalInstance = new bootstrap.Modal(document.getElementById('itemModal'));
      modalInstance.show();
    }
  }

  function ensureItemDetailsLoaded(cb, retries) {
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
        if (retries > 0) {
          setTimeout(function() { ensureItemDetailsLoaded(cb, retries - 1); }, 800);
        } else {
          cb();
        }
      });
  }

  return { open: open };
}());