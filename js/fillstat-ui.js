// fillstat-ui.js: FINAL FIX - Confirm Button Working

document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("startSimBtn")) return;

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

    this.updateNavigationBar();
    this.saveToStorage();
    return this.stats[workspace_id];
  };

  // ===== 2. EVENT LISTENERS TOMBOL UTAMA =====
  document.getElementById("confirmButton").addEventListener("click", () => {
    const current = App.getCurrent();
    if (current) {
      console.log("✅ Confirm clicked! pot:", current.pot, "future_pot:", current.future_pot);
      current.confirm();
    }
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
  window.slotSetMax = function(slotNum, isNegative) {
  const current = App.getCurrent();
  if (!current || !current.slots[slotNum]) return;
  
  const slot = current.slots[slotNum];
  if (!slot.stat_data) {
    alert("Pilih stat dulu!");
    return;
  }
  
  const maxSteps = slot.getMaxSteps(isNegative);
  
  //  PENTING: Kalau isNegative true, pastikan steps-nya negatif!
  if (isNegative && maxSteps > 0) {
    slot.changeValueBySteps(-maxSteps, false);
  } else {
    slot.changeValueBySteps(maxSteps, false);
  }
};

  window.slotChangeByOne = function(slotNum, direction) {
    const current = App.getCurrent();
    if (!current || !current.slots[slotNum]) return;
    
    const slot = current.slots[slotNum];
    if (!slot.stat_data) {
      alert("Pilih stat dulu!");
      return;
    }
    
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

  // ===== 6.  FIX UTAMA: updatePotentialSuccessDisplay =====
  // INI YANG BIKIN TOMBOL CONFIRM BISA DIPENCET!
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
    
    //  INI BARIS PENTINGNYA! ⭐
    if (confirmBtn) {
      confirmBtn.disabled = this.pot === this.future_pot || this.finished;
      console.log("🔘 Confirm button state:", confirmBtn.disabled, "| pot:", this.pot, "| future_pot:", this.future_pot);
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
      
      html += `
        <tr>
          <td class="text-muted small">${mat.display}</td>
          <td class="text-end small" style="${style}">${amount.toLocaleString()}</td>
          <td class="text-end small" style="${stepStyle}">${stepAmount > 0 ? '+' + stepAmount.toLocaleString() : '-'}</td>
        </tr>
      `;
      totalCost += amount;
    });
    
    html += `
      <tr class="table-light">
        <th class="small pt-2">Total Material</th>
        <th class="text-end small pt-2">${totalCost.toLocaleString()}</th>
        <th class="text-end small pt-2">${this.step_max_mats > 0 ? '+' + this.step_max_mats : '-'}</th>
      </tr>
    `;
    
    tbody.innerHTML = html;
  };

  // ===== 8. Stat.prototype.updateFormulaDisplay =====
  Stat.prototype.updateFormulaDisplay = function () {
    const el = document.getElementById("formulaDisplay");
    if (!el) return;
    
    let display = this.steps.getDisplay();
    
    if (typeof this.finished === "number") {
      display += `
        <div class="alert alert-success mt-3 mb-0">
          <strong>🎯 Simulasi Selesai!</strong><br>
          <small>
            Final Success Rate: <strong>${this.getSuccessRate()}%</strong><br>
            Total Materials: ${Object.keys(this.mats).filter(mat => this.mats[mat]).map(mat => `${this.mats[mat]} ${mat}`).join(" / ")}
          </small>
        </div>
      `;
    }
    
    el.innerHTML = display || '<em class="text-muted">Belum ada langkah yang dilakukan. Pilih stats dan klik Confirm untuk memulai.</em>';
    
    const undoBtn = document.getElementById("undoButton");
    const redoBtn = document.getElementById("redoButton");
    const repeatBtn = document.getElementById("repeatButton");
    
    if (undoBtn) undoBtn.disabled = !this.steps.formula.length;
    if (redoBtn) redoBtn.disabled = !this.steps.redo_queue.length;
    if (repeatBtn) repeatBtn.disabled = !this.steps.formula.length || !!this.finished;
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
        return `
          <div class="card mb-2 border-start border-3 border-primary">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong class="text-primary">#${index + 1}.</strong> 
                  <span class="text-dark">${step.text}</span>
                  ${repeat}
                </div>
                <small class="text-muted">POT: ${step.pot_before} → ${step.pot_after}</small>
              </div>
              <div class="mt-1">
                <small class="text-muted">
                  Materials: ${Object.keys(step.step_mats).filter(m => step.step_mats[m]).map(m => `${step.step_mats[m]} ${m}`).join(", ") || "None"}
                </small>
              </div>
            </div>
          </div>
        `;
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
});