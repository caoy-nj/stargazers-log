const state = {
  events: [],
  category: "全部",
  query: "",
  topic: "",
  language: "",
};

const elements = {
  list: document.querySelector("#starred-list"),
  status: document.querySelector("#results-status"),
  search: document.querySelector("#repo-search"),
  languageFilter: document.querySelector("#language-filter"),
  searchButton: document.querySelector("#header-search-button"),
  filters: [...document.querySelectorAll("[data-filter]")],
  topicFilters: [...document.querySelectorAll("[data-topic]")],
  mobileMenuButton: document.querySelector("#mobile-menu-button"),
  mobileMenu: document.querySelector("#mobile-menu"),
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function getVisibleEvents() {
  const normalizedQuery = state.query.trim().toLocaleLowerCase("zh-CN");
  const normalizedTopic = state.topic.toLocaleLowerCase("zh-CN");
  const normalizedLanguage = state.language.toLocaleLowerCase("en");

  return state.events.filter((event) => {
    const matchesCategory = state.category === "全部" || event.category === state.category;
    const matchesLanguage =
      !normalizedLanguage ||
      (event.language || "").toLocaleLowerCase("en") === normalizedLanguage;
    const searchableText = [
      event.name,
      event.description,
      event.language,
      event.category,
      ...(event.topics || []),
    ]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesTopic =
      !normalizedTopic ||
      (event.topics || []).some(
        (topic) => topic.toLocaleLowerCase("zh-CN") === normalizedTopic,
      );

    return matchesCategory && matchesLanguage && matchesQuery && matchesTopic;
  });
}

function populateLanguageFilter() {
  const collator = new Intl.Collator("en", { sensitivity: "base" });
  const languages = [...new Set(state.events.map((event) => event.language).filter(Boolean))]
    .sort(collator.compare);
  const previousLanguage = state.language.toLocaleLowerCase("en");

  elements.languageFilter.replaceChildren(new Option("全部语言", ""));
  languages.forEach((language) => {
    elements.languageFilter.add(new Option(language, language));
  });

  state.language =
    languages.find((language) => language.toLocaleLowerCase("en") === previousLanguage) || "";
  elements.languageFilter.value = state.language;
}

function ownerInitials(owner = "") {
  return (
    owner
      .split(/[-_\s]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "GH"
  );
}

function renderCard(event) {
  const [owner, repo = event.name] = event.name.split("/");
  const languageColor = escapeHtml(event.languageColor || "#8158e8");
  const topics = (event.topics || [])
    .slice(0, 3)
    .map(
      (topic) =>
        `<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">${escapeHtml(topic)}</span>`,
    )
    .join("");

  return `
    <li class="repo-card group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_18px_rgba(75,51,133,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_16px_36px_rgba(75,51,133,0.09)] sm:p-6">
      <div class="relative z-10 flex gap-4">
        <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-slate-100 bg-slate-950 text-[11px] font-bold tracking-wide text-white shadow-sm transition duration-300 group-hover:rotate-[-4deg] group-hover:scale-105">
          ${escapeHtml(ownerInitials(owner))}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <a
                  href="${escapeHtml(normalizeUrl(event.url))}"
                  target="_blank"
                  rel="noreferrer"
                  class="truncate text-[15px] font-semibold tracking-[-0.015em] text-slate-900 transition group-hover:text-brand-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  <span class="font-normal text-slate-400">${escapeHtml(owner)} /</span>
                  ${escapeHtml(repo)}
                </a>
                ${event.featured ? '<span class="rounded-full bg-brand-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-brand-700">精选</span>' : ""}
              </div>
              <p class="mt-2 max-w-2xl text-[13px] leading-6 text-slate-500">${escapeHtml(event.description || "值得回看的开源项目。")}</p>
            </div>
            <a
              href="${escapeHtml(normalizeUrl(event.url))}"
              target="_blank"
              rel="noreferrer"
              class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-brand-200 group-hover:bg-white group-hover:text-brand-700"
              aria-label="在 GitHub 打开 ${escapeHtml(event.name)}"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-none stroke-current stroke-2">
                <path d="M7 17 17 7M8 7h9v9" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </div>
          <div class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                <span class="h-1.5 w-1.5 rounded-full" style="background-color: ${languageColor}"></span>
                ${escapeHtml(event.language || "开源项目")}
              </span>
              ${topics}
            </div>
            <div class="flex items-center gap-3 text-[10px] text-slate-400">
              <span class="inline-flex items-center gap-1">
                <svg aria-hidden="true" viewBox="0 0 24 24" class="h-3 w-3 fill-current"><path d="m12 2.7 2.72 5.51 6.08.89-4.4 4.28 1.04 6.05L12 16.56l-5.44 2.87 1.04-6.05-4.4-4.28 6.08-.89L12 2.7Z" /></svg>
                ${escapeHtml(event.stars || "—")}
              </span>
              <span class="text-slate-300">·</span>
              <time datetime="${escapeHtml(event.starred)}">${escapeHtml(dateFormatter.format(new Date(`${event.starred}T00:00:00`)))}</time>
            </div>
          </div>
        </div>
      </div>
    </li>
  `;
}

function updateFilterStyles() {
  elements.filters.forEach((button) => {
    const isActive = button.dataset.filter === state.category;
    button.setAttribute("aria-pressed", String(isActive));
    button.classList.toggle("bg-brand-700", isActive);
    button.classList.toggle("text-white", isActive);
    button.classList.toggle("shadow-sm", isActive);
    button.classList.toggle("text-slate-500", !isActive);
    button.classList.toggle("hover:bg-brand-50", !isActive);
    button.classList.toggle("hover:text-brand-700", !isActive);
  });

  elements.topicFilters.forEach((button) => {
    const isActive = button.dataset.topic === state.topic;
    button.setAttribute("aria-pressed", String(isActive));
    button.classList.toggle("border-brand-300", isActive);
    button.classList.toggle("bg-brand-100", isActive);
    button.classList.toggle("text-brand-800", isActive);
    button.classList.toggle("border-slate-200", !isActive);
    button.classList.toggle("bg-slate-50", !isActive);
  });
}

function clearFilters() {
  state.category = "全部";
  state.query = "";
  state.topic = "";
  state.language = "";
  elements.search.value = "";
  elements.languageFilter.value = "";
  render();
  elements.search.focus();
}

function render() {
  const events = getVisibleEvents();
  updateFilterStyles();

  if (!events.length) {
    elements.list.setAttribute("aria-busy", "false");
    elements.list.innerHTML = `
      <li class="rounded-2xl border border-dashed border-brand-200 bg-white/70 px-6 py-14 text-center">
        <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-500">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current stroke-2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" stroke-linecap="round" />
          </svg>
        </span>
        <h3 class="mt-4 text-sm font-semibold text-slate-800">没有找到匹配的仓库</h3>
        <p class="mt-1.5 text-xs text-slate-500">换个关键词，或清除当前筛选条件试试。</p>
        <button type="button" id="clear-filters" class="mt-5 rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-800">清除筛选</button>
      </li>
    `;
    elements.status.textContent = "当前筛选下暂无仓库";
    document.querySelector("#clear-filters").addEventListener("click", clearFilters);
    return;
  }

  elements.list.setAttribute("aria-busy", "false");
  elements.list.innerHTML = events.map(renderCard).join("");

  const filterSummary = [
    state.category !== "全部" ? `类别「${state.category}」` : "",
    state.language ? `语言「${state.language}」` : "",
    state.topic ? `主题「${state.topic}」` : "",
    state.query.trim() ? `搜索「${state.query.trim()}」` : "",
  ].filter(Boolean);
  const suffix = filterSummary.length ? ` · ${filterSummary.join("，")}` : "";
  elements.status.textContent = `共 ${events.length} 个星标仓库${suffix}`;
}

function focusSearch() {
  document.querySelector("#starred").scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => elements.search.focus(), 250);
}

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

elements.languageFilter.addEventListener("change", (event) => {
  state.language = event.target.value;
  render();
});

elements.filters.forEach((button) => {
  button.addEventListener("click", () => {
    state.category = button.dataset.filter;
    render();
  });
});

elements.topicFilters.forEach((button) => {
  button.addEventListener("click", () => {
    state.topic = state.topic === button.dataset.topic ? "" : button.dataset.topic;
    render();
    document.querySelector("#starred").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

elements.searchButton.addEventListener("click", focusSearch);

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    focusSearch();
  }
});

elements.mobileMenuButton.addEventListener("click", () => {
  const willOpen = elements.mobileMenu.classList.contains("hidden");
  elements.mobileMenu.classList.toggle("hidden", !willOpen);
  elements.mobileMenuButton.setAttribute("aria-expanded", String(willOpen));
  elements.mobileMenuButton.setAttribute("aria-label", willOpen ? "关闭导航菜单" : "打开导航菜单");
});

elements.mobileMenu.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    elements.mobileMenu.classList.add("hidden");
    elements.mobileMenuButton.setAttribute("aria-expanded", "false");
    elements.mobileMenuButton.setAttribute("aria-label", "打开导航菜单");
  }
});

async function loadEvents() {
  try {
    const response = await fetch("events.json");
    if (!response.ok) {
      throw new Error(`无法加载数据（HTTP ${response.status}）`);
    }

    const events = await response.json();
    if (!Array.isArray(events)) {
      throw new Error("数据格式无效");
    }

    const uniqueEvents = new Map();
    events.forEach((event) => {
      if (event?.name) {
        uniqueEvents.set(event.name.toLocaleLowerCase("zh-CN"), event);
      }
    });

    state.events = [...uniqueEvents.values()];
    populateLanguageFilter();
    render();
  } catch (error) {
    elements.list.setAttribute("aria-busy", "false");
    elements.list.innerHTML = `
      <li class="rounded-2xl border border-rose-100 bg-rose-50/70 px-6 py-12 text-center">
        <h3 class="text-sm font-semibold text-rose-800">星标日志暂时无法载入</h3>
        <p class="mt-2 text-xs leading-5 text-rose-600">${escapeHtml(error.message)}</p>
        <button type="button" id="retry-load" class="mt-5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">重新载入</button>
      </li>
    `;
    elements.status.textContent = "数据载入失败";
    document.querySelector("#retry-load").addEventListener("click", loadEvents);
  }
}

loadEvents();
