const { monsters, DIFFICULTY_MULTIPLIERS, ARTIFACT_DEFS, ACHIEVEMENTS } = window.GameData || {};

function getMonsterEffectiveMaxHp(monster) {
  const m = DIFFICULTY_MULTIPLIERS[state.difficulty] || DIFFICULTY_MULTIPLIERS.normal;
  return Math.max(1, Math.ceil(monster.maxHp * m.hp));
}

function getMonsterEffectiveGold(monster) {
  const m = DIFFICULTY_MULTIPLIERS[state.difficulty] || DIFFICULTY_MULTIPLIERS.normal;
  let gold = monster.gold * m.gold;
  if (state.artifacts && state.artifacts.length) {
    state.artifacts.forEach((aid) => {
      const def = ARTIFACT_DEFS[aid];
      if (def && def.goldMultiplier) gold *= def.goldMultiplier;
    });
  }
  return Math.max(1, Math.ceil(gold));
}

function hasArtifact(id) {
  return state.artifacts && state.artifacts.includes(id);
}

function checkAchievements() {
  ACHIEVEMENTS.forEach((a) => {
    if (state.artifacts.includes(a.id)) return;
    let ok = false;
    if (a.requirement === "kills" && state.kills >= a.value) ok = true;
    if (a.requirement === "totalHits" && state.totalHitsEver >= a.value) ok = true;
    if (ok) state.artifacts.push(a.id);
  });
}

function createInitialState() {
  const diff = "normal";
  const monster = monsters[0];
  const effectiveMaxHp = Math.max(1, Math.ceil(monster.maxHp * (DIFFICULTY_MULTIPLIERS[diff] || DIFFICULTY_MULTIPLIERS.normal).hp));
  return {
    gold: 0,
    kills: 0,
    level: 1,
    xp: 0,
    xpToNext: 12,
    monsterIndex: 0,
    currentHp: effectiveMaxHp,
    hitCountOnCurrent: 0,
    attackLocked: false,
    difficulty: diff,
    difficultyChosen: false,
    difficultyLocked: false,
    rage: 0,
    rageReady: false,
    totalHitsEver: 0,
    artifacts: [],
    stats: {
      power: 1,
      magic: 0,
      bleed: 0,
      critChance: 0,
      critDamage: 1.5
    },
    upgradeCosts: {
      power: 10,
      magic: 15,
      bleed: 35,
      critChance: 22,
      critDamage: 30
    },
    monsterBleedStacks: 0,
    monsterBleedRounds: 0,
    audioMuted: false
  };
}

const state = createInitialState();

window.setInitialDifficultyFromIntro = function (diff) {
  if (!["easy", "normal", "hard"].includes(diff)) return;
  var monster = getCurrentMonster();
  var oldMax = getMonsterEffectiveMaxHp(monster);
  state.difficulty = diff;
  state.difficultyChosen = true;
  state.difficultyLocked = true;
  var newMax = getMonsterEffectiveMaxHp(monster);
  state.currentHp = Math.min(newMax, Math.max(1, Math.round((state.currentHp / oldMax) * newMax)));
};

const STORAGE_KEY = "slime-clicker-save-v1";
const AUDIO_PATHS = {
  hit: "./sounds/hit/hit-1.wav",
  crit: "./sounds/crit/critical-hit.mp3",
  death: "./sounds/death/slime-death-1.wav",
  music: "./sounds/music/forest-loop.wav"
};

const ui = {
  gold: document.getElementById("gold"),
  kills: document.getElementById("kills"),
  level: document.getElementById("level"),
  xpText: document.getElementById("xpText"),
  monsterName: document.getElementById("monsterName"),
  monsterTrait: document.getElementById("monsterTrait"),
  critFxLayer: document.getElementById("critFxLayer"),
  monsterImage: document.getElementById("monsterImage"),
  hpFill: document.getElementById("hpFill"),
  hpText: document.getElementById("hpText"),
  attackBtn: document.getElementById("attackBtn"),
  logText: document.getElementById("logText"),
  statPower: document.getElementById("statPower"),
  statMagic: document.getElementById("statMagic"),
  statCritChance: document.getElementById("statCritChance"),
  statCritDamage: document.getElementById("statCritDamage"),
  statBleed: document.getElementById("statBleed"),
  pricePower: document.getElementById("pricePower"),
  priceMagic: document.getElementById("priceMagic"),
  priceBleed: document.getElementById("priceBleed"),
  priceCritChance: document.getElementById("priceCritChance"),
  priceCritDamage: document.getElementById("priceCritDamage"),
  skillButtons: document.querySelectorAll(".skill-btn"),
  resetBtn: document.getElementById("resetBtn"),
  audioToggleBtn: document.getElementById("audioToggleBtn"),
  damageNumbersLayer: document.getElementById("damageNumbersLayer"),
  deathParticlesLayer: document.getElementById("deathParticlesLayer"),
  rageFill: document.getElementById("rageFill"),
  ragePct: document.getElementById("ragePct"),
  artifactsList: document.getElementById("artifactsList")
};

const audio = {
  started: false,
  bgm: new Audio(AUDIO_PATHS.music)
};

audio.bgm.loop = true;
audio.bgm.volume = 0.48;

function getCurrentMonster() {
  return monsters[state.monsterIndex];
}

function calcBaseDamage() {
  return state.stats.power + state.stats.magic;
}

function getLevelBonusMultiplier() {
  return 1 + (state.level - 1) * 0.05;
}

function sanitizeLoadedNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const saved = JSON.parse(raw);
    state.gold = Math.max(0, sanitizeLoadedNumber(saved.gold, state.gold));
    state.kills = Math.max(0, sanitizeLoadedNumber(saved.kills, state.kills));
    state.level = Math.max(1, sanitizeLoadedNumber(saved.level, state.level));
    state.xp = Math.max(0, sanitizeLoadedNumber(saved.xp, state.xp));
    state.xpToNext = Math.max(8, sanitizeLoadedNumber(saved.xpToNext, state.xpToNext));
    state.monsterIndex = Math.max(0, Math.min(monsters.length - 1, sanitizeLoadedNumber(saved.monsterIndex, state.monsterIndex)));
    state.currentHp = Math.max(1, sanitizeLoadedNumber(saved.currentHp, state.currentHp));
    state.hitCountOnCurrent = Math.max(0, sanitizeLoadedNumber(saved.hitCountOnCurrent, state.hitCountOnCurrent));
    state.difficulty = ["easy", "normal", "hard"].includes(saved.difficulty) ? saved.difficulty : "normal";
    state.difficultyChosen = Boolean(saved.difficultyChosen);
    state.difficultyLocked = Boolean(saved.difficultyLocked);
    state.rage = Math.max(0, Math.min(100, sanitizeLoadedNumber(saved.rage, state.rage)));
    state.rageReady = Boolean(saved.rageReady);
    state.totalHitsEver = Math.max(0, sanitizeLoadedNumber(saved.totalHitsEver, state.totalHitsEver));
    state.attackLocked = false;
    state.artifacts = Array.isArray(saved.artifacts) ? saved.artifacts.filter((id) => ARTIFACT_DEFS[id]) : [];

    if (saved.stats) {
      state.stats.power = Math.max(1, sanitizeLoadedNumber(saved.stats.power, state.stats.power));
      state.stats.magic = Math.max(0, sanitizeLoadedNumber(saved.stats.magic, state.stats.magic));
      state.stats.bleed = Math.max(0, Math.min(0.4, sanitizeLoadedNumber(saved.stats.bleed, state.stats.bleed)));
      state.stats.critChance = Math.max(0, Math.min(0.85, sanitizeLoadedNumber(saved.stats.critChance, state.stats.critChance)));
      state.stats.critDamage = Math.max(1.5, sanitizeLoadedNumber(saved.stats.critDamage, state.stats.critDamage));
    }

    if (saved.upgradeCosts) {
      state.upgradeCosts.power = Math.max(10, sanitizeLoadedNumber(saved.upgradeCosts.power, state.upgradeCosts.power));
      state.upgradeCosts.magic = Math.max(10, sanitizeLoadedNumber(saved.upgradeCosts.magic, state.upgradeCosts.magic));
      state.upgradeCosts.bleed = Math.max(10, sanitizeLoadedNumber(saved.upgradeCosts.bleed, state.upgradeCosts.bleed));
      state.upgradeCosts.critChance = Math.max(10, sanitizeLoadedNumber(saved.upgradeCosts.critChance, state.upgradeCosts.critChance));
      state.upgradeCosts.critDamage = Math.max(10, sanitizeLoadedNumber(saved.upgradeCosts.critDamage, state.upgradeCosts.critDamage));
    }
    state.audioMuted = Boolean(saved.audioMuted);

    const monster = getCurrentMonster();
    const cap = getMonsterEffectiveMaxHp(monster);
    state.currentHp = Math.min(cap, Math.max(1, state.currentHp));
  } catch (error) {
    console.warn("Не удалось загрузить сохранение:", error);
  }
}

function saveProgress() {
  const payload = {
    gold: state.gold,
    kills: state.kills,
    level: state.level,
    xp: state.xp,
    xpToNext: state.xpToNext,
    monsterIndex: state.monsterIndex,
    currentHp: state.currentHp,
    hitCountOnCurrent: state.hitCountOnCurrent,
    difficulty: state.difficulty,
    difficultyChosen: state.difficultyChosen,
    difficultyLocked: state.difficultyLocked,
    rage: state.rage,
    rageReady: state.rageReady,
    totalHitsEver: state.totalHitsEver,
    artifacts: state.artifacts,
    stats: state.stats,
    upgradeCosts: state.upgradeCosts,
    audioMuted: state.audioMuted
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function gainXp(amount) {
  state.xp += amount;
  let leveledUp = false;

  while (state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext;
    state.level += 1;
    state.xpToNext = Math.ceil(state.xpToNext * 1.35);
    leveledUp = true;
  }

  return leveledUp;
}

function resetProgress() {
  const initial = createInitialState();
  state.gold = initial.gold;
  state.kills = initial.kills;
  state.level = initial.level;
  state.xp = initial.xp;
  state.xpToNext = initial.xpToNext;
  state.monsterIndex = initial.monsterIndex;
  state.currentHp = initial.currentHp;
  state.hitCountOnCurrent = initial.hitCountOnCurrent;
  state.difficulty = initial.difficulty;
  state.difficultyChosen = initial.difficultyChosen;
  state.difficultyLocked = initial.difficultyLocked;
  state.rage = initial.rage;
  state.rageReady = initial.rageReady;
  state.totalHitsEver = initial.totalHitsEver;
  state.artifacts = [...initial.artifacts];
  state.attackLocked = false;
  state.stats = { ...initial.stats };
  state.upgradeCosts = { ...initial.upgradeCosts };
  state.monsterBleedStacks = initial.monsterBleedStacks || 0;
  state.monsterBleedRounds = initial.monsterBleedRounds || 0;

  localStorage.removeItem(STORAGE_KEY);
  ui.logText.textContent = "Прогресс сброшен. Новая охота началась!";
  render();
  updateDifficultyButtons();
}

function playCritEffect(damage) {
  if (!ui.critFxLayer) {
    return;
  }

  const splash = document.createElement("div");
  splash.className = "crit-splash";
  splash.style.left = `${32 + Math.random() * 36}%`;
  splash.style.top = `${22 + Math.random() * 24}%`;

  const label = document.createElement("div");
  label.className = "crit-label";
  label.style.left = `${40 + Math.random() * 20}%`;
  label.style.top = `${24 + Math.random() * 22}%`;
  label.textContent = `КРИТ! -${Math.round(damage)}`;

  ui.critFxLayer.appendChild(splash);
  ui.critFxLayer.appendChild(label);
  splash.addEventListener("animationend", () => splash.remove());
  label.addEventListener("animationend", () => label.remove());

  ui.monsterImage.classList.remove("crit-pop");
  void ui.monsterImage.offsetWidth;
  ui.monsterImage.classList.add("crit-pop");
  ui.monsterImage.classList.add("crit-glow");
  window.setTimeout(() => {
    ui.monsterImage.classList.remove("crit-glow");
  }, 220);
}

function showDmgNumber(value, isCrit) {
  if (!ui.damageNumbersLayer || value <= 0) return;
  const el = document.createElement("div");
  el.className = "dmg-number" + (isCrit ? " crit" : "");
  el.textContent = "-" + Math.round(value);
  el.style.left = (48 + (Math.random() - 0.5) * 16) + "%";
  el.style.top = (26 + (Math.random() - 0.5) * 8) + "%";
  ui.damageNumbersLayer.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

function playSlimeHitAnimation() {
  if (!ui.monsterImage) return;
  ui.monsterImage.classList.remove("slime-hit");
  void ui.monsterImage.offsetWidth;
  ui.monsterImage.classList.add("slime-hit");
  setTimeout(() => ui.monsterImage.classList.remove("slime-hit"), 320);
}

function showDeathParticles() {
  if (!ui.deathParticlesLayer) return;
  for (let i = 0; i < 9; i++) {
    const p = document.createElement("div");
    p.className = "death-particle";
    ui.deathParticlesLayer.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }
}

function updateDifficultyButtons() {
  const hint = document.getElementById("difficultyLockHint");
  document.querySelectorAll(".difficulty-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.difficulty === state.difficulty);
    btn.classList.toggle("locked", state.difficultyLocked);
  });
  if (hint) hint.classList.toggle("visible", state.difficultyLocked);
}

function triggerDifficultyShake() {
  var frame = document.getElementById("difficultyFrame");
  if (!frame) return;
  frame.classList.remove("difficulty-shake");
  frame.offsetWidth;
  frame.classList.add("difficulty-shake");
  setTimeout(function () {
    frame.classList.remove("difficulty-shake");
  }, 520);
}

function updateAudioButtonText() {
  ui.audioToggleBtn.textContent = state.audioMuted ? "Звук: Выкл" : "Звук: Вкл";
}

function playOneShot(path, volume) {
  if (state.audioMuted) {
    return;
  }
  const sfx = new Audio(path);
  sfx.volume = volume;
  sfx.play().catch(() => {});
}

function ensureAudioStarted() {
  if (audio.started) {
    return;
  }
  audio.started = true;
  if (!state.audioMuted) {
    audio.bgm.play().catch(() => {});
  }
}

function toggleAudioMute() {
  state.audioMuted = !state.audioMuted;
  if (state.audioMuted) {
    audio.bgm.pause();
  } else if (audio.started) {
    audio.bgm.play().catch(() => {});
  }
  updateAudioButtonText();
  saveProgress();
}

function render() {
  const monster = getCurrentMonster();
  const effectiveMaxHp = getMonsterEffectiveMaxHp(monster);
  const hpPercent = Math.max(0, (state.currentHp / effectiveMaxHp) * 100);

  ui.gold.textContent = Math.floor(state.gold);
  ui.kills.textContent = state.kills;
  ui.level.textContent = state.level;
  ui.xpText.textContent = `${Math.floor(state.xp)} / ${state.xpToNext}`;
  ui.monsterName.textContent = monster.name;
  ui.monsterTrait.textContent = monster.traitText;
  ui.monsterImage.onerror = () => {
    if (monster.fallbackImage && ui.monsterImage.src.indexOf(monster.fallbackImage) === -1) {
      ui.monsterImage.src = monster.fallbackImage;
    }
  };
  ui.monsterImage.src = monster.image;
  ui.monsterImage.alt = monster.name;
  ui.monsterImage.dataset.monster = monster.id || "";
  if (monster.id === "t3") {
    ui.monsterImage.style.width = "260px";
    ui.monsterImage.style.height = "260px";
  } else {
    ui.monsterImage.style.width = "240px";
    ui.monsterImage.style.height = "240px";
  }
  ui.hpFill.style.width = `${hpPercent}%`;
  ui.hpText.textContent = `${Math.max(0, Math.ceil(state.currentHp))} / ${effectiveMaxHp}`;

  if (ui.rageFill) {
    ui.rageFill.style.width = state.rage + "%";
    ui.rageFill.classList.toggle("full", state.rageReady);
  }
  if (ui.ragePct) ui.ragePct.textContent = state.rageReady ? "Готово!" : state.rage + "%";

  if (ui.artifactsList) {
    ui.artifactsList.innerHTML = "";
    (state.artifacts || []).forEach((id) => {
      const def = ARTIFACT_DEFS[id];
      if (!def) return;
      const li = document.createElement("li");
      li.textContent = def.name;
      ui.artifactsList.appendChild(li);
    });
  }

  ui.statPower.textContent = state.stats.power;
  ui.statMagic.textContent = state.stats.magic;
  if (ui.statBleed) ui.statBleed.textContent = Math.round(state.stats.bleed * 100) + "%";
  ui.statCritChance.textContent = `${Math.round(state.stats.critChance * 100)}%`;
  ui.statCritDamage.textContent = `x${state.stats.critDamage.toFixed(2)}`;

  ui.pricePower.textContent = state.upgradeCosts.power;
  ui.priceMagic.textContent = state.upgradeCosts.magic;
  if (ui.priceBleed) ui.priceBleed.textContent = state.upgradeCosts.bleed;
  ui.priceCritChance.textContent = state.upgradeCosts.critChance;
  ui.priceCritDamage.textContent = state.upgradeCosts.critDamage;

  ui.skillButtons.forEach((btn) => {
    const skill = btn.dataset.skill;
    const cost = state.upgradeCosts[skill];
    const canAfford = state.difficultyChosen && state.gold >= cost;
    btn.disabled = !state.difficultyChosen || state.gold < cost;
    btn.classList.toggle("affordable", canAfford);
  });
  updateAudioButtonText();
}

var BLEED_DAMAGE_PER_STACK = 2;
var BLEED_ROUNDS = 3;

function nextMonster() {
  state.monsterIndex = (state.monsterIndex + 1) % monsters.length;
  state.currentHp = getMonsterEffectiveMaxHp(getCurrentMonster());
  state.hitCountOnCurrent = 0;
  state.monsterBleedStacks = 0;
  state.monsterBleedRounds = 0;
}

function attack() {
  ensureAudioStarted();

  if (!state.difficultyChosen) {
    ui.logText.textContent = "Сначала выберите сложность слева.";
    triggerDifficultyShake();
    return;
  }

  if (state.attackLocked) {
    return;
  }

  const monster = getCurrentMonster();
  state.hitCountOnCurrent += 1;
  state.totalHitsEver += 1;

  if (state.monsterBleedRounds > 0 && state.monsterBleedStacks > 0) {
    var bleedDmg = state.monsterBleedStacks * BLEED_DAMAGE_PER_STACK;
    state.currentHp -= bleedDmg;
    showDmgNumber(bleedDmg, false);
    state.monsterBleedRounds -= 1;
    if (state.monsterBleedRounds <= 0) {
      state.monsterBleedStacks = 0;
    }
  }

  if (state.currentHp <= 0) {
    state.attackLocked = true;
    if (monster.id === "t-boss") state.difficultyLocked = false;
    playOneShot(AUDIO_PATHS.death, 0.68);
    showDeathParticles();
    var goldEarned = getMonsterEffectiveGold(monster);
    state.gold += goldEarned;
    state.kills += 1;
    checkAchievements();
    var didLevelUp = gainXp(monster.xp);
    ui.logText.textContent = monster.name + " повержен! +" + goldEarned + " золота, +" + monster.xp + " опыта." + (didLevelUp ? " Уровень повышен!" : "");
    setTimeout(function () {
      nextMonster();
      state.attackLocked = false;
      render();
      updateDifficultyButtons();
      saveProgress();
    }, 480);
    render();
    updateDifficultyButtons();
    saveProgress();
    return;
  }

  const rageBonus = state.rageReady;
  if (state.rageReady) {
    state.rageReady = false;
    state.rage = 0;
  }

  let baseDamage = calcBaseDamage() * getLevelBonusMultiplier();
  if (rageBonus) baseDamage *= 1.35;
  const didCrit = Math.random() < state.stats.critChance;
  if (didCrit) baseDamage *= state.stats.critDamage;

  const traitResult = monster.applyTraits(baseDamage, state.stats, state.hitCountOnCurrent, { isCrit: didCrit });
  const finalDamage = Math.max(0, traitResult.damage);

  state.currentHp -= finalDamage;
  showDmgNumber(finalDamage, didCrit || rageBonus);
  playSlimeHitAnimation();

  const isDoubleStrike = hasArtifact("doubleStrike") && state.totalHitsEver % 50 === 0;
  if (isDoubleStrike && finalDamage > 0) {
    state.currentHp -= finalDamage;
    showDmgNumber(finalDamage, didCrit || rageBonus);
    playSlimeHitAnimation();
  }

  if (state.stats.bleed > 0 && Math.random() < state.stats.bleed) {
    state.monsterBleedStacks += 1;
    state.monsterBleedRounds = BLEED_ROUNDS;
  }

  state.rage = Math.min(100, state.rage + (didCrit ? 4 : 2));
  if (state.rage >= 100) {
    state.rage = 100;
    state.rageReady = true;
  }

  const infoTail = traitResult.note ? ` ${traitResult.note}` : "";
  ui.logText.textContent = `Вы нанесли ${finalDamage.toFixed(1)} урона.${didCrit ? " Критический удар!" : ""}${infoTail}`;
  if ((didCrit || rageBonus) && finalDamage > 0) {
    playCritEffect(finalDamage);
    playOneShot(AUDIO_PATHS.crit, 0.75);
  } else if (finalDamage > 0) {
    playOneShot(AUDIO_PATHS.hit, 0.55);
  }

  if (state.currentHp <= 0) {
    state.attackLocked = true;
    if (monster.id === "t-boss") {
      state.difficultyLocked = false;
    }
    playOneShot(AUDIO_PATHS.death, 0.68);
    showDeathParticles();
    const goldEarned = getMonsterEffectiveGold(monster);
    state.gold += goldEarned;
    state.kills += 1;
    checkAchievements();
    const didLevelUp = gainXp(monster.xp);
    ui.logText.textContent = `${monster.name} повержен! +${goldEarned} золота, +${monster.xp} опыта.${didLevelUp ? " Уровень повышен!" : ""}`;
    render();
    updateDifficultyButtons();
    saveProgress();

    var card = document.querySelector(".monster-card");
    var img = ui.monsterImage;
    if (card) card.classList.add("monster-out");
    setTimeout(function () {
      nextMonster();
      if (card) {
        card.classList.remove("monster-out");
        card.classList.add("monster-hidden");
      }
      render();

      var animateIn = function () {
        if (card) {
          card.classList.remove("monster-hidden");
          card.classList.add("monster-in");
        }
        setTimeout(function () {
          if (card) card.classList.remove("monster-in");
          state.attackLocked = false;
          render();
          updateDifficultyButtons();
          saveProgress();
        }, 560);
      };

      if (!img) {
        animateIn();
        return;
      }

      var done = false;
      var onReady = function () {
        if (done) return;
        done = true;
        animateIn();
      };

      img.addEventListener("load", onReady, { once: true });
      img.addEventListener("error", onReady, { once: true });
      setTimeout(onReady, 260);
    }, 520);
    return;
  }

  checkAchievements();
  render();
  saveProgress();
}

function upgradeSkill(skill) {
  const price = state.upgradeCosts[skill];
  if (!state.difficultyChosen) {
    ui.logText.textContent = "Сначала выберите сложность слева.";
    triggerDifficultyShake();
    return;
  }
  if (state.gold < price) {
    ui.logText.textContent = "Недостаточно золота для улучшения.";
    return;
  }

  state.gold -= price;
  state.upgradeCosts[skill] = Math.ceil(price * 1.35);

  if (skill === "power") {
    state.stats.power += 1;
    ui.logText.textContent = "Сила удара увеличена.";
  } else if (skill === "magic") {
    state.stats.magic += 1;
    ui.logText.textContent = "Магия усилена.";
  } else if (skill === "critChance") {
    state.stats.critChance = Math.min(0.85, Number((state.stats.critChance + 0.04).toFixed(2)));
    ui.logText.textContent = "Крит шанс повышен.";
  } else if (skill === "bleed") {
    state.stats.bleed = Math.min(0.4, Number((state.stats.bleed + 0.05).toFixed(2)));
    ui.logText.textContent = "Кровотечение усилено.";
  } else if (skill === "critDamage") {
    state.stats.critDamage = Number((state.stats.critDamage + 0.15).toFixed(2));
    ui.logText.textContent = "Крит урон повышен.";
  }

  render();
  saveProgress();
}

if (ui.attackBtn) {
  ui.attackBtn.addEventListener("click", attack);
}

ui.skillButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    upgradeSkill(btn.dataset.skill);
  });
});

if (ui.resetBtn) {
  ui.resetBtn.addEventListener("click", () => {
    ensureAudioStarted();
    const confirmed = window.confirm("Сбросить весь прогресс и начать заново?");
    if (!confirmed) {
      return;
    }
    resetProgress();
  });
}

if (ui.audioToggleBtn) {
  ui.audioToggleBtn.addEventListener("click", () => {
    ensureAudioStarted();
    toggleAudioMute();
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (target.closest(".skill-btn") || target.closest("#attackBtn") || target.closest("#resetBtn") || target.closest("#audioToggleBtn") || target.closest(".difficulty-btn")) {
    return;
  }

  attack();
});

document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.difficulty;
    if (!next || next === state.difficulty) return;
    const monster = getCurrentMonster();
    const oldMax = getMonsterEffectiveMaxHp(monster);
    if (state.difficultyChosen && state.difficultyLocked) {
      return;
    }
    state.difficulty = next;
    if (!state.difficultyChosen) {
      state.difficultyChosen = true;
    }
    state.difficultyLocked = true;
    const newMax = getMonsterEffectiveMaxHp(monster);
    state.currentHp = Math.min(newMax, Math.max(1, Math.round((state.currentHp / oldMax) * newMax)));
    updateDifficultyButtons();
    saveProgress();
    render();
  });
});

// Логика интро-книги вынесена в intro.js
