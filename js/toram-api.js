// js/toram-api.js - Unified Type/Icon Detection Version
window.ToramSheets = (function () {
  'use strict';

  var dataState = { fullData: [], pageType: '', containerId: '' };
  var CONFIG = { SHEET_ID: 'API_MODE_CORYN_CLUB' };
  var BASE_URL = 'https://coryn.club/api/v1';
  var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 jam

  var ICON_BASE = (function () {
    var path = window.location.pathname;
    if (path.indexOf('/pages/') !== -1) return '../img/icons/';
    return 'img/icons/';
  }());

  // ============================================================
  // SINGLE SOURCE OF TRUTH: type_label -> kategori
  // Regex dibuat fleksibel: nerima spasi ATAU strip ("2 Handed Sword",
  // "2-Handed Sword", "two-handed sword", dst semua ke-cover).
  // ============================================================
  function normalizeType(type) {
    return (type || '').toLowerCase().replace(/[\[\]]/g, '').trim();
  }

  function typeToCategory(type) {
    var t = normalizeType(type);
    if (!t) return 'other';

    if (/\b1[\s-]?handed\b/.test(t) || /\bone[\s-]?hand(ed)?\b/.test(t)) return '1-handed sword';
    if (/\b2[\s-]?handed\b/.test(t) || /\btwo[\s-]?hand(ed)?\b/.test(t)) return '2-handed sword';
    if (/\bkatana\b/.test(t)) return 'katana';
    if (/\bbowgun\b/.test(t)) return 'bowgun'; // cek sebelum 'bow' polos
    if (/\bbow\b/.test(t)) return 'bow';
    if (/\bstaff\b/.test(t)) return 'staff';
    if (/\bmagic device\b/.test(t)) return 'magic device';
    if (/\bknuckle/.test(t)) return 'knuckles';
    if (/\bhalberd\b/.test(t)) return 'halberd';
    if (/\bdagger\b/.test(t)) return 'dagger';
    if (/\bshield\b/.test(t)) return 'shield';

    // Crysta: cek kategori eksplisit dulu, baru fallback ke warna dalam kurung
    if (/\bweapon crysta\b/.test(t)) return 'weapon crysta';
    if (/\barmor crysta\b/.test(t)) return 'armor crysta';
    if (/\bspecial crysta\b/.test(t)) return 'special crysta';
    if (/\badd(itional)? crysta\b/.test(t)) return 'additional crysta';
    if (/\bcrysta\b/.test(t)) {
      var colorMatch = t.match(/\(([^)]+)\)/);
      if (colorMatch) {
        var color = colorMatch[1].trim();
        if (color === 'green') return 'armor crysta';
        if (color === 'red') return 'weapon crysta';
        if (color === 'yellow') return 'additional crysta';
        if (color === 'purple') return 'special crysta';
      }
      return 'enhancer crysta';
    }

    if (/\barmor\b/.test(t)) return 'armor';
    if (/\badditional\b/.test(t)) return 'additional';
    if (/\bring\b/.test(t)) return 'ring';
    if (/\bspecial\b/.test(t)) return 'special';
    if (/\bmaterial\b|\bore\b|\bmetal\b|\bingot\b|\bcloth\b|\bfabric\b|\bthread\b|\byarn\b|\bwood\b|\blumber\b|\blog\b|\bbeast\b|\bhide\b|\bfur\b|\bleather\b|\bbone\b|\bhorn\b|\bfang\b|\bclaw\b|\bmana\b/.test(t)) return 'material';
    if (/\bconsumable\b|\bmedicine\b|\bpotion\b|\bherb\b/.test(t)) return 'consumable';

    return 'other';
  }

  // Kategori crysta versi pendek, dipakai buat nama file icon (crysta_XXX_tier.png)
  function getCrystaCategory(type) {
    var cat = typeToCategory(type);
    if (cat === 'weapon crysta') return 'weapon';
    if (cat === 'armor crysta') return 'armor';
    if (cat === 'special crysta') return 'special';
    if (cat === 'additional crysta') return 'add';
    if (cat === 'enhancer crysta') return 'normal';
    return null; // bukan crysta
  }

  // Deteksi sub-tipe material dari gabungan type + name (whole-word, case-insensitive)
  function resolveMaterialIcon(type, name) {
    var haystack = ((type || '') + ' ' + (name || '')).toLowerCase();
    if (/\bore\b/.test(haystack)) return 'ore_ico.png';
    if (/\bmetal\b|\bingot\b/.test(haystack)) return 'metal_ico.png';
    if (/\bcloth\b|\bfabric\b|\bthread\b|\byarn\b/.test(haystack)) return 'cloth_ico.png';
    if (/\bwood\b|\blumber\b|\blog\b/.test(haystack)) return 'wood_ico.png';
    if (/\bbeast\b|\bhide\b|\bfur\b|\bleather\b|\bbone\b|\bhorn\b|\bfang\b|\bclaw\b/.test(haystack)) return 'beast_ico.png';
    if (/\bmana\b/.test(haystack)) return 'mana_ico.png';
    if (/\bmedicine\b|\bpotion\b|\bherb\b/.test(haystack)) return 'medicine_ico.png';
    return null;
  }

  // Nama file icon (tanpa path) untuk kategori manapun. Dipakai grid & modal,
  // jadi hasilnya SELALU konsisten di semua tempat.
  function getItemIconFile(type, name, tier) {
    var cat = typeToCategory(type);
    switch (cat) {
      case '1-handed sword': return '1h_ico.png';
      case '2-handed sword': return '2h_ico.png';
      case 'katana': return 'ktn_ico.png';
      case 'bow': return 'bow_ico.png';
      case 'bowgun': return 'bwg_ico.png';
      case 'staff': return 'stf_ico.png';
      case 'magic device': return 'md_ico.png';
      case 'knuckles': return 'knu_ico.png';
      case 'halberd': return 'hb_ico.png';
      case 'dagger': return 'dagger_ico.png';
      case 'armor': return 'armor_ico.png';
      case 'shield': return 'shield_ico.png';
      case 'additional': return 'add_ico.png';
      case 'special':
      case 'ring': return 'special_ico.png';
      case 'material': return resolveMaterialIcon(type, name) || 'items_ico.png';
      case 'consumable': return 'medicine_ico.png';
      case 'weapon crysta':
      case 'armor crysta':
      case 'special crysta':
      case 'additional crysta':
      case 'enhancer crysta': {
        var c = getCrystaCategory(type) || 'normal';
        return 'crysta_' + c + '_' + (tier || 'base') + '.png';
      }
      default: return 'items_ico.png';
    }
  }

  // ============================================================
  // CORE API FUNCTIONS
  // ============================================================
  async function fetchAllItemsFromAPI() {
    const cacheKey = 'coryn_all_items_v6';
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
        await new Promise(r => setTimeout(r, 50));
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

    return itemsToProcess.map(function (item) {
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

  // FUNGSI ICON HTML — sekarang tinggal manggil getItemIconFile, gak ada logic duplikat lagi
  function iconHTML(imageURL, icon, type, altText, source, fit) {
    var fallbackImg = ICON_BASE + getItemIconFile(type, altText);
    var objectFit = fit || 'contain';
    return '<img src="' + fallbackImg + '" alt="' + esc(altText) + '" style="width:100%;height:100%;object-fit:' + objectFit + ';border-radius:inherit" onerror="this.onerror=null;this.src=\'' + ICON_BASE + 'items_ico.png\';" />';
  }

  return {
    CONFIG: CONFIG,
    dataState: dataState,
    load: load,
    fetchItemFullDetails: fetchItemFullDetails,
    esc: esc,
    iconHTML: iconHTML,
    typeToCategory: typeToCategory,
    getCrystaCategory: getCrystaCategory,
    resolveMaterialIcon: resolveMaterialIcon,
    getItemIconFile: getItemIconFile,
    ICON_BASE: ICON_BASE
  };
}());