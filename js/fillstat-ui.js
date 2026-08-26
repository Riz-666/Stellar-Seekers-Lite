// fillstat-ui.js: Integrasi UI Bootstrap dengan logika t4stat.js

document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("startSimBtn")) return;

  // ===== 1. BYPASS MainApp.spawn ASLI =====
  MainApp.prototype.spawn = function (id) {
    const starting_pot = document.getElementById("starting_pot").value;
    const recipe_pot = document.getElementById("recipe_pot").value;
    const weap_arm = document.getElementById("weap_arm").value;
    const tec = document.getElementById("tec").value;
    const proficiency = document.getElementById("proficiency").value;
    const mat_reduction = document.getElementById("mat_reduction").checked || false;

    if (!starting_pot || !recipe_pot) {
      alert("POT Awal dan POT Resep harus lebih dari 0!");
      return;
    }

    this.saveSettings({ tec, proficiency, mat_reduction });

    const workspace_id = id || this.getNewWorkspaceId();

    const details = {
      weap_arm,
      starting_pot,
      recipe_pot,
      workspace_id,
      tec,
      proficiency,
      mat_reduction,
    };
    this.stats[workspace_id] = new Stat(details);
    this.current = workspace_id;

    const workspaceArea = document.getElementById("workspaceArea");
    if (workspaceArea) workspaceArea.style.display = "block";

    this.updateNavigationBar();
    this.saveToStorage();

    return this.stats[workspace_id];
  };

  // ===== 2. SETUP TOMBOL-TOMBOL UTAMA =====
  // Tombol Confirm
  document.getElementById("confirmButton").addEventListener("click", function () {
    const current = App.getCurrent();
    if (current) {
      current.confirm();
    }
  });

  // Tombol Repeat
  document.getElementById("repeatButton").addEventListener("click", function () {
    const current = App.getCurrent();
    if (current) {
      current.repeat();
    }
  });

  // Tombol Undo
  document.getElementById("undoButton").addEventListener("click", function () {
    const current = App.getCurrent();
    if (current) {
      current.undo();
    }
  });

  // Tombol Redo
  document.getElementById("redoButton").addEventListener("click", function () {
    const current = App.getCurrent();
    if (current) {
      current.redo();
    }
  });

  // ===== 3. Stat.prototype.loadDisplay - Buat 8 Slots =====
  Stat.prototype.loadDisplay = function () {
    let slotsHtml = "";
    for (let i = 0; i < 8; i++) {
      const options = this.buildStatOptions(i);
      slotsHtml += `
        <div class="row g-2 mb-2 align-items-center slot-row" data-slot="${i}">
          <div class="col-1 text-center fw-bold text-muted">${i + 1}</div>
          <div class="col-5">
            <select class="form-select form-select-sm" id="slot${i}" onchange="App.getCurrent().slots[${i}].onUpdate()">
              <option value="0">PILIH STAT</option>
              ${options}
            </select>
          </div>
          <div class="col-3">
            <input class="form-control form-control-sm text-center" autocomplete="off" type="text" maxlength="4" size="4" 
                   disabled id="input${i}" value="0" 
                   onkeydown="App.getCurrent().slots[${i}].onKeyPress(event)" 
                   oninput="App.getCurrent().slots[${i}].onUpdate()">
          </div>
          <div class="col-3">
            <span class="badge bg-light text-dark border" id="matcost${i}" style="font-size: 0.75rem; width: 100%; text-align: center;">-</span>
          </div>
        </div>
      `;
    }
    const container = document.getElementById("slotsContainer");
    if (container) container.innerHTML = slotsHtml;

    this.updatePotentialSuccessDisplay();
    this.updateMaterialCosts();
    this.updateFormulaDisplay();
    
    // Reset tombol
    document.getElementById("confirmButton").disabled = true;
    document.getElementById("repeatButton").disabled = true;
    document.getElementById("undoButton").disabled = true;
    document.getElementById("redoButton").disabled = true;
  };

  // ===== 4. Stat.prototype.buildStatOptions =====
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

  // ===== 5. Stat.prototype.updatePotentialSuccessDisplay =====
  Stat.prototype.updatePotentialSuccessDisplay = function () {
    const potEl = document.getElementById("potentialDisplay");
    const sucEl = document.getElementById("successRateDisplay");
    const confBtn = document.getElementById("confirmButton");
    
    if (potEl) potEl.innerHTML = `Potential: ${this.future_pot} / ${this.pot}`;
    if (sucEl) {
      const rate = this.getSuccessRate();
      sucEl.innerHTML = `Success Rate: ${rate}%`;
      sucEl.className = `badge fs-6 ${rate >= 80 ? 'bg-success' : rate >= 60 ? 'bg-warning text-dark' : 'bg-danger'}`;
    }
    if (confBtn) confBtn.disabled = this.pot === this.future_pot || this.finished;
  };

  // ===== 6. Stat.prototype.updateMaterialCosts =====
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
    materials.forEach(mat => {
      const amount = this.mats[mat.key] || 0;
      const style = amount > 0 ? "color: #198754; font-weight: bold;" : "color: #6c757d;";
      html += `<tr><td class="text-muted small">${mat.display}</td><td class="text-end small" style="${style}">${amount}</td></tr>`;
    });
    html += `<tr class="border-top"><th class="small pt-2">Max / Step</th><td class="text-end small pt-2 fw-bold">${this.max_mats}</td></tr>`;
    tbody.innerHTML = html;
  };

  // ===== 7. Stat.prototype.updateFormulaDisplay =====
  Stat.prototype.updateFormulaDisplay = function () {
    const el = document.getElementById("formulaDisplay");
    if (!el) return;
    
    let display = this.steps.getDisplay();
    
    if (typeof this.finished === "number") {
      display += `<div class="mt-3 p-3 bg-success bg-opacity-10 border border-success rounded">
        <strong class="text-success d-block mb-2"> Simulasi Selesai!</strong>
        <div class="small">
          <div>Final Success Rate: <span class="fw-bold text-success">${this.getSuccessRate()}%</span></div>
          <div class="mt-1">Total Materials: ${Object.keys(this.mats).filter(mat => this.mats[mat]).map(mat => `${this.mats[mat]} ${mat}`).join(" / ")}</div>
        </div>
      </div>`;
    }
    
    el.innerHTML = display || '<em class="text-muted">Belum ada langkah yang dilakukan. Pilih stats dan klik Confirm untuk memulai.</em>';

    const undoBtn = document.getElementById("undoButton");
    const redoBtn = document.getElementById("redoButton");
    const repeatBtn = document.getElementById("repeatButton");
    
    if (undoBtn) undoBtn.disabled = !this.steps.formula.length;
    if (redoBtn) redoBtn.disabled = !this.steps.redo_queue.length;
    if (repeatBtn) repeatBtn.disabled = !this.steps.formula.length || !!this.finished;
  };

  // ===== 8. Stat.prototype.lockAllSlots & unlockAllSlots =====
  Stat.prototype.lockAllSlots = function () {
    for (let slot of this.slots) if (slot.lock) slot.lock();
    const confBtn = document.getElementById("confirmButton");
    const repBtn = document.getElementById("repeatButton");
    if (confBtn) confBtn.disabled = true;
    if (repBtn) repBtn.disabled = true;
  };

  Stat.prototype.unlockAllSlots = function () {
    for (let slot of this.slots) if (slot.unlock) slot.unlock();
    const confBtn = document.getElementById("confirmButton");
    const repBtn = document.getElementById("repeatButton");
    if (confBtn) confBtn.disabled = false;
    if (repBtn) repBtn.disabled = false;
  };

  // ===== 9. Formula.prototype.getDisplay =====
  if (typeof Formula !== "undefined") {
    Formula.prototype.getDisplay = function () {
      if (!this.condensed_formula.length) return '';
      return this.condensed_formula.map((step, index) => {
        const repeat = step.repeat > 1 ? `<span class="text-primary fw-bold">(x${step.repeat})</span>` : "";
        return `<div class="mb-2 p-2 bg-light rounded border-start border-3 border-primary">
          <span class="fw-bold text-dark">#${index + 1}.</span> ${step.text} ${repeat} 
          <span class="text-muted small d-block">→ POT: ${step.pot_before} → ${step.pot_after}</span>
        </div>`;
      }).join("");
    };
  }

  // ===== 10. Event Listener untuk Tombol Mulai =====
  document.getElementById("startSimBtn").addEventListener("click", function () {
    const startPot = parseInt(document.getElementById("starting_pot").value) || 0;
    const recipePot = parseInt(document.getElementById("recipe_pot").value) || 0;
    
    if (startPot <= 0 || recipePot <= 0) {
      alert("POT Awal dan POT Resep harus lebih dari 0!");
      return;
    }

    App.spawn(); 
  });

  // ===== 11. Load settings awal =====
  if (typeof App !== "undefined") {
    App.loadSettings();
    setInterval(() => { if (App) App.saveToStorage(); }, 30000);
  }
});