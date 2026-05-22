const categories = [
  { id: "food", label: "餐饮", color: "#df6b57", icon: "餐", keywords: ["restaurant", "cafe", "coffee", "meal", "dining", "starbucks", "tabetomo", "麦当劳", "餐", "咖啡", "饭", "奶茶"] },
  { id: "grocery", label: "购物/日用品", color: "#d29b2f", icon: "购", keywords: ["whole foods", "trader joe", "market", "grocery", "walmart", "target", "costco", "supermarket", "超市", "便利", "食品", "采购"] },
  { id: "transport", label: "交通", color: "#3977ad", icon: "行", keywords: ["mta", "transit", "uber", "lyft", "taxi", "metro", "gas", "parking", "subway", "公交", "地铁", "打车", "加油", "停车"] },
  { id: "housing", label: "居住", color: "#7f5a83", icon: "住", keywords: ["rent", "utility", "electric", "water", "internet", "房租", "水电", "物业", "网络"] },
  { id: "health", label: "健康", color: "#2f8b74", icon: "健", keywords: ["pharmacy", "doctor", "clinic", "cvs", "walgreens", "药", "医院", "诊所", "保险"] },
  { id: "fun", label: "娱乐", color: "#b05684", icon: "乐", keywords: ["movie", "cinema", "game", "spotify", "netflix", "ticket", "电影", "游戏", "演出", "娱乐"] },
  { id: "study", label: "学习/办公", color: "#5d7f4f", icon: "学", keywords: ["book", "course", "office", "software", "文具", "课程", "书", "办公", "订阅"] },
  { id: "other", label: "其他", color: "#75817b", icon: "其", keywords: [] }
];

const legacyStorageKey = "moneytracking.expenses.v1";
const profileRegistryKey = "moneytracking.profiles.v1";
const storagePrefix = "moneytracking.expenses.profile.";
let storageKey = "";
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFmt = new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" });

const state = {
  expenses: [],
  activeMonth: monthKey(new Date()),
  mode: "manual",
  pendingImports: [],
  selectedCategoryId: "",
  authMode: "login",
  profileHash: ""
};

const els = {
  authScreen: document.querySelector("#authScreen"),
  appShell: document.querySelector("#appShell"),
  authForm: document.querySelector("#authForm"),
  authPassword: document.querySelector("#authPassword"),
  authSubmit: document.querySelector("#authSubmit"),
  authMessage: document.querySelector("#authMessage"),
  lockApp: document.querySelector("#lockApp"),
  currentMonth: document.querySelector("#currentMonth"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  totalSpent: document.querySelector("#totalSpent"),
  dailyAverage: document.querySelector("#dailyAverage"),
  monthHint: document.querySelector("#monthHint"),
  dailyHint: document.querySelector("#dailyHint"),
  topCategory: document.querySelector("#topCategory"),
  topCategoryHint: document.querySelector("#topCategoryHint"),
  entryCount: document.querySelector("#entryCount"),
  entryDrawer: document.querySelector("#entryDrawer"),
  openEntry: document.querySelector("#openEntry"),
  closeEntry: document.querySelector("#closeEntry"),
  categoryDetail: document.querySelector("#categoryDetail"),
  categoryDetailTitle: document.querySelector("#categoryDetailTitle"),
  categoryDetailSummary: document.querySelector("#categoryDetailSummary"),
  categoryDetailChart: document.querySelector("#categoryDetailChart"),
  categoryDetailTooltip: document.querySelector("#categoryDetailTooltip"),
  categoryDetailStats: document.querySelector("#categoryDetailStats"),
  categoryDetailRecords: document.querySelector("#categoryDetailRecords"),
  closeCategoryDetail: document.querySelector("#closeCategoryDetail"),
  category: document.querySelector("#category"),
  expenseForm: document.querySelector("#expenseForm"),
  amount: document.querySelector("#amount"),
  date: document.querySelector("#date"),
  merchant: document.querySelector("#merchant"),
  note: document.querySelector("#note"),
  submitExpense: document.querySelector("#submitExpense"),
  receiptTools: document.querySelector("#receiptTools"),
  receiptInput: document.querySelector("#receiptInput"),
  receiptPreview: document.querySelector("#receiptPreview"),
  ocrText: document.querySelector("#ocrText"),
  receiptItemsPreview: document.querySelector("#receiptItemsPreview"),
  receiptItemsTitle: document.querySelector("#receiptItemsTitle"),
  receiptItemsList: document.querySelector("#receiptItemsList"),
  ocrStatus: document.querySelector("#ocrStatus"),
  parseOcr: document.querySelector("#parseOcr"),
  importPreview: document.querySelector("#importPreview"),
  importPreviewTitle: document.querySelector("#importPreviewTitle"),
  importList: document.querySelector("#importList"),
  importAll: document.querySelector("#importAll"),
  donutChart: document.querySelector("#donutChart"),
  donutTotal: document.querySelector("#donutTotal"),
  donutTooltip: document.querySelector("#donutTooltip"),
  categoryLegend: document.querySelector("#categoryLegend"),
  categorySummary: document.querySelector("#categorySummary"),
  trendChart: document.querySelector("#trendChart"),
  trendInsight: document.querySelector("#trendInsight"),
  insightList: document.querySelector("#insightList"),
  recordsList: document.querySelector("#recordsList"),
  recordSummary: document.querySelector("#recordSummary"),
  seedDemo: document.querySelector("#seedDemo"),
  clearAll: document.querySelector("#clearAll")
};

const chartState = {
  donutGroups: [],
  donutTotal: 0,
  donutSegments: [],
  activeDonutIndex: -1,
  detailBars: [],
  yearBars: []
};

function init() {
  els.date.value = new Date().toISOString().slice(0, 10);
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.label;
    els.category.append(option);
  });

  document.querySelectorAll("[data-entry-mode]").forEach((button) => {
    button.addEventListener("click", () => switchMode(button.dataset.entryMode));
  });
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => switchAuthMode(button.dataset.authMode));
  });
  els.authForm.addEventListener("submit", handleAuthSubmit);
  els.lockApp.addEventListener("click", lockApp);
  els.prevMonth.addEventListener("click", () => shiftMonth(-1));
  els.nextMonth.addEventListener("click", () => shiftMonth(1));
  els.currentMonth.addEventListener("click", () => {
    state.activeMonth = monthKey(new Date());
    render();
  });
  els.openEntry.addEventListener("click", () => setEntryDrawer(true));
  els.closeEntry.addEventListener("click", () => setEntryDrawer(false));
  els.closeCategoryDetail.addEventListener("click", () => {
    state.selectedCategoryId = "";
    renderCategoryDetail(getMonthExpenses());
  });
  els.date.addEventListener("change", () => {
    if (els.date.value) {
      state.activeMonth = monthKey(els.date.value);
      render();
    }
  });
  els.expenseForm.addEventListener("submit", addExpense);
  els.receiptInput.addEventListener("change", handleReceipt);
  els.parseOcr.addEventListener("click", () => applyReceiptText(els.ocrText.value));
  els.importAll.addEventListener("click", importPendingTransactions);
  els.donutChart.addEventListener("mousemove", handleDonutHover);
  els.donutChart.addEventListener("click", handleDonutClick);
  els.donutChart.addEventListener("mouseleave", clearDonutHover);
  els.categoryDetailChart.addEventListener("mousemove", handleCategoryDetailHover);
  els.categoryDetailChart.addEventListener("mouseleave", hideCategoryDetailTooltip);
  els.trendChart.addEventListener("click", handleYearChartClick);
  els.seedDemo.addEventListener("click", seedDemoData);
  els.clearAll.addEventListener("click", clearAllData);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  switchAuthMode(getProfiles().length ? "login" : "create");
}

function switchAuthMode(mode) {
  state.authMode = mode;
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });
  els.authSubmit.textContent = mode === "create" ? "创建并进入" : "进入账本";
  els.authPassword.autocomplete = mode === "create" ? "new-password" : "current-password";
  els.authMessage.textContent = mode === "create"
    ? "请设置一串独特密码。以后输入同一密码即可进入这个账本。"
    : "输入已设置的账本密码。不同密码会进入不同账本。";
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const password = els.authPassword.value.trim();
  if (password.length < 4) {
    els.authMessage.textContent = "密码至少需要 4 个字符。";
    return;
  }

  const hash = await hashPassword(password);
  const profiles = getProfiles();
  const exists = profiles.includes(hash);
  if (state.authMode === "login" && !exists) {
    els.authMessage.textContent = "没有找到这个账本。请切换到“新建账本”先设置密码。";
    return;
  }
  if (state.authMode === "create" && exists) {
    els.authMessage.textContent = "这个密码对应的账本已存在，请直接进入账本。";
    return;
  }

  if (state.authMode === "create") {
    profiles.push(hash);
    localStorage.setItem(profileRegistryKey, JSON.stringify(profiles));
  }

  unlockProfile(hash);
}

function unlockProfile(hash) {
  state.profileHash = hash;
  storageKey = `${storagePrefix}${hash}`;
  state.expenses = loadExpenses();
  migrateLegacyExpensesIfNeeded();
  state.activeMonth = monthKey(new Date());
  state.selectedCategoryId = "";
  state.pendingImports = [];
  els.authPassword.value = "";
  els.authScreen.hidden = true;
  els.appShell.hidden = false;
  render();
}

function lockApp() {
  state.profileHash = "";
  storageKey = "";
  state.expenses = [];
  state.selectedCategoryId = "";
  state.pendingImports = [];
  setEntryDrawer(false);
  els.appShell.hidden = true;
  els.authScreen.hidden = false;
  switchAuthMode(getProfiles().length ? "login" : "create");
  window.setTimeout(() => els.authPassword.focus(), 0);
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(`MoneyTracking:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getProfiles() {
  try {
    return JSON.parse(localStorage.getItem(profileRegistryKey) || "[]");
  } catch {
    return [];
  }
}

function migrateLegacyExpensesIfNeeded() {
  if (state.expenses.length || localStorage.getItem(storageKey)) return;
  const legacy = localStorage.getItem(legacyStorageKey);
  if (!legacy) return;
  try {
    const parsed = JSON.parse(legacy);
    if (Array.isArray(parsed) && parsed.length) {
      state.expenses = parsed;
      saveExpenses();
    }
  } catch {
    // Ignore malformed legacy data.
  }
}

function setEntryDrawer(open) {
  els.entryDrawer.hidden = !open;
  els.openEntry.textContent = open ? "正在记录" : "添加开销";
  if (open) {
    window.setTimeout(() => els.amount.focus(), 0);
  }
}

function loadExpenses() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(storageKey, JSON.stringify(state.expenses));
}

function monthKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(delta) {
  const [year, month] = state.activeMonth.split("-").map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  state.activeMonth = monthKey(next);
  render();
}

function switchMode(mode) {
  state.mode = mode;
  document.querySelectorAll("[data-entry-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.entryMode === mode);
  });
  els.receiptTools.hidden = mode !== "receipt";
}

function addExpense(event) {
  event.preventDefault();
  const amount = Number(els.amount.value);
  if (!Number.isFinite(amount) || amount <= 0) return;

  state.expenses.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    amount,
    date: els.date.value,
    category: els.category.value,
    merchant: els.merchant.value.trim() || "未命名支出",
    note: els.note.value.trim(),
    source: state.mode,
    createdAt: new Date().toISOString()
  });
  state.activeMonth = monthKey(els.date.value);
  saveExpenses();
  els.expenseForm.reset();
  els.date.value = new Date().toISOString().slice(0, 10);
  els.category.value = "food";
  els.receiptPreview.hidden = true;
  els.ocrStatus.textContent = "支持 JPG、PNG、HEIC，并可拆分信用卡流水";
  renderReceiptItems([]);
  clearPendingImports();
  els.submitExpense.textContent = "已添加";
  window.setTimeout(() => {
    els.submitExpense.textContent = "添加记录";
  }, 1200);
  setEntryDrawer(false);
  render();
}

async function handleReceipt(event) {
  const file = event.target.files[0];
  if (!file) return;
  const heicInput = isHeicFile(file);

  try {
    els.ocrStatus.textContent = heicInput ? "正在转换 iPhone HEIC 照片..." : "正在准备图片...";
    const imageFile = await prepareImageForOcr(file);
    els.ocrStatus.textContent = "正在优化小票照片...";
    const ocrFile = await createOcrReadyImage(imageFile);
    const objectUrl = URL.createObjectURL(ocrFile);
    els.receiptPreview.src = objectUrl;
    els.receiptPreview.hidden = false;
    els.ocrStatus.textContent = "正在识别图片文字...";
    const text = await recognizeReceipt(ocrFile, objectUrl);
    els.ocrText.value = text.trim();
    applyReceiptText(text);
    els.ocrStatus.textContent = text.trim() ? "已解析图片文字" : "未识别到文字，可手动输入";
  } catch (error) {
    els.ocrStatus.innerHTML = heicInput
      ? "HEIC 转换或识别失败。iPhone 转 JPEG：打开照片 > 分享 > 存储到“文件”，再从“文件”App 长按图片 > 快速操作 > 转换图像 > 选 JPEG，然后重新上传。"
      : "识别失败，可手动输入或粘贴小票文字";
    console.warn(error);
  }
}

async function prepareImageForOcr(file) {
  if (!isHeicFile(file)) return file;
  await ensureHeicConverter();
  const converted = await heic2any({
    blob: file,
    quality: 0.92,
    toType: "image/jpeg"
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
}

function isHeicFile(file) {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

async function createOcrReadyImage(file) {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const rotateLandscape = bitmap.width > bitmap.height * 1.15;
  const targetWidth = rotateLandscape ? bitmap.height : bitmap.width;
  const targetHeight = rotateLandscape ? bitmap.width : bitmap.height;
  const canvas = document.createElement("canvas");
  const maxSide = 2200;
  const scale = Math.min(1, maxSide / Math.max(targetWidth, targetHeight));
  canvas.width = Math.round(targetWidth * scale);
  canvas.height = Math.round(targetHeight * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(scale, scale);
  if (rotateLandscape) {
    ctx.translate(targetWidth, 0);
    ctx.rotate(Math.PI / 2);
  }
  ctx.drawImage(bitmap, 0, 0);
  ctx.restore();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const boosted = Math.max(0, Math.min(255, (gray - 118) * 1.35 + 146));
    data[i] = boosted;
    data[i + 1] = boosted;
    data[i + 2] = boosted;
  }
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.94));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "-ocr.jpg"), { type: "image/jpeg" });
}

async function recognizeReceipt(file, imageUrl) {
  if ("TextDetector" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new TextDetector();
      const lines = await detector.detect(bitmap);
      const text = lines.map((item) => item.rawValue).join("\n");
      if (text.trim()) return text;
    } catch {
      // Continue to the Tesseract fallback.
    }
  }

  await ensureTesseract();
  const result = await Tesseract.recognize(imageUrl, "eng+chi_sim", {
    logger: (message) => {
      if (message.status === "recognizing text") {
        els.ocrStatus.textContent = `正在识别小票文字 ${Math.round(message.progress * 100)}%`;
      }
    }
  });
  return result.data.text || "";
}

function ensureTesseract() {
  if (window.Tesseract) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

function ensureHeicConverter() {
  if (window.heic2any) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

function applyReceiptText(text) {
  const transactions = parseCardTransactions(text);
  if (transactions.length > 1 || (transactions.length === 1 && isCardLikeText(text))) {
    renderReceiptItems([]);
    state.pendingImports = transactions;
    renderPendingImports();
    const firstMonth = monthKey(transactions[0].date);
    state.activeMonth = firstMonth;
    els.ocrStatus.textContent = `识别到 ${transactions.length} 笔信用卡交易，可批量导入`;
    render();
    return;
  }

  clearPendingImports();
  const amount = extractAmount(text);
  if (amount) {
    els.amount.value = amount.toFixed(2);
  } else {
    els.amount.value = "";
    if (isCardLikeText(text)) {
      els.ocrStatus.textContent = "未拆出有效交易，请检查截图是否包含商户、金额和日期";
      return;
    }
  }

  const suggestedCategory = suggestCategory(text);
  els.category.value = suggestedCategory.id;

  const merchant = extractMerchant(text);
  if (merchant && !els.merchant.value) els.merchant.value = merchant;

  const receiptItems = parseReceiptItems(text);
  renderReceiptItems(receiptItems);
  if (receiptItems.length) {
    const itemNote = receiptItems
      .slice(0, 12)
      .map((item) => `${item.name} ${currency.format(item.amount)}`)
      .join("; ");
    els.note.value = `商品明细：${itemNote}${receiptItems.length > 12 ? " ..." : ""}`;
  } else if (!els.note.value && text.trim()) {
    els.note.value = "小票识别导入";
  }
}

function parseReceiptItems(text) {
  const lines = normalizeOcrLines(text)
    .map((line) => line.replace(/[|*]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const items = [];

  lines.forEach((line) => {
    const cleaned = cleanReceiptItemLine(line);
    if (!cleaned || isReceiptSummaryLine(cleaned)) return;

    const match = cleaned.match(/^(.{2,}?)\s+([0-9]{1,4}[,.][0-9]{2})\s*[A-Z]?$/i);
    if (!match) return;

    const name = normalizeItemName(match[1]);
    const amount = Number(match[2].replace(",", "."));
    if (!name || !Number.isFinite(amount) || amount <= 0 || amount > 10000) return;
    if (/^\d+$/.test(name) || name.length < 2) return;
    items.push({ name, amount });
  });

  return items.slice(0, 30);
}

function cleanReceiptItemLine(line) {
  return line
    .replace(/^\s*[:;\-]+\s*/, "")
    .replace(/\b[A-Z]?\d{4,}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isReceiptSummaryLine(line) {
  return /subtotal|total|tax|change|cash|visa|master|approved|purchase|member|barcode|receipt|invoice|balance|amount|tender|payment|sold|merchant|reward|coupon|saving|item|qty/i.test(line);
}

function normalizeItemName(value) {
  return value
    .replace(/^[^\dA-Za-z\u4e00-\u9fff]+/, "")
    .replace(/\s+[A-Z]$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

function renderReceiptItems(items) {
  if (!items.length) {
    els.receiptItemsPreview.hidden = true;
    els.receiptItemsList.innerHTML = "";
    return;
  }

  const total = sum(items.map((item) => item.amount));
  els.receiptItemsPreview.hidden = false;
  els.receiptItemsTitle.textContent = `识别到 ${items.length} 个商品，合计 ${currency.format(total)}`;
  els.receiptItemsList.innerHTML = items.map((item) => `
    <div class="receipt-item-row">
      <span>${escapeHtml(item.name)}</span>
      <strong>${currency.format(item.amount)}</strong>
    </div>
  `).join("");
}

function parseCardTransactions(text) {
  const currentYear = new Date().getFullYear();
  const lines = normalizeOcrLines(text);
  const datePattern = /\b(0?[1-9]|1[0-2])[\/.-](0?[1-9]|[12]\d|3[01])(?:[\/.-](20\d{2}|\d{2}))?\b/;
  const transactions = [];

  lines.forEach((line, index) => {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) return;

    const previousDate = findPreviousDateIndex(lines, index, datePattern);
    const start = Math.max(previousDate + 1, index - 5, 0);
    const end = Math.min(lines.length, index + 3);
    const windowLines = lines.slice(start, end);
    const beforeDate = lines.slice(start, index + 1);
    const amount = extractTransactionAmount(beforeDate, line);
    const merchant = extractTransactionMerchant(windowLines, index - start);
    const date = normalizeTransactionDate(dateMatch, currentYear);

    if (!amount || !merchant || !date) return;
    transactions.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}`,
      amount,
      date,
      merchant,
      category: suggestCategory(merchant).id,
      note: "信用卡截图导入",
      source: "card"
    });
  });

  return transactions;
}

function normalizeOcrLines(text) {
  return text
    .replace(/[>›]+/g, " ")
    .replace(/\b(0?[1-9]|1[0-2])[\/.-](0?[1-9]|[12]\d|3[01])(?:[\/.-](20\d{2}|\d{2}))?\b/g, "\n$&\n")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function isCardLikeText(text) {
  const lower = text.toLowerCase();
  const dateCount = (text.match(/\b(0?[1-9]|1[0-2])[\/.-](0?[1-9]|[12]\d|3[01])(?:[\/.-](20\d{2}|\d{2}))?\b/g) || []).length;
  const moneyCount = (text.match(/[$＄]\s*[0-9]{1,5}(?:[,.][0-9]{2})/g) || []).length;
  return dateCount >= 1 && moneyCount >= 1 && /pending|posted|transactions?|transit|payment|card|信用卡|账单/.test(lower);
}

function findPreviousDateIndex(lines, index, datePattern) {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (datePattern.test(lines[i])) return i;
  }
  return -1;
}

function extractTransactionAmount(lines, dateLine) {
  const amountPattern = /(?:[$＄]\s*)?([0-9]{1,5}(?:[,.][0-9]{2}))(?!\d)/g;
  const candidates = [];
  lines.forEach((line, index) => {
    if (/pending|posted|transactions?|信用卡|账单|合计|total/i.test(line) && index < lines.length - 2) return;
    Array.from(line.matchAll(amountPattern)).forEach((match) => {
      const value = Number(match[1].replace(",", "."));
      if (Number.isFinite(value) && value > 0 && value < 100000) {
        candidates.push({ value, index, hasCurrency: /[$＄]/.test(match[0]) });
      }
    });
  });

  const dateAmounts = Array.from(dateLine.matchAll(amountPattern))
    .map((match) => Number(match[1].replace(",", ".")))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 100000);
  if (dateAmounts.length) return dateAmounts.at(-1);

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.index - a.index || Number(b.hasCurrency) - Number(a.hasCurrency));
  return candidates[0].value;
}

function extractTransactionMerchant(lines, dateOffset) {
  const candidates = lines
    .slice(0, dateOffset)
    .map(cleanMerchantLine)
    .filter((line) => line && !isNonMerchantLine(line));

  if (!candidates.length) return "";
  const uppercase = candidates.find((line) => /[A-Z]{3}/.test(line) && line === line.toUpperCase());
  return (uppercase || candidates[0]).slice(0, 48);
}

function cleanMerchantLine(line) {
  return line
    .replace(/(?:[$＄]\s*)?[0-9]{1,5}(?:[,.][0-9]{2})(?!\d)/g, "")
    .replace(/\b(0?[1-9]|1[0-2])[\/.-](0?[1-9]|[12]\d|3[01])(?:[\/.-](20\d{2}|\d{2}))?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNonMerchantLine(line) {
  if (line.length < 2) return true;
  if (/^pending\b|^posted\b|transactions?|信用卡|账单|合计|total/i.test(line)) return true;
  if (!/[A-Za-z\u4e00-\u9fff]/.test(line)) return true;
  return false;
}

function normalizeTransactionDate(match, fallbackYear) {
  const month = Number(match[1]);
  const day = Number(match[2]);
  const rawYear = match[3] ? Number(match[3]) : fallbackYear;
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function renderPendingImports() {
  if (!state.pendingImports.length) {
    els.importPreview.hidden = true;
    els.importList.innerHTML = "";
    return;
  }

  const total = sum(state.pendingImports.map((item) => item.amount));
  els.importPreview.hidden = false;
  els.importPreviewTitle.textContent = `识别到 ${state.pendingImports.length} 笔，共 ${currency.format(total)}`;
  els.importList.innerHTML = state.pendingImports.map((item) => {
    const cat = categories.find((category) => category.id === item.category) || categories.at(-1);
    return `
      <article class="import-item" data-id="${item.id}">
        <div>
          <strong>${escapeHtml(item.merchant)}</strong>
          <span>${formatInputDate(item.date)} · ${cat.label}</span>
        </div>
        <div class="import-side">
          <strong>${currency.format(item.amount)}</strong>
          <button type="button" data-remove-import="${item.id}" aria-label="移除这笔交易">×</button>
        </div>
      </article>
    `;
  }).join("");

  els.importList.querySelectorAll("[data-remove-import]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pendingImports = state.pendingImports.filter((item) => item.id !== button.dataset.removeImport);
      renderPendingImports();
    });
  });
}

function importPendingTransactions() {
  if (!state.pendingImports.length) return;
  const createdAt = new Date().toISOString();
  const imported = state.pendingImports.map((item) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${item.id}`,
    amount: item.amount,
    date: item.date,
    category: item.category,
    merchant: item.merchant,
    note: item.note,
    source: item.source,
    createdAt
  }));
  state.expenses = [...imported, ...state.expenses];
  state.activeMonth = monthKey(imported[0].date);
  saveExpenses();
  clearPendingImports();
  els.ocrStatus.textContent = `已导入 ${imported.length} 笔信用卡交易`;
  setEntryDrawer(false);
  render();
}

function clearPendingImports() {
  state.pendingImports = [];
  renderPendingImports();
}

function formatInputDate(value) {
  return dateFmt.format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function extractAmount(text) {
  const lower = text
    .toLowerCase()
    .replace(/\b(0?[1-9]|1[0-2])[\/.-](0?[1-9]|[12]\d|3[01])(?:[\/.-](20\d{2}|\d{2}))?\b/g, " ");
  const lines = lower.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const priority = lines.filter((line) => /total|amount|balance|合计|总计|应付|实付|金额/.test(line));
  const amountPattern = /(?:[$＄¥]\s*|usd|rmb)?\s*([0-9]{1,5}[,.][0-9]{2})(?!\d)/gi;
  const candidates = [...priority, ...lines]
    .flatMap((line) => Array.from(line.matchAll(amountPattern)))
    .map((match) => Number(match[1].replace(",", ".")))
    .filter((num) => Number.isFinite(num) && num > 0 && num < 100000);

  if (!candidates.length) return null;
  return Math.max(...candidates);
}

function suggestCategory(text) {
  const lower = text.toLowerCase();
  const firstLine = lower.split(/\n+/).find(Boolean) || "";
  const scored = categories.map((cat) => {
    const score = cat.keywords.reduce((total, keyword) => {
      const needle = keyword.toLowerCase();
      if (!lower.includes(needle)) return total;
      return total + (firstLine.includes(needle) ? 4 : 1);
    }, 0);
    return { cat, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0].score > 0 ? scored[0].cat : categories.at(-1);
}

function extractMerchant(text) {
  const line = text.split(/\n+/).map((item) => item.trim()).find((item) => item.length > 2 && !/[0-9]{4,}/.test(item));
  return line ? line.slice(0, 40) : "";
}

function getMonthExpenses() {
  return state.expenses
    .filter((expense) => monthKey(expense.date) === state.activeMonth)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

function render() {
  const expenses = getMonthExpenses();
  const total = sum(expenses.map((expense) => expense.amount));
  const byCategory = groupByCategory(expenses);
  const top = [...byCategory].sort((a, b) => b.total - a.total)[0];

  els.currentMonth.textContent = formatMonth(state.activeMonth);
  els.totalSpent.textContent = currency.format(total);
  els.entryCount.textContent = String(expenses.length);
  els.monthHint.textContent = expenses.length ? `${expenses.length} 笔支出已记录` : "暂无记录";
  els.dailyAverage.textContent = currency.format(total / daysElapsedInMonth(state.activeMonth));
  els.topCategory.textContent = top ? top.category.label : "-";
  els.topCategoryHint.textContent = top ? `${Math.round((top.total / total) * 100)}% 的当月支出` : "等待分类数据";
  els.donutTotal.textContent = currency.format(total);
  els.categorySummary.textContent = top ? `${top.category.label} 占比最高，支出 ${currency.format(top.total)}；小项已增强显示` : "暂无数据";
  els.recordSummary.textContent = expenses.length ? `${formatMonth(state.activeMonth)} 共 ${expenses.length} 笔` : "所有记录保存在本机浏览器。";

  renderDonut(byCategory, total);
  renderYearSummary();
  renderCategoryDetail(expenses);
  renderInsights(expenses, byCategory, total);
  renderRecords(expenses);
}

function formatMonth(key) {
  const [year, month] = key.split("-").map(Number);
  return `${year}年${month}月`;
}

function daysElapsedInMonth(key) {
  const [year, month] = key.split("-").map(Number);
  const now = new Date();
  if (monthKey(now) === key) return Math.max(1, now.getDate());
  return new Date(year, month, 0).getDate();
}

function groupByCategory(expenses) {
  return categories
    .map((category) => ({
      category,
      total: sum(expenses.filter((expense) => expense.category === category.id).map((expense) => expense.amount))
    }))
    .filter((item) => item.total > 0);
}

function sum(nums) {
  return nums.reduce((total, num) => total + Number(num || 0), 0);
}

function renderDonut(groups, total, activeIndex = chartState.activeDonutIndex) {
  chartState.donutGroups = groups;
  chartState.donutTotal = total;
  chartState.donutSegments = [];
  const ctx = els.donutChart.getContext("2d");
  const size = els.donutChart.width;
  ctx.clearRect(0, 0, size, size);
  ctx.lineCap = "round";
  ctx.globalAlpha = 1;

  if (!total) {
    chartState.activeDonutIndex = -1;
    els.donutTooltip.hidden = true;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 116, 0, Math.PI * 2);
    ctx.lineWidth = 46;
    ctx.strokeStyle = "#dce4df";
    ctx.stroke();
    els.categoryLegend.innerHTML = `<div class="empty-state">添加记录后展示分类占比</div>`;
    return;
  }

  let start = -Math.PI / 2;
  const displayGroups = getReadableDonutGroups(groups, total);
  displayGroups.forEach((displayGroup, index) => {
    const group = displayGroup.group;
    const arc = displayGroup.displayRatio * Math.PI * 2;
    const end = start + arc;
    chartState.donutSegments.push({ start, end, group });
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, index === activeIndex ? 121 : 116, start, end);
    ctx.lineWidth = index === activeIndex ? 56 : 42;
    ctx.strokeStyle = group.category.color;
    ctx.globalAlpha = activeIndex === -1 || index === activeIndex ? 1 : 0.32;
    ctx.stroke();
    start = end;
  });
  ctx.globalAlpha = 1;

  els.categoryLegend.innerHTML = groups.map((group, index) => `
    <div class="legend-row ${index === activeIndex || group.category.id === state.selectedCategoryId ? "active" : ""}" data-donut-index="${index}">
      <span class="legend-name"><i class="swatch" style="background:${group.category.color}"></i>${group.category.label}</span>
      <strong>${currency.format(group.total)}</strong>
    </div>
  `).join("");

  els.categoryLegend.querySelectorAll("[data-donut-index]").forEach((row) => {
    row.addEventListener("mouseenter", () => setActiveDonutSegment(Number(row.dataset.donutIndex)));
    row.addEventListener("mouseleave", clearDonutHover);
    row.addEventListener("click", () => selectDonutSegment(Number(row.dataset.donutIndex)));
  });
}

function getReadableDonutGroups(groups, total) {
  if (groups.length <= 1) {
    return groups.map((group) => ({ group, displayRatio: 1 }));
  }

  const minRatio = Math.min(0.1, 0.45 / groups.length);
  const raw = groups.map((group) => ({ group, trueRatio: group.total / total }));
  const small = raw.filter((item) => item.trueRatio < minRatio);
  const large = raw.filter((item) => item.trueRatio >= minRatio);
  const smallTotal = small.length * minRatio;
  const largeRawTotal = sum(large.map((item) => item.trueRatio));
  const remaining = Math.max(0.35, 1 - smallTotal);

  return raw.map((item) => {
    if (item.trueRatio < minRatio) {
      return { group: item.group, displayRatio: minRatio };
    }
    return {
      group: item.group,
      displayRatio: largeRawTotal ? (item.trueRatio / largeRawTotal) * remaining : remaining / Math.max(1, large.length)
    };
  });
}

function handleDonutHover(event) {
  if (!chartState.donutTotal) return;
  const rect = els.donutChart.getBoundingClientRect();
  const scale = els.donutChart.width / rect.width;
  const x = (event.clientX - rect.left) * scale;
  const y = (event.clientY - rect.top) * scale;
  const cx = els.donutChart.width / 2;
  const cy = els.donutChart.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 82 || distance > 150) {
    clearDonutHover();
    return;
  }

  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI / 2) angle += Math.PI * 2;
  const index = chartState.donutSegments.findIndex((segment) => angle >= segment.start && angle <= segment.end);
  if (index >= 0) {
    setActiveDonutSegment(index, event.clientX - rect.left, event.clientY - rect.top);
  }
}

function handleDonutClick(event) {
  if (!chartState.donutTotal) return;
  const rect = els.donutChart.getBoundingClientRect();
  const scale = els.donutChart.width / rect.width;
  const x = (event.clientX - rect.left) * scale;
  const y = (event.clientY - rect.top) * scale;
  const cx = els.donutChart.width / 2;
  const cy = els.donutChart.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 82 || distance > 150) return;

  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI / 2) angle += Math.PI * 2;
  const index = chartState.donutSegments.findIndex((segment) => angle >= segment.start && angle <= segment.end);
  if (index >= 0) selectDonutSegment(index);
}

function selectDonutSegment(index) {
  const group = chartState.donutGroups[index];
  if (!group) return;
  state.selectedCategoryId = group.category.id;
  render();
  els.categoryDetail.hidden = false;
  els.categoryDetail.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActiveDonutSegment(index, x, y) {
  if (chartState.activeDonutIndex !== index) {
    chartState.activeDonutIndex = index;
    renderDonut(chartState.donutGroups, chartState.donutTotal, index);
  }
  const group = chartState.donutGroups[index];
  if (!group) return;
  const percent = Math.round((group.total / chartState.donutTotal) * 100);
  els.donutTooltip.hidden = false;
  els.donutTooltip.innerHTML = `<strong>${group.category.label}</strong><span>${currency.format(group.total)} · ${percent}%</span>`;
  if (Number.isFinite(x) && Number.isFinite(y)) {
    els.donutTooltip.style.left = `${Math.min(Math.max(x + 12, 8), 230)}px`;
    els.donutTooltip.style.top = `${Math.min(Math.max(y + 12, 8), 230)}px`;
  } else {
    els.donutTooltip.style.left = "50%";
    els.donutTooltip.style.top = "18px";
  }
}

function clearDonutHover() {
  if (chartState.activeDonutIndex !== -1) {
    chartState.activeDonutIndex = -1;
    renderDonut(chartState.donutGroups, chartState.donutTotal, -1);
  }
  els.donutTooltip.hidden = true;
}

function renderCategoryDetail(expenses) {
  if (!state.selectedCategoryId) {
    els.categoryDetail.hidden = true;
    els.categoryDetailRecords.innerHTML = "";
    return;
  }

  const cat = categories.find((item) => item.id === state.selectedCategoryId);
  const records = expenses
    .filter((expense) => expense.category === state.selectedCategoryId)
    .sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date));
  if (!cat || !records.length) {
    state.selectedCategoryId = "";
    els.categoryDetail.hidden = true;
    return;
  }

  const total = sum(records.map((record) => record.amount));
  const avg = total / records.length;
  const largest = records[0];
  els.categoryDetail.hidden = false;
  els.categoryDetailTitle.textContent = `${cat.label}明细`;
  els.categoryDetailSummary.textContent = `${formatMonth(state.activeMonth)} 共 ${records.length} 笔，合计 ${currency.format(total)}`;
  els.categoryDetailStats.innerHTML = `
    <div><span>合计</span><strong>${currency.format(total)}</strong></div>
    <div><span>平均单笔</span><strong>${currency.format(avg)}</strong></div>
    <div><span>最大单笔</span><strong>${escapeHtml(largest.merchant)} · ${currency.format(largest.amount)}</strong></div>
  `;
  renderCategoryDetailChart(records, cat);
  renderCategoryDetailRecords(records, cat);
}

function renderCategoryDetailChart(records, cat) {
  chartState.detailBars = [];
  hideCategoryDetailTooltip();
  const ctx = els.categoryDetailChart.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = els.categoryDetailChart.clientWidth;
  const cssHeight = 240;
  els.categoryDetailChart.width = cssWidth * ratio;
  els.categoryDetailChart.height = cssHeight * ratio;
  ctx.clearRect(0, 0, els.categoryDetailChart.width, els.categoryDetailChart.height);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const chartRecords = records.slice(0, 10).reverse();
  const max = Math.max(1, ...chartRecords.map((record) => record.amount));
  const left = 34;
  const top = 18;
  const chartW = cssWidth - 58;
  const chartH = 150;
  const gap = 8;
  const barW = Math.max(12, (chartW - gap * Math.max(0, chartRecords.length - 1)) / Math.max(1, chartRecords.length));

  ctx.strokeStyle = "#dce4df";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const y = top + (chartH / 2) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + chartW, y);
    ctx.stroke();
  }

  chartRecords.forEach((record, index) => {
    const x = left + index * (barW + gap);
    const barH = Math.max(4, (record.amount / max) * chartH);
    const y = top + chartH - barH;
    ctx.fillStyle = categoryRecordColor(cat.color, index, chartRecords.length);
    roundRect(ctx, x, y, barW, barH, 5);
    ctx.fill();
    chartState.detailBars.push({ x, y, width: barW, height: barH, record });
    ctx.fillStyle = "#6b746f";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(dateFmt.format(new Date(`${record.date}T00:00:00`)), x + barW / 2, 196);
  });

  ctx.fillStyle = "#1f2926";
  ctx.font = "12px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`最近 ${chartRecords.length} 笔金额分布`, left, 224);
}

function handleCategoryDetailHover(event) {
  if (!chartState.detailBars.length) return;
  const rect = els.categoryDetailChart.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const bar = chartState.detailBars.find((item) => (
    x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height
  ));

  if (!bar) {
    hideCategoryDetailTooltip();
    return;
  }

  els.categoryDetailTooltip.hidden = false;
  els.categoryDetailTooltip.innerHTML = `
    <strong>${escapeHtml(bar.record.merchant)}</strong>
    <span>${dateFmt.format(new Date(`${bar.record.date}T00:00:00`))} · ${currency.format(bar.record.amount)}</span>
  `;
  els.categoryDetailTooltip.style.left = `${Math.min(Math.max(x + 12, 90), rect.width - 90)}px`;
  els.categoryDetailTooltip.style.top = `${Math.min(Math.max(y + 12, 12), 178)}px`;
}

function hideCategoryDetailTooltip() {
  els.categoryDetailTooltip.hidden = true;
}

function categoryRecordColor(hex, index, count) {
  const { h, s, l } = hexToHsl(hex);
  const spread = count <= 1 ? 0 : (index / (count - 1)) - 0.5;
  const lightness = Math.max(34, Math.min(72, l + spread * 26));
  const saturation = Math.max(42, Math.min(78, s - 4 + Math.abs(spread) * 10));
  return `hsl(${h} ${saturation}% ${lightness}%)`;
}

function hexToHsl(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function renderCategoryDetailRecords(records, cat) {
  els.categoryDetailRecords.innerHTML = records.map((record) => `
    <article class="record-item detail-record">
      <div class="record-icon" style="background:${cat.color}">${cat.icon}</div>
      <div class="record-main">
        <strong>${escapeHtml(record.merchant)}</strong>
        <span>${dateFmt.format(new Date(`${record.date}T00:00:00`))}${record.note ? ` · ${escapeHtml(record.note)}` : ""}</span>
      </div>
      <div class="record-side"><strong>${currency.format(record.amount)}</strong></div>
    </article>
  `).join("");
}

function renderYearSummary() {
  chartState.yearBars = [];
  const ctx = els.trendChart.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = els.trendChart.clientWidth;
  const cssHeight = 220;
  els.trendChart.width = cssWidth * ratio;
  els.trendChart.height = cssHeight * ratio;
  ctx.clearRect(0, 0, els.trendChart.width, els.trendChart.height);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const year = Number(state.activeMonth.slice(0, 4));
  const monthly = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, total: 0 }));
  state.expenses.forEach((expense) => {
    const date = new Date(`${expense.date}T00:00:00`);
    if (date.getFullYear() === year) {
      monthly[date.getMonth()].total += expense.amount;
    }
  });
  const max = Math.max(1, ...monthly.map((item) => item.total));
  const chartW = cssWidth - 56;
  const chartH = 142;
  const left = 32;
  const top = 22;
  const gap = 7;
  const barW = Math.max(10, (chartW - gap * 11) / 12);

  ctx.strokeStyle = "#dce4df";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const y = top + (chartH / 2) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + chartW, y);
    ctx.stroke();
  }

  monthly.forEach((item, index) => {
    const x = left + index * (barW + gap);
    const barH = (item.total / max) * chartH;
    const y = top + chartH - barH;
    const key = monthKey(new Date(year, index, 1));
    ctx.fillStyle = key === state.activeMonth ? "#df6b57" : "#0f6b63";
    roundRect(ctx, x, y, barW, Math.max(3, barH), 5);
    ctx.fill();
    chartState.yearBars.push({
      x,
      y: top,
      width: barW,
      height: chartH,
      monthKey: key,
      total: item.total
    });
    ctx.fillStyle = "#6b746f";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`${index + 1}月`, x + barW / 2, 190);
  });

  const yearTotal = sum(monthly.map((item) => item.total));
  const bestMonth = monthly.reduce((best, item) => item.total > best.total ? item : best, { month: 1, total: 0 });
  els.trendInsight.textContent = yearTotal
    ? `${year} 年累计 ${currency.format(yearTotal)}，${bestMonth.month}月最高，为 ${currency.format(bestMonth.total)}。`
    : "记录开销后会生成年度概览。";
}

function handleYearChartClick(event) {
  if (!chartState.yearBars.length) return;
  const rect = els.trendChart.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const hit = chartState.yearBars.find((bar) => (
    x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height + 34
  ));
  if (!hit) return;

  state.activeMonth = hit.monthKey;
  state.selectedCategoryId = "";
  clearDonutHover();
  hideCategoryDetailTooltip();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function renderInsights(expenses, groups, total) {
  if (!expenses.length) {
    els.insightList.innerHTML = `<div class="empty-state">暂无洞察</div>`;
    return;
  }

  const avg = total / daysElapsedInMonth(state.activeMonth);
  const top = [...groups].sort((a, b) => b.total - a.total)[0];
  const imageImportCount = expenses.filter((expense) => expense.source === "receipt" || expense.source === "card").length;
  const largest = [...expenses].sort((a, b) => b.amount - a.amount)[0];
  const insights = [
    { title: "预算节奏", body: `当前日均 ${currency.format(avg)}。按这个节奏，本月预计约 ${currency.format(avg * new Date(Number(state.activeMonth.slice(0, 4)), Number(state.activeMonth.slice(5)), 0).getDate())}。` },
    { title: "类别集中度", body: top ? `${top.category.label} 是最大开销，已占 ${Math.round((top.total / total) * 100)}%。` : "类别分布还不明显。" },
    { title: "最大单笔", body: `${largest.merchant} 花费 ${currency.format(largest.amount)}，日期 ${dateFmt.format(new Date(`${largest.date}T00:00:00`))}。` },
    { title: "录入方式", body: imageImportCount ? `${imageImportCount} 笔来自图片识别，占 ${Math.round((imageImportCount / expenses.length) * 100)}%。` : "目前全部为手动录入。" }
  ];

  els.insightList.innerHTML = insights.map((item) => `
    <div class="insight">
      <div><b>${item.title}</b><span>${item.body}</span></div>
    </div>
  `).join("");
}

function renderRecords(expenses) {
  if (!expenses.length) {
    els.recordsList.innerHTML = `<div class="empty-state">还没有记录。可以先添加一笔，或载入示例数据看看分析效果。</div>`;
    return;
  }

  els.recordsList.innerHTML = "";
  const template = document.querySelector("#recordTemplate");
  expenses.forEach((expense) => {
    const cat = categories.find((item) => item.id === expense.category) || categories.at(-1);
    const node = template.content.cloneNode(true);
    const item = node.querySelector(".record-item");
    const icon = node.querySelector(".record-icon");
    const title = node.querySelector(".record-main strong");
    const meta = node.querySelector(".record-main span");
    const amount = node.querySelector(".record-side strong");
    const button = node.querySelector(".record-side button");

    icon.textContent = cat.icon;
    icon.style.background = cat.color;
    title.textContent = expense.merchant;
    meta.textContent = `${dateFmt.format(new Date(`${expense.date}T00:00:00`))} · ${cat.label}${expense.note ? ` · ${expense.note}` : ""}`;
    amount.textContent = currency.format(expense.amount);
    button.addEventListener("click", () => deleteExpense(expense.id));
    item.dataset.id = expense.id;
    els.recordsList.append(node);
  });
}

function deleteExpense(id) {
  state.expenses = state.expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  render();
}

function seedDemoData() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const demo = [
    ["Trader Joe's", 68.42, "grocery", 1],
    ["Blue Bottle Coffee", 6.75, "food", 2],
    ["Metro Card", 28.00, "transport", 3],
    ["CVS Pharmacy", 19.36, "health", 5],
    ["Netflix", 15.49, "fun", 7],
    ["午餐", 18.90, "food", 9],
    ["Office Depot", 42.15, "study", 11],
    ["Electric Bill", 86.20, "housing", 13],
    ["Costco", 124.37, "grocery", 15]
  ].map(([merchant, amount, category, day]) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${day}`,
    merchant,
    amount,
    category,
    date: new Date(start.getFullYear(), start.getMonth(), Math.min(day, today.getDate())).toISOString().slice(0, 10),
    note: "示例数据",
    source: day % 2 ? "manual" : "receipt",
    createdAt: new Date().toISOString()
  }));

  state.expenses = [...demo, ...state.expenses];
  saveExpenses();
  state.activeMonth = monthKey(today);
  render();
}

function clearAllData() {
  if (!state.expenses.length) return;
  if (!confirm("确定清空所有本机记录吗？")) return;
  state.expenses = [];
  saveExpenses();
  render();
}

window.addEventListener("resize", render);
init();
