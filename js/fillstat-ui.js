// fillstat-ui.js: VERSI FINAL & LENGKAP (ANTI CRASH + FILTER AKTIF)

document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("startSimBtn")) return;

  // ===== 0. PERBAIKAN KRUSIAL: Cegah t4stat.js crash mencari elemen yang tidak ada =====
  MainApp.prototype.updateNavigationBar = function () {
    return;
  };

  // ===== 1. BYPASS MainApp.spawn =====
  MainApp.prototype.spawn = function (id) {
    const starting_pot = parseInt(document.getElementById("starting_pot").value) || 0;
    const recipe_pot = parseInt(document.getElementById("recipe_pot").value) || 0;
    const weap_arm = document.getElementById("weap_arm").value;
    const tec = parseInt(document.getElementById("tec").value) || 255;
    const proficiency = parseInt(document.getElementById("proficiency").value) || 0;
    const mat_reduction = document.getElementById("mat_reduction").checked || false;

    if (starting_pot <= 0 || recipe_pot <= 0) {
      alert("POT Awal dan POT Resep harus lebih dari 0!");
      return;
    }

    this.saveSettings({ tec, proficiency, mat_reduction });
    const workspace_id = id || this.getNewWorkspaceId();

    const details = {
      weap_arm, starting_pot, recipe_pot, workspace_id, tec, proficiency, mat_reduction,
    };
    this.stats[workspace_id] = new Stat(details);
    this.current = workspace_id;

    const workspaceArea = document.getElementById("workspaceArea");
    if (workspaceArea) workspaceArea.style.display = "block";

    this.saveToStorage();
    return this.stats[workspace_id];
  };

  // ===== 2. EVENT LISTENERS TOMBOL UTAMA =====
  document.getElementById("confirmButton").addEventListener("click", () => {
    const current = App.getCurrent();
    if (current) current.confirm();
  });

  document.getElementById("repeatButton").addEventListener("click", () => {
    const current = App.getCurrent();
    if (current) current.repeat();
  });

  document.getElementById("undoButton").addEventListener("click", () => {
    const current = App.getCurrent();
    if (current) current.undo();
  });

  document.getElementById("redoButton").addEventListener("click", () => {
    const current = App.getCurrent();
    if (current) current.redo();
  });

  // ===== 3. HELPER FUNCTIONS UNTUK TOMBOL =====
  window.slotSetMax = function (slotNum, isNegative) {
    const current = App.getCurrent();
    if (!current || !current.slots[slotNum]) return;
    const slot = current.slots[slotNum];
    if (!slot.stat_data) { alert("Pilih stat dulu!"); return; }

    const maxSteps = slot.getMaxSteps(isNegative);
    if (isNegative && maxSteps > 0) {
      slot.changeValueBySteps(-maxSteps, false);
    } else {
      slot.changeValueBySteps(maxSteps, false);
    }
  };

  window.slotChangeByOne = function (slotNum, direction) {
    const current = App.getCurrent();
    if (!current || !current.slots[slotNum]) return;
    const slot = current.slots[slotNum];
    if (!slot.stat_data) { alert("Pilih stat dulu!"); return; }
    slot.changeValueBySteps(direction, true);
  };

  // ===== 4. Stat.prototype.loadDisplay =====
  Stat.prototype.loadDisplay = function () {
    let slotsHtml = "";
    for (let i = 0; i < 8; i++) {
      const options = this.buildStatOptions(i);
      slotsHtml += `
        <div class="card mb-2 border-0 shadow-sm" style="background: #f8f9fa;">
          <div class="card-body py-2">
            <div class="row align-items-center g-2">
              <div class="col-12 col-md-1 text-center">
                <span class="badge bg-primary rounded-pill">${i + 1}</span>
              </div>
              <div class="col-12 col-md-4">
                <select class="form-select form-select-sm" id="slot${i}" onchange="App.getCurrent().slots[${i}].onUpdate()">
                  <option value="0">PILIH STAT</option>
                  ${options}
                </select>
              </div>
              <div class="col-12 col-md-7">
                <div class="input-group input-group-sm">
                  <button class="btn btn-outline-danger" type="button" onclick="window.slotSetMax(${i}, true)" title="Max Negatif">
                    <i class="bi bi-skip-start-fill"></i> -Max
                  </button>
                  <button class="btn btn-outline-secondary" type="button" onclick="window.slotChangeByOne(${i}, -1)" title="Kurangi 1">
                    <i class="bi bi-dash"></i>
                  </button>
                  <input class="form-control form-control-sm text-center fw-bold" type="text" id="input${i}" value="0" 
                         onkeydown="App.getCurrent().slots[${i}].onKeyPress(event)" 
                         oninput="App.getCurrent().slots[${i}].onUpdate()">
                  <button class="btn btn-outline-secondary" type="button" onclick="window.slotChangeByOne(${i}, 1)" title="Tambah 1">
                    <i class="bi bi-plus"></i>
                  </button>
                  <button class="btn btn-outline-success" type="button" onclick="window.slotSetMax(${i}, false)" title="Max Positif">
                    +Max <i class="bi bi-skip-end-fill"></i>
                  </button>
                </div>
                <div class="mt-1 text-center">
                  <small class="text-muted" id="matcost${i}" style="font-size: 0.75rem;"></small>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    const container = document.getElementById("slotsContainer");
    if (container) container.innerHTML = slotsHtml;

    this.updatePotentialSuccessDisplay();
    this.updateMaterialCosts();
    this.updateFormulaDisplay();
  };

  // ===== 5. Stat.prototype.buildStatOptions =====
  Stat.prototype.buildStatOptions = function (slotIndex) {
    if (typeof OPTIONS === "undefined" || !Array.isArray(OPTIONS)) return "";
    let options = "";
    let lastCat = "";
    let catId = 0;
    for (let data of OPTIONS) {
      if (this.type === "a" && data.cat === "Awaken Elements") continue;
      if (lastCat !== data.cat) {
        options += `<option value="-1" disabled class="fw-bold text-primary">&gt;-- ${data.cat} --&lt;</option>`;
        lastCat = data.cat;
      }
      catId++;
      options += `<option value="${catId}">${data.name}</option>`;
    }
    return options;
  };

  // ===== 6. FIX UTAMA: updatePotentialSuccessDisplay =====
  Stat.prototype.updatePotentialSuccessDisplay = function () {
    const potEl = document.getElementById("potentialDisplay");
    const sucEl = document.getElementById("successRateDisplay");
    const confirmBtn = document.getElementById("confirmButton");

    if (potEl) potEl.innerHTML = `Potential: ${this.future_pot} / ${this.pot}`;
    if (sucEl) {
      const rate = this.getSuccessRate();
      sucEl.innerHTML = `Success Rate: ${rate}%`;
      sucEl.className = `badge fs-6 ${rate >= 80 ? 'bg-success' : rate >= 60 ? 'bg-warning text-dark' : 'bg-danger'}`;
    }
    if (confirmBtn) {
      confirmBtn.disabled = this.pot === this.future_pot || this.finished;
    }
  };

  // ===== 7. Stat.prototype.updateMaterialCosts =====
  Stat.prototype.updateMaterialCosts = function () {
    const tbody = document.querySelector("#materialTable tbody");
    if (!tbody) return;

    const materials = [
      { key: "Metal", display: "Metal / Logam" },
      { key: "Cloth", display: "Cloth / Kain" },
      { key: "Beast", display: "Beast / Fauna" },
      { key: "Wood", display: "Wood / Kayu" },
      { key: "Medicine", display: "Medicine / Obat" },
      { key: "Mana", display: "Mana" }
    ];

    let html = "";
    let totalCost = 0;

    materials.forEach(mat => {
      const amount = this.mats[mat.key] || 0;
      const stepAmount = this.step_mats[mat.key] || 0;
      const style = amount > 0 ? "color: #198754; font-weight: bold;" : "color: #6c757d;";
      const stepStyle = stepAmount > 0 ? "color: #0d6efd; font-weight: bold;" : "";

      html += `<tr>
          <td class="text-muted small">${mat.display}</td>
          <td class="text-end small" style="${style}">${amount.toLocaleString()}</td>
          <td class="text-end small" style="${stepStyle}">${stepAmount > 0 ? '+' + stepAmount.toLocaleString() : '-'}</td>
        </tr>`;
      totalCost += amount;
    });

    html += `<tr class="table-light">
        <th class="small pt-2">Total Material</th>
        <th class="text-end small pt-2">${totalCost.toLocaleString()}</th>
        <th class="text-end small pt-2">${this.step_max_mats > 0 ? '+' + this.step_max_mats : '-'}</th>
      </tr>`;

    tbody.innerHTML = html;
  };

  // ===== 8. Stat.prototype.updateFormulaDisplay =====
  Stat.prototype.updateFormulaDisplay = function () {
    const el = document.getElementById("formulaDisplay");
    if (!el) return;

    let display = this.steps.getDisplay();
    if (typeof this.finished === "number") {
      display += `<div class="alert alert-success mt-3 mb-0">
          <strong>🎯 Simulasi Selesai!</strong><br>
          <small>Final Success Rate: <strong>${this.getSuccessRate()}%</strong><br>
          Total Materials: ${Object.keys(this.mats).filter(mat => this.mats[mat]).map(mat => `${this.mats[mat]} ${mat}`).join(" / ")}</small>
        </div>`;
    }

    el.innerHTML = display || '<em class="text-muted">Belum ada langkah yang dilakukan. Pilih stats dan klik Confirm untuk memulai.</em>';

    const undoBtn = document.getElementById("undoButton");
    const redoBtn = document.getElementById("redoButton");
    const repeatBtn = document.getElementById("repeatButton");
    const saveBtn = document.getElementById("saveFormulaBtn");

    if (undoBtn) undoBtn.disabled = !this.steps.formula.length;
    if (redoBtn) redoBtn.disabled = !this.steps.redo_queue.length;
    if (repeatBtn) repeatBtn.disabled = !this.steps.formula.length || !!this.finished;

    if (saveBtn) {
      saveBtn.style.display = this.steps.formula.length > 0 ? "inline-block" : "none";
    }
  };

  // ===== 9. Stat.prototype.lockAllSlots & unlockAllSlots =====
  Stat.prototype.lockAllSlots = function () {
    for (let slot of this.slots) if (slot.lock) slot.lock();
    const confirmBtn = document.getElementById("confirmButton");
    const repeatBtn = document.getElementById("repeatButton");
    if (confirmBtn) confirmBtn.disabled = true;
    if (repeatBtn) repeatBtn.disabled = true;
  };

  Stat.prototype.unlockAllSlots = function () {
    for (let slot of this.slots) if (slot.unlock) slot.unlock();
    const confirmBtn = document.getElementById("confirmButton");
    const repeatBtn = document.getElementById("repeatButton");
    if (confirmBtn) confirmBtn.disabled = false;
    if (repeatBtn) repeatBtn.disabled = false;
  };

  // ===== 10. Formula.prototype.getDisplay =====
  if (typeof Formula !== "undefined") {
    Formula.prototype.getDisplay = function () {
      if (!this.condensed_formula.length) return '';
      return this.condensed_formula.map((step, index) => {
        const repeat = step.repeat > 1 ? `<span class="badge bg-primary">(x${step.repeat})</span>` : "";
        return `<div class="card mb-2 border-start border-3 border-primary">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-center">
                <div><strong class="text-primary">#${index + 1}.</strong> <span class="text-dark">${step.text}</span> ${repeat}</div>
                <small class="text-muted">POT: ${step.pot_before} → ${step.pot_after}</small>
              </div>
              <div class="mt-1"><small class="text-muted">Materials: ${Object.keys(step.step_mats).filter(m => step.step_mats[m]).map(m => `${step.step_mats[m]} ${m}`).join(", ") || "None"}</small></div>
            </div>
          </div>`;
      }).join("");
    };
  }

  // ===== 11. Event Listener Tombol Mulai =====
  document.getElementById("startSimBtn").addEventListener("click", function () {
    const startPot = parseInt(document.getElementById("starting_pot").value) || 0;
    const recipePot = parseInt(document.getElementById("recipe_pot").value) || 0;
    if (startPot <= 0 || recipePot <= 0) {
      alert("POT Awal dan POT Resep harus lebih dari 0!");
      return;
    }
    App.spawn();
  });

  // ===== 12. Load settings awal =====
  if (typeof App !== "undefined") {
    App.loadSettings();
    setInterval(() => { if (App) App.saveToStorage(); }, 30000);
  }

  // ===== 13. SAVE & LOAD FORMULA (CARD VIEW WITH FILTER) =====
  const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxf2PkN5PGfKuc1Ig775hGJBxAd09PVZYmLdusbcJo5Ax5qT2xzwkEI129XoBtKnf438w/exec";

  // --- FUNGSI SIMPAN ---
  document.getElementById("saveFormulaBtn")?.addEventListener("click", async () => {
    const current = App.getCurrent();
    if (!current || current.steps.formula.length === 0) {
      alert("Tidak ada langkah untuk disimpan!");
      return;
    }

    const formulaName = prompt("Masukkan nama untuk rumus ini:");
    if (!formulaName) return;

    const formulaData = {
      action: 'saveFormula',
      FormulaName: formulaName,
      Type: current.type === 'w' ? 'Weapon' : 'Armor',
      StartingPOT: current.starting_pot,
      RecipePOT: current.recipe_pot,
      TEC: current.tec,
      Proficiency: current.proficiency || 0,
      MatReduction: current.mat_reduction ? 'TRUE' : 'FALSE',
      Formula: JSON.stringify(current.steps.formula),
      CreatedAt: new Date().toISOString(),
      CreatedBy: 'StellarSeekers'
    };

    let savedFormulas = JSON.parse(localStorage.getItem('fillstat_formulas') || '[]');
    savedFormulas.push(formulaData);
    localStorage.setItem('fillstat_formulas', JSON.stringify(savedFormulas));

    try {
      fetch(GAS_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulaData)
      });
      alert("✅ Rumus berhasil disimpan ke Browser & sedang disinkronkan ke Google Sheets!");
    } catch (error) {
      console.warn("GAS POST Warning:", error);
      alert("✅ Rumus berhasil disimpan di Browser! (Sinkronisasi Sheet berjalan di latar belakang).");
    }
  });

  // --- HELPER: Parse Formula dengan Aman ---
  function parseFormulaData(f) {
    try {
      const raw = f.Formula || f.formula;
      if (typeof raw === 'string') {
        return JSON.parse(raw);
      }
      return raw;
    } catch (e) {
      console.warn("Gagal parse formula:", e);
      return null;
    }
  }

  // --- HELPER: Hitung Final Stats dari Text Step ---
  function calculateFinalStats(formulaData) {
    let finalStatsMap = {};
    formulaData.forEach(step => {
      if (step.text) {
        const regex = /([A-Za-z0-9%() ]+?)\s*([+-]?\d+)/g;
        let match;
        while ((match = regex.exec(step.text)) !== null) {
          let statName = match[1].trim();
          let value = parseInt(match[2], 10);
          if (!finalStatsMap[statName]) {
            finalStatsMap[statName] = 0;
          }
          finalStatsMap[statName] += value;
        }
      }
    });
    return Object.entries(finalStatsMap).map(([statName, value]) => {
      const sign = value >= 0 ? '+' : '';
      return `${statName} ${sign}${value}`;
    });
  }

  // --- FUNGSI LOAD & RENDER CARD ---
  window.loadAndRenderFormulas = async function () {
    console.log("🔄 Memulai load formulas...");
    let formulas = [];
    const grid = document.getElementById('formulasGrid');
    const emptyState = document.getElementById('formulasEmptyState');

    if (grid) {
      grid.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted">Memuat data rumus...</p></div>';
    }
    if (emptyState) emptyState.classList.add('d-none');

    try {
      console.log("📡 Fetching dari Google Sheets...");
      const response = await fetch(GAS_API_URL + '?action=getFormulas');
      const textResponse = await response.text();
      let result = {};
      try { result = JSON.parse(textResponse); } catch (e) {}

      if (result.success === true && result.data && result.data.length > 0) {
        formulas = result.data;
        console.log(`✅ Berhasil memuat ${formulas.length} rumus dari Sheets.`);
      }
    } catch (error) {
      console.error(" Error fetching dari Sheets:", error);
    }

    if (formulas.length === 0) {
      console.log("🔄 Mencoba load dari LocalStorage...");
      formulas = JSON.parse(localStorage.getItem('fillstat_formulas') || '[]');
    }

    window._allSavedFormulas = formulas;
    
    // Reset filter inputs
    const searchInput = document.getElementById('formulaSearchInput');
    const typeFilter = document.getElementById('formulaTypeFilter');
    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = 'all';

    // PENTING: Setup event listener setiap kali load
    setupFormulaEventListeners();
    applyFormulaFilters();
  };

  // --- FUNGSI FILTER & SEARCH ---
  function applyFormulaFilters() {
    const searchInput = document.getElementById('formulaSearchInput');
    const typeFilter = document.getElementById('formulaTypeFilter');
    
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const typeVal = typeFilter ? typeFilter.value : 'all';

    const filtered = (window._allSavedFormulas || []).filter(f => {
      const name = (f.FormulaName || f.formulaname || '').toLowerCase();
      const type = (f.Type || f.type || '').toLowerCase();
      
      const matchSearch = name.includes(query);
      const matchType = typeVal === 'all' || type === typeVal.toLowerCase();
      
      return matchSearch && matchType;
    });

    renderFormulaCards(filtered);
  }

  // --- SETUP EVENT LISTENER (INI YANG TADI HILANG!) ---
  function setupFormulaEventListeners() {
    const searchInput = document.getElementById('formulaSearchInput');
    const typeFilter = document.getElementById('formulaTypeFilter');
    
    if (searchInput) {
      searchInput.addEventListener('input', applyFormulaFilters);
    }
    if (typeFilter) {
      typeFilter.addEventListener('change', applyFormulaFilters);
    }
  }

  // --- FUNGSI RENDER CARD ---
  function renderFormulaCards(formulasToRender) {
    const grid = document.getElementById('formulasGrid');
    const emptyState = document.getElementById('formulasEmptyState');
    
    if (!grid) return;
    grid.innerHTML = '';

    if (!formulasToRender || formulasToRender.length === 0) {
      if (emptyState) emptyState.classList.remove('d-none');
      return;
    }
    
    if (emptyState) emptyState.classList.add('d-none');

    formulasToRender.forEach((f, idx) => {
      const originalIndex = window._allSavedFormulas.indexOf(f);
      if (originalIndex === -1) return;

      const name = f.FormulaName || f.formulaname || `Rumus ${originalIndex + 1}`;
      const type = f.Type || f.type || 'Unknown';
      const date = f.CreatedAt || f.createdat ? new Date(f.CreatedAt || f.createdat).toLocaleDateString('id-ID') : 'N/A';
      const startPot = f.StartingPOT || f.startingpot || '?';
      const recipePot = f.RecipePOT || f.recipepot || '?';
      const tec = f.TEC || f.tec || '0';
      const prof = f.Proficiency || f.proficiency || '0';
      const matRed = (f.MatReduction || f.matreduction) === 'TRUE' || (f.MatReduction || f.matreduction) === true ? 'Ya' : 'Tidak';

      const formulaData = parseFormulaData(f);
      let finalStats = [];
      let successRate = '-';
      let highestMat = { name: '-', amount: 0 };

      if (formulaData && Array.isArray(formulaData)) {
        const lastStep = formulaData[formulaData.length - 1];
        if (lastStep && lastStep.finished !== undefined && lastStep.finished !== false) {
          successRate = lastStep.finished + '%';
        }
        
        const matNames = ['Metal', 'Cloth', 'Beast', 'Wood', 'Medicine', 'Mana'];
        matNames.forEach(mat => {
          let total = 0;
          formulaData.forEach(step => {
            if (step.step_mats && step.step_mats[mat]) total += step.step_mats[mat];
          });
          if (total > 0 && total > highestMat.amount) {
            highestMat = { name: mat, amount: total };
          }
        });
        
        finalStats = calculateFinalStats(formulaData);
      }

      let statsHtml = '';
      if (finalStats.length > 0) {
        statsHtml = '<div class="mb-2 p-2 rounded bg-light" style="max-height: 150px; overflow-y: auto;">';
        statsHtml += '<small class="text-muted d-block mb-1"><strong>Final Stats:</strong></small>';
        statsHtml += '<div class="d-flex flex-wrap gap-1">';
        finalStats.forEach(stat => {
          const isPositive = stat.includes('+');
          statsHtml += `<span class="badge ${isPositive ? 'bg-success' : 'bg-danger'} text-white" style="font-size: 0.7rem;">${stat}</span>`;
        });
        statsHtml += '</div></div>';
      }
      
      let matsHtml = '';
      if (highestMat.amount > 0) {
        matsHtml = `<div class="mb-2"><small class="text-muted">Highest Mat: <strong>${highestMat.name} (${highestMat.amount.toLocaleString()})</strong></small></div>`;
      }
      
      const card = document.createElement('div');
      card.className = 'col-md-6 col-lg-4 fade-in-up';
      card.innerHTML = `
        <div class="form-card h-100 p-3 d-flex flex-column" style="transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="fw-bold mb-0 text-truncate" style="color: var(--blue-dark); max-width: 60%;" title="${name}">${name}</h6>
            <small class="text-muted">${date}</small>
          </div>
          <div class="mb-2">
            <div class="d-flex flex-wrap gap-1 mb-2">
              <span class="badge ${type === 'Weapon' ? 'bg-primary' : 'bg-info'}">${type}</span>
              <span class="badge bg-secondary">TEC: ${tec}</span>
              <span class="badge bg-warning text-dark">Prof: ${prof}</span>
              <span class="badge bg-dark">MatRed: ${matRed}</span>
            </div>
            <p class="mb-1 small"><strong>POT:</strong> ${startPot} → ${recipePot}</p>
            ${successRate !== '-' ? `<p class="mb-1 small"><strong>Success Rate:</strong> <span class="text-success fw-bold">${successRate}</span></p>` : ''}
          </div>
          ${statsHtml}
          ${matsHtml}
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-primary-custom flex-fill btn-sm" onclick="window.showFormulaDetail(${originalIndex})">
              <i class="bi bi-eye me-1"></i> Detail
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // --- FUNGSI TAMPILKAN DETAIL FORMULA ---
  window.showFormulaDetail = function (index) {
    const f = window._allSavedFormulas[index];
    if (!f) return;

    const name = f.FormulaName || f.formulaname || `Rumus ${index + 1}`;
    const formulaData = parseFormulaData(f);

    if (!formulaData || !Array.isArray(formulaData)) {
      alert("Data formula tidak valid atau rusak.");
      return;
    }

    const matTotals = { Metal: 0, Cloth: 0, Beast: 0, Wood: 0, Medicine: 0, Mana: 0 };
    let successRate = '-';

    formulaData.forEach((step, stepIdx) => {
      if (step.step_mats) {
        for (let mat in step.step_mats) {
          matTotals[mat] += step.step_mats[mat];
        }
      }
      if (stepIdx === formulaData.length - 1 && step.finished !== undefined && step.finished !== false) {
        successRate = step.finished + '%';
      }
    });

    const finalStats = calculateFinalStats(formulaData);

    let modalHtml = `
      <div class="modal fade" id="formulaDetailModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">📊 Detail Rumus: ${name}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <h6 class="fw-bold mb-2">🎯 Final Stats (Akumulasi)</h6>
                <div class="d-flex flex-wrap gap-2 p-2 rounded bg-light">
                  ${finalStats.map(stat => {
                    const isPositive = stat.includes('+');
                    return `<span class="badge ${isPositive ? 'bg-success' : 'bg-danger'} fs-6">${stat}</span>`;
                  }).join('')}
                </div>
              </div>
              
              <div class="mb-3">
                <h6 class="fw-bold mb-2">🎲 Success Rate</h6>
                <span class="badge bg-success fs-5">${successRate}</span>
              </div>
              
              <div class="mb-3">
                <h6 class="fw-bold mb-2">💎 Total Material Needed</h6>
                <div class="row g-2">
                  ${Object.entries(matTotals).filter(([_, amount]) => amount > 0).map(([mat, amount]) => `
                    <div class="col-6">
                      <div class="p-2 rounded bg-light d-flex justify-content-between">
                        <span class="text-muted">${mat}:</span>
                        <strong>${amount.toLocaleString()}</strong>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="mb-3">
                <h6 class="fw-bold mb-2">📝 Step-by-Step Process</h6>
                <div class="list-group">
                  ${formulaData.map((step, idx) => `
                    <div class="list-group-item">
                      <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong>Step #${idx + 1}</strong>
                        <small class="text-muted">POT: ${step.pot_before} → ${step.pot_after}</small>
                      </div>
                      <div class="small text-primary mb-1 fw-semibold">
                        ${step.text || 'No description'}
                      </div>
                      ${step.step_mats && Object.values(step.step_mats).some(v => v > 0) ? `
                        <div class="small text-muted">
                          Materials: ${Object.entries(step.step_mats).filter(([_, v]) => v > 0).map(([mat, amount]) => `${mat}: ${amount}`).join(', ')}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
              <button type="button" class="btn btn-primary" onclick="window.applySavedFormula(${index}); document.getElementById('formulaDetailModal').querySelector('[data-bs-dismiss]').click()">
                <i class="bi bi-arrow-repeat me-1"></i> Muat Rumus Ini
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('formulaDetailModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('formulaDetailModal'));
    modal.show();
  };

  // --- FUNGSI TERAPKAN RUMUS ---
  window.applySavedFormula = function (index) {
    const f = window._allSavedFormulas[index];
    if (!f) return;

    const name = f.FormulaName || f.formulaname || `Rumus ${index + 1}`;

    if (confirm(`Muat rumus "${name}"? Ini akan menimpa simulasi saat ini.`)) {
      document.getElementById('weap_arm').value = (f.Type || f.type) === 'Weapon' ? 'w' : 'a';
      document.getElementById('starting_pot').value = f.StartingPOT || f.startingpot;
      document.getElementById('recipe_pot').value = f.RecipePOT || f.recipepot;
      document.getElementById('tec').value = f.TEC || f.tec;
      document.getElementById('proficiency').value = f.Proficiency || f.proficiency || 0;
      const matRedVal = (f.MatReduction || f.matreduction);
      document.getElementById('mat_reduction').checked = (matRedVal === 'TRUE' || matRedVal === true);

      App.spawn();
      const current = App.getCurrent();

      const formulaSteps = parseFormulaData(f);
      if (!formulaSteps || !Array.isArray(formulaSteps)) {
        alert("Gagal memuat data rumus: format tidak valid.");
        return;
      }

      const loadData = {
        formula: formulaSteps,
        settings: {
          tec: parseInt(f.TEC || f.tec) || 255,
          proficiency: parseInt(f.Proficiency || f.proficiency) || 0,
          mat_reduction: (matRedVal === 'TRUE' || matRedVal === true),
          type: (f.Type || f.type) === 'Weapon' ? 'w' : 'a',
          recipe_pot: parseInt(f.RecipePOT || f.recipepot),
          starting_pot: parseInt(f.StartingPOT || f.startingpot),
          potential_return: 5 + (parseInt(f.TEC || f.tec) || 255) / 10,
          bonus_potential_return: 5 + (parseInt(f.TEC || f.tec) || 255) / 10,
          finished: false,
          max_mats: 0
        }
      };

      if (typeof current.autoLoad === 'function') {
        current.autoLoad(loadData);
      }

      alert("✅ Rumus berhasil dimuat!");
      
      const simBtn = document.querySelector('[data-target="fillstat-sim"]');
      if (simBtn) simBtn.click();
    }
  };
});