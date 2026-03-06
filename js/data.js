// Данные игры: монстры, множители сложности и артефакты
(function (global) {
  const monsters = [
    {
      id: "t1",
      name: "Зеленый Слизень",
      image: "./images/sl-1.png",
      fallbackImage: "./images/slimes/t1.svg",
      maxHp: 35,
      gold: 12,
      xp: 4,
      traitText: "Обычный монстр без сопротивлений.",
      applyTraits(baseDamage, stats) {
        return { damage: baseDamage, note: "" };
      }
    },
    {
      id: "t2",
      name: "Синий Слизень",
      image: "./images/sl-2.png",
      fallbackImage: "./images/slimes/t2.svg",
      maxHp: 55,
      gold: 20,
      xp: 6,
      traitText: "Магорезист: получает на 50% меньше магического урона.",
      applyTraits(baseDamage, stats) {
        const magicPenalty = stats.magic * 0.5;
        return { damage: Math.max(1, baseDamage - magicPenalty), note: "Магия ослаблена." };
      }
    },
    {
      id: "t3",
      name: "Быстрый Слизень",
      image: "./images/sl-3.png",
      fallbackImage: "./images/slimes/t3.svg",
      maxHp: 85,
      gold: 33,
      xp: 9,
      traitText: "Антикрит: получает на 50% меньше урона от критов.",
      applyTraits(baseDamage, stats, hitCount, attackInfo) {
        if (attackInfo.isCrit) {
          return { damage: Math.max(1, baseDamage * 0.5), note: "Крит частично поглощен." };
        }
        return { damage: baseDamage, note: "" };
      }
    },
    {
      id: "t4",
      name: "Колючий Слизень",
      image: "./images/sl-4.png",
      fallbackImage: "./images/slimes/t4.svg",
      maxHp: 130,
      gold: 48,
      xp: 14,
      traitText: "Панцирь: всегда блокирует 2 урона.",
      applyTraits(baseDamage, stats) {
        return { damage: Math.max(1, baseDamage - 2), note: "Панцирь поглотил часть урона." };
      }
    },
    {
      id: "t5",
      name: "Теневой Слизень",
      image: "./images/sl-5.png",
      fallbackImage: "./images/slimes/t5.svg",
      maxHp: 190,
      gold: 75,
      xp: 20,
      traitText: "Нестабилен: уклоняется от каждого 3-го удара.",
      applyTraits(baseDamage, stats, hitCount) {
        if (hitCount % 3 === 0) {
          return { damage: 0, note: "Монстр уклонился от удара!" };
        }
        return { damage: baseDamage, note: "" };
      }
    },
    {
      id: "t-boss",
      name: "Босс Слизней",
      image: "./images/sl-boss.png",
      fallbackImage: "./images/slimes/t-boss.svg",
      maxHp: 320,
      gold: 150,
      xp: 35,
      traitText: "Босс: магорезист 40%, блок 2 урона, крит урон режется на 35%.",
      applyTraits(baseDamage, stats, _hitCount, attackInfo) {
        const magicPenalty = stats.magic * 0.4;
        let bossDamage = Math.max(1, baseDamage - magicPenalty - 2);
        if (attackInfo.isCrit) {
          bossDamage = Math.max(1, bossDamage * 0.65);
        }
        return { damage: bossDamage, note: "Босс режет магию, блокирует и ослабляет криты." };
      }
    }
  ];

  const DIFFICULTY_MULTIPLIERS = {
    easy: { hp: 0.9, gold: 0.95 },
    normal: { hp: 1.2, gold: 1 },
    hard: { hp: 2.4, gold: 1.25 }
  };

  const ARTIFACT_DEFS = {
    gold10: { name: "+10% золота", goldMultiplier: 1.1 },
    doubleStrike: { name: "Раз в 50 ударов — двойной удар", everyNHits: 50 }
  };

  const ACHIEVEMENTS = [
    { id: "gold10", requirement: "kills", value: 50 },
    { id: "doubleStrike", requirement: "totalHits", value: 100 }
  ];

  global.GameData = {
    monsters,
    DIFFICULTY_MULTIPLIERS,
    ARTIFACT_DEFS,
    ACHIEVEMENTS
  };
})(window);

