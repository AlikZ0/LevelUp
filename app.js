/* ============================================================
   LevelUp — игровой трекер целей (frontend-only)
   Все данные хранятся в localStorage. Экспорт/импорт в JSON.
   ============================================================ */

(() => {
  "use strict";

  const STORAGE_KEY = "levelup.data.v1";
  const BACKUP_KEY = "levelup.backup.v1";
  const SCHEMA_VERSION = 1;

  const EMOJIS = ["🎯", "💪", "📚", "🏃", "🧘", "💧", "🥗", "😴", "💻", "🎨",
                  "🎸", "🌱", "🧠", "✍️", "🗣️", "💰", "🧹", "🙏", "☀️", "🔥"];
  const COLORS = ["#7c6cff", "#56d1ff", "#43d17f", "#ffb347", "#ff5d73",
                  "#f45bd4", "#5b8bff", "#2dd4bf", "#c084fc", "#facc15"];

  const LEVEL_TITLES = [
    [1, "Новичок"], [3, "Ученик"], [5, "Практик"], [8, "Знаток"],
    [12, "Мастер"], [16, "Эксперт"], [21, "Чемпион"], [27, "Легенда"], [35, "Титан"],
  ];

  /* ---------- Состояние ---------- */
  let state = null;
  let viewDate = new Date(); // какой день сейчас смотрим

  /* ---------- Утилиты дат ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  function dateKey(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function todayKey() { return dateKey(new Date()); }
  function isSameDay(a, b) { return dateKey(a) === dateKey(b); }
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
                  "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  function humanDate(d) {
    return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  // Последние 7 дней, заканчивая на viewDate (индекс 6 = viewDate)
  function last7Days(end) {
    const arr = [];
    for (let i = 6; i >= 0; i--) arr.push(addDays(end, -i));
    return arr;
  }

  /* ---------- Хранилище ---------- */
  function defaultState() {
    return {
      version: SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      goals: [],
      log: {}, // { "YYYY-MM-DD": { goalId: true } }
    };
  }

  function seedState() {
    const s = defaultState();
    s.goals = [
      { id: uid(), name: "Спорт", icon: "💪", color: COLORS[2], xp: 15, createdAt: Date.now() },
      { id: uid(), name: "Чтение", icon: "📚", color: COLORS[1], xp: 10, createdAt: Date.now() },
      { id: uid(), name: "Вода 2л", icon: "💧", color: COLORS[4], xp: 5, createdAt: Date.now() },
    ];
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedState();
      const parsed = JSON.parse(raw);
      return migrate(parsed);
    } catch (e) {
      console.error("Не удалось прочитать данные, пробую резервную копию", e);
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

  function validGoal(g) {
    return g && typeof g.id === "string" && typeof g.name === "string";
  }

  let saveTimer = null;
  function save() {
    try {
      const json = JSON.stringify(state);
      // Перед перезаписью сохраняем предыдущее состояние как резервную копию
      const prev = localStorage.getItem(STORAGE_KEY);
      if (prev) localStorage.setItem(BACKUP_KEY, prev);
      localStorage.setItem(STORAGE_KEY, json);
      flashSaved();
    } catch (e) {
      console.error("Ошибка сохранения", e);
      toast("⚠️ Не удалось сохранить данные", "warn");
    }
  }

  function flashSaved() {
    const el = $("#saveStatus");
    if (!el) return;
    el.textContent = "✅ Сохранено";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      el.textContent = "💾 Данные сохраняются локально в этом браузере";
    }, 1400);
  }

  function uid() {
    return "g" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  /* ---------- Логика опыта / уровней ---------- */
  // XP, необходимый для перехода с уровня L на L+1
  function xpToNext(level) { return 100 + (level - 1) * 50; }

  // Возвращает { level, into, need, total } на основе общего опыта
  function levelInfo(totalXp) {
    let level = 1;
    let remaining = totalXp;
    while (remaining >= xpToNext(level)) {
      remaining -= xpToNext(level);
      level++;
    }
    return { level, into: remaining, need: xpToNext(level), total: totalXp };
  }

  function levelTitle(level) {
    let title = LEVEL_TITLES[0][1];
    for (const [min, name] of LEVEL_TITLES) {
      if (level >= min) title = name;
    }
    return title;
  }

  function goalById(id) { return state.goals.find((g) => g.id === id); }

  function isDone(dayKey, goalId) {
    return !!(state.log[dayKey] && state.log[dayKey][goalId]);
  }

  // Все выполнения за конкретный день, суммарный XP
  function totalXpEarned() {
    let sum = 0;
    for (const day in state.log) {
      const entry = state.log[day];
      for (const gid in entry) {
        if (entry[gid]) {
          const g = goalById(gid);
          sum += g ? Number(g.xp) || 0 : 0;
        }
      }
    }
    return sum;
  }

  // Стрик по цели: сколько дней подряд (до viewDate включительно) цель выполнялась
  function streakFor(goalId, endDate) {
    let count = 0;
    let d = new Date(endDate);
    // Если сегодня ещё не отмечено — стрик считаем со вчерашнего дня
    if (!isDone(dateKey(d), goalId)) {
      // разрешаем, что «сегодня» ещё впереди — начинаем со вчера
      if (isSameDay(d, new Date())) d = addDays(d, -1);
      else return 0;
    }
    while (isDone(dateKey(d), goalId)) {
      count++;
      d = addDays(d, -1);
    }
    return count;
  }

  function completionsOn(dayKey) {
    const entry = state.log[dayKey];
    if (!entry) return 0;
    return state.goals.reduce((n, g) => n + (entry[g.id] ? 1 : 0), 0);
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
      if (after > before) {
        toast(`🎉 Новый уровень ${after} — ${levelTitle(after)}!`, "good");
      } else {
        toast(`+${xp} XP · ${g ? g.name : ""} 🔥`, "good");
      }
    }
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

  function render() {
    renderLevel();
    renderDaybar();
    renderStats();
    renderGoals();
    renderWeek();
  }

  function renderLevel() {
    const info = levelInfo(totalXpEarned());
    $("#levelNum").textContent = info.level;
    $("#levelTitle").textContent = levelTitle(info.level);
    $("#xpText").textContent = `${info.into} / ${info.need} XP`;
    $("#totalXp").textContent = `Всего опыта: ${info.total} XP`;
    const pct = Math.min(100, Math.round((info.into / info.need) * 100));
    $("#xpFill").style.width = pct + "%";
  }

  function renderDaybar() {
    const today = new Date();
    const isToday = isSameDay(viewDate, today);
    $("#dayTitle").textContent = isToday ? "Сегодня"
      : isSameDay(viewDate, addDays(today, -1)) ? "Вчера" : humanDate(viewDate).split(",")[0];
    $("#dayDate").textContent = humanDate(viewDate);
    $("#todayBtn").hidden = isToday;
    // нельзя заглядывать в будущее
    $("#nextDay").disabled = isToday;
    $("#nextDay").style.opacity = isToday ? .35 : 1;
  }

  function renderStats() {
    const key = dateKey(viewDate);
    const doneToday = completionsOn(key);
    const totalGoals = state.goals.length;
    const dayXp = state.goals.reduce((n, g) => n + (isDone(key, g.id) ? (Number(g.xp) || 0) : 0), 0);

    // Активных дней всего
    const activeDays = Object.keys(state.log).filter((d) => Object.keys(state.log[d]).length > 0).length;

    // Лучший общий стрик (дней подряд хотя бы с одним выполнением)
    const bestStreak = bestOverallStreak();

    const cards = [
      { emoji: "✅", value: `${doneToday}/${totalGoals}`, label: "выполнено за день" },
      { emoji: "⭐", value: `${dayXp}`, label: "XP за этот день" },
      { emoji: "🔥", value: `${bestStreak}`, label: "лучшая серия дней" },
      { emoji: "📅", value: `${activeDays}`, label: "активных дней всего" },
    ];
    const row = $("#statsRow");
    row.innerHTML = "";
    for (const c of cards) {
      row.appendChild(el("div", "stat-card",
        `<div class="stat-value"><span class="emoji">${c.emoji}</span>${c.value}</div>
         <div class="stat-label">${c.label}</div>`));
    }
  }

  function bestOverallStreak() {
    const days = Object.keys(state.log)
      .filter((d) => Object.keys(state.log[d]).length > 0)
      .sort();
    if (days.length === 0) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curD = new Date(days[i]);
      if (isSameDay(addDays(prev, 1), curD)) { cur++; best = Math.max(best, cur); }
      else cur = 1;
    }
    return best;
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
      card.style.setProperty("--goal-color", g.color || "#7c6cff");

      const streak = streakFor(g.id, viewDate);
      const dots = week.map((d) => {
        const on = isDone(dateKey(d), g.id);
        const isTd = isSameDay(d, viewDate);
        return `<span class="wk-dot${on ? " on" : ""}${isTd ? " today" : ""}" title="${humanDate(d)}"></span>`;
      }).join("");

      card.innerHTML = `
        <div class="goal-top">
          <div class="goal-icon">${g.icon || "🎯"}</div>
          <div class="goal-info">
            <div class="goal-name">${escapeHtml(g.name)}</div>
            <div class="goal-sub">+${Number(g.xp) || 0} XP за выполнение</div>
          </div>
          <button class="goal-edit" title="Редактировать" data-edit="${g.id}">✏️</button>
        </div>
        ${streak > 0 ? `<div class="goal-streak">🔥 Серия: ${streak} ${plural(streak, "день", "дня", "дней")}</div>` : `<div class="goal-streak" style="color:var(--muted)">Серия прервана — начни заново!</div>`}
        <div class="goal-week-dots">${dots}</div>
        <div class="goal-action">
          <button class="check-btn${done ? " done" : ""}" data-toggle="${g.id}">
            ${done ? "✓ Выполнено" : "Отметить выполнение"}
            <span class="xp-pill">+${Number(g.xp) || 0} XP</span>
          </button>
        </div>`;
      grid.appendChild(card);
    }

    $$("[data-toggle]", grid).forEach((b) =>
      b.addEventListener("click", () => {
        toggleGoal(b.dataset.toggle);
        const c = b.closest(".goal-card");
        if (c) { c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
      }));
    $$("[data-edit]", grid).forEach((b) =>
      b.addEventListener("click", () => openGoalModal(b.dataset.edit)));
  }

  function renderWeek() {
    const week = last7Days(viewDate);
    const table = $("#weekTable");
    table.innerHTML = "";

    $("#weekRange").textContent =
      `${week[0].getDate()} ${MONTHS[week[0].getMonth()]} — ${week[6].getDate()} ${MONTHS[week[6].getMonth()]}`;

    // Заголовок
    const thead = el("thead");
    const hrow = el("tr");
    hrow.appendChild(el("th", null, "Цель"));
    week.forEach((d) => {
      const isTd = isSameDay(d, viewDate);
      const th = el("th", isTd ? "col-today" : null,
        `${WEEKDAYS[d.getDay()]}<br><span class="muted">${d.getDate()}</span>`);
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    // Тело
    const tbody = el("tbody");
    if (state.goals.length === 0) {
      const tr = el("tr");
      tr.appendChild(el("td", null, `<span class="muted">Добавь цели, чтобы увидеть прогресс</span>`));
      tr.firstChild.colSpan = 8;
      tbody.appendChild(tr);
    }
    for (const g of state.goals) {
      const tr = el("tr");
      const nameCell = el("td", "goal-cell",
        `<span class="dot" style="background:${g.color}"></span>${g.icon || ""} ${escapeHtml(g.name)}`);
      tr.appendChild(nameCell);
      week.forEach((d) => {
        const on = isDone(dateKey(d), g.id);
        const isTd = isSameDay(d, viewDate);
        const td = el("td", isTd ? "col-today" : null,
          `<span class="cell-mark ${on ? "on" : "off"}">${on ? "●" : "·"}</span>`);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    // Итоги недели
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
    const items = [
      { v: `${weekXp} XP`, l: "опыта за неделю" },
      { v: `${weekDone}`, l: "выполнений за неделю" },
      { v: `${rate}%`, l: "выполнено от плана" },
      { v: `${perfectDays}`, l: "идеальных дней (100%)" },
    ];
    for (const it of items) {
      summary.appendChild(el("div", "summary-card",
        `<div class="v">${it.v}</div><div class="l">${it.l}</div>`));
    }
  }

  /* ---------- Модалка цели ---------- */
  let editingId = null;
  let pickIcon = EMOJIS[0];
  let pickColor = COLORS[0];

  function buildPickers() {
    const ep = $("#emojiPicker");
    ep.innerHTML = "";
    EMOJIS.forEach((em) => {
      const b = el("div", "emoji-opt", em);
      b.addEventListener("click", () => {
        pickIcon = em;
        $$(".emoji-opt", ep).forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
      });
      ep.appendChild(b);
    });
    const cp = $("#colorPicker");
    cp.innerHTML = "";
    COLORS.forEach((c) => {
      const b = el("div", "color-opt");
      b.style.background = c;
      b.addEventListener("click", () => {
        pickColor = c;
        $$(".color-opt", cp).forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
      });
      cp.appendChild(b);
    });
  }

  function syncPickerSelection() {
    $$(".emoji-opt").forEach((x) => x.classList.toggle("sel", x.textContent === pickIcon));
    $$(".color-opt").forEach((x) => x.classList.toggle("sel", rgbEq(x.style.background, pickColor)));
  }

  function openGoalModal(id) {
    editingId = id || null;
    const g = id ? goalById(id) : null;
    $("#goalModalTitle").textContent = g ? "Редактировать цель" : "Новая цель";
    $("#goalName").value = g ? g.name : "";
    $("#goalXp").value = g ? (Number(g.xp) || 10) : 10;
    pickIcon = g ? (g.icon || EMOJIS[0]) : EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
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
    save();
    closeGoalModal();
    render();
    toast(editingId ? "Цель обновлена ✅" : "Цель добавлена 🎯", "good");
  }

  function deleteGoal() {
    if (!editingId) return;
    const g = goalById(editingId);
    if (!confirm(`Удалить цель «${g ? g.name : ""}»?\nИстория выполнений по ней тоже будет убрана из статистики.`)) return;
    state.goals = state.goals.filter((x) => x.id !== editingId);
    // чистим лог
    for (const d in state.log) {
      delete state.log[d][editingId];
      if (Object.keys(state.log[d]).length === 0) delete state.log[d];
    }
    save();
    closeGoalModal();
    render();
    toast("Цель удалена", "warn");
  }

  /* ---------- Экспорт / Импорт ---------- */
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `levelup-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Резервная копия скачана ⬇️", "good");
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const migrated = migrate(data);
        if (!confirm("Импортировать данные из файла?\nТекущие данные будут заменены (предыдущее состояние сохранится в резервной копии).")) return;
        state = migrated;
        save();
        render();
        toast("Данные импортированы ✅", "good");
      } catch (e) {
        console.error(e);
        toast("⚠️ Не удалось прочитать файл", "warn");
      }
    };
    reader.readAsText(file);
  }

  function resetAll() {
    if (!confirm("Удалить ВСЕ цели и историю?\nСоветуем сначала сделать экспорт. Действие необратимо.")) return;
    if (!confirm("Точно уверены? Все данные будут стёрты.")) return;
    state = defaultState();
    save();
    render();
    toast("Всё сброшено", "warn");
  }

  /* ---------- Мелкие помощники ---------- */
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
  function rgbEq(a, b) {
    // грубое сравнение цвета из style.background с hex
    const toHex = (str) => {
      const m = str.match(/\d+/g);
      if (!m) return str.toLowerCase();
      return "#" + m.slice(0, 3).map((x) => pad2(parseInt(x, 10).toString(16))).join("");
    };
    const pad2 = (h) => h.length === 1 ? "0" + h : h;
    return toHex(a) === b.toLowerCase();
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

  /* ---------- События ---------- */
  function bindEvents() {
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

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#goalModal").hidden) closeGoalModal();
    });

    // Предупреждаем, если хранилище недоступно (например, приватный режим)
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) { state = load(); render(); }
    });
  }

  /* ---------- Старт ---------- */
  function init() {
    if (!storageAvailable()) {
      toast("⚠️ localStorage недоступен — данные не сохранятся. Используйте экспорт.", "warn");
    }
    state = load();
    buildPickers();
    bindEvents();
    render();
    // Гарантируем начальное сохранение (например, при первом запуске с сидом)
    save();
  }

  function storageAvailable() {
    try {
      const k = "__lu_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
