const INTRO_SEEN_KEY = "slime-clicker-intro-seen";

let introSelectedDifficulty = null;

function startGameAfterIntro() {
  if (typeof window.setInitialDifficultyFromIntro === "function" && introSelectedDifficulty) {
    window.setInitialDifficultyFromIntro(introSelectedDifficulty);
  }
  document.body.classList.remove("intro-active");
  document.body.classList.add("game-visible");
  const overlay = document.getElementById("introOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
    setTimeout(function () { overlay.remove(); }, 550);
  }
  loadProgress();
  updateDifficultyButtons();
  render();
}

document.addEventListener("DOMContentLoaded", function () {
  const introSeen = localStorage.getItem(INTRO_SEEN_KEY) === "1";
  if (introSeen) {
    startGameAfterIntro();
    return;
  }

  const startBtn = document.getElementById("introStartBtn");
  document.querySelectorAll(".intro-difficulty-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const d = btn.getAttribute("data-difficulty");
      if (!d) return;
      introSelectedDifficulty = d;
      document.querySelectorAll(".intro-difficulty-btn").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-difficulty") === d);
      });
      if (startBtn) {
        startBtn.disabled = false;
        startBtn.classList.remove("intro-start-btn-disabled");
      }
    });
  });

  if (startBtn) {
    startBtn.addEventListener("click", function () {
      if (startBtn.disabled || !introSelectedDifficulty) return;
      localStorage.setItem(INTRO_SEEN_KEY, "1");
      startGameAfterIntro();
    });
  }
});

