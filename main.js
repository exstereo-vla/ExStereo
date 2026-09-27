// ---------------- bar chart with task tabs ----------------
// methods: [{ name, group, cls }]; rows: [label, ...values]; format(v, row) -> text; pct(v, row) -> bar width

function makeChart({ tabsEl, barsEl, methods, rows, format, pct }) {
  let html = "";
  let lastGroup = null;
  methods.forEach((m, i) => {
    if (m.group !== lastGroup) {
      if (lastGroup !== null) html += "</div>";
      html += '<div class="bar-group">';
      lastGroup = m.group;
    }
    html += `
      <div class="bar-row${m.cls === "ours" ? " ours" : ""}">
        <span class="bar-label">${m.name}</span>
        <div class="bar-track"><div class="bar ${m.cls}" data-i="${i}"></div></div>
        <span class="bar-val" data-i="${i}"></span>
      </div>`;
  });
  barsEl.innerHTML = html + "</div>";

  function show(idx) {
    const row = rows[idx];
    barsEl.querySelectorAll(".bar").forEach((b) => (b.style.width = pct(row[+b.dataset.i + 1], row) + "%"));
    barsEl.querySelectorAll(".bar-val").forEach((s) => (s.textContent = format(row[+s.dataset.i + 1], row)));
    tabsEl.querySelectorAll(".tab").forEach((t, i) => {
      t.classList.toggle("active", i === idx);
      t.setAttribute("aria-selected", i === idx);
    });
  }

  rows.forEach((r, i) => {
    const b = document.createElement("button");
    b.className = "tab";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.textContent = r[0];
    b.addEventListener("click", () => show(i));
    tabsEl.appendChild(b);
  });

  requestAnimationFrame(() => show(0));
}

// ---------------- simulation results (Table I) ----------------

const SIM_METHODS = [
  { name: "ACT", group: "Baselines", cls: "" },
  { name: "DP3", group: "Baselines", cls: "" },
  { name: "StereoVLA", group: "Baselines", cls: "" },
  { name: "π<sub>0.5</sub>", group: "π0.5", cls: "vla" },
  { name: "π<sub>0.5</sub>-ExStereo (w/o MT)", group: "π0.5", cls: "nomt" },
  { name: "π<sub>0.5</sub>-ExStereo", group: "π0.5", cls: "ours" },
  { name: "SmolVLA", group: "SmolVLA", cls: "vla" },
  { name: "SmolVLA-ExStereo", group: "SmolVLA", cls: "ours" },
];

// [label, folder under assets/video/sim_rollouts, ...success rates]
const SIM_TASKS = [
  ["Lift Pot",          "lift_pot",           2.7,  5.3,  0.0, 58.7, 66.7,  61.3,  9.3, 12.0],
  ["Adjust Bottle",     "adjust_bottle",     10.7,  2.7, 53.3, 76.0, 89.3,  96.0, 58.7, 96.0],
  ["Grab Roller",       "grab_roller",       42.7,  5.3, 17.3, 80.0, 89.3, 100.0, 57.3, 48.0],
  ["Open Laptop",       "open_laptop",        0.0,  5.3,  2.7, 61.3, 72.0,  92.0,  2.7, 44.0],
  ["Beat Block Hammer", "beat_block_hammer",  0.0,  4.0,  0.0, 25.3, 45.3,  70.7,  1.3, 24.0],
  ["Click Alarmclock",  "click_alarmclock",   2.7, 10.7, 13.3, 21.3, 24.0,  54.7, 14.7, 22.7],
  ["Dump Bin Bigbin",   "dump_bin_bigbin",    2.7, 60.0, 30.7, 58.7, 66.7,  77.3, 26.7, 49.3],
  ["Handover Mic",      "handover_mic",       0.0, 28.0,  6.7, 26.7, 49.3,  77.3,  0.0, 65.3],
  ["Press Stapler",     "press_stapler",     10.7, 14.7, 10.7, 76.0, 80.0,  78.7, 14.7, 53.3],
  ["Stamp Seal",        "stamp_seal",         0.0,  0.0,  0.0, 28.0, 45.3,  56.0,  1.3,  5.3],
];

const SIM_AVERAGE = ["Average", 7.2, 13.6, 13.5, 51.2, 62.8, 76.4, 18.7, 42.0];

makeChart({
  tabsEl: document.getElementById("task-tabs"),
  barsEl: document.getElementById("bars"),
  methods: SIM_METHODS,
  rows: [SIM_AVERAGE, ...SIM_TASKS.map(([name, , ...vals]) => [name, ...vals])],
  format: (v) => v.toFixed(1),
  pct: (v) => v,
});

// ---------------- real-world results (Table III) ----------------

const REAL_METHODS = [
  { name: "StereoVLA", group: "Baselines", cls: "" },
  { name: "π<sub>0.5</sub>", group: "π0.5", cls: "vla" },
  { name: "π<sub>0.5</sub>-ExStereo (w/o MT)", group: "π0.5", cls: "nomt" },
  { name: "π<sub>0.5</sub>-ExStereo", group: "π0.5", cls: "ours" },
];

// [label, trials, ...successes]
const REAL_RESULTS = [
  ["All tasks",          60, 11, 16, 36, 50],
  ["Stack Two Bowls",    20,  0,  2,  9, 13],
  ["Lift Glass Bottles", 20,  4,  5, 11, 18],
  ["Close Fridge Door",  20,  7,  9, 16, 19],
];

makeChart({
  tabsEl: document.getElementById("real-tabs"),
  barsEl: document.getElementById("real-bars"),
  methods: REAL_METHODS,
  rows: REAL_RESULTS.map(([name, n, ...vals]) => [name, ...vals.map((v) => ({ v, n }))]),
  format: ({ v, n }) => `${v}/${n}`,
  pct: ({ v, n }) => (100 * v) / n,
});

// ---------------- lazy video loading ----------------
// Clips carry data-src and only download once scrolled near the viewport;
// they pause when scrolled away.

const clipObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (!v.src) v.src = v.dataset.src;
        v.play().catch(() => {});
      } else if (v.src) {
        v.pause();
      }
    });
  },
  { rootMargin: "200px 0px" }
);

function makeClip(src) {
  const v = document.createElement("video");
  v.dataset.src = src;
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = "none";
  v.setAttribute("muted", "");
  v.setAttribute("playsinline", "");
  clipObserver.observe(v);
  return v;
}

function releaseClip(v) {
  clipObserver.unobserve(v);
  v.pause();
  v.removeAttribute("src");
  v.load(); // aborts any in-flight download
}

// ---------------- simulation rollouts ----------------

const SIM_EPISODES = 25;
const SIM_INITIAL = 6;

const simTabs = document.getElementById("sim-tabs");
const simGrid = document.getElementById("sim-grid");
const simMore = document.getElementById("sim-more");
let simTask = 0;

function addSimClips(from, to) {
  const folder = SIM_TASKS[simTask][1];
  for (let ep = from; ep < to; ep++) {
    const fig = document.createElement("figure");
    fig.className = "clip";
    const frame = document.createElement("div");
    frame.className = "media-frame";
    frame.appendChild(makeClip(`assets/video/sim_rollouts/${folder}/episode${ep}.mp4`));
    const cap = document.createElement("figcaption");
    cap.textContent = `Episode ${ep}`;
    fig.append(frame, cap);
    simGrid.appendChild(fig);
  }
}

function showSimTask(idx) {
  simTask = idx;
  simGrid.querySelectorAll("video").forEach(releaseClip);
  simGrid.innerHTML = "";
  addSimClips(0, SIM_INITIAL);
  simMore.hidden = false;
  simTabs.querySelectorAll(".tab").forEach((t, i) => {
    t.classList.toggle("active", i === idx);
    t.setAttribute("aria-selected", i === idx);
  });
}

SIM_TASKS.forEach(([name], i) => {
  const b = document.createElement("button");
  b.className = "tab";
  b.type = "button";
  b.setAttribute("role", "tab");
  b.textContent = name;
  b.addEventListener("click", () => showSimTask(i));
  simTabs.appendChild(b);
});

simMore.addEventListener("click", () => {
  addSimClips(SIM_INITIAL, SIM_EPISODES);
  simMore.hidden = true;
});

showSimTask(0);

// ---------------- real-world rollouts (placeholders) ----------------
// Drop videos at assets/video/real/<task>_<n>.mp4 and they replace the placeholder automatically.

const REAL_TASKS = [
  { id: "stack_two_bowls", name: "Stack Two Bowls", desc: "Stack two bowls on top of each other in the correct order." },
  { id: "lift_glass_bottles", name: "Lift Glass Bottles", desc: "Pick up two transparent glass bottles from the table." },
  { id: "close_fridge_door", name: "Close Fridge Door", desc: "Close the fridge door using the left arm." },
];

const ROLLOUTS_PER_TASK = 3;

const rolloutsEl = document.getElementById("rollouts");

REAL_TASKS.forEach((t) => {
  const block = document.createElement("div");
  block.className = "task-block";
  block.innerHTML = `
    <div class="task-head">
      <div>
        <h3>${t.name}</h3>
        <p>${t.desc}</p>
      </div>
    </div>
    <div class="rollout-grid"></div>`;
  const grid = block.querySelector(".rollout-grid");

  for (let n = 1; n <= ROLLOUTS_PER_TASK; n++) {
    const src = `assets/video/real/${t.id}_${n}.mp4`;
    const fig = document.createElement("figure");
    fig.innerHTML = `
      <div class="media-frame slot">
        <div class="media-placeholder">
          <span>Rollout video coming soon</span>
          <code>${src}</code>
        </div>
      </div>
      <figcaption>π<sub>0.5</sub>-ExStereo · rollout ${n}</figcaption>`;
    const frame = fig.querySelector(".media-frame");
    const v = makeClip(src);
    v.addEventListener("loadeddata", () => frame.classList.add("loaded"));
    frame.prepend(v);
    grid.appendChild(fig);
  }
  rolloutsEl.appendChild(block);
});

// ---------------- overview video (click to load) ----------------

const launch = document.getElementById("overview-launch");
launch.addEventListener("click", () => {
  const v = document.createElement("video");
  v.src = launch.dataset.src;
  v.poster = launch.querySelector("img").src;
  v.controls = true;
  v.playsInline = true;
  v.autoplay = true;
  launch.replaceWith(v);
  v.play().catch(() => {});
});

// ---------------- BibTeX copy ----------------

const copyBtn = document.getElementById("copy-bib");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById("bibtex").textContent);
      copyBtn.textContent = "Copied";
    } catch {
      copyBtn.textContent = "Press ⌘C";
    }
    setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
  });
}
