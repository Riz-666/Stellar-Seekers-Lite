// js/toram-api.js - Final Hybrid Version with Smart Icon Fallback
window.ToramSheets = (function () {
  'use strict';

  var dataState = { fullData: [], pageType: '', containerId: '' };
  var CONFIG = { SHEET_ID: 'API_MODE_CORYN_CLUB' };
  var BASE_URL = 'https://coryn.club/api/v1';
  var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 jam

  // ============================================================
  // SMART ICON FALLBACK (Diadaptasi dari sheets.js asli kamu)
  // ============================================================
  var ICON_BASE = (function () {
    var path = window.location.pathname;
    if (path.indexOf('/pages/') !== -1) return '../img/icons/';
    return 'img/icons/';
  }());

  var TYPE_ICONS = {
  '1-handed sword': '1h_ico.png',
  '2-handed sword': '2h_ico.png',
  'katana': 'ktn_ico.png',
  'bow': 'bow_ico.png',
  'bowgun': 'bwg_ico.png',
  'staff': 'stf_ico.png',
  'magic device': 'md_ico.png',
  'knuckles': 'knu_ico.png',
  'halberd': 'hb_ico.png',
  'dagger': 'dagger_ico.png',
  'armor': 'armor_ico.png',
  'shield': 'shield_ico.png',
  'additional': 'add_ico.png',
  'special': 'special_ico.png',
  'ring': 'special_ico.png',
  'material': 'items_ico.png',
  'consumable': 'medicine_ico.png'
};

  function resolveIcon(type, name) {
    var t = (type || '').toLowerCase().trim();
    var n = (name || '').toLowerCase().trim();
    if (/\bore\b/i.test(n)) return ICON_BASE + 'ore_ico.png';
    
    var icon = TYPE_ICONS[t];
    if (!icon) {
      if (t.indexOf('boss') !== -1 || t === 'monster' || t === 'mob') icon = 'monsters_ico.png';
      else if (t.indexOf('quest') !== -1) icon = 'quest_ico.png';
      else if (t.indexOf('pet') !== -1) icon = 'pets_ico.png';
      else icon = 'items_ico.png'; // Default ultimate fallback
    }
    return ICON_BASE + icon;
  }

  // ============================================================
  // CORE API FUNCTIONS
  // ============================================================
  async function fetchAllItemsFromAPI() {
    const cacheKey = 'coryn_all_items_v6'; // Upgrade ke v6 agar cache lama yang error ter-reset
    const cacheTimeKey = 'coryn_all_items_time_v6';

    try {
      const cached = localStorage.getItem(cacheKey);
      const ts = parseInt(localStorage.getItem(cacheTimeKey) || '0', 10);
      if (cached && (Date.now() - ts) < CACHE_TTL) {
        console.log("✅ Data list dimuat dari Cache (Instan)");
        return JSON.parse(cached);
      }
    } catch (e) { console.error("Cache error:", e); }

    console.log("🚀 Memuat data dasar item dari API...");
    let allRawItems = [];
    let offset = 0;
    const limit = 100;
    let total = 0;
    let isFirst = true;

    while (true) {
      try {
        const url = `${BASE_URL}/items.php?limit=${limit}&offset=${offset}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP " + response.status);
        const json = await response.json();

        if (!json.success || !json.data) break;

        if (isFirst) {
          total = json.meta.total;
          isFirst = false;
          console.log(`Total item ditemukan: ${total}. Mulai download...`);
        }

        allRawItems = allRawItems.concat(json.data);
        
        const loadingStatus = document.getElementById('loadingStatus');
        if (loadingStatus) loadingStatus.textContent = `Memuat ${allRawItems.length} dari ${total} item...`;

        offset += limit;
        if (allRawItems.length >= total) break;
        await new Promise(r => setTimeout(r, 50)); // Jeda agar tidak di-blokir
      } catch (err) {
        console.error("Batch fetch error:", err);
        break;
      }
    }

    try {
      localStorage.setItem(cacheKey, JSON.stringify(allRawItems));
      localStorage.setItem(cacheTimeKey, Date.now().toString());
    } catch (e) { console.error("Cache save error:", e); }

    return allRawItems;
  }

  async function fetchItemFullDetails(itemId) {
    const cacheKey = 'coryn_item_full_' + itemId;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    try {
      const url = `${BASE_URL}/items.php?id=${itemId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("HTTP " + response.status);
      const json = await response.json();
      
      if (json.success && json.data) {
        localStorage.setItem(cacheKey, JSON.stringify(json.data));
        return json.data;
      }
    } catch (err) {
      console.error("Gagal ambil detail item:", itemId, err);
    }
    return null;
  }

  function normalizeItems(apiData) {
    let itemsToProcess = [];
    if (Array.isArray(apiData)) {
      itemsToProcess = apiData;
    } else if (apiData && apiData.success && Array.isArray(apiData.data)) {
      itemsToProcess = apiData.data;
    } else {
      return [];
    }

    return itemsToProcess.map(function(item) {
      var isEvent = false;
      var badge = '';
      if (item.meta && item.meta.badge) {
        isEvent = true;
        badge = item.meta.badge;
      }

      var note = '';
      var dropSource = '';
      var isUntradable = false;
      if (item.meta && item.meta.note) {
        note = item.meta.note;
        var noteLower = note.toLowerCase();
        if (noteLower.includes('dropped by')) {
          var dropMatch = note.match(/Dropped by ([^(]+)/i);
          dropSource = dropMatch ? dropMatch[1].trim() : 'Monster Drop';
        } else if (noteLower.includes('shop')) {
          dropSource = 'NPC Shop';
        } else if (noteLower.includes('quest')) {
          dropSource = 'Quest Reward';
        }
        if (noteLower.includes('untradable')) isUntradable = true;
      }

      var isCraftable = false;
      var craftAmount = 0;
      if (item.process && item.process > 0) {
        isCraftable = true;
        craftAmount = item.process_amount || 0;
        if (!dropSource) dropSource = 'Craft NPC';
      }

      // IMAGE URL: Format sesuai observasi kamu (hanya replace spasi)
      var imageUrl = '';
      if (item.id) {
        var safeName = (item.name || 'unknown').replace(/ /g, '%20');
        imageUrl = 'https://www.coryn.club/app/' + item.id + '-' + safeName + '.jpg';
        imageUrl += '?v=' + Date.now();
      }

      return {
        ID: item.id,
        Name: item.name || 'Unknown',
        Type: item.type_label ? item.type_label.replace(/[\[\]]/g, '') : 'Unknown',
        StatsList: [],
        StatsString: '',
        TotalStats: 0,
        IsEvent: isEvent,
        Badge: badge,
        Rarity: isEvent ? 'Event' : 'Non-Event',
        Source: dropSource || (isCraftable ? 'Craft' : 'Drop'),
        DropSource: dropSource,
        Note: note,
        IsUntradable: isUntradable,
        SellSpina: item.sell > 0 ? item.sell : 0,
        IsCraftable: isCraftable,
        CraftAmount: craftAmount,
        ImageURL: imageUrl,
        Icon: '',
        Meta: item.meta || {},
        _index: item.id
      };
    });
  }

  async function load(page, containerId) {
    if (page !== 'items') return;
    try {
      const rawItems = await fetchAllItemsFromAPI();
      const normalizedData = normalizeItems(rawItems);
      dataState.fullData = normalizedData;
      dataState.pageType = page;
      dataState.containerId = containerId;
      
      document.dispatchEvent(new CustomEvent('sheetsdataready', {
        detail: { data: normalizedData, page: page, containerId: containerId }
      }));
    } catch (err) {
      console.error("Fatal Error loading items:", err);
    }
  }

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // FUNGSI ICON HTML DENGAN SMART FALLBACK
  function iconHTML(imageURL, icon, type, altText, source, fit) {
  // PRIORITAS: Gunakan icon lokal dari folder img/icons/
  var t = (type || '').toLowerCase().trim();
  var fallbackImg = 'img/icons/items_ico.png';
  
  // Mapping ke file icon yang sudah ada di folder kamu
  if (t.includes('1-handed sword') || t.includes('one-hand sword')) fallbackImg = 'img/icons/1h_ico.png';
  else if (t.includes('2-handed sword') || t.includes('two-hand sword')) fallbackImg = 'img/icons/2h_ico.png';
  else if (t === 'katana') fallbackImg = 'img/icons/ktn_ico.png';
  else if (t === 'bow') fallbackImg = 'img/icons/bow_ico.png';
  else if (t === 'bowgun') fallbackImg = 'img/icons/bwg_ico.png';
  else if (t === 'staff') fallbackImg = 'img/icons/stf_ico.png';
  else if (t === 'magic device') fallbackImg = 'img/icons/md_ico.png';
  else if (t === 'knuckles') fallbackImg = 'img/icons/knu_ico.png';
  else if (t === 'halberd') fallbackImg = 'img/icons/hb_ico.png';
  else if (t === 'dagger') fallbackImg = 'img/icons/dagger_ico.png';
  else if (t.includes('armor')) fallbackImg = 'img/icons/armor_ico.png';
  else if (t === 'shield') fallbackImg = 'img/icons/shield_ico.png';
  else if (t === 'additional') fallbackImg = 'img/icons/add_ico.png';
  else if (t === 'special' || t === 'ring') fallbackImg = 'img/icons/special_ico.png';
  else if (t.includes('material') || t.includes('ore')) fallbackImg = 'img/icons/items_ico.png';
  
  var objectFit = fit || 'contain';
  
  // Jangan coba load dari Coryn, langsung pakai icon lokal
  return '<img src="' + fallbackImg + '" alt="' + esc(altText) + '" style="width:100%;height:100%;object-fit:' + objectFit + ';border-radius:inherit" />';
}

  function typeToCategory(type) {
  var t = (type || '').toLowerCase().trim();
  // Return value yang SAMA PERSIS dengan dropdown
  if (t.indexOf('1-handed sword') !== -1 || t.indexOf('one-hand sword') !== -1) return '1-handed sword';
  if (t.indexOf('2-handed sword') !== -1 || t.indexOf('two-hand sword') !== -1) return '2-handed sword';
  if (t === 'katana') return 'katana';
  if (t === 'bow') return 'bow';
  if (t === 'bowgun') return 'bowgun';
  if (t === 'staff') return 'staff';
  if (t === 'magic device') return 'magic device';
  if (t === 'knuckles') return 'knuckles';
  if (t === 'halberd') return 'halberd';
  if (t === 'dagger') return 'dagger';
  if (t === 'armor' || t.indexOf('armor') !== -1) return 'armor';
  if (t === 'shield') return 'shield';
  if (t === 'additional') return 'additional';
  if (t === 'special') return 'special';
  if (t === 'ring') return 'ring';
  if (t === 'material') return 'material';
  if (t === 'consumable') return 'consumable';
  return 'other';
}

  return {
    CONFIG: CONFIG,
    dataState: dataState,
    load: load,
    fetchItemFullDetails: fetchItemFullDetails,
    esc: esc,
    iconHTML: iconHTML,
    typeToCategory: typeToCategory
  };
}());