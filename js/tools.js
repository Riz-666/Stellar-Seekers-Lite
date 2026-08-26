document.addEventListener('DOMContentLoaded', () => {
  console.log("Tools.js loaded successfully!");

  // Fungsi untuk custom dropdown
window.selectHokianAspect = function(value, element) {
  const hiddenInput = document.getElementById('hokianAspect');
  const selectedText = document.getElementById('selectedAspectText');
  
  if (hiddenInput && selectedText) {
    hiddenInput.value = value;
    selectedText.innerHTML = element.innerHTML;
  }
};

  // ===== 1. LOGIKA TAB / SIDEBAR =====
  const sidebarButtons = document.querySelectorAll('#toolsSidebar .list-group-item:not(:disabled)');
  const toolViews = document.querySelectorAll('.tool-view');

  sidebarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebarButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      toolViews.forEach(view => view.classList.add('d-none'));

      const targetId = btn.getAttribute('data-target');
      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.classList.remove('d-none');
      }
    });
  });

  // ===== 2. LOGIKA MQ CALCULATOR =====
  const LV_CAP = 315;

  const QUEST_DATA = [
    { Name: "First Time Visit", Chapter: 1, Episode: 1, Boss: "-", EXP: 30 },
    { Name: "Straye Brother and Sister", Chapter: 1, Episode: 2, Boss: "Boss Colon", EXP: 80 },
    { Name: "A Golem on a Rampage", Chapter: 1, Episode: 3, Boss: "Excavated Golem", EXP: 730 },
    { Name: "The Goddess of Wisdom", Chapter: 1, Episode: 4, Boss: "-", EXP: 2050 },
    { Name: "The Dragon's Den", Chapter: 1, Episode: 5, Boss: "Eerie Crystal", EXP: 4700 },
    { Name: "The Ruined Temple", Chapter: 1, Episode: 6, Boss: "-", EXP: 9330 },
    { Name: "The First Magic Stone", Chapter: 1, Episode: 7, Boss: "Minotaur", EXP: 16700 },
    { Name: "Purification Incense", Chapter: 1, Episode: 8, Boss: "-", EXP: 27900 },
    { Name: "The Dragon and Black Crystal", Chapter: 1, Episode: 9, Boss: "Brutal Dragon Decel", EXP: 43000 },
    { Name: "The Merchant Girl", Chapter: 2, Episode: 10, Boss: "Mochelo", EXP: 64000 },
    { Name: "Where Are the Gems?", Chapter: 2, Episode: 11, Boss: "Flare Volg", EXP: 92000 },
    { Name: "Who is the Black Knight?!", Chapter: 2, Episode: 12, Boss: "Ooze", EXP: 118200 },
    { Name: "Trials in the Palace", Chapter: 2, Episode: 13, Boss: "-", EXP: 149000 },
    { Name: "The Moon Wizard", Chapter: 2, Episode: 14, Boss: "Mauez", EXP: 172000 },
    { Name: "The Follower and Hater", Chapter: 2, Episode: 15, Boss: "Ganglef", EXP: 227000 },
    { Name: "The Wizard's Cave", Chapter: 2, Episode: 16, Boss: "-", EXP: 240000 },
    { Name: "The Star Wizard", Chapter: 2, Episode: 17, Boss: "Boss Roga", EXP: 255000 },
    { Name: "The Invincible... Enemy??", Chapter: 3, Episode: 18, Boss: "-", EXP: 270000 },
    { Name: "The Ancient Empress", Chapter: 3, Episode: 19, Boss: "Ancient Empress", EXP: 284000 },
    { Name: "The Culprit", Chapter: 3, Episode: 20, Boss: "Masked Warrior", EXP: 319000 },
    { Name: "Fate of the Fortress", Chapter: 3, Episode: 21, Boss: "-", EXP: 335000 },
    { Name: "Memory in the Lost Town", Chapter: 3, Episode: 22, Boss: "Pillar Golem", EXP: 398000 },
    { Name: "The Stolen Sorcery Gem", Chapter: 3, Episode: 23, Boss: "-", EXP: 417000 },
    { Name: "Living with a Dragon", Chapter: 3, Episode: 24, Boss: "Grass Dragon Yelb", EXP: 462300 },
    { Name: "Monsters from Outerworld", Chapter: 3, Episode: 25, Boss: "Nurethoth", EXP: 540000 },
    { Name: "The Mage Diels", Chapter: 4, Episode: 26, Boss: "-", EXP: 562000 },
    { Name: "Journey for Reconstruction", Chapter: 4, Episode: 27, Boss: "Goldoon (MQ only)", EXP: 585000 },
    { Name: "The Sacred Gem in Akaku", Chapter: 4, Episode: 28, Boss: "Goovua", EXP: 710000 },
    { Name: "The King of Darkan", Chapter: 4, Episode: 29, Boss: "-", EXP: 740000 },
    { Name: "The Lurking Evil", Chapter: 4, Episode: 30, Boss: "Scrader", EXP: 803000 },
    { Name: "Find the False Black Knight!", Chapter: 4, Episode: 31, Boss: "Black Knight of Delusion", EXP: 913000 },
    { Name: "Technista's Movement", Chapter: 4, Episode: 32, Boss: "-", EXP: 1000000 },
    { Name: "The Falling Feather of Death", Chapter: 4, Episode: 33, Boss: "Evil Crystal Beast", EXP: 1100000 },
    { Name: "In The Unknown Darkness", Chapter: 5, Episode: 34, Boss: "-", EXP: 1150000 },
    { Name: "The Charm", Chapter: 5, Episode: 35, Boss: "Cerberus", EXP: 1310000 },
    { Name: "Parching Dark Mirror", Chapter: 5, Episode: 36, Boss: "Zolban", EXP: 1370000 },
    { Name: "Fierce Battle in the Garden", Chapter: 5, Episode: 37, Boss: "Aranea", EXP: 1550000 },
    { Name: "A Light in the Darkness", Chapter: 5, Episode: 38, Boss: "Bexiz", EXP: 1750000 },
    { Name: "The Ones Nesting in the Manor", Chapter: 5, Episode: 39, Boss: "Imitator", EXP: 1970000 },
    { Name: "The Dark Castle", Chapter: 5, Episode: 40, Boss: "Imitacia", EXP: 2210000 },
    { Name: "To The Living World", Chapter: 5, Episode: 41, Boss: "-", EXP: 2220000 },
    { Name: "Demi Machina", Chapter: 6, Episode: 42, Boss: "-", EXP: 2600000 },
    { Name: "The Town of Pax Faction", Chapter: 6, Episode: 43, Boss: "Iconos", EXP: 2700000 },
    { Name: "Mechanical Heart", Chapter: 6, Episode: 44, Boss: "Ifrid", EXP: 2800000 },
    { Name: "Black Knights of Lyark", Chapter: 6, Episode: 45, Boss: "-", EXP: 2820000 },
    { Name: "The Mysterious Artifact", Chapter: 6, Episode: 46, Boss: "Proto Leon", EXP: 3030000 },
    { Name: "Truth of the Artifact", Chapter: 6, Episode: 47, Boss: "-", EXP: 3099000 },
    { Name: "The Price of Treachery", Chapter: 6, Episode: 48, Boss: "York", EXP: 3320000 },
    { Name: "The Blasphemous Factory", Chapter: 6, Episode: 49, Boss: "Tyrant Machina", EXP: 3640000 },
    { Name: "Mystery of the Black Knights", Chapter: 6, Episode: 50, Boss: "Mozto Machina", EXP: 4020000 },
    { Name: "Monster's Forest", Chapter: 7, Episode: 51, Boss: "Lalvada", EXP: 4730000 },
    { Name: "The Underground Town", Chapter: 7, Episode: 52, Boss: "-", EXP: 4820000 },
    { Name: "The Elves in Lyark", Chapter: 7, Episode: 53, Boss: "Zahhak Machina", EXP: 5070000 },
    { Name: "The Mad Laboratory", Chapter: 7, Episode: 54, Boss: "Guignol", EXP: 5500000 },
    { Name: "Tragedy in the Jail", Chapter: 7, Episode: 55, Boss: "Gwaimol", EXP: 6000000 },
    { Name: "Calamity in Droma Square", Chapter: 7, Episode: 56, Boss: "Ultimate Machina", EXP: 6400000 },
    { Name: "Head for Ultimea Palace", Chapter: 7, Episode: 57, Boss: "Ornlarf", EXP: 6900000 },
    { Name: "The Chaotic Truth", Chapter: 7, Episode: 58, Boss: "Venena Coenubia", EXP: 7400000 },
    { Name: "The Mine Where Monsters Lurk", Chapter: 8, Episode: 59, Boss: "Shampy", EXP: 8400000 },
    { Name: "The Mysterious Shadow", Chapter: 8, Episode: 60, Boss: "-", EXP: 8500000 },
    { Name: "The New Diel Country", Chapter: 8, Episode: 61, Boss: "Crystal Titan", EXP: 8600000 },
    { Name: "The Ruins of the Gods", Chapter: 8, Episode: 62, Boss: "Mom Fluck", EXP: 8800000 },
    { Name: "The Former God of Justice", Chapter: 8, Episode: 63, Boss: "Zelbuse", EXP: 9100000 },
    { Name: "The Remaining Thrones in the Shrine", Chapter: 8, Episode: 64, Boss: "Mardula", EXP: 9700000 },
    { Name: "Gods' Whereabouts", Chapter: 8, Episode: 65, Boss: "-", EXP: 10400000 },
    { Name: "The Wait at Specia's Shrine", Chapter: 8, Episode: 66, Boss: "Seele Zauga", EXP: 11100000 },
    { Name: "The Warden of Ice & Snow", Chapter: 8, Episode: 67, Boss: "King Piton", EXP: 11800000 },
    { Name: "At Mountains End", Chapter: 8, Episode: 68, Boss: "Finstern the Dark Dragon", EXP: 12500000 },
    { Name: "Deadly Road to Eldenbaum", Chapter: 9, Episode: 69, Boss: "Tuscog", EXP: 15800000 },
    { Name: "Unforseen Trap", Chapter: 9, Episode: 70, Boss: "Eroded Pilz", EXP: 17100000 },
    { Name: "Traces of Technological Progress", Chapter: 9, Episode: 71, Boss: "Pyxtica", EXP: 18200000 },
    { Name: "An Unexpected Acquaintance", Chapter: 9, Episode: 72, Boss: "Kuzto", EXP: 19200000 },
    { Name: "Front Line Base Operation", Chapter: 9, Episode: 73, Boss: "Sapphire Roga", EXP: 20300000 },
    { Name: "Strategy to Redeem the Treetop Harbor", Chapter: 9, Episode: 74, Boss: "Gravicep", EXP: 21500000 },
    { Name: "The Teleporter Left Behind", Chapter: 9, Episode: 75, Boss: "Repthon", EXP: 22700000 },
    { Name: "The Man Who Seeks Death", Chapter: 9, Episode: 76, Boss: "Vulture", EXP: 23900000 },
    { Name: "The Battle to Recapture Eldenbaum", Chapter: 9, Episode: 77, Boss: "Venena Meta Coenubia", EXP: 25000000 },
    { Name: "A New Beginning", Chapter: 9, Episode: 78, Boss: "-", EXP: 13000000 },
    { Name: "Off to the Fateful Land", Chapter: 10, Episode: 79, Boss: "-", EXP: 26000000 },
    { Name: "The Inhabitants Under the Cliff", Chapter: 10, Episode: 80, Boss: "Pisteus", EXP: 27400000 },
    { Name: "The Nightmare Returns", Chapter: 10, Episode: 81, Boss: "-", EXP: 28800000 },
    { Name: "The Whereabouts of the Missing Monks", Chapter: 10, Episode: 82, Boss: "Arachnidemon", EXP: 30200000 },
    { Name: "The Goddess of Courage and the Squatters", Chapter: 10, Episode: 83, Boss: "-", EXP: 31600000 },
    { Name: "Navigator of the Ark", Chapter: 10, Episode: 84, Boss: "Black Shadow", EXP: 33100000 },
    { Name: "Witch in the Woods", Chapter: 10, Episode: 85, Boss: "Hexter", EXP: 34600000 },
    { Name: "The Duel in Nov Diela", Chapter: 10, Episode: 86, Boss: "Irestida", EXP: 36200000 },
    { Name: "Flying the Ark", Chapter: 11, Episode: 87, Boss: "Reliza", EXP: 37800000 },
    { Name: "Land of the Unknown", Chapter: 11, Episode: 88, Boss: "Gemma", EXP: 49000000 },
    { Name: "The Strolling Forest", Chapter: 11, Episode: 89, Boss: "Ferzen the Rock Dragon", EXP: 51000000 },
    { Name: "Eumanos the Forest Dwellers", Chapter: 11, Episode: 90, Boss: "Junior Dragon Zyvio", EXP: 53400000 },
    { Name: "A Sproutling is Born", Chapter: 11, Episode: 91, Boss: "War Dragon Turba", EXP: 55700000 },
    { Name: "The Blessing-Bearer", Chapter: 11, Episode: 92, Boss: "Vlam the Flame Dragon", EXP: 58100000 },
    { Name: "Intense Battle in Coenubla's Stronghold", Chapter: 11, Episode: 93, Boss: "Velum", EXP: 60500000 },
    { Name: "The Shadow of a Smoky Mountain", Chapter: 11, Episode: 94, Boss: "Oculagsinio", EXP: 63000000 },
    { Name: "The Weredragons & the Underground World", Chapter: 11, Episode: 95, Boss: "Gordel", EXP: 65500000 },
    { Name: "The Sky with a Ceiling", Chapter: 12, Episode: 96, Boss: "-", EXP: 73400000 },
    { Name: "Rivalry Between Dragons and Weredragons", Chapter: 12, Episode: 97, Boss: "Burning Dragon Igneus", EXP: 76300000 },
    { Name: "Weredragon Couple and a Baby", Chapter: 12, Episode: 98, Boss: "Trickster Dragon Mimyugon", EXP: 79300000 },
    { Name: "Vital Point", Chapter: 12, Episode: 99, Boss: "Filrocas", EXP: 82300000 },
    { Name: "Intense Battle in Propulsion System", Chapter: 12, Episode: 100, Boss: "Wicked Dragon Fazzino", EXP: 85300000 },
    { Name: "Discovering a New Technology", Chapter: 12, Episode: 101, Boss: "-", EXP: 44200000 },
    { Name: "Ark Repair", Chapter: 12, Episode: 102, Boss: "Walican", EXP: 92700000 },
    { Name: "Weredragon Dispute", Chapter: 12, Episode: 103, Boss: "Brass Dragon Reguita", EXP: 96000000 },
    { Name: "Cocoon in the Ice Wall", Chapter: 12, Episode: 104, Boss: "Dominaredor", EXP: 99300000 },
    { Name: "Underwater Inhabitants", Chapter: 13, Episode: 105, Boss: "Zapo", EXP: 112600000 },
    { Name: "Water Dome", Chapter: 13, Episode: 106, Boss: "Red Ash Dragon Rudish", EXP: 116500000 },
    { Name: "Underwater City", Chapter: 13, Episode: 107, Boss: "-", EXP: 60200000 },
    { Name: "The Thing in the Abandoned District", Chapter: 13, Episode: 108, Boss: "Don Profundo", EXP: 125800000 },
    { Name: "Shadow from the Abyss", Chapter: 13, Episode: 109, Boss: "Vatudo", EXP: 129900000 },
    { Name: "The Ruthless Council", Chapter: 13, Episode: 110, Boss: "-", EXP: 67000000 },
    { Name: "Mysterious Entity in the Little Shrine", Chapter: 13, Episode: 111, Boss: "Raging Dragon Bovinari", EXP: 139900000 },
    { Name: "The Great Battle Underwater", Chapter: 13, Episode: 112, Boss: "Humida, Torexesa", EXP: 144200000 },
    { Name: "Crisis in the Sky", Chapter: 14, Episode: 113, Boss: "Mulgoon", EXP: 159100000 },
    { Name: "The Surviving Siblings", Chapter: 14, Episode: 114, Boss: "Deformis", EXP: 164000000 },
    { Name: "Chaotic Situation", Chapter: 14, Episode: 115, Boss: "-", EXP: 168900000 },
    { Name: "The Bitter Truth", Chapter: 14, Episode: 116, Boss: "Menti", EXP: 173800000 },
    { Name: "The Uncouth Rana Prince", Chapter: 14, Episode: 117, Boss: "Biskyva", EXP: 178800000 },
    { Name: "Mutant Coenubia Village", Chapter: 14, Episode: 118, Boss: "Piscruva", EXP: 183900000 },
    { Name: "Fierce Battle with Mutant Lixis", Chapter: 14, Episode: 119, Boss: "Supreme Evil Crystal Beast", EXP: 189000000 },
    { Name: "Ark Crisis", Chapter: 15, Episode: 120, Boss: "Bakuzan", EXP: 210500000 },
    { Name: "Coastal Clash", Chapter: 15, Episode: 121, Boss: "Rondine", EXP: 216300000 },
    { Name: "Unda's Rescue Operartion", Chapter: 15, Episode: 122, Boss: "Gula the Gourmet", EXP: 222200000 },
    { Name: "Unda's Return", Chapter: 15, Episode: 123, Boss: "Goudvis", EXP: 228100000 },
    { Name: "The Young Man and the Old Tree", Chapter: 15, Episode: 124, Boss: "Puiet", EXP: 234000000 },
    { Name: "The Village of Lixis", Chapter: 15, Episode: 125, Boss: "Gioco", EXP: 240000000 },
    { Name: "Vision of a Distant Past", Chapter: 15, Episode: 126, Boss: "Baratok", EXP: 246000000 },
    { Name: "As the Roots Come to Light", Chapter: 15, Episode: 127, Boss: "Doy & Mari", EXP: 252100000 },
    { Name: "Freedos's Thoughts Until Quest", Chapter: 16, Episode: 128, Boss: "Kipina", EXP: 141700000 },
    { Name: "Chaos in the Valley Until Quest", Chapter: 16, Episode: 129, Boss: "", EXP: 293700000 },
  ];

  const getXP = (lv) => Math.floor(0.025 * Math.pow(lv, 4) + 2 * lv);

  const getTotalXP = (begin, beginPercentage, end) => {
    if (begin >= end) return 0;
    let xp = Math.floor((1 - beginPercentage / 100) * getXP(begin));
    for (let i = begin + 1; i < end; i++) {
      xp += getXP(i);
    }
    return xp;
  };

  const addXP = (begin, beginPercentage, extraXP) => {
    let remainingXP = extraXP;
    let XPRequiredNextLv = (1 - beginPercentage / 100) * getXP(begin);
    if (extraXP < XPRequiredNextLv) {
      let currentXP = (beginPercentage / 100) * getXP(begin) + extraXP;
      return [begin, Math.floor(100 * currentXP / getXP(begin))];
    } else {
      remainingXP -= XPRequiredNextLv;
      let lv = begin + 1;
      while (getXP(lv) <= remainingXP) {
        remainingXP -= getXP(lv);
        lv += 1;
      }
      let lvPercentage = Math.floor(100 * remainingXP / getXP(lv));
      return [lv, lvPercentage];
    }
  };

  function populateQuestDropdowns() {
    const fromSelect = document.getElementById('mqFrom');
    const untilSelect = document.getElementById('mqUntil');
    if (!fromSelect || !untilSelect) return;

    fromSelect.innerHTML = '';
    untilSelect.innerHTML = '';

    QUEST_DATA.forEach((q, index) => {
      const name = q.Name || 'Unknown Quest';
      const ch = q.Chapter || '?';
      const label = `CH${ch} - ${name}`;
      fromSelect.add(new Option(label, index));
      untilSelect.add(new Option(label, index));
    });

    fromSelect.selectedIndex = 0;
    untilSelect.selectedIndex = QUEST_DATA.length - 1;
    updateCalculator();
  }

  function updateCalculator() {
    if (QUEST_DATA.length === 0) return;
    const lv = parseInt(document.getElementById('currentLvl').value) || 1;
    const pct = parseInt(document.getElementById('currentPct').value) || 0;
    const target = parseInt(document.getElementById('targetLvl').value) || LV_CAP;

    const xpRequired = getTotalXP(lv, pct, target);
    const resExpReq = document.getElementById('resExpReq');
    if (resExpReq) resExpReq.textContent = xpRequired.toLocaleString();

    const mqBegin = parseInt(document.getElementById('mqFrom').value) || 0;
    const mqEnd = parseInt(document.getElementById('mqUntil').value) || 0;
    const skipVenena = document.getElementById('skipVenena')?.checked || false;
    const spamAdv = document.getElementById('multipleMq')?.checked || false;

    if (mqBegin <= mqEnd) {
      let mqXP = 0, mqXPReverse = 0, mqStopIndex = mqBegin, mqStartIndex = mqEnd;
      let mqStopAtFound = false, mqStartFromFound = false;

      for (let i = mqBegin; i <= mqEnd; i++) {
        const qForward = QUEST_DATA[i];
        const qBackward = QUEST_DATA[mqEnd - (i - mqBegin)];

        const getExpForQuest = (q) => {
          let total = q.EXP || 0;
          const name = (q.Name || '').toLowerCase();
          const boss = (q.Boss || '').toLowerCase();
          if ((name.includes('the battle to recapture eldenbaum') || boss.includes('venena meta coenubia')) && !skipVenena) {
            total += 12500000;
          }
          return total;
        };

        mqXP += getExpForQuest(qForward);
        mqXPReverse += getExpForQuest(qBackward);

        if (!mqStopAtFound && mqXP >= xpRequired) { mqStopAtFound = true; mqStopIndex = i; }
        if (!mqStartFromFound && mqXPReverse >= xpRequired) { mqStartFromFound = true; mqStartIndex = mqEnd - (i - mqBegin); }
      }

      const resQuestExpText = document.getElementById('resQuestExpText');
      if (resQuestExpText) resQuestExpText.textContent = mqXP.toLocaleString() + ' EXP';

      const [nLv, nLvP] = addXP(lv, pct, mqXP);
      const resEvaluationText = document.getElementById('resEvaluationText');
      if (resEvaluationText) resEvaluationText.textContent = `Lv.${nLv} (${nLvP}%)`;

      const resStartFrom = document.getElementById('resStartFrom');
      const resStopAt = document.getElementById('resStopAt');

      if (mqStartFromFound && !spamAdv && mqStartIndex > mqBegin && resStartFrom) {
        resStartFrom.style.display = 'block';
        resStartFrom.innerHTML = `💡 Kamu bisa <strong>mulai</strong> dari quest: <em>${QUEST_DATA[mqStartIndex].Name}</em>`;
      } else if (resStartFrom) {
        resStartFrom.style.display = 'none';
      }

      if (mqStopAtFound && !spamAdv && mqStopIndex < mqEnd && resStopAt) {
        resStopAt.style.display = 'block';
        resStopAt.innerHTML = `💡 Kamu bisa <strong>berhenti</strong> setelah quest: <em>${QUEST_DATA[mqStopIndex].Name}</em>`;
      } else if (resStopAt) {
        resStopAt.style.display = 'none';
      }

      const resultTableGroup = document.getElementById('resultTableGroup');
      if (resultTableGroup) {
        if (spamAdv) {
          resultTableGroup.style.display = 'block';
          evaluateDiaries(lv, pct, xpRequired, mqXP, mqBegin, mqEnd, skipVenena);
        } else {
          resultTableGroup.style.display = 'none';
        }
      }
    }
  }

  function evaluateDiaries(startLv, startPct, targetXP, questXP, mqBeginIndex, mqEndIndex, skipVenena) {
    const tableBody = document.getElementById('resultTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const targetLvl = parseInt(document.getElementById('targetLvl').value) || LV_CAP;

    let curLv = startLv, curPct = startPct, runs = 0;
    while (runs < 200) {
      runs++;
      const xpNeededNow = getTotalXP(curLv, curPct, targetLvl);
      if (xpNeededNow <= 0) break;

      if (questXP >= xpNeededNow) {
        let stackedXP = 0, lastQName = 'Unknown';
        for (let i = mqBeginIndex; i <= mqEndIndex; i++) {
          const q = QUEST_DATA[i];
          let exp = q.EXP || 0;
          const name = (q.Name || '').toLowerCase();
          const boss = (q.Boss || '').toLowerCase();
          if ((name.includes('the battle to recapture eldenbaum') || boss.includes('venena meta coenubia')) && !skipVenena) {
            exp += 12500000;
          }
          stackedXP += exp;
          if (stackedXP >= xpNeededNow) {
            const [tLv, tPct] = addXP(curLv, curPct, stackedXP);
            curLv = tLv; curPct = tPct;
            const qCh = q.Chapter || '';
            lastQName = (qCh ? 'CH' + qCh + ' - ' : '') + q.Name;
            break;
          }
        }
        const row = document.createElement('tr');
        row.innerHTML = `<td>${runs}</td><td>${lastQName}</td><td><span class="badge bg-primary">Lv.${curLv} (${curPct}%)</span></td>`;
        tableBody.appendChild(row);
        break;
      } else {
        [curLv, curPct] = addXP(curLv, curPct, questXP);
        const untilSelect = document.getElementById('mqUntil');
        const untilText = untilSelect ? untilSelect.options[untilSelect.selectedIndex].text : 'Unknown';
        const row = document.createElement('tr');
        row.innerHTML = `<td>${runs}</td><td>${untilText}</td><td><span class="badge bg-primary">Lv.${curLv} (${curPct}%)</span></td>`;
        tableBody.appendChild(row);
      }
    }
  }

  const calcInputs = ['currentLvl', 'currentPct', 'targetLvl', 'mqFrom', 'mqUntil', 'skipVenena', 'multipleMq'];
  calcInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateCalculator);
      el.addEventListener('change', updateCalculator);
    }
  });

  populateQuestDropdowns();
  console.log("MQ Calculator initialized with", QUEST_DATA.length, "quests.");


  // ===== 3. LOGIKA DAFTAR BAHAN MQ =====
  const mqMaterialsData = [
    { id: 1, chapter: 'Chapter 1.5', quest_name: 'The Dragon\'s Den', name_en: 'Colon Leaf', name_id: 'Daun Colon', jumlah: 'x5', source: 'Colon — Land under development' },
    { id: 2, chapter: 'Chapter 1.5', quest_name: 'The Dragon\'s Den', name_en: 'Hard Dragon Skin', name_id: 'Sisik Naga Keras', jumlah: 'x2', source: 'Piedra — Reug salt plains wanderers camp' },
    { id: 3, chapter: 'Chapter 1.5', quest_name: 'The Dragon\'s Den', name_en: 'Lamb Meat', name_id: 'Daging Domba', jumlah: 'x1', source: 'Wooly — Reug salt plains wanderers camp' },
    { id: 4, chapter: 'Chapter 1.8', quest_name: 'Purification Incense', name_en: 'Fairy Feather', name_id: 'Sayap Peri', jumlah: 'x3', source: 'Roar — Ruined temple area 2/3' },
    { id: 5, chapter: 'Chapter 1.8', quest_name: 'Purification Incense', name_en: 'Thick Beak', name_id: 'Paruh Tebal', jumlah: 'x3', source: 'Beak — Ruined temple area 1' },
    { id: 6, chapter: 'Chapter 1.8', quest_name: 'Purification Incense', name_en: 'Vine', name_id: 'Sulur', jumlah: 'x3', source: 'Pain Leaf — Isthmus Of Kaus' },
    { id: 7, chapter: 'Chapter 2.13', quest_name: 'Trials in the Palace', name_en: 'Swordsman Stone Coin', name_id: 'Koin Batu Ksatria', jumlah: 'x20', source: 'Sword marionette - New moon place' },
    { id: 8, chapter: 'Chapter 3.18', quest_name: 'The Invincible... Enemy??', name_en: 'Sand Mole Meat', name_id: 'Daging Tikus Pasir', jumlah: 'x1', source: 'Sand mole - Centerio highlands' },
    { id: 9, chapter: 'Chapter 3.18', quest_name: 'The Invincible... Enemy??', name_en: 'Beast Claw', name_id: 'Cakar Binatang Buas', jumlah: 'x5', source: 'Foxiger - Centerio highlands' },
    { id: 10, chapter: 'Chapter 3.18', quest_name: 'The Invincible... Enemy??', name_en: 'Sand Frog Skin', name_id: 'Kulit Kodok Pasir', jumlah: 'x5', source: 'Sand frosch - Centerio highlands' },
    { id: 11, chapter: 'Chapter 3.21', quest_name: 'Fate of the Fortress', name_en: 'Jagged Fang', name_id: 'Taring Bergerigi', jumlah: 'x10', source: 'Gob roga - Saham underground cave area 2' },
    { id: 12, chapter: 'Chapter 3.21', quest_name: 'Fate of the Fortress', name_en: 'Saham Crystal', name_id: 'Kristal Saham', jumlah: 'x5', source: 'Rotta nemico - Saham underground cave area 1' },
    { id: 13, chapter: 'Chapter 3.21', quest_name: 'Fate of the Fortress', name_en: 'Spiritual Gemstone', name_id: 'Permata Jiwa', jumlah: 'x1', source: 'Cassy - Ancient empress\'s tomb area 2/3' },
    { id: 14, chapter: 'Chapter 8.62', quest_name: 'The Ruins of the Gods', name_en: 'Rokoko Grape', name_id: 'Anggur Rokoko', jumlah: 'x5', source: 'Kijimu - Rokoko plains' },
    { id: 15, chapter: 'Chapter 9.73', quest_name: 'Front Line Base Operation', name_en: 'Labilans Wood', name_id: 'Kayu Labilans', jumlah: 'x10', source: 'Toretta - Labilans Sector area 1/2' },
    { id: 16, chapter: 'Chapter 11.89', quest_name: 'The Strolling Forest', name_en: 'Broken Horn', name_id: 'Tanduk Patah', jumlah: 'x20', source: 'Rhinoceros - Fugitive Lake Swamp area 1/2/3' },
    { id: 17, chapter: 'Chapter 12.102', quest_name: 'Ark Repair', name_en: 'Jabali Stone', name_id: 'Batu Jabali', jumlah: 'x5', source: 'Gemare - Kabla jabali' },
    { id: 18, chapter: 'Chapter 12.102', quest_name: 'Ark Repair', name_en: 'Growing Ore', name_id: 'Biji Berkembang', jumlah: 'x5', source: 'Petraceras/Orictoceras - Kabla jabali' },
    { id: 19, chapter: 'Chapter 14.119', quest_name: 'Fierce Battle with Mutant Lixis', name_en: 'Slimy Thick Skin', name_id: 'Kulit Tebal Berlendir', jumlah: 'x20', source: 'Romyzon - Lahan Basah Latum' },
    { id: 20, chapter: 'Chapter 14.119', quest_name: 'Fierce Battle with Mutant Lixis', name_en: 'Tangled Roots', name_id: 'Akar Melilit', jumlah: 'x10', source: 'Lileaf/Wiltileaf - Perdida Wasteland/Eumano Village' },
    { id: 21, chapter: 'Chapter 14.119', quest_name: 'Fierce Battle with Mutant Lixis', name_en: 'Menabra Wood', name_id: 'Kayu Menabra', jumlah: 'x10', source: 'Delphi - Menabra Plains' },
    { id: 22, chapter: 'Chapter 15.124', quest_name: 'The Young Man and the Old Tree', name_en: 'Stagnant Fertilizer', name_id: 'Pupuk Keruh', jumlah: 'x10', source: 'Solvay - Rode Zaag Range' }
  ];

  let currentLang = 'id';
  let currentPageMat = 1;
  const itemsPerPageMat = 10;

  const uniqueChapters = [...new Set(mqMaterialsData.map(m => m.chapter))].sort((a, b) => {
    return parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''));
  });

  const chapterSelect = document.getElementById('materialChapter');
  if (chapterSelect) {
    uniqueChapters.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch;
      opt.textContent = ch;
      chapterSelect.appendChild(opt);
    });
  }

  window.changeMatPage = function (page) {
    currentPageMat = page;
    renderMaterialsTable();
  };

  function renderMaterialsTable() {
    const searchEl = document.getElementById('materialSearch');
    const chapterEl = document.getElementById('materialChapter');
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;

    const searchVal = searchEl ? searchEl.value.toLowerCase() : '';
    const chapterVal = chapterEl ? chapterEl.value : 'Semua';

    const filtered = mqMaterialsData.filter(item => {
      const matchSearch = item.name_id.toLowerCase().includes(searchVal) ||
        item.name_en.toLowerCase().includes(searchVal) ||
        item.chapter.toLowerCase().includes(searchVal) ||
        item.quest_name.toLowerCase().includes(searchVal);
      const matchChapter = chapterVal === 'Semua' || item.chapter === chapterVal;
      return matchSearch && matchChapter;
    });

    const statTotal = document.getElementById('statTotal');
    const statChapters = document.getElementById('statChapters');
    const statFiltered = document.getElementById('statFiltered');
    if (statTotal) statTotal.textContent = mqMaterialsData.length;
    if (statChapters) statChapters.textContent = uniqueChapters.length;
    if (statFiltered) statFiltered.textContent = filtered.length;

    const totalPages = Math.ceil(filtered.length / itemsPerPageMat) || 1;
    if (currentPageMat > totalPages) currentPageMat = totalPages;

    const start = (currentPageMat - 1) * itemsPerPageMat;
    const paginatedData = filtered.slice(start, start + itemsPerPageMat);

    tbody.innerHTML = '';
    if (paginatedData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Tidak ada data yang ditemukan.</td></tr>`;
    } else {
      paginatedData.forEach((item, index) => {
        const itemName = currentLang === 'id' ? item.name_id : item.name_en;
        const subName = currentLang === 'id' ? item.name_en : item.name_id;
        const langLabel = currentLang === 'id' ? 'EN' : 'ID';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="text-center fw-bold text-muted">${start + index + 1}</td>
          <td><span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">${item.chapter}</span></td>
          <td>
            <div class="fw-bold" style="color: var(--blue-dark);">${itemName}</div>
            <small class="text-muted fst-italic" style="font-size: 0.75rem;">${langLabel}: ${subName} | ${item.quest_name}</small>
          </td>
          <td class="text-center fw-bold fs-5" style="color: var(--blue-accent);">${item.jumlah}</td>
          <td><small class="text-muted">${item.source || '-'}</small></td>
        `;
        tbody.appendChild(row);
      });
    }

    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
      paginationInfo.textContent = `Menampilkan ${filtered.length > 0 ? start + 1 : 0}-${Math.min(start + itemsPerPageMat, filtered.length)} dari ${filtered.length} data`;
    }

    const paginationControls = document.getElementById('paginationControls');
    if (paginationControls) {
      paginationControls.innerHTML = '';
      if (totalPages > 1) {
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPageMat === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" onclick="changeMatPage(${currentPageMat - 1}); return false;">&laquo;</a>`;
        paginationControls.appendChild(prevLi);

        for (let i = 1; i <= totalPages; i++) {
          if (i === 1 || i === totalPages || (i >= currentPageMat - 1 && i <= currentPageMat + 1)) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPageMat ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" onclick="changeMatPage(${i}); return false;">${i}</a>`;
            paginationControls.appendChild(li);
          } else if (i === currentPageMat - 2 || i === currentPageMat + 2) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = `<span class="page-link">...</span>`;
            paginationControls.appendChild(li);
          }
        }

        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPageMat === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" onclick="changeMatPage(${currentPageMat + 1}); return false;">&raquo;</a>`;
        paginationControls.appendChild(nextLi);
      }
    }
  }

  const matSearchEl = document.getElementById('materialSearch');
  if (matSearchEl) matSearchEl.addEventListener('input', () => { currentPageMat = 1; renderMaterialsTable(); });

  const matChapterEl = document.getElementById('materialChapter');
  if (matChapterEl) matChapterEl.addEventListener('change', () => { currentPageMat = 1; renderMaterialsTable(); });

  const toggleLangBtn = document.getElementById('toggleLangBtn');
  if (toggleLangBtn) {
    toggleLangBtn.addEventListener('click', function () {
      currentLang = currentLang === 'id' ? 'en' : 'id';
      this.innerHTML = currentLang === 'id' ? '<i class="bi bi-translate me-2"></i>Ganti ke Bahasa Inggris' : '<i class="bi bi-translate me-2"></i>Ganti ke Bahasa Indonesia';
      renderMaterialsTable();
    });
  }

  renderMaterialsTable();
  console.log("MQ Materials Table initialized with", mqMaterialsData.length, "items.");
  const hokianMessages = {
    general: [
      { min: 0, title: "{name}, RNG RED FLAG! ⚠️", msg: "Hoki lagi sial. Mending AFK di kota atau logout dulu. Jangan dipaksa!" },
      { min: 40, title: "{name}, Biasa Aja... 😐", msg: "RNG lagi netral. Jangan neko-neko dulu, main aman lebih baik." },
      { min: 70, title: "{name}, Lagi Hoki Nih! 😊", msg: "Luck-mu lagi bagus. Cocok buat farm boss atau coba-coba fill stat." },
      { min: 90, title: "{name}, DEWA RNG! 🌟", msg: "Hari ini RNG-mu gacor parah! Waktunya upgrade, craft, atau buka gacha. Semua bakal hoki!" }
    ],
    fillstat: [
      { min: 0, title: "{name}, JANGAN FILL STAT! 🛑", msg: "RNG lagi jahat. Fill stat sekarang = material hilang percuma. Tunda dulu bro!" },
      { min: 40, title: "{name}, Rawan Pecah 💥", msg: "Success rate lagi rendah. Pastikan punya banyak backup material atau tunggu dulu." },
      { min: 70, title: "{name}, Fill Stat Aman 🛡️", msg: "Peluang sukses tinggi. Siapkan material cadangan dikit, tapi overall aman kok." },
      { min: 90, title: "{name}, ANTI PECAH 100%! 🔨", msg: "Success rate fill stat lagi max! Ga bakal ada stat yang hilang. Gaskeun tanpa takut pecah!" }
    ],
    craft: [
      { min: 0, title: "{name}, Material Hilang Percuma 🗑️", msg: "Craft sekarang = buang-buang material. Mending farm material dulu atau tunggu hoki membaik!" },
      { min: 40, title: "{name}, Hasil Mungkin Zonk 📉", msg: "Crafting hari ini mungkin cuma dapat 0 slot atau POT rendah. Jangan berharap tinggi." },
      { min: 70, title: "{name}, Craft Lagi Bagus 🍀", msg: "Peluang dapat slot atau POT bagus terbuka. Lanjutkan crafting-mu!" },
      { min: 90, title: "{name}, 2 SLOT GUARANTEED! ⚒️", msg: "Crafting hoki maksimal! Potensi dapat 2 slot atau high POT sangat tinggi. Waktunya Craft Brutal!" }
    ],
    drop: [
      { min: 0, title: "{name}, Farming Zonk Total 🗑️", msg: "Monster cuma drop Material atau Equipment 1 Slot receh. Mending istirahat atau lakukan quest aja." },
      { min: 40, title: "{name}, Boss Pelit Hari Ini 🏜️", msg: "Drop lagi kering. Coba ganti channel, map, atau party buat boost drop rate." },
      { min: 70, title: "{name}, Rejeki Lagi Mengalir 🍀", msg: "Drop rate bersahabat. Lanjutkan farming Sampai Gila." },
      { min: 90, title: "{name}, DROP RATE GACOR! 💎", msg: "Monster/Boss bakal drop item 2s/High Atk! Farming time! Pakai Drop Up book makin gacor!" }
    ],
    gacha: [
      { min: 0, title: "{name}, JANGAN BUANG ORB! 💸", msg: "RNG gacha lagi jahat. Orb mahal cuma bakal dapat Aksesoris. Tahan dulu jempolmu!" },
      { min: 40, title: "{name}, Orb Terbang Percuma 📉", msg: "Gacha hari ini kemungkinan besar zonk. Simpan orb-mu untuk waktu yang lebih baik." },
      { min: 70, title: "{name}, Gacha Lagi Bagus 🎟️", msg: "Peluang dapat item dari gacha cukup tinggi. Gas tipis-tipis!" },
      { min: 90, title: "{name}, PRIME ATAU LEGSILK MENANTIMU! 🎁", msg: "Buka orb sekarang! Avatar 1 Set, Legsilk, atau Prime menantimu. Ini saatnya!" }
    ]
  };

  const btnCekHokian = document.getElementById('btnCekHokian');
  if (btnCekHokian) {
    btnCekHokian.addEventListener('click', () => {
      const nicknameRaw = document.getElementById('hokianNickname').value.trim();
      const name = nicknameRaw || "Petualang"; // Default jika kosong
      const aspect = document.getElementById('hokianAspect').value;

      const resultDiv = document.getElementById('hokianResult');
      const scoreEl = document.getElementById('hokianScore');
      const titleEl = document.getElementById('hokianTitle');
      const msgEl = document.getElementById('hokianMessage');
      const visualEl = document.getElementById('hokianVisual');

      // Reset & Tampilkan animasi loading
      resultDiv.classList.remove('d-none');
      scoreEl.textContent = '0%';
      titleEl.textContent = `Membaca nasib ${name}...`;
      msgEl.textContent = 'Mohon tunggu sebentar';
      visualEl.textContent = '🔮';
      visualEl.style.animation = 'shake 0.5s infinite';

      // Generate skor acak 0-100
      const finalScore = Math.floor(Math.random() * 101);

      // Cari pesan yang sesuai
      const messages = hokianMessages[aspect];
      const matched = messages.slice().reverse().find(m => finalScore >= m.min);

      // Ganti placeholder {name} dengan nickname asli
      const finalTitle = matched.title.replace('{name}', name);
      const finalMsg = matched.msg.replace('{name}', name);

      // Animasi angka berputar (rolling)
      let currentScore = 0;
      const duration = 1500; // 1.5 detik
      const intervalTime = 20;
      const steps = duration / intervalTime;
      const increment = finalScore / steps;

      const rollInterval = setInterval(() => {
        currentScore += increment;
        if (currentScore >= finalScore) {
          currentScore = finalScore;
          clearInterval(rollInterval);

          // Finalisasi UI
          scoreEl.textContent = finalScore + '%';
          titleEl.textContent = finalTitle;
          msgEl.textContent = finalMsg;
          visualEl.style.animation = 'none';

          // Pewarnaan & Efek berdasarkan skor
          if (finalScore >= 80) {
            scoreEl.style.color = '#198754'; // Hijau
            visualEl.textContent = '🌟';
            // Trigger Confetti!
            if (typeof confetti === 'function') {
              confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#198754', '#0d6efd']
              });
            }
          } else if (finalScore >= 50) {
            scoreEl.style.color = '#0d6efd'; // Biru
            visualEl.textContent = '😊';
          } else if (finalScore >= 30) {
            scoreEl.style.color = '#ffc107'; // Kuning
            visualEl.textContent = '😐';
          } else {
            scoreEl.style.color = '#dc3545'; // Merah
            visualEl.textContent = '💀';
            // Efek getar 3x kalau hokian jelek
            visualEl.style.animation = 'shake 0.5s ease-in-out 3';
          }
        } else {
          scoreEl.textContent = Math.floor(currentScore) + '%';
        }
      }, intervalTime);
    });
  }
});