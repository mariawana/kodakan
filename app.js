(() => {
  "use strict";

  // ---------- Config ----------
  const SHOTS = 4;
  const PHOTO_W = 800;
  const PHOTO_H = 600;

  const FILTERS = [
    { id: "normal", label: "Normal", css: "none" },
    { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.1)" },
    { id: "sepia", label: "Sepia", css: "sepia(0.9)" },
    { id: "vintage", label: "Vintage", css: "sepia(0.35) contrast(1.1) saturate(1.3) brightness(1.05)" },
    { id: "warm", label: "Warm", css: "saturate(1.2) hue-rotate(-10deg) brightness(1.05)" },
    { id: "cool", label: "Cool", css: "saturate(1.1) hue-rotate(15deg) brightness(1.02)" },
  ];

  const FRAMES = [
    { id: "cream", color: "#f4ead5", text: "#3b2a20" },
    { id: "film", color: "#1b1411", text: "#f0b84a", holes: true },
    { id: "rust", color: "#b5532f", text: "#f4ead5" },
    { id: "mustard", color: "#d9a441", text: "#3b2a20" },
    { id: "teal", color: "#5e8c87", text: "#f4ead5" },
    { id: "rose", color: "#d9a79c", text: "#3b2a20" },
  ];

  // ---------- Elements ----------
  const $ = (id) => document.getElementById(id);
  const video = $("video");
  const placeholder = $("placeholder");
  const cameraError = $("cameraError");
  const startCameraBtn = $("startCamera");
  const snapBtn = $("snapBtn");
  const countdownEl = $("countdown");
  const flashEl = $("flash");
  const shotBadge = $("shotBadge");
  const thumbsEl = $("thumbs");
  const filtersEl = $("filters");
  const framesEl = $("frames");
  const timersEl = $("timers");
  const resultSection = $("result");
  const stripImg = $("stripImg");
  const downloadBtn = $("downloadBtn");
  const shareBtn = $("shareBtn");
  const retakeBtn = $("retakeBtn");
  const work = $("work");

  // ---------- State ----------
  let stream = null;
  let busy = false;
  let filter = FILTERS[3]; // vintage by default
  let frame = FRAMES[0];
  let seconds = 3;
  let photos = []; // canvases
  let stripBlob = null;

  // ---------- UI builders ----------
  FILTERS.forEach((f, i) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(f === filter));
    b.textContent = f.label;
    b.addEventListener("click", () => {
      filter = f;
      [...filtersEl.children].forEach((c) => c.setAttribute("aria-checked", String(c === b)));
      video.style.filter = f.css;
    });
    filtersEl.appendChild(b);
  });

  FRAMES.forEach((f, i) => {
    const b = document.createElement("button");
    b.className = "swatch";
    b.type = "button";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", f.id + " frame");
    b.setAttribute("aria-checked", String(i === 0));
    b.style.background = f.color;
    b.addEventListener("click", () => {
      frame = f;
      [...framesEl.children].forEach((c) => c.setAttribute("aria-checked", String(c === b)));
    });
    framesEl.appendChild(b);
  });

  timersEl.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    seconds = Number(b.dataset.seconds);
    [...timersEl.children].forEach((c) => c.setAttribute("aria-checked", String(c === b)));
  });

  // ---------- Camera ----------
  async function startCamera() {
    cameraError.textContent = "";
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraError.textContent = "Your browser does not support camera access.";
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      video.srcObject = stream;
      video.style.filter = filter.css;
      await video.play();
      placeholder.hidden = true;
      snapBtn.disabled = false;
    } catch (err) {
      const denied = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
      cameraError.textContent = denied
        ? "Camera permission was blocked. Allow camera access in your browser settings and try again."
        : "Could not start the camera. Is another app using it?";
    }
  }
  startCameraBtn.addEventListener("click", startCamera);

  // ---------- Capture ----------
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function applyPixelFilter(ctx, w, h, id) {
    if (id === "normal") return;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      if (id === "bw") {
        let y = 0.299 * r + 0.587 * g + 0.114 * b;
        y = (y - 128) * 1.1 + 128;
        r = g = b = y;
      } else if (id === "sepia") {
        const nr = 0.393 * r + 0.769 * g + 0.189 * b;
        const ng = 0.349 * r + 0.686 * g + 0.168 * b;
        const nb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = nr; g = ng; b = nb;
      } else if (id === "vintage") {
        const nr = 0.393 * r + 0.769 * g + 0.189 * b;
        const ng = 0.349 * r + 0.686 * g + 0.168 * b;
        const nb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = r * 0.65 + nr * 0.35 + 8;
        g = g * 0.65 + ng * 0.35 + 4;
        b = b * 0.65 + nb * 0.35 - 6;
        r = (r - 128) * 1.1 + 128;
        g = (g - 128) * 1.1 + 128;
        b = (b - 128) * 1.1 + 128;
        const grain = (Math.random() - 0.5) * 28; // film grain
        r += grain; g += grain; b += grain;
      } else if (id === "warm") {
        r = r * 1.1 + 8; g = g * 1.02; b = b * 0.9;
      } else if (id === "cool") {
        r = r * 0.92; g = g * 1.02; b = b * 1.12 + 6;
      }
      d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
      d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    }
    ctx.putImageData(img, 0, 0);
  }

  function grabFrame() {
    const c = document.createElement("canvas");
    c.width = PHOTO_W;
    c.height = PHOTO_H;
    const ctx = c.getContext("2d", { willReadFrequently: true });

    // cover-crop the video into 4:3
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const target = PHOTO_W / PHOTO_H;
    let sw = vw, sh = vh, sx = 0, sy = 0;
    if (vw / vh > target) {
      sw = vh * target;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / target;
      sy = (vh - sh) / 2;
    }

    // mirror so the photo matches the preview
    ctx.save();
    ctx.translate(PHOTO_W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PHOTO_W, PHOTO_H);
    ctx.restore();

    applyPixelFilter(ctx, PHOTO_W, PHOTO_H, filter.id);
    return c;
  }

  async function runCountdown(n) {
    for (let i = n; i > 0; i--) {
      countdownEl.textContent = i;
      countdownEl.classList.remove("tick");
      void countdownEl.offsetWidth; // restart animation
      countdownEl.classList.add("tick");
      await wait(1000);
    }
    countdownEl.textContent = "";
    countdownEl.classList.remove("tick");
  }

  function doFlash() {
    flashEl.classList.remove("go");
    void flashEl.offsetWidth;
    flashEl.classList.add("go");
  }

  function setThumb(index, canvas) {
    const t = thumbsEl.children[index];
    t.style.backgroundImage = `url(${canvas.toDataURL("image/jpeg", 0.7)})`;
    t.classList.add("filled");
  }

  function clearThumbs() {
    [...thumbsEl.children].forEach((t) => {
      t.style.backgroundImage = "";
      t.classList.remove("filled");
    });
  }

  async function startSession() {
    if (busy || !stream) return;
    busy = true;
    snapBtn.disabled = true;
    photos = [];
    clearThumbs();
    resultSection.hidden = true;
    shotBadge.hidden = false;

    for (let i = 0; i < SHOTS; i++) {
      shotBadge.textContent = `Frame ${i + 1} / ${SHOTS}`;
      await runCountdown(i === 0 ? seconds : Math.max(3, seconds - 1));
      doFlash();
      const shot = grabFrame();
      photos.push(shot);
      setThumb(i, shot);
      await wait(700);
    }

    shotBadge.hidden = true;
    await buildStrip();
    busy = false;
    snapBtn.disabled = false;
    snapBtn.textContent = "Shoot Another Roll";
  }

  // ---------- Strip ----------
  async function buildStrip() {
    try {
      await Promise.all([
        document.fonts.load("64px 'Special Elite'"),
        document.fonts.load("28px 'Courier Prime'"),
      ]);
    } catch (_) {
      /* fall back to system fonts */
    }
    const pad = 64;
    const gap = 24;
    const footer = 150;
    const w = PHOTO_W + pad * 2;
    const h = pad + SHOTS * PHOTO_H + (SHOTS - 1) * gap + footer;

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");

    ctx.fillStyle = frame.color;
    ctx.fillRect(0, 0, w, h);

    photos.forEach((p, i) => {
      const y = pad + i * (PHOTO_H + gap);
      ctx.drawImage(p, pad, y, PHOTO_W, PHOTO_H);
    });

    // sprocket holes for the film-strip frame
    if (frame.holes) {
      ctx.fillStyle = "#f4ead5";
      const hw = 24, hh = 34;
      for (let y = 30; y < h - 60; y += 70) {
        ctx.fillRect(20, y, hw, hh);
        ctx.fillRect(w - 20 - hw, y, hw, hh);
      }
    }

    const footY = pad + SHOTS * PHOTO_H + (SHOTS - 1) * gap;
    ctx.fillStyle = frame.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "64px 'Special Elite', 'Courier New', monospace";
    ctx.fillText("KODAKAN", w / 2, footY + footer / 2 - 14);
    ctx.font = "28px 'Courier Prime', 'Courier New', monospace";
    const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    ctx.globalAlpha = 0.8;
    ctx.fillText(date, w / 2, footY + footer / 2 + 40);
    ctx.globalAlpha = 1;

    stripBlob = await new Promise((res) => c.toBlob(res, "image/png"));
    const url = URL.createObjectURL(stripBlob);
    if (stripImg.dataset.url) URL.revokeObjectURL(stripImg.dataset.url);
    stripImg.dataset.url = url;
    stripImg.src = url;
    downloadBtn.href = url;

    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });

    if (navigator.canShare && navigator.canShare({ files: [new File([stripBlob], "strip.png", { type: "image/png" })] })) {
      shareBtn.hidden = false;
    }
  }

  shareBtn.addEventListener("click", async () => {
    if (!stripBlob) return;
    try {
      await navigator.share({
        files: [new File([stripBlob], "photobooth-strip.png", { type: "image/png" })],
        title: "My Kodakan strip",
      });
    } catch (_) {
      /* user cancelled */
    }
  });

  retakeBtn.addEventListener("click", () => {
    resultSection.hidden = true;
    clearThumbs();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  snapBtn.addEventListener("click", startSession);

  // Stop camera when tab is closed
  window.addEventListener("pagehide", () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  });
})();
