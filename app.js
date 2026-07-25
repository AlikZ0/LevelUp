/* ============================================================
   LevelUp — игровой трекер целей (frontend-only)
   Данные в localStorage. Экспорт/импорт JSON. SVG-иконки. Тёмная тема.
   Календарь прошедших дней + редактируемая точка старта.
   ============================================================ */

(() => {
  "use strict";

  const STORAGE_KEY = "levelup.data.v1";
  const BACKUP_KEY = "levelup.backup.v1";
  const THEME_KEY = "levelup.theme";
  const SCHEMA_VERSION = 1;

  /* ---------- Набор SVG-иконок (viewBox 0 0 24 24, stroke=currentColor) ---------- */
  const ICONS = {
    "chevron-left": '<path d="M15 6l-6 6 6 6"/>',
    "chevron-right": '<path d="M9 6l6 6-6 6"/>',
    download: '<path d="M12 4v10M8 11l4 4 4-4M5 19h14"/>',
    upload: '<path d="M12 16V6M8 9l4-4 4 4M5 19h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M4 20l4-1L19 8a2 2 0 0 0-3-3L5 16l-1 4z"/><path d="M14.5 6.5l3 3"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M6.5 7l1 12.5h9L17.5 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9.5h16M8 3v4M16 3v4"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-.5 4"/><path d="M20 4v5h-5"/>',
    flag: '<path d="M6 21V4M6 4h11l-2 3.5L17 11H6"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.8 5.8L4.4 4.4M19.6 19.6l-1.4-1.4M18.2 5.8l1.4-1.4M4.4 19.6l1.4-1.4"/>',
    moon: '<path d="M20 14.2A8 8 0 1 1 9.8 4 6.3 6.3 0 0 0 20 14.2z"/>',
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
    trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4.5v1A3.5 3.5 0 0 0 8 10.5M17 6h2.5v1a3.5 3.5 0 0 1-3.5 3.5"/><path d="M9.5 13.5h5l.4 3h-5.8z"/><path d="M8 20h8M12 16.5V20"/>',
  };
  const GOAL_ICONS = ["target", "dumbbell", "book", "droplet", "activity", "code",
    "music", "leaf", "pen", "chat", "coin", "heart", "star", "sunrise", "apple", "flame"];
  const COLORS = ["#4f46e5", "#0ea5e9", "#16a34a", "#f59e0b", "#ef4444",
                  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#64748b"];
  const LEVEL_TITLES = [
    [1, "Новичок"], [3, "Ученик"], [5, "Практик"], [8, "Знаток"],
    [12, "Мастер"], [16, "Эксперт"], [21, "Чемпион"], [27, "Легенда"], [35, "Титан"],
  ];
  const RING_C = 2 * Math.PI * 24;

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
    return `<span class="fallback">${escapeHtml(name || "🎯")}</span>`;
  }

  /* ---------- Состояние ---------- */
  let state = null;
  let viewDate = startOfDay(new Date());
  let calMonth = firstOfMonth(new Date());

  /* ---------- Даты ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => dateKey(new Date());
  const isSameDay = (a, b) => dateKey(a) === dateKey(b);
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function firstOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function parseKey(key) { const [y, m, d] = String(key).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); }
  const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const CAL_WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
                  "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const MONTHS_NOM = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                      "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const humanDate = (d) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  function last7Days(end) { const a = []; for (let i = 6; i >= 0; i--) a.push(addDays(end, -i)); return a; }

  /* Дата старта как объект (00:00 локального дня) */
  function startObj() {
    const key = state && state.startDate ? state.startDate : todayKey();
    return startOfDay(parseKey(key));
  }
  const inFuture = (d) => startOfDay(d) > startOfDay(new Date());
  // Редактировать можно ТОЛЬКО сегодняшний день; остальные — только просмотр
  const isEditableDay = (d) => isSameDay(d, new Date());

  /* ---------- Хранилище ---------- */
  function defaultState() {
    return { version: SCHEMA_VERSION, createdAt: new Date().toISOString(), startDate: todayKey(), goals: [], log: {} };
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
      try { const bak = localStorage.getItem(BACKUP_KEY); if (bak) return migrate(JSON.parse(bak)); } catch (_) {}
      return seedState();
    }
  }
  function migrate(data) {
    if (!data || typeof data !== "object") return seedState();
    const s = defaultState();
    s.createdAt = data.createdAt || s.createdAt;
    s.goals = Array.isArray(data.goals) ? data.goals.filter(validGoal) : [];
    s.log = (data.log && typeof data.log === "object") ? data.log : {};
    // Точка старта: сохранённая → самая ранняя запись → дата создания → сегодня
    if (isValidKey(data.startDate)) {
      s.startDate = data.startDate;
    } else {
      const logDays = Object.keys(s.log).filter((d) => s.log[d] && Object.keys(s.log[d]).length > 0).sort();
      if (logDays.length) s.startDate = logDays[0];
      else if (data.createdAt) s.startDate = dateKey(new Date(data.createdAt));
      else s.startDate = todayKey();
    }
    return s;
  }
  const validGoal = (g) => g && typeof g.id === "string" && typeof g.name === "string";
  const isValidKey = (k) => typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k);

  let saveTimer = null;
  function save() {
    try {
      const json = JSON.stringify(state);
      const prev = localStorage.getItem(STORAGE_KEY);
      if (prev) localStorage.setItem(BACKUP_KEY, prev);
      localStorage.setItem(STORAGE_KEY, json);
      flashSaved();
    } catch (e) { console.error("Ошибка сохранения", e); toast("Не удалось сохранить данные", "warn"); }
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
  // Активные цели = ежедневные привычки (ещё не отмеченные как достигнутые)
  const activeGoals = () => state.goals.filter((g) => !g.achievedAt);
  const achievedGoals = () => state.goals.filter((g) => g.achievedAt)
    .sort((a, b) => (b.achievedAt || 0) - (a.achievedAt || 0));
  // Цель существует только начиная с дня её создания (раньше её просто не было)
  function goalCreatedDay(g) {
    const t = g.createdAt;
    return (typeof t === "number" && isFinite(t)) ? startOfDay(new Date(t)) : null;
  }
  function goalExistsOn(g, day) {
    const cd = goalCreatedDay(g);
    return !cd || startOfDay(day) >= cd; // нет даты создания → считаем, что была всегда
  }
  const goalsExistingOn = (day) => activeGoals().filter((g) => goalExistsOn(g, day));

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
    const day = parseKey(dayKey);
    return goalsExistingOn(day).reduce((n, g) => n + (entry[g.id] ? 1 : 0), 0);
  }
  function bestOverallStreak() {
    const days = Object.keys(state.log)
      .filter((d) => Object.keys(state.log[d]).length > 0).sort();
    if (!days.length) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      if (isSameDay(addDays(parseKey(days[i - 1]), 1), parseKey(days[i]))) { cur++; best = Math.max(best, cur); }
      else cur = 1;
    }
    return best;
  }

  /* ---------- Действия ---------- */
  function setViewDate(d) {
    viewDate = startOfDay(d);
    calMonth = firstOfMonth(viewDate);
    render();
  }
  function toggleGoal(goalId) {
    if (!isEditableDay(viewDate)) {
      toast("Отмечать можно только сегодняшний день", "warn");
      return;
    }
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
      const undo = { label: "Отменить", onClick: () => undoComplete(key, goalId) };
      if (after > before) toast(`Новый уровень ${after} — ${levelTitle(after)}! 🎉`, "good", undo);
      else toast(`+${xp} XP · ${g ? g.name : ""}`, "good", undo);
    }
  }
  // Быстрая отмена только что отмеченного выполнения (из уведомления)
  function undoComplete(key, goalId) {
    if (state.log[key]) {
      delete state.log[key][goalId];
      if (Object.keys(state.log[key]).length === 0) delete state.log[key];
    }
    save(); render();
    toast("Отменено", "warn");
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

  function render() { renderLevel(); renderDaybar(); renderStats(); renderGoals(); renderAchievements(); renderCalendar(); renderSummary(); }

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
    $("#prevDay").disabled = false;
    $("#prevDay").style.opacity = 1;
  }

  function renderStats() {
    const key = dateKey(viewDate);
    const existing = goalsExistingOn(viewDate);
    const doneToday = completionsOn(key);
    const totalGoals = existing.length;
    const dayXp = existing.reduce((n, g) => n + (isDone(key, g.id) ? (Number(g.xp) || 0) : 0), 0);
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
    const active = activeGoals();
    const key = dateKey(viewDate);
    const week = last7Days(viewDate);
    const locked = !isEditableDay(viewDate);
    const isTodayView = isSameDay(viewDate, new Date());

    // Цели, которые существовали в этот день (созданы не позже него)
    const existing = active.filter((g) => goalExistsOn(g, viewDate));
    // На сегодня выполненные скрываются до завтра; на других днях видны все существовавшие
    const shown = isTodayView ? existing.filter((g) => !isDone(key, g.id)) : existing;
    const doneToday = existing.filter((g) => isDone(key, g.id)).length;

    // Пустые состояния
    const hint = $("#emptyHint");
    if (state.goals.length === 0) {
      hint.hidden = false;
      hint.innerHTML = "Пока нет ни одной цели. Нажми «Новая цель», чтобы добавить первую.";
    } else if (existing.length === 0) {
      hint.hidden = false;
      hint.innerHTML = "В этот день целей ещё не было — приложение их не отслеживало.";
    } else if (shown.length === 0 && isTodayView) {
      hint.hidden = false;
      hint.innerHTML = "🎉 Все цели на сегодня выполнены! Новые появятся завтра.";
    } else {
      hint.hidden = true;
    }
    // Заметка о скрытых выполненных
    const note = $("#goalsNote");
    if (isTodayView && doneToday > 0 && shown.length > 0) {
      note.hidden = false;
      note.textContent = `Выполнено сегодня: ${doneToday} — скрыто до завтра`;
    } else {
      note.hidden = true;
    }

    for (const g of shown) {
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
          <button class="goal-iconbtn" title="Отметить цель достигнутой" data-achieve="${g.id}"${locked ? " disabled" : ""}>${icon("trophy", 16)}</button>
          <button class="goal-iconbtn" title="Редактировать" data-edit="${g.id}"${locked ? " disabled" : ""}>${icon("pencil", 16)}</button>
        </div>
        <div class="goal-streak ${streak > 0 ? "active" : "inactive"}">
          ${streak > 0 ? `${icon("flame", 15)} Серия: ${streak} ${plural(streak, "день", "дня", "дней")}`
                       : "Серия прервана — начни заново"}
        </div>
        <div class="goal-week-dots">${dots}</div>
        <div class="goal-action">
          <button class="check-btn${done ? " done" : ""}" data-toggle="${g.id}"${locked ? " disabled" : ""}>
            ${done ? icon("check", 18) + " Выполнено" : (locked ? "Не выполнено" : "Отметить выполнение")}
            <span class="xp-pill">+${Number(g.xp) || 0} XP</span>
          </button>
        </div>`;
      grid.appendChild(card);
    }

    $$("[data-toggle]", grid).forEach((b) => b.addEventListener("click", () => {
      if (b.disabled) return;
      const id = b.dataset.toggle;
      if (isDone(dateKey(viewDate), id)) {
        toggleGoal(id); // снятие отметки (видимо только на прошлых днях)
      } else {
        openCompleteModal(id); // подтверждение перед выполнением
      }
      const c = b.closest(".goal-card");
      if (c) { c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
    }));
    $$("[data-edit]", grid).forEach((b) => b.addEventListener("click", () => { if (!b.disabled) openGoalModal(b.dataset.edit); }));
    $$("[data-achieve]", grid).forEach((b) => b.addEventListener("click", () => { if (!b.disabled) openAchieveModal(b.dataset.achieve); }));
  }

  /* ---------- Подтверждение выполнения ---------- */
  let completingId = null;
  function openCompleteModal(id) {
    const g = goalById(id);
    if (!g) return;
    if (!isEditableDay(viewDate)) {
      toast("Отмечать можно только сегодняшний день", "warn");
      return;
    }
    completingId = id;
    $("#completeModalGoal").innerHTML =
      `<div class="goal-icon" style="--goal-color:${g.color || "#4f46e5"}">${renderGoalIcon(g.icon, 20)}</div>
       <span><b>${escapeHtml(g.name)}</b> · +${Number(g.xp) || 0} XP</span>`;
    $("#completeModalNote").textContent = isSameDay(viewDate, new Date())
      ? "После подтверждения цель будет отмечена и скроется до завтра."
      : `Отметить выполненной за ${humanDate(viewDate)}?`;
    $("#completeModal").hidden = false;
    setTimeout(() => $("#completeConfirmBtn").focus(), 30);
  }
  function closeCompleteModal() { $("#completeModal").hidden = true; completingId = null; }
  function confirmComplete() {
    if (!completingId) return;
    const id = completingId;
    closeCompleteModal();
    toggleGoal(id); // отмечает выполнение + XP + уведомление с отменой
  }

  /* ---------- Итоги дня ---------- */
  function dayLogItem(g, done) {
    return `<div class="daylog-item ${done ? "done" : "todo"}" style="--goal-color:${g.color || "#4f46e5"}">
      <span class="goal-icon">${renderGoalIcon(g.icon, 18)}</span>
      <span class="daylog-name">${escapeHtml(g.name)}</span>
      <span class="daylog-xp">+${Number(g.xp) || 0} XP</span>
      <span class="daylog-mark">${done ? icon("check", 16) : ""}</span>
    </div>`;
  }
  function openDayLog() {
    const key = dateKey(viewDate);
    const active = goalsExistingOn(viewDate); // только существовавшие в этот день
    const done = active.filter((g) => isDone(key, g.id));
    const todo = active.filter((g) => !isDone(key, g.id));
    const dayXp = done.reduce((n, g) => n + (Number(g.xp) || 0), 0);
    const isTd = isSameDay(viewDate, new Date());

    $("#dayLogTitle").textContent = "Итоги дня · " + (isTd ? "Сегодня" : humanDate(viewDate));

    let html = `<div class="daylog-section">
      <div class="daylog-head good">${icon("check", 15)} Выполнено (${done.length})</div>
      ${done.length ? done.map((g) => dayLogItem(g, true)).join("")
                    : `<div class="daylog-empty">Пока ничего не выполнено</div>`}
    </div>
    <div class="daylog-section">
      <div class="daylog-head">${icon("target", 15)} Осталось (${todo.length})</div>
      ${todo.length ? todo.map((g) => dayLogItem(g, false)).join("")
                    : (active.length ? `<div class="daylog-empty">Все цели выполнены 🎉</div>`
                                     : `<div class="daylog-empty">Нет активных целей</div>`)}
    </div>
    <div class="daylog-total">Опыт за день: <b>${dayXp} XP</b></div>`;

    $("#dayLogBody").innerHTML = html;
    $("#dayLogModal").hidden = false;
  }
  function closeDayLog() { $("#dayLogModal").hidden = true; }

  /* ---------- Достижения ---------- */
  function renderAchievements() {
    const section = $("#achvSection");
    const grid = $("#achvGrid");
    const list = achievedGoals();
    section.hidden = list.length === 0;
    $("#achvCount").textContent = list.length
      ? `${list.length} ${plural(list.length, "цель", "цели", "целей")}` : "";
    grid.innerHTML = "";
    for (const g of list) {
      const card = el("div", "achv-card");
      card.style.setProperty("--goal-color", g.color || "#4f46e5");
      const title = g.achievementTitle || g.name;
      card.innerHTML = `
        <div class="achv-ribbon">${icon("trophy", 14)} Достигнуто</div>
        <div class="goal-top">
          <div class="goal-icon">${renderGoalIcon(g.icon)}</div>
          <div class="goal-info">
            <div class="goal-name">${escapeHtml(title)}</div>
            <div class="goal-sub">${formatDate(g.achievedAt)}</div>
          </div>
        </div>`;
      grid.appendChild(card);
    }
  }

  // Достижение оформляется через модалку: ввод названия → сохранение (без возврата)
  let achievingId = null;
  function openAchieveModal(id) {
    const g = goalById(id);
    if (!g) return;
    achievingId = id;
    $("#achvModalGoal").innerHTML =
      `<div class="goal-icon" style="--goal-color:${g.color || "#4f46e5"}">${renderGoalIcon(g.icon, 20)}</div>
       <span>Цель: <b>${escapeHtml(g.name)}</b></span>`;
    const inp = $("#achvTitle");
    inp.value = g.name;
    $("#achvModal").hidden = false;
    setTimeout(() => { inp.focus(); inp.select(); }, 30);
  }
  function closeAchieveModal() { $("#achvModal").hidden = true; achievingId = null; }
  function confirmAchieve() {
    if (!achievingId) return;
    const g = goalById(achievingId);
    if (!g) { closeAchieveModal(); return; }
    const title = $("#achvTitle").value.trim();
    if (!title) { toast("Впиши, что ты выполнил", "warn"); return; }
    g.achievementTitle = title;
    g.achievedAt = Date.now();
    save();
    closeAchieveModal();
    render();
    toast(`🏆 Достижение: ${title}!`, "good");
  }

  /* ---------- Календарь ---------- */
  function renderCalendar() {
    $("#calMonthLabel").textContent = `${MONTHS_NOM[calMonth.getMonth()]} ${calMonth.getFullYear()}`;

    const wd = $("#calWeekdays");
    wd.innerHTML = "";
    CAL_WD.forEach((w) => wd.appendChild(el("span", "cal-wd", w)));

    const grid = $("#calGrid");
    grid.innerHTML = "";
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7; // сдвиг для недели с понедельника
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    for (let i = 0; i < offset; i++) grid.appendChild(el("span", "cal-cell empty"));

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      const key = dateKey(d);
      const totalGoals = goalsExistingOn(d).length; // сколько целей существовало в этот день
      const ratio = totalGoals ? completionsOn(key) / totalGoals : 0;
      const perfect = totalGoals > 0 && ratio >= 1;
      const disabled = inFuture(d); // прошлые дни доступны для просмотра, будущее — нет
      const isTd = isSameDay(d, new Date());
      const isSel = isSameDay(d, viewDate);
      const isStart = isSameDay(d, startObj());

      const cell = el("button", "cal-cell");
      if (disabled) cell.classList.add("disabled");
      if (isTd) cell.classList.add("today");
      if (isSel) cell.classList.add("selected");
      if (perfect) cell.classList.add("perfect");
      if (isStart) cell.classList.add("start");
      cell.type = "button";
      cell.title = humanDate(d) + (isStart ? " · старт" : "") + (totalGoals ? ` · ${completionsOn(key)}/${totalGoals}` : "");
      if (!disabled && ratio > 0) {
        cell.style.background = `color-mix(in srgb, var(--accent) ${Math.round(18 + ratio * 62)}%, transparent)`;
        if (ratio >= 0.6) cell.classList.add("filled");
      }
      cell.innerHTML = `<span class="cal-num">${day}</span>` +
        (perfect ? `<span class="cal-check">${icon("check", 12)}</span>` : "");
      if (!disabled) cell.addEventListener("click", () => {
        setViewDate(d);
        const gs = document.querySelector(".goals-section");
        if (gs) gs.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      grid.appendChild(cell);
    }

    // Точка старта (только для чтения)
    const lbl = $("#startDateLabel");
    if (lbl) lbl.textContent = formatDate(parseKey(state.startDate).getTime());
  }

  function renderSummary() {
    // Итоги за отображаемый в календаре месяц (в пределах точки старта и сегодня)
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let monthXp = 0, monthDone = 0, perfectDays = 0, trackedDays = 0, possible = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      if (inFuture(d)) continue;
      const existing = goalsExistingOn(d); // только существовавшие в этот день цели
      if (existing.length === 0) continue; // до появления целей день не считаем
      trackedDays++;
      possible += existing.length;
      const key = dateKey(d);
      const dc = completionsOn(key);
      monthDone += dc;
      if (dc === existing.length) perfectDays++;
      existing.forEach((g) => { if (isDone(key, g.id)) monthXp += Number(g.xp) || 0; });
    }
    const rate = possible ? Math.round((monthDone / possible) * 100) : 0;

    const summary = $("#weekSummary");
    summary.innerHTML = "";
    [
      { v: `${monthXp} XP`, l: "опыта за месяц" },
      { v: `${monthDone}`, l: "выполнений за месяц" },
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
        state = migrated;
        viewDate = startOfDay(new Date());
        calMonth = firstOfMonth(new Date());
        save(); render();
        toast("Данные импортированы", "good");
      } catch (e) { console.error(e); toast("Не удалось прочитать файл", "warn"); }
    };
    reader.readAsText(file);
  }
  function resetAll() {
    if (!confirm("Удалить ВСЕ цели и историю?\nСоветуем сначала сделать экспорт. Действие необратимо.")) return;
    if (!confirm("Точно уверены? Все данные будут стёрты.")) return;
    state = defaultState();
    viewDate = startOfDay(new Date());
    calMonth = firstOfMonth(new Date());
    save(); render();
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
  function formatDate(ts) {
    const d = new Date(ts);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  let toastTimer = null;
  function toast(msg, kind, action) {
    const t = $("#toast");
    t.className = "toast" + (kind ? " " + kind : "");
    t.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = msg;
    t.appendChild(span);
    if (action) {
      const btn = document.createElement("button");
      btn.className = "toast-action";
      btn.textContent = action.label;
      btn.addEventListener("click", () => { t.hidden = true; clearTimeout(toastTimer); action.onClick(); });
      t.appendChild(btn);
    }
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, action ? 5000 : 2200);
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

    $("#achvSaveBtn").addEventListener("click", confirmAchieve);
    $("#achvCancelBtn").addEventListener("click", closeAchieveModal);
    $("#achvModal").addEventListener("click", (e) => { if (e.target.id === "achvModal") closeAchieveModal(); });
    $("#achvTitle").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmAchieve(); });

    $("#completeConfirmBtn").addEventListener("click", confirmComplete);
    $("#completeCancelBtn").addEventListener("click", closeCompleteModal);
    $("#completeModal").addEventListener("click", (e) => { if (e.target.id === "completeModal") closeCompleteModal(); });

    $("#dayLogBtn").addEventListener("click", openDayLog);
    $("#dayLogCloseBtn").addEventListener("click", closeDayLog);
    $("#dayLogModal").addEventListener("click", (e) => { if (e.target.id === "dayLogModal") closeDayLog(); });

    $("#prevDay").addEventListener("click", () => setViewDate(addDays(viewDate, -1)));
    $("#nextDay").addEventListener("click", () => {
      if (isSameDay(viewDate, new Date())) return;
      setViewDate(addDays(viewDate, 1));
    });
    $("#todayBtn").addEventListener("click", () => setViewDate(new Date()));

    $("#calPrev").addEventListener("click", () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); render(); });
    $("#calNext").addEventListener("click", () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); render(); });
    $("#calMonthLabel").addEventListener("click", () => { calMonth = firstOfMonth(new Date()); render(); });

    $("#exportBtn").addEventListener("click", exportData);
    $("#importBtn").addEventListener("click", () => $("#importInput").click());
    $("#importInput").addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) importData(e.target.files[0]);
      e.target.value = "";
    });
    $("#resetBtn").addEventListener("click", resetAll);

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("#goalModal").hidden) closeGoalModal();
      if (!$("#achvModal").hidden) closeAchieveModal();
      if (!$("#completeModal").hidden) closeCompleteModal();
      if (!$("#dayLogModal").hidden) closeDayLog();
    });
    window.addEventListener("storage", (e) => { if (e.key === STORAGE_KEY) { state = load(); render(); } });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => { if (!localStorage.getItem(THEME_KEY)) renderThemeToggle(); });
  }

  /* ---------- Pull-to-refresh (потяни вниз сверху → перезагрузка) ---------- */
  function setupPullToRefresh() {
    const ptr = $("#ptr");
    if (!ptr || !("ontouchstart" in window)) return;
    ptr.innerHTML = icon("refresh", 22);
    const THRESHOLD = 70, MAX = 90, RESIST = 0.5;
    let startY = 0, pulling = false, pull = 0;
    const anyModalOpen = () => !!document.querySelector(".modal-backdrop:not([hidden])");
    const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
    function show(px) {
      pull = px;
      ptr.style.transition = "none";
      ptr.style.transform = `translateX(-50%) translateY(${px}px)`;
      ptr.style.opacity = Math.min(1, px / THRESHOLD);
      ptr.classList.toggle("ready", px >= THRESHOLD);
    }
    function reset() {
      ptr.classList.remove("ready", "spin");
      ptr.style.transition = "transform .2s ease, opacity .2s ease";
      ptr.style.transform = "translateX(-50%) translateY(-56px)";
      ptr.style.opacity = "0";
    }
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1 || anyModalOpen() || !atTop()) { pulling = false; return; }
      startY = e.touches[0].clientY; pulling = true; pull = 0;
    }, { passive: true });
    window.addEventListener("touchmove", (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || !atTop()) { pulling = false; reset(); return; }
      e.preventDefault(); // берём жест на себя
      show(Math.min(dy * RESIST, MAX));
    }, { passive: false });
    function end() {
      if (!pulling) return;
      pulling = false;
      if (pull >= THRESHOLD) {
        ptr.classList.add("spin");
        ptr.style.transition = "transform .2s ease";
        ptr.style.transform = "translateX(-50%) translateY(18px)";
        ptr.style.opacity = "1";
        setTimeout(() => location.reload(), 150);
      } else {
        reset();
      }
    }
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", () => { if (pulling) { pulling = false; reset(); } });
  }

  /* ---------- Старт ---------- */
  function init() {
    if (!storageAvailable()) toast("localStorage недоступен — данные не сохранятся. Используйте экспорт.", "warn");
    state = load();
    fillStaticIcons();
    renderThemeToggle();
    buildPickers();
    bindEvents();
    setupPullToRefresh();
    render();
    save();
  }
  function storageAvailable() {
    try { const k = "__lu_test__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; }
    catch (e) { return false; }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
