/* ============================================================
   LevelUp — игровой трекер целей (frontend-only)
   Данные в localStorage. Экспорт/импорт JSON. SVG-иконки. Тёмная тема.
   ============================================================ */

(() => {
  "use strict";

  const STORAGE_KEY = "levelup.data.v1";
  const BACKUP_KEY = "levelup.backup.v1";
  const THEME_KEY = "levelup.theme";
  const SCHEMA_VERSION = 1;

  /* ---------- Набор SVG-иконок (viewBox 0 0 24 24, stroke=currentColor) ---------- */
  const ICONS = {
    // Интерфейс
    "chevron-left": '<path d="M15 6l-6 6 6 6"/>',
    "chevron-right": '<path d="M9 6l6 6-6 6"/>',
    download: '<path d="M12 4v10M8 11l4 4 4-4M5 19h14"/>',
    upload: '<path d="M12 16V6M8 9l4-4 4 4M5 19h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M4 20l4-1L19 8a2 2 0 0 0-3-3L5 16l-1 4z"/><path d="M14.5 6.5l3 3"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M6.5 7l1 12.5h9L17.5 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5h16M8 3v4M16 3v4"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.8 5.8L4.4 4.4M19.6 19.6l-1.4-1.4M18.2 5.8l1.4-1.4M4.4 19.6l1.4-1.4"/>',
    moon: '<path d="M20 14.2A8 8 0 1 1 9.8 4 6.3 6.3 0 0 0 20 14.2z"/>',
    // Иконки целей
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    dumbbell: '<path d="M6.5 7v10M4 9.5v5M17.5 7v10M20 9.5v5M6.5 12h11"/>',
    book: '<path d="M12 6C10.5 4.8 8 4 5 4v13c3 0 5.5.8 7 2 1.5-1.2 4-2 7-2V4c-3 0-5.5.8-7 2z"/><path d="M12 6v13"/>',
    droplet: '<path d="M12 3.5c3 4 6 6.3 6 9.8A6 6 0 0 1 6 13.3c0-3.5 3-5.8 6-9.8z"/>',
    activity: '<path d="M3 12h4l2.5-7 5 14 2.5-7H21"/>',
    code: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    leaf: '<path d="M5 19C5 10 12 4 20 4c0 8-6 15-15 15z"/><path d="M5 19c3-5 7-8 11-9.5"/>',
    pen: '<path d="M4 20l4-1L19 8a2 2 0 0 0-3-3L5 16l-1 4z"/><path d="M14.5 6.5l3 3"/>',
    chat: '<path d="M20 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 20 12z"/>',
    coin: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10.5v3M18 10.5v3"/>',
    heart: '<path d="M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11z"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.75 6.75 19.6l1-5.8L3.5 9.7l5.9-.9z"/>',
    sunrise: '<path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 3v5M12 8l-2.5-2.5M12 8l2.5-2.5M4.5 12l-1.5-1M19.5 12l1.5-1"/>',
    apple: '<path d="M12 8.2C11 6 8.6 5.6 6.9 6.9 5.2 8.2 4.9 11.6 6.4 15c1 2.3 2.5 4 3.7 4 .8 0 1-.4 1.9-.4s1.1.4 1.9.4c1.2 0 2.7-1.7 3.7-4 1.5-3.4 1.2-6.8-.5-8.1C15.4 5.6 13 6 12 8.2z"/><path d="M12 8.2c0-2 1-3.3 2.6-3.8"/>',
    flame: '<path d="M12 3c.5 3 3.5 4.2 3.5 7.8A3.5 3.5 0 0 1 8.5 11c0-1.3.4-2.2 1.2-3C11 9 12 6 12 3z"/>',
  };

  // Иконки, доступные для выбора у цели
  const GOAL_ICONS = ["target", "dumbbell", "book", "droplet", "activity", "code",
    "music", "leaf", "pen", "chat", "coin", "heart", "star", "sunrise", "apple", "flame"];

  const COLORS = ["#4f46e5", "#0ea5e9", "#16a34a", "#f59e0b", "#ef4444",
                  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#64748b"];

  const LEVEL_TITLES = [
    [1, "Новичок"], [3, "Ученик"], [5, "Практик"], [8, "Знаток"],
    [12, "Мастер"], [16, "Эксперт"], [21, "Чемпион"], [27, "Легенда"], [35, "Титан"],
  ];

  const RING_C = 2 * Math.PI * 24; // длина окружности кольца (r=24)

  /* ---------- Иконка ---------- */
  function icon(name, size = 20) {
    const inner = ICONS[name];
    if (!inner) return "";
    return `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" ` +
      `stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ` +
      `aria-hidden="true">${inner}</svg>`;
  }
  function renderGoalIcon(name, size = 22) {
    if (ICONS[name]) return icon(name, size);
    // обратная совместимость: старые данные с эмодзи
    return `<span class="fallback">${escapeHtml(name || "🎯")}</span>`;
  }

  /* ---------- Состояние ---------- */
  let state = null;
  let viewDate = new Date();

  /* ---------- Даты ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => dateKey(new Date());
  const isSameDay = (a, b) => dateKey(a) === dateKey(b);
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
                  "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const humanDate = (d) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  function last7Days(end) { const a = []; for (let i = 6; i >= 0; i--) a.push(addDays(end, -i)); return a; }

  /* ---------- Хранилище ---------- */
  function defaultState() {
    return { version: SCHEMA_VERSION, createdAt: new Date().toISOString(), goals: [], log: {} };
  }
  function seedState() {
    const s = defaultState();
    s.goals = [
      { id: uid(), name: "Спорт", icon: "dumbbell", color: COLORS[2], xp: 15, createdAt: Date.now() },
      { id: uid(), name: "Чтение", icon: "book", color: COLORS[1], xp: 10, createdAt: Date.now() },
      { id: uid(), name: "Вода 2л", icon: "droplet", color: COLORS[4], xp: 5, createdAt: Date.now() },
    ];
    return s;
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedState();
      return migrate(JSON.parse(raw));
    } catch (e) {
      console.error("Ошибка чтения, пробую резервную копию", e);
      try {
        const bak = localStorage.getItem(BACKUP_KEY);
        if (bak) return migrate(JSON.parse(bak));
      } catch (_) {}
      return seedState();
    }
  }
  function migrate(data) {
    if (!data || typeof data !== "object") return seedState();
    const s = defaultState();
    s.createdAt = data.createdAt || s.createdAt;
    s.goals = Array.isArray(data.goals) ? data.goals.filter(validGoal) : [];
    s.log = (data.log && typeof data.log === "object") ? data.log : {};
    return s;
  }
  const validGoal = (g) => g && typeof g.id === "string" && typeof g.name === "string";

  let saveTimer = null;
  function save() {
    try {
      const json = JSON.stringify(state);
      const prev = localStorage.getItem(STORAGE_KEY);
      if (prev) localStorage.setItem(BACKUP_KEY, prev);
      localStorage.setItem(STORAGE_KEY, json);
      flashSaved();
    } catch (e) {
      console.error("Ошибка сохранения", e);
      toast("Не удалось сохранить данные", "warn");
    }
  }
  function flashSaved() {
    const el = $("#saveStatus");
    if (!el) return;
    el.textContent = "Сохранено ✓";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { el.textContent = "Данные сохраняются локально в этом браузере"; }, 1400);
  }
  const uid = () => "g" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

  /* ---------- Опыт / уровни ---------- */
  const xpToNext = (level) => 100 + (level - 1) * 50;
  function levelInfo(totalXp) {
    let level = 1, remaining = totalXp;
    while (remaining >= xpToNext(level)) { remaining -= xpToNext(level); level++; }
    return { level, into: remaining, need: xpToNext(level), total: totalXp };
  }
  function levelTitle(level) {
    let title = LEVEL_TITLES[0][1];
    for (const [min, name] of LEVEL_TITLES) if (level >= min) title = name;
    return title;
  }
  const goalById = (id) => state.goals.find((g) => g.id === id);
  const isDone = (dayKey, goalId) => !!(state.log[dayKey] && state.log[dayKey][goalId]);

  function totalXpEarned() {
    let sum = 0;
    for (const day in state.log) {
      const entry = state.log[day];
      for (const gid in entry) if (entry[gid]) { const g = goalById(gid); sum += g ? Number(g.xp) || 0 : 0; }
    }
    return sum;
  }
  function streakFor(goalId, endDate) {
    let count = 0, d = new Date(endDate);
    if (!isDone(dateKey(d), goalId)) {
      if (isSameDay(d, new Date())) d = addDays(d, -1);
      else return 0;
    }
    while (isDone(dateKey(d), goalId)) { count++; d = addDays(d, -1); }
    return count;
  }
  function completionsOn(dayKey) {
    const entry = state.log[dayKey];
    if (!entry) return 0;
    return state.goals.reduce((n, g) => n + (entry[g.id] ? 1 : 0), 0);
  }
  function bestOverallStreak() {
    const days = Object.keys(state.log).filter((d) => Object.keys(state.log[d]).length > 0).sort();
    if (!days.length) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      if (isSameDay(addDays(new Date(days[i - 1]), 1), new Date(days[i]))) { cur++; best = Math.max(best, cur); }
      else cur = 1;
    }
    return best;
  }

  /* ---------- Действия ---------- */
  function toggleGoal(goalId) {
    const key = dateKey(viewDate);
    if (!state.log[key]) state.log[key] = {};
    const wasDone = !!state.log[key][goalId];
    if (wasDone) {
      delete state.log[key][goalId];
      if (Object.keys(state.log[key]).length === 0) delete state.log[key];
    } else {
      state.log[key][goalId] = true;
    }
    save();
    render();
    if (!wasDone) {
      const g = goalById(goalId);
      const xp = g ? Number(g.xp) || 0 : 0;
      const before = levelInfo(totalXpEarned() - xp).level;
      const after = levelInfo(totalXpEarned()).level;
      if (after > before) toast(`Новый уровень ${after} — ${levelTitle(after)}! 🎉`, "good");
      else toast(`+${xp} XP · ${g ? g.name : ""}`, "good");
    }
  }

  /* ---------- Тема ---------- */
  function resolvedTheme() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light") return attr;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    const meta = $("#themeColorMeta");
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0e0e11" : "#fafafa");
    renderThemeToggle();
  }
  function toggleTheme() { applyTheme(resolvedTheme() === "dark" ? "light" : "dark"); }
  function renderThemeToggle() {
    const btn = $("#themeToggle");
    if (!btn) return;
    const dark = resolvedTheme() === "dark";
    btn.innerHTML = icon(dark ? "sun" : "moon", 19);
    btn.title = dark ? "Светлая тема" : "Тёмная тема";
  }

  /* ---------- Рендеринг ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function render() { renderLevel(); renderDaybar(); renderStats(); renderGoals(); renderWeek(); }

  function renderLevel() {
    const info = levelInfo(totalXpEarned());
    $("#levelNum").textContent = info.level;
    $("#levelTitle").textContent = levelTitle(info.level);
    $("#xpText").textContent = `${info.into} / ${info.need} XP`;
    $("#totalXp").textContent = `Всего опыта: ${info.total} XP · до ${info.level + 1} ур. ${info.need - info.into} XP`;
    const pct = Math.min(1, info.into / info.need);
    $("#levelRing").style.strokeDashoffset = RING_C * (1 - pct);
  }

  function renderDaybar() {
    const today = new Date();
    const isToday = isSameDay(viewDate, today);
    $("#dayTitle").textContent = isToday ? "Сегодня"
      : isSameDay(viewDate, addDays(today, -1)) ? "Вчера" : WEEKDAYS[viewDate.getDay()];
    $("#dayDate").textContent = humanDate(viewDate);
    $("#todayBtn").hidden = isToday;
    $("#nextDay").disabled = isToday;
    $("#nextDay").style.opacity = isToday ? .4 : 1;
  }

  function renderStats() {
    const key = dateKey(viewDate);
    const doneToday = completionsOn(key);
    const totalGoals = state.goals.length;
    const dayXp = state.goals.reduce((n, g) => n + (isDone(key, g.id) ? (Number(g.xp) || 0) : 0), 0);
    const activeDays = Object.keys(state.log).filter((d) => Object.keys(state.log[d]).length > 0).length;
    const cards = [
      { ic: "check", value: `${doneToday}/${totalGoals}`, label: "выполнено за день" },
      { ic: "star", value: `${dayXp}`, label: "XP за этот день" },
      { ic: "flame", value: `${bestOverallStreak()}`, label: "лучшая серия дней" },
      { ic: "calendar", value: `${activeDays}`, label: "активных дней всего" },
    ];
    const row = $("#statsRow");
    row.innerHTML = "";
    for (const c of cards) {
      row.appendChild(el("div", "stat-card",
        `<div class="stat-value"><span class="stat-ic">${icon(c.ic, 16)}</span><span>${c.value}</span></div>
         <div class="stat-label">${c.label}</div>`));
    }
  }

  function renderGoals() {
    const grid = $("#goalsGrid");
    grid.innerHTML = "";
    $("#emptyHint").hidden = state.goals.length > 0;
    const key = dateKey(viewDate);
    const week = last7Days(viewDate);

    for (const g of state.goals) {
      const done = isDone(key, g.id);
      const card = el("div", "goal-card" + (done ? " done" : ""));
      card.style.setProperty("--goal-color", g.color || "#4f46e5");
      const streak = streakFor(g.id, viewDate);
      const dots = week.map((d) => {
        const on = isDone(dateKey(d), g.id);
        const isTd = isSameDay(d, viewDate);
        return `<span class="wk-dot${on ? " on" : ""}${isTd ? " today" : ""}" title="${humanDate(d)}"></span>`;
      }).join("");

      card.innerHTML = `
        <div class="goal-top">
          <div class="goal-icon">${renderGoalIcon(g.icon)}</div>
          <div class="goal-info">
            <div class="goal-name">${escapeHtml(g.name)}</div>
            <div class="goal-sub">+${Number(g.xp) || 0} XP за выполнение</div>
          </div>
          <button class="goal-edit" title="Редактировать" data-edit="${g.id}">${icon("pencil", 16)}</button>
        </div>
        <div class="goal-streak ${streak > 0 ? "active" : "inactive"}">
          ${streak > 0 ? `${icon("flame", 15)} Серия: ${streak} ${plural(streak, "день", "дня", "дней")}`
                       : "Серия прервана — начни заново"}
        </div>
        <div class="goal-week-dots">${dots}</div>
        <div class="goal-action">
          <button class="check-btn${done ? " done" : ""}" data-toggle="${g.id}">
            ${done ? icon("check", 18) + " Выполнено" : "Отметить выполнение"}
            <span class="xp-pill">+${Number(g.xp) || 0} XP</span>
          </button>
        </div>`;
      grid.appendChild(card);
    }

    $$("[data-toggle]", grid).forEach((b) => b.addEventListener("click", () => {
      toggleGoal(b.dataset.toggle);
      const c = b.closest(".goal-card");
      if (c) { c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
    }));
    $$("[data-edit]", grid).forEach((b) => b.addEventListener("click", () => openGoalModal(b.dataset.edit)));
  }

  function renderWeek() {
    const week = last7Days(viewDate);
    const table = $("#weekTable");
    table.innerHTML = "";
    $("#weekRange").textContent =
      `${week[0].getDate()} ${MONTHS[week[0].getMonth()]} — ${week[6].getDate()} ${MONTHS[week[6].getMonth()]}`;

    const thead = el("thead");
    const hrow = el("tr");
    hrow.appendChild(el("th", null, "Цель"));
    week.forEach((d) => {
      const isTd = isSameDay(d, viewDate);
      hrow.appendChild(el("th", isTd ? "col-today" : null,
        `${WEEKDAYS[d.getDay()]}<br><span class="muted">${d.getDate()}</span>`));
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    const tbody = el("tbody");
    if (state.goals.length === 0) {
      const tr = el("tr");
      const td = el("td", null, `<span class="muted">Добавь цели, чтобы увидеть прогресс</span>`);
      td.colSpan = 8;
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    for (const g of state.goals) {
      const tr = el("tr");
      const nameCell = el("td", "goal-cell",
        `<span class="cell-ic" style="color:${g.color}">${renderGoalIcon(g.icon, 16)}</span>${escapeHtml(g.name)}`);
      tr.appendChild(nameCell);
      week.forEach((d) => {
        const on = isDone(dateKey(d), g.id);
        const isTd = isSameDay(d, viewDate);
        tr.appendChild(el("td", isTd ? "col-today" : null,
          on ? `<span class="cell-mark on">${icon("check", 16)}</span>`
             : `<span class="cell-mark off">·</span>`));
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    let weekXp = 0, weekDone = 0, perfectDays = 0;
    week.forEach((d) => {
      const k = dateKey(d);
      const dc = completionsOn(k);
      weekDone += dc;
      if (state.goals.length > 0 && dc === state.goals.length) perfectDays++;
      state.goals.forEach((g) => { if (isDone(k, g.id)) weekXp += Number(g.xp) || 0; });
    });
    const possible = state.goals.length * 7;
    const rate = possible ? Math.round((weekDone / possible) * 100) : 0;

    const summary = $("#weekSummary");
    summary.innerHTML = "";
    [
      { v: `${weekXp} XP`, l: "опыта за неделю" },
      { v: `${weekDone}`, l: "выполнений за неделю" },
      { v: `${rate}%`, l: "выполнено от плана" },
      { v: `${perfectDays}`, l: "идеальных дней (100%)" },
    ].forEach((it) => summary.appendChild(el("div", "summary-card",
      `<div class="v">${it.v}</div><div class="l">${it.l}</div>`)));
  }

  /* ---------- Модалка цели ---------- */
  let editingId = null;
  let pickIcon = GOAL_ICONS[0];
  let pickColor = COLORS[0];

  function buildPickers() {
    const ip = $("#iconPicker");
    ip.innerHTML = "";
    GOAL_ICONS.forEach((name) => {
      const b = el("div", "icon-opt", icon(name, 20));
      b.dataset.name = name;
      b.addEventListener("click", () => {
        pickIcon = name;
        $$(".icon-opt", ip).forEach((x) => x.classList.toggle("sel", x === b));
      });
      ip.appendChild(b);
    });
    const cp = $("#colorPicker");
    cp.innerHTML = "";
    COLORS.forEach((c) => {
      const b = el("div", "color-opt");
      b.style.background = c;
      b.dataset.color = c;
      b.addEventListener("click", () => {
        pickColor = c;
        $$(".color-opt", cp).forEach((x) => x.classList.toggle("sel", x === b));
      });
      cp.appendChild(b);
    });
  }
  function syncPickerSelection() {
    $$(".icon-opt").forEach((x) => x.classList.toggle("sel", x.dataset.name === pickIcon));
    $$(".color-opt").forEach((x) => x.classList.toggle("sel", x.dataset.color.toLowerCase() === String(pickColor).toLowerCase()));
  }
  function openGoalModal(id) {
    editingId = id || null;
    const g = id ? goalById(id) : null;
    $("#goalModalTitle").textContent = g ? "Редактировать цель" : "Новая цель";
    $("#goalName").value = g ? g.name : "";
    $("#goalXp").value = g ? (Number(g.xp) || 10) : 10;
    pickIcon = g ? (g.icon || GOAL_ICONS[0]) : GOAL_ICONS[state.goals.length % GOAL_ICONS.length];
    pickColor = g ? (g.color || COLORS[0]) : COLORS[state.goals.length % COLORS.length];
    syncPickerSelection();
    $("#deleteGoalBtn").hidden = !g;
    $("#goalModal").hidden = false;
    setTimeout(() => $("#goalName").focus(), 30);
  }
  function closeGoalModal() { $("#goalModal").hidden = true; editingId = null; }
  function saveGoal() {
    const name = $("#goalName").value.trim();
    if (!name) { toast("Введите название цели", "warn"); return; }
    const xp = Math.max(1, Math.min(1000, parseInt($("#goalXp").value, 10) || 10));
    if (editingId) {
      const g = goalById(editingId);
      if (g) { g.name = name; g.icon = pickIcon; g.color = pickColor; g.xp = xp; }
    } else {
      state.goals.push({ id: uid(), name, icon: pickIcon, color: pickColor, xp, createdAt: Date.now() });
    }
    save(); closeGoalModal(); render();
    toast(editingId ? "Цель обновлена" : "Цель добавлена", "good");
  }
  function deleteGoal() {
    if (!editingId) return;
    const g = goalById(editingId);
    if (!confirm(`Удалить цель «${g ? g.name : ""}»?\nИстория выполнений по ней тоже будет убрана из статистики.`)) return;
    state.goals = state.goals.filter((x) => x.id !== editingId);
    for (const d in state.log) { delete state.log[d][editingId]; if (Object.keys(state.log[d]).length === 0) delete state.log[d]; }
    save(); closeGoalModal(); render();
    toast("Цель удалена", "warn");
  }

  /* ---------- Экспорт / Импорт ---------- */
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `levelup-backup-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast("Резервная копия скачана", "good");
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const migrated = migrate(JSON.parse(reader.result));
        if (!confirm("Импортировать данные из файла?\nТекущие данные будут заменены (предыдущее состояние сохранится в резервной копии).")) return;
        state = migrated; save(); render();
        toast("Данные импортированы", "good");
      } catch (e) { console.error(e); toast("Не удалось прочитать файл", "warn"); }
    };
    reader.readAsText(file);
  }
  function resetAll() {
    if (!confirm("Удалить ВСЕ цели и историю?\nСоветуем сначала сделать экспорт. Действие необратимо.")) return;
    if (!confirm("Точно уверены? Все данные будут стёрты.")) return;
    state = defaultState(); save(); render();
    toast("Всё сброшено", "warn");
  }

  /* ---------- Помощники ---------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }
  let toastTimer = null;
  function toast(msg, kind) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast" + (kind ? " " + kind : "");
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }
  function fillStaticIcons() {
    $$("[data-icon]").forEach((e) => {
      const size = e.dataset.iconSize ? parseInt(e.dataset.iconSize, 10) : 18;
      e.innerHTML = icon(e.dataset.icon, size);
    });
  }

  /* ---------- События ---------- */
  function bindEvents() {
    $("#themeToggle").addEventListener("click", toggleTheme);
    $("#addGoalBtn").addEventListener("click", () => openGoalModal(null));
    $("#saveGoalBtn").addEventListener("click", saveGoal);
    $("#cancelGoalBtn").addEventListener("click", closeGoalModal);
    $("#deleteGoalBtn").addEventListener("click", deleteGoal);
    $("#goalModal").addEventListener("click", (e) => { if (e.target.id === "goalModal") closeGoalModal(); });
    $("#goalName").addEventListener("keydown", (e) => { if (e.key === "Enter") saveGoal(); });

    $("#prevDay").addEventListener("click", () => { viewDate = addDays(viewDate, -1); render(); });
    $("#nextDay").addEventListener("click", () => {
      if (isSameDay(viewDate, new Date())) return;
      viewDate = addDays(viewDate, 1); render();
    });
    $("#todayBtn").addEventListener("click", () => { viewDate = new Date(); render(); });

    $("#exportBtn").addEventListener("click", exportData);
    $("#importBtn").addEventListener("click", () => $("#importInput").click());
    $("#importInput").addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) importData(e.target.files[0]);
      e.target.value = "";
    });
    $("#resetBtn").addEventListener("click", resetAll);

    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#goalModal").hidden) closeGoalModal(); });
    window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEY) { state = load(); render(); } });
    // если тема не выбрана вручную — следуем за системой
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => { if (!localStorage.getItem(THEME_KEY)) renderThemeToggle(); });
  }

  /* ---------- Старт ---------- */
  function init() {
    if (!storageAvailable()) toast("localStorage недоступен — данные не сохранятся. Используйте экспорт.", "warn");
    state = load();
    fillStaticIcons();
    renderThemeToggle();
    buildPickers();
    bindEvents();
    render();
    save();
  }
  function storageAvailable() {
    try { const k = "__lu_test__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; }
    catch (e) { return false; }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
