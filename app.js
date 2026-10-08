(function () {
  "use strict";

  const config = window.birthdayConfig;
  const root = document.documentElement;
  const state = { started: false, opened: new Set(), meteorSeen: false, lastFocus: null };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const gate = $("#gate-panel");
  const exploration = $("#exploration");
  const startButton = $("#start-button");
  const status = $("#scene-status");
  const progress = $("#progress-pill");
  const messageLayer = $("#message-layer");
  const messageTitle = $("#message-title");
  const messageBody = $("#message-body");
  const messageNote = $("#message-note");
  const messageKicker = $("#message-kicker");
  const messageClose = $("#message-close");
  const personalLayer = $("#personal-layer");
  const personalBody = $("#personal-body");
  const personalSignature = $("#personal-signature");
  const personalClose = $("#personal-close");
  const finalLayer = $("#final-layer");
  const finalCard = finalLayer.querySelector(".final-card");
  const finalBody = $("#final-body");
  const receiveButton = $("#receive-button");
  const returnButton = $("#return-home-button");
  const meteorButton = $("#meteor-button");
  const audio = $("#background-audio");
  const audioButton = $("#audio-button");
  const muteButton = $("#mute-button");
  const audioStatus = $("#audio-status");

  const canvas = $("#sky-canvas");
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let lastFrame = 0;
  let meteorTimer = 0;
  let fireworksLoop = 0;
  let fireworksTimers = [];
  let returnButtonTimer = 0;
  let finaleStartedAt = 0;
  const stars = [];
  const meteors = [];
  const fireworks = [];

  function setupCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedStars() {
    stars.length = 0;
    const count = Math.min(120, Math.max(56, Math.round((width * height) / 9500)));
    for (let i = 0; i < count; i += 1) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.64,
        radius: Math.random() * 1.25 + 0.25,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.82 ? "#f6d99a" : "#d5e9ee"
      });
    }
  }

  function drawScene(time) {
    ctx.clearRect(0, 0, width, height);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stars.forEach((star) => {
      const pulse = reduced ? 0.75 : 0.48 + Math.sin(time / 1000 + star.phase) * 0.28;
      ctx.globalAlpha = Math.max(0.2, pulse);
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    drawMeteors(time);
    drawFireworks();
    raf = requestAnimationFrame(drawScene);
  }

  function drawMeteors(time) {
    for (let i = meteors.length - 1; i >= 0; i -= 1) {
      const meteor = meteors[i];
      meteor.life += 1;
      const progressValue = meteor.life / meteor.duration;
      const x = meteor.x + meteor.dx * progressValue;
      const y = meteor.y + meteor.dy * progressValue;
      const alpha = progressValue < 0.2 ? progressValue / 0.2 : 1 - (progressValue - 0.2) / 0.8;
      const gradient = ctx.createLinearGradient(x, y, x - meteor.dx * 0.13, y - meteor.dy * 0.13);
      gradient.addColorStop(0, `rgba(246,217,154,${Math.max(0, alpha)})`);
      gradient.addColorStop(1, "rgba(246,217,154,0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - meteor.dx * 0.16, y - meteor.dy * 0.16);
      ctx.stroke();
      if (meteor.life >= meteor.duration) meteors.splice(i, 1);
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && time > meteorTimer) {
      meteorTimer = time + 6500 + Math.random() * 6000;
      meteors.push({ x: width * (0.55 + Math.random() * 0.35), y: height * (0.16 + Math.random() * 0.2), dx: -width * 0.22, dy: height * 0.16, life: 0, duration: 75 });
    }
  }

  function drawFireworks() {
    for (let i = fireworks.length - 1; i >= 0; i -= 1) {
      const firework = fireworks[i];
      firework.particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.018;
        particle.life -= 1;
        ctx.globalAlpha = Math.max(0, particle.life / 75);
        ctx.fillStyle = firework.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      if (firework.particles.every((particle) => particle.life <= 0)) fireworks.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }

  function burstFireworks() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#f6d99a", "#9bdad8", "#a8a9f6", "#f9b8a5"];
    const mobile = width < 600;
    [0, 360, 720, 1080].forEach((delay, index) => {
      const timer = setTimeout(() => {
        const x = width * (0.2 + Math.random() * 0.6);
        const y = height * (0.2 + Math.random() * 0.27);
        const particles = [];
        const particleCount = mobile ? 38 : 34;
        for (let i = 0; i < particleCount; i += 1) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const speed = (mobile ? 1.15 : 1.3) + Math.random() * (mobile ? 2 : 2.2);
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: (mobile ? 78 : 65) + Math.random() * 20,
            size: (mobile ? 1.7 : 1) + Math.random() * 1.4
          });
        }
        fireworks.push({ particles, color: colors[index % colors.length] });
        fireworksTimers = fireworksTimers.filter((item) => item !== timer);
      }, delay);
      fireworksTimers.push(timer);
    });
  }

  function updateProgress() {
    progress.textContent = `漂流瓶 ${state.opened.size} / ${config.blessings.length}`;
    $$("[data-bottle-id]").forEach((button) => {
      const opened = state.opened.has(button.dataset.bottleId);
      button.classList.toggle("is-open", opened);
      button.setAttribute("aria-pressed", String(opened));
      button.querySelector(".bottle-label").textContent = opened ? "已打开" : config.blessings.find((item) => item.id === button.dataset.bottleId)?.title || "漂流瓶";
    });
  }

  function focusDialog(layer) {
    const target = layer.querySelector("button");
    if (target) target.focus();
  }

  function focusWithoutScroll(target) {
    if (!target) return;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    target.focus({ preventScroll: true });
    // Some mobile browsers ignore the preventScroll option when a fixed
    // overlay changes visibility. Restore the exact reading position instead
    // of allowing the focus change to move the scene to the document start.
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
      window.scrollTo(scrollX, scrollY);
    }
  }

  function openMessage({ kicker, title, text, note, focus }) {
    state.lastFocus = focus || document.activeElement;
    messageKicker.textContent = kicker;
    messageTitle.textContent = title;
    messageBody.textContent = text;
    messageNote.textContent = note || "";
    messageLayer.hidden = false;
    focusDialog(messageLayer);
  }

  function closeMessage() {
    messageLayer.hidden = true;
    if (state.lastFocus && typeof state.lastFocus.focus === "function") state.lastFocus.focus();
  }

  function openPersonal() {
    personalBody.innerHTML = config.personalMessage.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
    personalSignature.textContent = config.personalMessage.signature;
    personalLayer.hidden = false;
    focusDialog(personalLayer);
  }

  function openFinal() {
    personalLayer.hidden = true;
    finalCard.hidden = false;
    returnButton.hidden = true;
    returnButton.classList.remove("is-ready");
    finalBody.textContent = config.finalMessage;
    finalLayer.hidden = false;
    root.classList.add("final-open");
    focusDialog(finalLayer);
  }

  function receiveBlessing(event) {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const keyboardActivation = event.detail === 0;
    event.preventDefault();
    event.stopPropagation();
    finaleStartedAt = performance.now();
    window.clearTimeout(returnButtonTimer);
    personalLayer.hidden = true;
    finalCard.hidden = true;
    root.classList.add("blessing-received");
    finalLayer.classList.add("is-received");
    burstFireworks();
    window.clearInterval(fireworksLoop);
    fireworksLoop = window.setInterval(burstFireworks, 5200);
    returnButtonTimer = window.setTimeout(() => {
      returnButton.hidden = false;
      requestAnimationFrame(() => returnButton.classList.add("is-ready"));
      if (keyboardActivation) focusWithoutScroll(returnButton);
      // Keep the fireworks reveal in place even if the browser reflows after
      // the final card fade-out completes.
      if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
        window.scrollTo(scrollX, scrollY);
      }
    }, 1400);
  }

  function handleBottle(button) {
    const blessing = config.blessings.find((item) => item.id === button.dataset.bottleId);
    if (!blessing) return;
    state.opened.add(blessing.id);
    updateProgress();
    openMessage({ kicker: "漂流瓶里的话", title: blessing.title, text: blessing.text, note: blessing.note, focus: button });
    status.textContent = state.opened.size === config.blessings.length ? "四只漂流瓶都打开了。海浪把一封信送到了岸边。" : "把这句祝福收好，再去看看下一只瓶子。";
  }

  function startExperience() {
    if (state.started) return;
    state.started = true;
    root.classList.add("experience-started");
    gate.classList.add("is-dismissed");
    exploration.hidden = false;
    requestAnimationFrame(() => exploration.classList.add("is-active"));
    status.textContent = "海浪把第一只瓶子送到了岸边。";
    tryPlayAudio();
    setTimeout(() => document.querySelector(".bottle")?.focus({ preventScroll: true }), 700);
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
      audioButton.disabled = false;
      muteButton.disabled = false;
      audioStatus.textContent = "音乐需要再次点击顶部按钮播放。";
    });
  }

  function toggleAudio() {
    if (!config.audio.enabled) return;
    if (!audio.src) audio.src = config.audio.src;
    if (audio.paused) {
      audio.play().then(() => { audioButton.textContent = "暂停"; audioButton.setAttribute("aria-label", "暂停音乐"); audioStatus.textContent = "音乐：正在播放"; }).catch(() => { audioStatus.textContent = "音乐加载失败，祝福仍可继续。"; });
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
    if (finaleStartedAt && performance.now() - finaleStartedAt < 1300) return;
    window.clearTimeout(returnButtonTimer);
    returnButtonTimer = 0;
    finaleStartedAt = 0;
    window.clearInterval(fireworksLoop);
    fireworksLoop = 0;
    fireworksTimers.forEach((timer) => window.clearTimeout(timer));
    fireworksTimers = [];
    fireworks.length = 0;
    state.started = false;
    state.opened.clear();
    state.meteorSeen = false;
    root.classList.remove("experience-started", "final-open", "blessing-received");
    gate.classList.remove("is-dismissed");
    exploration.hidden = true;
    exploration.classList.remove("is-active");
    messageLayer.hidden = true;
    personalLayer.hidden = true;
    finalLayer.hidden = true;
    finalCard.hidden = false;
    finalLayer.classList.remove("is-received");
    returnButton.hidden = true;
    returnButton.classList.remove("is-ready");
    meteorButton.classList.remove("is-collected");
    meteorButton.setAttribute("aria-pressed", "false");
    status.textContent = "海浪把第一只瓶子送到了岸边。";
    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
    startButton.focus();
  }

  startButton.addEventListener("click", startExperience);
  messageClose.addEventListener("click", () => {
    closeMessage();
    if (state.opened.size === config.blessings.length) setTimeout(openPersonal, 280);
  });
  personalClose.addEventListener("click", openFinal);
  receiveButton.addEventListener("click", receiveBlessing);
  returnButton.addEventListener("click", restart);
  audioButton.addEventListener("click", toggleAudio);
  muteButton.addEventListener("click", toggleMute);
  $$('[data-bottle-id]').forEach((button) => button.addEventListener("click", () => handleBottle(button)));
  meteorButton.addEventListener("click", () => {
    state.meteorSeen = true;
    meteorButton.classList.add("is-collected");
    meteorButton.setAttribute("aria-pressed", "true");
    openMessage({ kicker: "流星彩蛋", title: "给你的一颗小星星", text: config.easterEggs.meteor, note: "", focus: meteorButton });
  });

  messageLayer.addEventListener("click", (event) => { if (event.target === messageLayer) closeMessage(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!messageLayer.hidden) closeMessage();
      else if (!personalLayer.hidden) personalLayer.hidden = true;
    }
  });
  window.addEventListener("resize", () => { setupCanvas(); seedStars(); });

  setupCanvas();
  seedStars();
  raf = requestAnimationFrame(drawScene);
  updateProgress();
  if (config.audio.enabled) {
    audioButton.disabled = false;
    muteButton.disabled = false;
  }
})();
