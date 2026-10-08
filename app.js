(function () {
  "use strict";

  const config = window.birthdayConfig;
  const root = document.documentElement;
  const state = { started: false, seen: new Set(), letterOpen: false, bottleSeen: false };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const startButton = $("#start-button");
  const directViewButton = $("#direct-view-button");
  const progressLabel = $("#progress-label");
  const progressBar = $("#progress-bar");
  const interactionStatus = $("#interaction-status");
  const blessingPanel = $("#blessing-panel");
  const blessingTitle = $("#blessing-title");
  const blessingText = $("#blessing-text");
  const blessingNote = $("#blessing-note");
  const finalSection = $("#final");
  const letterToggle = $("#letter-toggle");
  const letterContent = $("#letter-content");
  const moonButton = $("#moon-button");
  const moonMessage = $("#moon-message");
  const bottleButton = $("#bottle-button");
  const bottleMessage = $("#bottle-message");
  const audio = $("#background-audio");
  const audioButton = $("#audio-button");
  const muteButton = $("#mute-button");
  const audioStatus = $("#audio-status");

  function scrollToElement(element) {
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateProgress() {
    const count = state.seen.size;
    const total = config.blessings.length;
    progressLabel.textContent = `已点亮 ${count} / ${total}`;
    progressBar.style.width = `${(count / total) * 100}%`;
    $$("[data-blessing-id]").forEach((button) => {
      const seen = state.seen.has(button.dataset.blessingId);
      button.classList.toggle("is-seen", seen);
      button.setAttribute("aria-pressed", String(seen));
      const small = button.querySelector("small");
      if (small) small.textContent = seen ? "已点亮" : "点击查看";
    });
  }

  function showBlessing(blessing) {
    blessingTitle.textContent = blessing.title;
    blessingText.textContent = blessing.text;
    blessingNote.textContent = blessing.note;
    blessingPanel.classList.add("is-visible");
  }

  function unlockFinal() {
    finalSection.hidden = false;
    root.classList.add("final-unlocked");
    interactionStatus.textContent = "夜海已经亮起来了。还有一封信，等你打开。";
    setTimeout(() => scrollToElement(finalSection), 260);
  }

  function revealAll() {
    config.blessings.forEach((blessing) => state.seen.add(blessing.id));
    updateProgress();
    blessingTitle.textContent = "完整祝福已经展开";
    blessingText.textContent = config.blessings.map((item) => `${item.title}：${item.text}`).join(" ");
    blessingNote.textContent = "你可以慢慢读，也可以回到星星之间重新查看。";
    blessingPanel.classList.add("is-visible");
    interactionStatus.textContent = "所有星光都已收下。";
    unlockFinal();
  }

  function startExperience() {
    if (state.started) return;
    state.started = true;
    root.classList.add("experience-started");
    interactionStatus.textContent = "从任意一颗星星开始，发现一段祝福。";
    scrollToElement($("#explore"));
    tryPlayAudio();
  }

  function handleBlessing(button) {
    startExperience();
    const blessing = config.blessings.find((item) => item.id === button.dataset.blessingId);
    if (!blessing) return;
    state.seen.add(blessing.id);
    showBlessing(blessing);
    updateProgress();
    interactionStatus.textContent = state.seen.size === config.blessings.length
      ? "四颗星星都已点亮，最后的祝福正在靠近。"
      : "很好，再点亮一颗星星吧。";
    if (state.seen.size === config.blessings.length) unlockFinal();
  }

  function toggleLetter() {
    state.letterOpen = !state.letterOpen;
    letterContent.hidden = !state.letterOpen;
    letterToggle.setAttribute("aria-expanded", String(state.letterOpen));
    letterToggle.textContent = state.letterOpen ? "收起这封信" : "打开这封信";
    if (state.letterOpen) setTimeout(() => letterContent.focus?.(), 0);
  }

  function showEgg(element, message, button, label) {
    element.hidden = false;
    element.textContent = message;
    if (button) {
      button.classList.add("is-open");
      button.setAttribute("aria-pressed", "true");
      if (label) button.querySelector("span:last-child").textContent = label;
    }
  }

  function tryPlayAudio() {
    if (!config.audio.enabled || !config.audio.src) return;
    if (!audio.src) audio.src = config.audio.src;
    audio.play().then(() => {
      audioButton.disabled = false;
      muteButton.disabled = false;
      audioButton.textContent = "暂停";
      audioButton.setAttribute("aria-label", "暂停音乐");
      audioStatus.textContent = "音乐：正在播放";
    }).catch(() => {
      audioStatus.textContent = "音乐暂时无法自动播放，请使用顶部音乐按钮。";
      audioButton.disabled = false;
      muteButton.disabled = false;
    });
  }

  function toggleAudio() {
    if (!config.audio.enabled) return;
    if (audio.paused) {
      audio.play().then(() => {
        audioButton.textContent = "暂停";
        audioButton.setAttribute("aria-label", "暂停音乐");
        audioStatus.textContent = "音乐：正在播放";
      }).catch(() => { audioStatus.textContent = "音乐加载失败，祝福仍可继续。"; });
    } else {
      audio.pause();
      audioButton.textContent = "播放";
      audioButton.setAttribute("aria-label", "播放音乐");
      audioStatus.textContent = "音乐：已暂停";
    }
  }

  function toggleMute() {
    audio.muted = !audio.muted;
    muteButton.textContent = audio.muted ? "取消静音" : "静音";
    muteButton.setAttribute("aria-pressed", String(audio.muted));
    muteButton.setAttribute("aria-label", audio.muted ? "取消静音" : "静音音乐");
  }

  function restart() {
    state.started = false;
    state.seen.clear();
    state.letterOpen = false;
    state.bottleSeen = false;
    root.classList.remove("experience-started", "final-unlocked");
    finalSection.hidden = true;
    letterContent.hidden = true;
    letterToggle.setAttribute("aria-expanded", "false");
    letterToggle.textContent = "打开这封信";
    moonMessage.hidden = true;
    bottleMessage.hidden = true;
    bottleButton.classList.remove("is-open");
    bottleButton.setAttribute("aria-pressed", "false");
    blessingPanel.classList.remove("is-visible");
    blessingTitle.textContent = "选择一颗星星，打开一段祝福。";
    blessingText.textContent = "";
    blessingNote.textContent = "";
    interactionStatus.textContent = "点亮第一颗星，开始收下祝福。";
    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  startButton.addEventListener("click", startExperience);
  directViewButton.addEventListener("click", revealAll);
  $$('[data-blessing-id]').forEach((button) => button.addEventListener("click", () => handleBlessing(button)));
  letterToggle.addEventListener("click", toggleLetter);
  moonButton.addEventListener("click", () => showEgg(moonMessage, config.easterEggs.moon, moonButton));
  bottleButton.addEventListener("click", () => {
    state.bottleSeen = true;
    showEgg(bottleMessage, config.easterEggs.bottle, bottleButton, "已打开");
  });
  $("#restart-button").addEventListener("click", restart);
  audioButton.addEventListener("click", toggleAudio);
  muteButton.addEventListener("click", toggleMute);

  if (config.audio.enabled) {
    audioButton.disabled = false;
    muteButton.disabled = false;
    audioStatus.textContent = "音乐：点击开始后播放";
  }
  updateProgress();
})();
