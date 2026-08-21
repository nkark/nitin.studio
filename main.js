const params = new URLSearchParams(location.search);
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.getElementById("scene");
const countEl = document.getElementById("count");
const hintEl = document.getElementById("hint");
const toastEl = document.getElementById("toast");
const srStatus = document.getElementById("srStatus");
const toggleBtn = document.getElementById("dayNight");
const skyVideo = document.getElementById("skyVideo");

let rocketFlying = false;
let nightV = 0;
let scene = null;

try {
  const m = await import("./scene.js");
  scene = m.createScene(canvas, { reducedMotion: reduced, instant: params.has("instant") });
} catch {
  document.documentElement.classList.add("no3d");
}

if (scene) {
  const buttons = {
    house: document.getElementById("hs-house"),
    garden: document.getElementById("hs-garden"),
    mailbox: document.getElementById("hs-mailbox"),
    rocket: document.getElementById("hs-rocket"),
    cat: document.getElementById("hs-cat")
  };

  let hinted = false;
  function dismissHint() {
    if (hinted) return;
    hinted = true;
    hintEl.classList.add("gone");
  }
  canvas.addEventListener("pointerdown", dismissHint, { once: true });
  setTimeout(dismissHint, 8000);

  scene.onHotspots((list) => {
    for (const h of list) {
      if (h.id === "count") {
        if (countEl.textContent && !h.behind) {
          countEl.style.left = h.x + "px";
          countEl.style.top = h.y + "px";
        }
        continue;
      }
      const el = buttons[h.id];
      if (!el) continue;
      if (h.behind) {
        el.style.display = "none";
        continue;
      }
      el.style.display = "";
      el.style.left = h.x + "px";
      el.style.top = h.y + "px";
      el.classList.toggle("occluded", h.occluded);
      el.disabled = h.occluded || (h.id === "rocket" && rocketFlying);
    }
  });

  scene.onEvent((e) => {
    if (e.type === "ready") {
      if (params.has("instant")) canvas.style.transition = "none";
      canvas.classList.add("ready");
    }
    else if (e.type === "status") srStatus.textContent = e.text;
    else if (e.type === "count") {
      if (e.text) {
        countEl.hidden = false;
        countEl.textContent = e.text;
      } else {
        countEl.hidden = true;
        countEl.textContent = "";
      }
    } else if (e.type === "rocket") rocketFlying = e.flying;
    else if (e.type === "night") {
      nightV = e.v;
      document.documentElement.style.setProperty("--night", e.v.toFixed(3));
      skyVideo.style.opacity = String((1 - e.v) * 0.85);
    }
  });

  toggleBtn.addEventListener("click", () => {
    const toNight = toggleBtn.getAttribute("aria-pressed") !== "true";
    toggleBtn.setAttribute("aria-pressed", String(toNight));
    toggleBtn.setAttribute("aria-label", toNight ? "Switch to day" : "Switch to night");
    localStorage.setItem("ns-night", toNight ? "1" : "0");
    scene.setNight(toNight);
    srStatus.textContent = toNight ? "Good night." : "Good morning.";
  });

  if (localStorage.getItem("ns-night") === "1" || params.has("night")) {
    toggleBtn.setAttribute("aria-pressed", "true");
    toggleBtn.setAttribute("aria-label", "Switch to day");
    scene.setNight(true, true);
  }

  buttons.rocket.addEventListener("click", () => scene.launch());
  if (params.has("launch")) setTimeout(() => scene.launch(), 600);
  buttons.cat.addEventListener("click", () => scene.petCat());

  document.getElementById("card-contact").addEventListener("toggle", (e) => {
    scene.setMailboxFlag(e.newState === "open");
  });

  document.getElementById("copyEmail").addEventListener("click", async () => {
    const email = "nitinkarki.22@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast("Copied nitinkarki.22@gmail.com");
  });

  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  skyVideo.addEventListener("error", () => skyVideo.remove());
  skyVideo.src = skyVideo.dataset.src;
  skyVideo.addEventListener("loadeddata", () => {
    skyVideo.style.opacity = String((1 - nightV) * 0.85);
    if (!reduced) skyVideo.play().catch(() => {});
  }, { once: true });
  skyVideo.load();

  const cardParam = params.get("card");
  if (cardParam) {
    const el = document.getElementById("card-" + cardParam);
    if (el) {
      if (params.has("instant")) el.style.transition = "none";
      el.showPopover();
      if (cardParam === "contact") scene.setMailboxFlag(true);
    }
  }

  scene.start();
}
