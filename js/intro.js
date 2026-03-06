const INTRO_SEEN_KEY = "slime-clicker-intro-seen";

let introSelectedDifficulty = null;
const INTRO_FLIP_SOUND = "./sounds/hit/hit-1.wav";

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

  const leftPage = document.querySelector(".intro-page-left");
  const rightPage = document.querySelector(".intro-page-right");
  const book = document.querySelector(".intro-book");
  const nextBtn = document.getElementById("introNextBtn");
  const prevBtn = document.getElementById("introPrevBtn");
  const startBtn = document.getElementById("introStartBtn");

  function playIntroFlipSound() {
    const s = new Audio(INTRO_FLIP_SOUND);
    s.volume = 0.16;
    s.playbackRate = 1.45;
    s.play().catch(function () {});
  }

  function showLeftPage() {
    if (!leftPage || !rightPage) return;
    if (book) {
      book.classList.remove("flipping");
      void book.offsetWidth;
      book.classList.add("flipping");
    }
    playIntroFlipSound();
    rightPage.classList.add("turn-out");
    setTimeout(function () {
      rightPage.classList.remove("active");
      rightPage.classList.remove("turn-out");
      leftPage.classList.add("active");
      if (book) book.classList.remove("flipping");
    }, 280);
  }

  function showRightPage() {
    if (!leftPage || !rightPage) return;
    if (book) {
      book.classList.remove("flipping");
      void book.offsetWidth;
      book.classList.add("flipping");
    }
    playIntroFlipSound();
    leftPage.classList.remove("turn-out");
    leftPage.classList.add("turn-out");
    setTimeout(function () {
      leftPage.classList.remove("active");
      rightPage.classList.add("active");
      if (book) book.classList.remove("flipping");
    }, 260);
  }

  if (leftPage) leftPage.classList.add("active");

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      showRightPage();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      showLeftPage();
    });
  }

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

