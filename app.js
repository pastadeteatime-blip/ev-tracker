const GOAL_YEN = 1_000_000;
const YEN_PER_BALL = 4;
const DEFAULT_COST_PER_1K_BALLS = 250;

const TAN_PAYOUT_DISP = 400;
const TAN_PAYOUT_NET  = 360;


const MACHINES = window.MACHINES;

const LS_PREFIX = "evTracker_machineTotals_v1_";
const LS_STORE_MACHINE_TOTALS_PREFIX = "evTracker_storeMachineTotals_v1_";
const LS_SELECTED_MACHINE = "evTracker_selectedMachineId_v1";
const LS_SELECTED_EXCHANGE = "evTracker_selectedExchange_v1";
const LS_FAVORITE_MACHINES = "evTracker_favoriteMachineIds_v1";
const LS_RECENT_MACHINES = "evTracker_recentPlayedMachineIds_v1";
const LS_SELECTED_STORE = "evTracker_selectedStore_v1";
const LS_STORE_NAMES = "evTracker_storeNames_v1";
const LS_OWNED_BALANCES = "evTracker_ownedBalances_v1";
const LS_STORE_EXCHANGES = "evTracker_storeExchanges_v1";
const LS_TOTAL_VIEW_MODE = "evTracker_totalViewMode_v1";
const LS_DAILY_LOG_DATE = "evTracker_dailyLogDate_v1";
const LS_DAILY_HAND_BALLS = "evTracker_dailyHandBalls_v1";
const LS_DAILY_CASH_ON_HAND = "evTracker_dailyCashOnHand_v1";
const LS_ACTIVE_SESSION = "evTracker_activeSession_v1";
const LS_SESSION_SNAPSHOTS = "evTracker_sessionSnapshots_v1";
const BACKUP_APP_ID = "ev-tracker";
const BACKUP_SCHEMA_VERSION = 1;
const SESSION_SNAPSHOT_LIMIT = 8;




const LS_SESSION_PREFIX = "evTracker_session_v1_";
function getSessionKey(machineId) {
  return `${LS_SESSION_PREFIX}${machineId}`;
}


let selectedMachine = MACHINES[0];
let currentGoalIndex = 0;
let selectedExchange = 28;
let selectedStore = "";
let playSource = "cash";
let totalViewMode = localStorage.getItem(LS_TOTAL_VIEW_MODE) === "all" ? "all" : "selected";
let isAddingStore = false;
let appDialogMode = null;
let pendingRestartOutcomeType = null;


let investYen = 0;
let confirmedInvestYen = 0;
let ownedUseBalls = 0;
let confirmedOwnedBalls = 0;
let outputUseBalls = 0;
let confirmedOutputBalls = 0;
let lastConfirmedOwnedBalls = 0;
let playStartHandBalls = null;


let totals = {
  totalExpectBalls: 0,
  totalExpectYen: 0,
  totalSpin: 0,
  totalInvestYen: 0,
  totalOwnedBallsUsed: 0,
  totalOutputBallsUsed: 0,
  totalKInvested: 0,
  totalConsumedK: 0,
  totalTrueBorderWeighted: 0,
  totalTrueBorderCount: 0,
  totalOwnedRatioWeighted: 0,
  totalOwnedRatioCount: 0,
  totalHitCount: 0,
  totalTanCount: 0,
  totalRushCount: 0,
  totalLtCount: 0,
  totalRushPayoutDispSum: 0,
  totalRushPayoutDispCount: 0,
  totalLtPayoutDispSum: 0,
  totalLtPayoutDispCount: 0,
};




let spinLog = [];
let pendingIndex = -1;
let nextStartCounter = 0;
let payoutConfirmIndex = -1;
let fixedPayoutEditIndex = -1;
let endBallsYame = null;
let endBallsPending = false;
let pendingHitHandData = null;
let hasStarted = false;
let investFromStop = false;
let investmentsSincePlayBoundary = 0;
let calculatedLogCount = 0;
let midCheckTempCounter = null;
let isSwitchingMachine = false;
let lastConfirmedInvestYen = 0;
let lastConfirmedOutputBalls = 0;
let lastMidCheckBalls = null;
let lastHandBalanceInput = null;
let rushEndAdjustIndex = -1;
let toastTimer = null;
let appDialogCloseHandler = null;
let machinePickerScrollTop = 0;
let totalViewReturnY = null;
let saveSessionTimer = null;
let investSourceRevealFrame = null;
let investSourceRevealCleanup = null;
let investSourceRevealTimer = null;
let lastFinalResult = null;

function $(id) {
  return document.getElementById(id);
}

function getInputValue(id) {
  return $(id)?.value ?? "";
}

function getSessionDraftInputs() {
  return {
    counterNow: getInputValue("counterNow"),
    payoutNow: getInputValue("payoutNow"),
    fixedPayoutNow: getInputValue("fixedPayoutNow"),
    hitHandNow: getInputValue("hitHandNow"),
    endBallsNow: getInputValue("endBallsNow"),
    midBallsNow: getInputValue("midBallsNow"),
    investYen: getInputValue("investYen"),
    ownedUseBalls: getInputValue("ownedUseBalls"),
    outputUseBalls: getInputValue("outputUseBalls"),
  };
}

function restoreInputValue(id, value) {
  const el = $(id);
  if (el && typeof value === "string") {
    el.value = value;
    updateClearButtonForInput(el);
  }
}

function updateClearButtonForInput(input) {
  if (!input?.id) return;
  const btn = document.querySelector(`[data-clear-target="${input.id}"]`);
  if (!btn) return;
  btn.classList.toggle("is-hidden", input.value === "");
}

function initClearableInputs() {
  document.querySelectorAll("[data-clear-target]").forEach((btn) => {
    const input = $(btn.dataset.clearTarget);
    if (!input) return;

    updateClearButtonForInput(input);
    input.addEventListener("input", () => updateClearButtonForInput(input));
    input.addEventListener("change", () => updateClearButtonForInput(input));

    btn.addEventListener("click", () => {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.focus();
    });
  });
}

function initNumberInputWheelGuard() {
  document.addEventListener("wheel", (event) => {
    const input = event.target?.closest?.("input[type='number']");
    if (!input) return;
    event.preventDefault();
  }, { passive: false });
}

function prepareClearableNumberInput(id, selectValue = true, initialValue = 0) {
  const input = $(id);
  if (!input) return;

  input.value = String(Math.max(0, Math.floor(Number(initialValue) || 0)));
  updateClearButtonForInput(input);

  if (!selectValue) return;
  requestAnimationFrame(() => {
    input.focus();
    input.select?.();
  });
}

function prepareEndBallsInput(selectValue = true, initialValue = 0) {
  prepareClearableNumberInput("endBallsNow", selectValue, initialValue);
}

function prepareMidBallsInput(selectValue = true) {
  prepareClearableNumberInput("midBallsNow", selectValue);
}

function normalizeHandBalanceInput(data) {
  if (!data || typeof data !== "object") return null;
  const counter = Math.floor(Number(data.counter));
  const balls = Math.floor(Number(data.balls));
  if (!Number.isFinite(counter) || !Number.isFinite(balls) || balls < 0) return null;
  return { counter, balls };
}

function getCurrentCounterForHandBalanceMemory() {
  const raw = $("counterNow")?.value?.trim();
  if (raw !== "") {
    const counter = Math.floor(Number(raw));
    if (Number.isFinite(counter)) return counter;
  }
  return Math.floor(Number(nextStartCounter) || 0);
}

function rememberHandBalanceInput(balls, counter) {
  const normalized = normalizeHandBalanceInput({ balls, counter });
  lastHandBalanceInput = normalized;
}

function getHandBalancePrefillForCounter(counter) {
  const normalized = normalizeHandBalanceInput(lastHandBalanceInput);
  if (!normalized || normalized.counter !== Math.floor(Number(counter))) return null;
  return normalized.balls;
}

function renderAppVersion() {
  const version = window.APP_VERSION || "";
  const versionEl = document.querySelector(".app-version");
  if (!versionEl || !version) return;

  const appScript = document.querySelector('script[src*="app.js"]');
  const cacheVersion = appScript
    ? new URL(appScript.getAttribute("src"), window.location.href).searchParams.get("v")
    : "";
  const baseVersion = version.split(".").slice(0, 2).join(".");
  const displayVersion = cacheVersion && /^\d+$/.test(cacheVersion)
    ? `${baseVersion}.${cacheVersion}`
    : version;

  versionEl.textContent = `Version ${displayVersion}`;
}


function fmtInt(n) {
  return Math.round(n).toLocaleString("ja-JP");
}
function fmtRate2(n) {
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function showToast(message) {
  const toast = $("appToast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("is-hidden");
  toast.classList.add("is-visible");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
    toast.classList.add("is-hidden");
    toastTimer = null;
  }, 1800);
}

function hideAppDialog() {
  $("appDialogOverlay")?.classList.add("is-hidden");
  $("appDialogOverlay")?.setAttribute("aria-hidden", "true");
  $("appDialog")?.classList.add("is-hidden");
  $("appDialogForm")?.classList.add("is-hidden");
  $("appDialogOk")?.classList.remove("is-hidden");
  pendingRestartOutcomeType = null;
  appDialogMode = null;

  if (appDialogCloseHandler) {
    document.removeEventListener("keydown", appDialogCloseHandler);
    appDialogCloseHandler = null;
  }
}

function showAppDialog(title, message, okText = "OK") {
  const overlay = $("appDialogOverlay");
  const dialog = $("appDialog");
  const titleEl = $("appDialogTitle");
  const messageEl = $("appDialogMessage");
  const okBtn = $("appDialogOk");
  const form = $("appDialogForm");

  if (!overlay || !dialog || !titleEl || !messageEl || !okBtn) {
    alert(message);
    return;
  }

  titleEl.textContent = title;
  messageEl.textContent = message;
  okBtn.textContent = okText;
  form?.classList.add("is-hidden");
  okBtn.classList.remove("is-hidden");
  appDialogMode = "message";

  overlay.classList.remove("is-hidden");
  overlay.setAttribute("aria-hidden", "false");
  dialog.classList.remove("is-hidden");

  if (appDialogCloseHandler) {
    document.removeEventListener("keydown", appDialogCloseHandler);
  }
  appDialogCloseHandler = (event) => {
    if (event.key === "Escape" || event.key === "Enter") hideAppDialog();
  };
  document.addEventListener("keydown", appDialogCloseHandler);

  okBtn.focus();
}

function showOwnedBalanceInputDialog() {
  if (!selectedStore) {
    return;
  }

  const overlay = $("appDialogOverlay");
  const dialog = $("appDialog");
  const titleEl = $("appDialogTitle");
  const messageEl = $("appDialogMessage");
  const form = $("appDialogForm");
  const label = $("appDialogInputLabel");
  const input = $("appDialogInput");
  const okBtn = $("appDialogOk");
  const saveBtn = $("appDialogSave");

  if (!overlay || !dialog || !titleEl || !messageEl || !form || !input || !okBtn) return;

  appDialogMode = "ownedBalance";
  titleEl.textContent = "貯玉を更新";
  messageEl.textContent = `${selectedStore}の現在の貯玉を入力してください`;
  if (label) label.textContent = "貯玉";
  input.type = "number";
  input.inputMode = "numeric";
  input.min = "0";
  input.step = "1";
  input.value = String(getOwnedBalance());
  updateClearButtonForInput(input);
  if (saveBtn) saveBtn.textContent = "更新";
  form.classList.remove("is-hidden");
  okBtn.classList.add("is-hidden");

  overlay.classList.remove("is-hidden");
  overlay.setAttribute("aria-hidden", "false");
  dialog.classList.remove("is-hidden");

  if (appDialogCloseHandler) {
    document.removeEventListener("keydown", appDialogCloseHandler);
  }
  appDialogCloseHandler = (event) => {
    if (event.key === "Escape") hideAppDialog();
  };
  document.addEventListener("keydown", appDialogCloseHandler);

  input.focus();
  input.select();
}

function showDailyCashInputDialog() {
  const overlay = $("appDialogOverlay");
  const dialog = $("appDialog");
  const titleEl = $("appDialogTitle");
  const messageEl = $("appDialogMessage");
  const form = $("appDialogForm");
  const label = $("appDialogInputLabel");
  const input = $("appDialogInput");
  const okBtn = $("appDialogOk");
  const saveBtn = $("appDialogSave");

  if (!overlay || !dialog || !titleEl || !messageEl || !form || !input || !okBtn) return;

  appDialogMode = "dailyCash";
  titleEl.textContent = "入店時所持金を入力";
  messageEl.textContent = "入店時に持っていた現金を入力してください";
  if (label) label.textContent = "入店時所持金";
  input.type = "number";
  input.inputMode = "numeric";
  input.min = "0";
  input.step = "1000";
  input.value = String(getDailyCashOnHand());
  updateClearButtonForInput(input);
  if (saveBtn) saveBtn.textContent = "更新";
  form.classList.remove("is-hidden");
  okBtn.classList.add("is-hidden");

  overlay.classList.remove("is-hidden");
  overlay.setAttribute("aria-hidden", "false");
  dialog.classList.remove("is-hidden");

  if (appDialogCloseHandler) {
    document.removeEventListener("keydown", appDialogCloseHandler);
  }
  appDialogCloseHandler = (event) => {
    if (event.key === "Escape") hideAppDialog();
  };
  document.addEventListener("keydown", appDialogCloseHandler);

  input.focus();
  input.select();
}

function showStoreAddDialog() {
  const overlay = $("appDialogOverlay");
  const dialog = $("appDialog");
  const titleEl = $("appDialogTitle");
  const messageEl = $("appDialogMessage");
  const form = $("appDialogForm");
  const label = $("appDialogInputLabel");
  const input = $("appDialogInput");
  const okBtn = $("appDialogOk");
  const saveBtn = $("appDialogSave");

  if (!overlay || !dialog || !titleEl || !messageEl || !form || !input || !okBtn) return;

  appDialogMode = "storeAdd";
  titleEl.textContent = "店舗を新規登録";
  messageEl.textContent = "追加する店舗名を入力してください";
  if (label) label.textContent = "店舗名";
  input.type = "text";
  input.inputMode = "text";
  input.removeAttribute("min");
  input.removeAttribute("step");
  input.value = "";
  updateClearButtonForInput(input);
  if (saveBtn) saveBtn.textContent = "決定";
  form.classList.remove("is-hidden");
  okBtn.classList.add("is-hidden");

  overlay.classList.remove("is-hidden");
  overlay.setAttribute("aria-hidden", "false");
  dialog.classList.remove("is-hidden");

  if (appDialogCloseHandler) {
    document.removeEventListener("keydown", appDialogCloseHandler);
  }
  appDialogCloseHandler = (event) => {
    if (event.key === "Escape") hideAppDialog();
  };
  document.addEventListener("keydown", appDialogCloseHandler);

  input.focus();
}

function showRestartCounterInputDialog(type) {
  const overlay = $("appDialogOverlay");
  const dialog = $("appDialog");
  const titleEl = $("appDialogTitle");
  const messageEl = $("appDialogMessage");
  const form = $("appDialogForm");
  const label = $("appDialogInputLabel");
  const input = $("appDialogInput");
  const okBtn = $("appDialogOk");
  const saveBtn = $("appDialogSave");

  if (!overlay || !dialog || !titleEl || !messageEl || !form || !input || !okBtn) {
    alert("再開回転数を入力できませんでした");
    return;
  }

  const labelText = getHitOptionLabel(type).replace(/\s+/g, "");
  const mapValue = selectedMachine?.restart?.[type];
  const defaultValue = Number.isFinite(Number(mapValue)) ? Number(mapValue) : 0;

  appDialogMode = "restartCounter";
  pendingRestartOutcomeType = type;
  titleEl.textContent = "再開回転数を入力";
  messageEl.textContent = `${labelText}後の再開回転数を入力してください`;
  if (label) label.textContent = "再開回転数";
  input.type = "number";
  input.inputMode = "numeric";
  input.min = "0";
  input.step = "1";
  input.value = String(defaultValue);
  updateClearButtonForInput(input);
  if (saveBtn) saveBtn.textContent = "決定";
  form.classList.remove("is-hidden");
  okBtn.classList.add("is-hidden");

  overlay.classList.remove("is-hidden");
  overlay.setAttribute("aria-hidden", "false");
  dialog.classList.remove("is-hidden");

  if (appDialogCloseHandler) {
    document.removeEventListener("keydown", appDialogCloseHandler);
  }
  appDialogCloseHandler = (event) => {
    if (event.key === "Escape") hideAppDialog();
  };
  document.addEventListener("keydown", appDialogCloseHandler);

  input.focus();
  input.select();
}

function confirmAppDialogForm() {
  if (appDialogMode === "storeAdd") {
    saveNewStore();
    return;
  }

  if (appDialogMode === "dailyCash") {
    confirmDailyCashDialog();
    return;
  }

  if (appDialogMode === "restartCounter") {
    confirmRestartCounterDialog();
    return;
  }

  confirmOwnedBalanceDialog();
}

function confirmOwnedBalanceDialog() {
  if (!selectedStore) {
    hideAppDialog();
    alert("先に店舗を選択してください");
    return;
  }

  const input = $("appDialogInput");
  const value = Number(input?.value);
  if (!Number.isFinite(value) || value < 0) {
    const messageEl = $("appDialogMessage");
    if (messageEl) messageEl.textContent = "貯玉を0以上の数値で入力してください";
    input?.focus();
    return;
  }

  setOwnedBalance(value);
  saveSession();
  renderOwnedBalance();
  showAppDialog("貯玉を更新しました", `${fmtInt(value)}玉に更新しました`);
}

function confirmDailyCashDialog() {
  const input = $("appDialogInput");
  const value = Number(input?.value);
  if (!Number.isFinite(value) || value < 0) {
    const messageEl = $("appDialogMessage");
    if (messageEl) messageEl.textContent = "入店時所持金を0以上の数値で入力してください";
    input?.focus();
    return;
  }

  setDailyCashOnHand(value);
  saveSession();
  renderOwnedBalance();
  showAppDialog("入店時所持金を更新しました", `${fmtInt(value)}円に更新しました`);
}

function confirmRestartCounterDialog() {
  const type = pendingRestartOutcomeType;
  const input = $("appDialogInput");
  const value = Number(input?.value);

  if (!type) {
    hideAppDialog();
    return;
  }

  if (!Number.isFinite(value) || value < 0) {
    const messageEl = $("appDialogMessage");
    if (messageEl) messageEl.textContent = "再開回転数を0以上の数値で入力してください";
    input?.focus();
    return;
  }

  const nextStart = Math.floor(value);
  hideAppDialog();
  completeHitOutcome(type, nextStart);
}
function fmtRate1(n) {
  if (!Number.isFinite(n)) return "0.0";
  return (Math.floor(n * 10) / 10).toFixed(1);
}


function setSignedColor(el, val) {
  if (!el) return;
  if (val > 0) el.style.color = "#2563eb";
  else if (val < 0) el.style.color = "#dc2626";
  else el.style.color = "";
}


function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function clearFinalResult() {
  lastFinalResult = null;
  clearFinalResultView();
}

function clearFinalResultView() {
  const finalEl = $("finalResult");
  if (finalEl) finalEl.innerText = "";

  $("finalRateMeter")?.classList.add("is-hidden");
  const finalNeedle = $("finalMeterNeedle");
  if (finalNeedle) finalNeedle.style.left = "50%";
}

function normalizeFinalResult(data) {
  if (!data || typeof data !== "object") return null;

  const result = {
    ownedRatio: Number(data.ownedRatio),
    trueBorder: data.trueBorder === null ? null : Number(data.trueBorder),
    rotationRate: Number(data.rotationRate),
    diffBorder: data.diffBorder === null ? null : Number(data.diffBorder),
    todayYen: Number(data.todayYen),
  };

  if (!Number.isFinite(result.ownedRatio) ||
      !Number.isFinite(result.rotationRate) ||
      !Number.isFinite(result.todayYen)) {
    return null;
  }

  result.ownedRatio = Math.max(0, Math.min(1, result.ownedRatio));
  if (!Number.isFinite(result.trueBorder)) result.trueBorder = null;
  if (!Number.isFinite(result.diffBorder)) result.diffBorder = null;

  return result;
}

function renderFinalResultView(data = lastFinalResult) {
  const result = normalizeFinalResult(data);
  if (!result) {
    clearFinalResultView();
    return;
  }

  const finalEl = $("finalResult");
  const rateDiff = Number.isFinite(result.diffBorder) ? result.rotationRate - result.diffBorder : null;
  const rateDiffText = rateDiff === null
    ? ""
    : ` (${rateDiff >= 0 ? "+" : ""}${fmtRate1(rateDiff)})`;
  const rateDiffClass =
    rateDiff === null || rateDiff === 0
      ? ""
      : rateDiff > 0
        ? "is-plus"
        : "is-minus";

  if (finalEl) {
    finalEl.innerHTML = "";

    const ownedRatioLine = document.createElement("div");
    ownedRatioLine.textContent = `持ち玉比率：${Math.round(result.ownedRatio * 100)}%`;
    finalEl.appendChild(ownedRatioLine);

    if (result.trueBorder !== null) {
      const trueBorderLine = document.createElement("div");
      trueBorderLine.textContent = `真ボーダー：${fmtRate1(result.trueBorder)} 回/k`;
      finalEl.appendChild(trueBorderLine);
    }

    const rateLine = document.createElement("div");
    rateLine.appendChild(document.createTextNode(`今回の回転率：${fmtRate1(result.rotationRate)} 回/k`));
    if (rateDiffText) {
      const diffSpan = document.createElement("span");
      diffSpan.className = `rate-diff ${rateDiffClass}`;
      diffSpan.textContent = rateDiffText;
      rateLine.appendChild(diffSpan);
    }
    finalEl.appendChild(rateLine);

    const evLine = document.createElement("div");
    evLine.textContent = `今回の期待値：${result.todayYen >= 0 ? "+" : ""}${fmtInt(result.todayYen)}円`;
    finalEl.appendChild(evLine);
  }

  updateFinalRateMeter(result.rotationRate, result.diffBorder);
}

function getFinalCalcInvestInputs(rows = getUncalculatedRows()) {
  const playInputs = getPlayInputsFromRows(rows);
  return {
    investK: Number(playInputs.investK) || (confirmedInvestYen / 1000),
    ownedBalls: Number(playInputs.ownedBalls) || confirmedOwnedBalls,
    outputBalls: Number(playInputs.outputBalls) || confirmedOutputBalls,
  };
}

function formatFinalCalcFormula({ spinCount, investK, ownedBalls, outputBalls }) {
  const terms = [];
  if (Number.isFinite(investK) && investK !== 0) terms.push(`現金${fmtRate1(investK)}k`);
  if (Number.isFinite(ownedBalls) && ownedBalls !== 0) terms.push(`貯玉${fmtInt(ownedBalls)}玉`);
  if (Number.isFinite(outputBalls) && outputBalls !== 0) terms.push(`持ち玉${fmtInt(outputBalls)}玉`);
  if (!terms.length) return "";
  return `${fmtInt(spinCount)} / ( ${terms.join(" + ")} )`;
}

function renderFinalCalcPreview() {
  const preview = $("finalCalcPreview");
  if (!preview) return;

  const calcRows = getUncalculatedRows();
  const spinCount = getTotalSpinsFromRows(calcRows);
  const hasConfirmedStop = hasConfirmedStopInRows(calcRows);
  const hasBlockingPending = payoutConfirmIndex !== -1 || endBallsPending;
  const formula = formatFinalCalcFormula({
    spinCount,
    ...getFinalCalcInvestInputs(calcRows),
  });

  if (spinCount <= 0 || !hasConfirmedStop || hasBlockingPending || !formula) {
    preview.classList.add("is-hidden");
    preview.innerHTML = "";
    return;
  }

  preview.innerHTML = `
    <div class="final-calc-preview__label">計算前の確認</div>
    <div class="final-calc-preview__formula">${formula}</div>
  `;
  preview.classList.remove("is-hidden");
}

function getDailyHandBalls() {
  return Math.max(0, Math.floor(Number(localStorage.getItem(LS_DAILY_HAND_BALLS)) || 0));
}

function setDailyHandBalls(value) {
  const balls = Math.max(0, Math.floor(Number(value) || 0));
  localStorage.setItem(LS_DAILY_HAND_BALLS, String(balls));
  renderOwnedBalance();
  return balls;
}

function getDailyCashOnHand() {
  return Math.max(0, Math.floor(Number(localStorage.getItem(LS_DAILY_CASH_ON_HAND)) || 0));
}

function setDailyCashOnHand(value) {
  const yen = Math.max(0, Math.floor(Number(value) || 0));
  localStorage.setItem(LS_DAILY_CASH_ON_HAND, String(yen));
  renderOwnedBalance();
  return yen;
}

function renderAffiliateLinks() {
  const card = $("affiliateCard");
  const list = $("affiliateLinksList");
  const links = Array.isArray(window.AFFILIATE_LINKS) ? window.AFFILIATE_LINKS : [];
  if (!card || !list || links.length === 0) return;

  const validLinks = links
    .filter((link) => {
      try {
        const url = new URL(link.url);
        return ["http:", "https:"].includes(url.protocol) && link.title;
      } catch {
        return false;
      }
    })
    .slice(0, 3);

  if (validLinks.length === 0) return;

  list.innerHTML = "";
  for (const link of validLinks) {
    const item = document.createElement("a");
    item.className = "affiliate-link";
    item.href = link.url;
    item.target = "_blank";
    item.rel = "sponsored noopener";

    const body = document.createElement("span");
    body.className = "affiliate-link__body";

    const title = document.createElement("span");
    title.className = "affiliate-link__title";
    title.textContent = link.title;
    body.appendChild(title);

    if (link.description) {
      const description = document.createElement("span");
      description.className = "affiliate-link__description";
      description.textContent = link.description;
      body.appendChild(description);
    }

    const arrow = document.createElement("span");
    arrow.className = "affiliate-link__arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "›";

    item.append(body, arrow);
    list.appendChild(item);
  }

  card.classList.remove("is-hidden");
}

function getBackupStorageKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith("evTracker_")) keys.push(key);
  }
  return keys.sort();
}

function createBackupPayload() {
  const data = {};
  for (const key of getBackupStorageKeys()) {
    data[key] = localStorage.getItem(key);
  }

  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data
  };
}

function exportBackup() {
  const payload = createBackupPayload();
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ev-tracker-backup-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function validateBackupPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.app !== BACKUP_APP_ID) return false;
  if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) return false;
  return Object.keys(payload.data).every((key) => (
    key.startsWith("evTracker_") &&
    (typeof payload.data[key] === "string" || payload.data[key] === null)
  ));
}

async function importBackupFile(file) {
  if (!file) return;

  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    alert("バックアップファイルを読み込めませんでした。JSONファイルを選んでください。");
    return;
  }

  if (!validateBackupPayload(payload)) {
    alert("期待値トラッカーのバックアップファイルではないようです。");
    return;
  }

  const ok = confirm(
    "現在の保存データをバックアップ内容で上書きします。\n" +
    "この操作の前に、必要なら現在のデータもバックアップしてください。\n\n" +
    "復元しますか？"
  );
  if (!ok) return;

  for (const key of getBackupStorageKeys()) {
    localStorage.removeItem(key);
  }
  for (const [key, value] of Object.entries(payload.data)) {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }

  alert("バックアップを復元しました。画面を再読み込みします。");
  window.location.reload();
}

function initBackupControls() {
  $("backupExportBtn")?.addEventListener("click", exportBackup);
  $("backupImportBtn")?.addEventListener("click", () => {
    $("backupImportFile")?.click();
  });
  $("backupImportFile")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    importBackupFile(file);
    e.target.value = "";
  });
}

function getExchangeYenPerBall() {
  return 100 / selectedExchange;
}


function calcExpectationYenFromBalls(expectBalls) {
  return Math.round((Number(expectBalls) || 0) * YEN_PER_BALL);
}


function normalizeStoreName(name) {
  return String(name || "").trim();
}


function isValidExchange(value) {
  return [25, 28, 30, 33].includes(Number(value));
}


function getStoreNames() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_STORE_NAMES) || "[]");
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}


function saveStoreName(name) {
  const clean = normalizeStoreName(name);
  if (!clean) return;
  const names = getStoreNames();
  if (!names.includes(clean)) {
    localStorage.setItem(LS_STORE_NAMES, JSON.stringify([...names, clean]));
  }
}


function saveStoreNames(names) {
  const unique = [];
  for (const name of names.map(normalizeStoreName).filter(Boolean)) {
    if (!unique.includes(name)) unique.push(name);
  }
  localStorage.setItem(LS_STORE_NAMES, JSON.stringify(unique));
}


function getStoreExchanges() {
  try {
    const obj = JSON.parse(localStorage.getItem(LS_STORE_EXCHANGES) || "{}");
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}


function saveStoreExchange(name, exchange = selectedExchange) {
  const clean = normalizeStoreName(name);
  const v = Number(exchange);
  if (!clean || !isValidExchange(v)) return;


  const exchanges = getStoreExchanges();
  exchanges[clean] = v;
  localStorage.setItem(LS_STORE_EXCHANGES, JSON.stringify(exchanges));
}


function deleteStore(name) {
  const clean = normalizeStoreName(name);
  if (!clean) return;
  if (!confirm(`「${clean}」を削除しますか？\n店舗の交換率と貯玉データも削除されます。`)) return;


  saveStoreNames(getStoreNames().filter((item) => item !== clean));


  const exchanges = getStoreExchanges();
  delete exchanges[clean];
  localStorage.setItem(LS_STORE_EXCHANGES, JSON.stringify(exchanges));


  const balances = getOwnedBalances();
  for (const key of Object.keys(balances)) {
    if (key === clean || key.startsWith(`${clean}__`)) delete balances[key];
  }
  saveOwnedBalances(balances);


  if (selectedStore === clean) {
    selectedStore = "";
    localStorage.removeItem(LS_SELECTED_STORE);
  }


  renderStoreControls();
  renderStorePickerList();
  saveSession();
}


function getStoreExchange(name) {
  const clean = normalizeStoreName(name);
  if (!clean) return null;


  const v = Number(getStoreExchanges()[clean]);
  return isValidExchange(v) ? v : null;
}


function setSelectedExchange(value, saveForStore = true, animate = true) {
  const v = Number(value);
  if (!isValidExchange(v)) return;


  selectedExchange = v;
  localStorage.setItem(LS_SELECTED_EXCHANGE, String(v));


  const exchangeSel = $("exchangeSelect");
  if (exchangeSel) exchangeSel.value = String(v);


  if (saveForStore && selectedStore) {
    saveStoreExchange(selectedStore, v);
  }

  clearFinalResult();
  renderMachineInfo(animate);
  renderOwnedBalance();
  renderMachinePickerList();
  updateView();
}


function getOwnedBalances() {
  try {
    const obj = JSON.parse(localStorage.getItem(LS_OWNED_BALANCES) || "{}");
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}


function saveOwnedBalances(obj) {
  localStorage.setItem(LS_OWNED_BALANCES, JSON.stringify(obj));
}


function getOwnedKey(store = selectedStore, exchange = selectedExchange) {
  const clean = normalizeStoreName(store);
  return clean ? `${clean}__${exchange}` : "";
}


function getOwnedBalance() {
  const key = getOwnedKey();
  if (!key) return 0;
  return Math.max(0, Number(getOwnedBalances()[key]) || 0);
}


function setOwnedBalance(value) {
  const key = getOwnedKey();
  if (!key) return;
  const balances = getOwnedBalances();
  balances[key] = Math.max(0, Math.floor(Number(value) || 0));
  saveOwnedBalances(balances);
  renderOwnedBalance();
}


function addOwnedBalance(delta) {
  setOwnedBalance(getOwnedBalance() + Math.floor(Number(delta) || 0));
}


function setSelectedStoreDisplay() {
  const el = $("selectedStoreName");
  if (el) el.textContent = selectedStore || "店舗を選択";


  const select = $("storeSelect");
  if (select) select.value = selectedStore || "";
}


function renderStorePickerList() {
  const list = $("storePickerList");
  if (!list) return;


  const query = ($("storeSearchInput")?.value || "").trim().toLowerCase();
  const names = getStoreNames().filter((name) => name.toLowerCase().includes(query));


  list.innerHTML = "";


  if (names.length === 0) {
    const empty = document.createElement("p");
    empty.className = "store-picker-empty";
    empty.textContent = "該当する店舗がありません";
    list.appendChild(empty);
    return;
  }


  for (const name of names) {
    const row = document.createElement("div");
    row.className = "store-picker-item";
    if (name === selectedStore) row.classList.add("is-current");


    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "store-picker-select";
    selectBtn.dataset.storeName = name;


    const title = document.createElement("strong");
    title.textContent = name;
    selectBtn.appendChild(title);


    const meta = document.createElement("span");
    const exchange = getStoreExchange(name) || selectedExchange;
    const balance = getOwnedBalances()[getOwnedKey(name, exchange)] || 0;
    meta.textContent = `${exchange}玉交換 / 貯玉 ${fmtInt(balance)}玉`;
    selectBtn.appendChild(meta);


    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "store-picker-delete";
    deleteBtn.dataset.storeDelete = name;
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", `${name}を削除`);


    row.appendChild(selectBtn);
    row.appendChild(deleteBtn);
    list.appendChild(row);
  }
}


function openStorePicker() {
  $("storePickerOverlay")?.classList.remove("is-hidden");
  $("storePickerModal")?.classList.remove("is-hidden");
  renderStorePickerList();
  setTimeout(() => $("storeSearchInput")?.focus(), 30);
}


function closeStorePicker() {
  $("storePickerOverlay")?.classList.add("is-hidden");
  $("storePickerModal")?.classList.add("is-hidden");
}


function renderStoreControls() {
  const names = getStoreNames();
  const row = document.querySelector(".store-row");
  row?.classList.toggle("is-adding-store", isAddingStore);
  row?.classList.toggle("is-store-selected", Boolean(selectedStore) && !isAddingStore);

  const pickerOpen = $("storePickerOpen");
  if (pickerOpen) {
    pickerOpen.disabled = Boolean(selectedStore) && !isAddingStore;
  }

  const select = $("storeSelect");
  if (select) {
    select.innerHTML = "";


    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = names.length ? "店を選択" : "店を追加してください";
    select.appendChild(placeholder);


    for (const name of names) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    }


    select.value = names.includes(selectedStore) ? selectedStore : "";
    select.disabled = isAddingStore;
  }


  setSelectedStoreDisplay();


  const input = $("storeName");
  if (input && !isAddingStore) input.value = "";


  const changeBtn = $("storeChangeBtn");
  if (changeBtn) {
    changeBtn.classList.toggle("is-hidden", isAddingStore);
    changeBtn.classList.toggle("is-reserved", !selectedStore && !isAddingStore);
  }
  $("storeAddBtn")?.classList.toggle("is-hidden", isAddingStore);
  $("storeSaveBtn")?.classList.toggle("is-hidden", !isAddingStore);
  $("storeCancelBtn")?.classList.toggle("is-hidden", !isAddingStore);


  const list = $("storeList");
  if (list) {
    list.innerHTML = "";
    for (const name of getStoreNames()) {
      const opt = document.createElement("option");
      opt.value = name;
      list.appendChild(opt);
    }
  }


  renderOwnedBalance();
  renderStorePickerList();
}


function renderOwnedBalance() {
  const currentBalance = getOwnedBalance();

  const dailyCash = $("dailyCashOnHand");
  if (dailyCash) {
    const cash = getDailyCashOnHand();
    dailyCash.textContent = cash <= 0
      ? "入店時所持金：----"
      : `入店時所持金：${fmtInt(cash)}円`;
  }

  const balance = $("ownedBalance");
  if (balance) {
    balance.textContent = `貯玉：${fmtInt(currentBalance)}玉`;
  }

  const currentHand = $("currentHandBalls");
  if (currentHand) {
    const handBalls = getDailyHandBalls();
    currentHand.textContent = handBalls <= 0
      ? "持ち玉：----"
      : `持ち玉：${fmtInt(handBalls)}玉`;
  }

  const investHand = $("investHandBalance");
  if (investHand) {
    const handBalls = getDailyHandBalls();
    investHand.textContent = handBalls <= 0
      ? "持ち玉：----"
      : `持ち玉：${fmtInt(handBalls)}玉`;
  }


  const saveBtn = $("ownedBalanceSaveBtn");
  if (saveBtn) {
    const hasActiveStore = Boolean(normalizeStoreName(selectedStore) && getStoreNames().includes(normalizeStoreName(selectedStore)));
    saveBtn.disabled = !hasActiveStore;
    saveBtn.classList.toggle("is-disabled", !hasActiveStore);
    saveBtn.setAttribute("aria-disabled", hasActiveStore ? "false" : "true");
  }
}

function saveOwnedBalanceInput() {
  const hasActiveStore = Boolean(normalizeStoreName(selectedStore) && getStoreNames().includes(normalizeStoreName(selectedStore)));
  if (!hasActiveStore) return;
  showOwnedBalanceInputDialog();
}

function saveDailyCashInput() {
  showDailyCashInputDialog();
}


function selectStore(name) {
  selectedStore = normalizeStoreName(name);
  if (selectedStore) {
    localStorage.setItem(LS_SELECTED_STORE, selectedStore);
    const storeExchange = getStoreExchange(selectedStore);
    if (storeExchange !== null) {
      setSelectedExchange(storeExchange, false);
    } else {
      saveStoreExchange(selectedStore, selectedExchange);
    }
  }
  isAddingStore = false;
  clearFinalResult();
  renderStoreControls();
  closeStorePicker();
  saveSession();
}


function startStoreAdd() {
  showStoreAddDialog();
}

function cancelStoreAdd() {
  isAddingStore = false;
  const input = $("storeName");
  if (input) input.value = "";
  renderStoreControls();
  saveSession();
}


function saveNewStore() {
  const input = appDialogMode === "storeAdd" ? $("appDialogInput") : $("storeName");
  const name = normalizeStoreName(input?.value);
  if (!name) {
    alert("\u8ffd\u52a0\u3059\u308b\u5e97\u540d\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044");
    input?.focus();
    return;
  }


  saveStoreName(name);
  saveStoreExchange(name, selectedExchange);
  hideAppDialog();
  selectStore(name);
}

function renderConfirmedInvest() {
  const el = $("investConfirmed");
  if (!el) return;
  const playInputs = getPlayInputsFromRows(getUncalculatedRows());
  const investYen = (Number(playInputs.investK) || 0) * 1000 || confirmedInvestYen;
  el.textContent = `現金投資：${fmtInt(investYen)} 円`;
}


function renderConfirmedOwned() {
  const el = $("ownedConfirmed");
  if (!el) return;
  const playInputs = getPlayInputsFromRows(getUncalculatedRows());
  const ownedBalls = Number(playInputs.ownedBalls) || confirmedOwnedBalls;
  el.textContent = `貯玉使用：${fmtInt(ownedBalls)}玉`;
}

function renderConfirmedOutput() {
  const el = $("outputConfirmed");
  if (!el) return;
  const playInputs = getPlayInputsFromRows(getUncalculatedRows());
  const outputBalls = Number(playInputs.outputBalls) || confirmedOutputBalls;
  el.textContent = `持ち玉使用：${fmtInt(outputBalls)}玉`;
}

function showInvestmentConfirmedDialog({ cashYen = 0, ownedBalls = 0, outputBalls = 0 }) {
  showAppDialog(
    "投資を確定しました",
    [
      "今回の投資",
      `現金投資：${fmtInt(cashYen)}円`,
      `貯玉使用：${fmtInt(ownedBalls)}玉`,
      `持ち玉使用：${fmtInt(outputBalls)}玉`,
    ].join("\n")
  );
}

function scrollToLogCard() {
  const card = $("logCard");
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}


function scrollToInvestCard(preferOutput = true) {
  const card = $("investCard");
  if (!card) return;
  if (preferOutput) {
    if (getDailyHandBalls() > 0) {
      setPlaySource("output", true);
    } else {
      setPlaySource("cash", false);
    }
  }
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}


function scrollToFinalCalcCard() {
  const card = $("finalCalcCard");
  if (!card) return;
  requestAnimationFrame(() => {
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}


function flashFinalCalcButton() {
  const btn = $("finalCalcBtn");
  if (!btn) return;
  btn.classList.remove("is-ev-flashing");
  void btn.offsetWidth;
  btn.classList.add("is-ev-flashing");
  window.setTimeout(() => btn.classList.remove("is-ev-flashing"), 900);
}


function scrollToMidCheckButton() {
  const btn = $("btnMidCheck");
  if (!btn) return;
  btn.scrollIntoView({ behavior: "smooth", block: "nearest" });
}




function getTodayStamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


function clearAllDailySessions() {
  for (const machine of MACHINES) {
    localStorage.removeItem(getSessionKey(machine.id));
  }
  localStorage.removeItem(LS_DAILY_HAND_BALLS);
  localStorage.removeItem(LS_DAILY_CASH_ON_HAND);
  localStorage.removeItem(LS_ACTIVE_SESSION);
  localStorage.removeItem(LS_SESSION_SNAPSHOTS);
}

function hasActiveDailySession() {
  return Boolean(
    spinLog.length > 0 ||
    hasStarted ||
    pendingIndex !== -1 ||
    payoutConfirmIndex !== -1 ||
    endBallsPending ||
    pendingHitHandData ||
    confirmedInvestYen > 0 ||
    confirmedOwnedBalls > 0 ||
    confirmedOutputBalls > 0 ||
    investYen !== 0 ||
    ownedUseBalls !== 0 ||
    outputUseBalls !== 0 ||
    getDailyHandBalls() > 0 ||
    getDailyCashOnHand() > 0 ||
    lastFinalResult !== null
  );
}

function clearCurrentDailyState() {
  setInvestYen(0, true);
  setOwnedUseBalls(0, true);
  setOutputUseBalls(0, true);
  confirmedInvestYen = 0;
  confirmedOwnedBalls = 0;
  confirmedOutputBalls = 0;
  setDailyHandBalls(0);
  setDailyCashOnHand(0);
  playStartHandBalls = null;
  investmentsSincePlayBoundary = 0;
  calculatedLogCount = 0;
  renderConfirmedInvest();
  renderConfirmedOwned();
  renderConfirmedOutput();


  spinLog = [];
  pendingIndex = -1;
  payoutConfirmIndex = -1;
  fixedPayoutEditIndex = -1;
  endBallsPending = false;
  endBallsYame = null;
  nextStartCounter = 0;
  hasStarted = false;
  lastMidCheckBalls = null;
  lastHandBalanceInput = null;
  playStartHandBalls = null;
  lastConfirmedInvestYen = 0;
  lastConfirmedOwnedBalls = 0;


  setCounterInputLocked(false);
  updateStartButton();


  $("counterNow") && ($("counterNow").value = "");
  $("payoutPanel")?.classList.add("is-hidden");
  $("fixedPayoutPanel")?.classList.add("is-hidden");
  $("endBallsPanel")?.classList.add("is-hidden");
  $("payoutNow") && ($("payoutNow").value = "");
  $("fixedPayoutNow") && ($("fixedPayoutNow").value = "");
  $("endBallsNow") && ($("endBallsNow").value = "");


  const resultEl = $("result");
  if (resultEl) {
    resultEl.innerText = "";
    setResultTierClass("");
  }


  clearFinalResult();


  renderSpinLog();
  setLogMode("main");
}


function checkDailyLogRollover() {
  const today = getTodayStamp();
  const saved = localStorage.getItem(LS_DAILY_LOG_DATE);


  if (!saved) {
    localStorage.setItem(LS_DAILY_LOG_DATE, today);
    return;
  }


  if (saved === today) return;

  if (hasActiveDailySession()) {
    localStorage.setItem(LS_DAILY_LOG_DATE, today);
    saveSession();
    return;
  }

  clearAllDailySessions();
  clearCurrentDailyState();
  localStorage.setItem(LS_DAILY_LOG_DATE, today);
  saveSession();
}


function createSessionData() {
  const sessionStore = normalizeStoreName(selectedStore);
  return {
    machineId: selectedMachine.id,
    savedAt: Date.now(),
    spinLog,
    pendingIndex,
    nextStartCounter,
    payoutConfirmIndex,
    fixedPayoutEditIndex,
    endBallsYame,
    endBallsPending,
    pendingHitHandData,
    hasStarted,
    investYen,
    confirmedInvestYen,
    ownedUseBalls,
    confirmedOwnedBalls,
    outputUseBalls,
    confirmedOutputBalls,
    playStartHandBalls,
    investmentsSincePlayBoundary,
    calculatedLogCount: getCalculatedLogCount(),
    selectedStore: sessionStore,
    playSource,
    lastMidCheckBalls,
    lastHandBalanceInput: normalizeHandBalanceInput(lastHandBalanceInput),
    dailyHandBalls: getDailyHandBalls(),
    dailyCashOnHand: getDailyCashOnHand(),
    draftInputs: getSessionDraftInputs(),
    lastFinalResult: normalizeFinalResult(lastFinalResult),
  };
}

function sessionHasActivity(data) {
  return Boolean(
    data &&
    (
      (Array.isArray(data.spinLog) && data.spinLog.length > 0) ||
      data.hasStarted ||
      Number.isFinite(data.pendingIndex) && data.pendingIndex !== -1 ||
      Number.isFinite(data.payoutConfirmIndex) && data.payoutConfirmIndex !== -1 ||
      data.endBallsPending ||
      data.pendingHitHandData ||
      Number(data.confirmedInvestYen) > 0 ||
      Number(data.confirmedOwnedBalls) > 0 ||
      Number(data.confirmedOutputBalls) > 0 ||
      Number(data.investYen) !== 0 ||
      Number(data.ownedUseBalls) !== 0 ||
      Number(data.outputUseBalls) !== 0 ||
      Number(data.dailyHandBalls) > 0 ||
      Number(data.dailyCashOnHand) > 0 ||
      normalizeFinalResult(data.lastFinalResult) !== null
    )
  );
}

function parseSessionData(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    if (!MACHINES.some((m) => m.id === data.machineId)) return null;
    return data;
  } catch {
    return null;
  }
}

function loadSessionSnapshots() {
  try {
    const snapshots = JSON.parse(localStorage.getItem(LS_SESSION_SNAPSHOTS) || "[]");
    if (!Array.isArray(snapshots)) return [];
    return snapshots
      .filter((data) => data && typeof data === "object" && MACHINES.some((m) => m.id === data.machineId))
      .sort((a, b) => (Number(b.savedAt) || 0) - (Number(a.savedAt) || 0));
  } catch {
    return [];
  }
}

function saveSessionSnapshot(data) {
  if (!sessionHasActivity(data)) return;

  try {
    const snapshots = loadSessionSnapshots()
      .filter((item) => item.machineId !== data.machineId || item.savedAt !== data.savedAt);
    snapshots.unshift(data);
    localStorage.setItem(LS_SESSION_SNAPSHOTS, JSON.stringify(snapshots.slice(0, SESSION_SNAPSHOT_LIMIT)));
  } catch (e) {
    console.warn("saveSessionSnapshot failed:", e);
  }
}

function clearSessionSnapshotsForMachine(machineId) {
  try {
    const snapshots = loadSessionSnapshots().filter((data) => data.machineId !== machineId);
    if (snapshots.length) {
      localStorage.setItem(LS_SESSION_SNAPSHOTS, JSON.stringify(snapshots));
    } else {
      localStorage.removeItem(LS_SESSION_SNAPSHOTS);
    }
  } catch {}
}

function getRecoverableSession(preferredMachineId, allowAnyMachine) {
  const snapshots = loadSessionSnapshots().filter(sessionHasActivity);
  return snapshots.find((data) => data.machineId === preferredMachineId) ||
    (allowAnyMachine ? snapshots[0] : null);
}

function saveSession() {
  if (isSwitchingMachine) return;
  try {
    const key = getSessionKey(selectedMachine.id);
    const data = createSessionData();
    localStorage.setItem(LS_SELECTED_MACHINE, selectedMachine.id);
    if (data.selectedStore) localStorage.setItem(LS_SELECTED_STORE, data.selectedStore);
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(LS_ACTIVE_SESSION, JSON.stringify(data));
    saveSessionSnapshot(data);
  } catch (e) {
    console.warn("saveSession failed:", e);
  }
}

function flushSessionNow() {
  if (saveSessionTimer) {
    clearTimeout(saveSessionTimer);
    saveSessionTimer = null;
  }
  saveSession();
}

function queueSaveSession() {
  if (saveSessionTimer) clearTimeout(saveSessionTimer);
  saveSessionTimer = setTimeout(() => {
    saveSessionTimer = null;
    saveSession();
  }, 150);
}

function loadSession(useActiveFallback = true) {
  try {
    const key = getSessionKey(selectedMachine.id);
    let data = parseSessionData(localStorage.getItem(key));
    const active = parseSessionData(localStorage.getItem(LS_ACTIVE_SESSION));

    if (!data && active && (useActiveFallback || active.machineId === selectedMachine.id)) {
      data = active;
    }

    if (!data) {
      data = getRecoverableSession(selectedMachine.id, useActiveFallback);
    }

    if (!data) return false;

    const activeMachine = MACHINES.find((m) => m.id === data.machineId);
    if (!activeMachine) return false;

    if (activeMachine.id !== selectedMachine.id) {
      selectedMachine = activeMachine;
      localStorage.setItem(LS_SELECTED_MACHINE, selectedMachine.id);
      const sel = $("machineSelect");
      if (sel) sel.value = selectedMachine.id;
      setSelectedMachineDisplay();
      renderFavoriteButton();
      loadTotalsForSelectedMachine();
    }

    spinLog = Array.isArray(data.spinLog) ? data.spinLog : [];
    pendingIndex = Number.isFinite(data.pendingIndex) ? data.pendingIndex : -1;
    nextStartCounter = Number.isFinite(data.nextStartCounter) ? data.nextStartCounter : 0;
    payoutConfirmIndex = Number.isFinite(data.payoutConfirmIndex) ? data.payoutConfirmIndex : -1;
    fixedPayoutEditIndex = Number.isFinite(data.fixedPayoutEditIndex) ? data.fixedPayoutEditIndex : -1;


    endBallsYame = Number.isFinite(data.endBallsYame) ? data.endBallsYame : null;
    endBallsPending = !!data.endBallsPending;
    pendingHitHandData = data.pendingHitHandData && typeof data.pendingHitHandData === "object"
      ? data.pendingHitHandData
      : null;
    hasStarted = !!data.hasStarted;


    investYen = Number.isFinite(data.investYen) ? data.investYen : 0;
    setInvestYen(investYen, true);


    confirmedInvestYen = Number.isFinite(data.confirmedInvestYen) ? data.confirmedInvestYen : 0;
    renderConfirmedInvest();


    ownedUseBalls = Number.isFinite(data.ownedUseBalls) ? data.ownedUseBalls : 0;
    setOwnedUseBalls(ownedUseBalls, true);

    confirmedOwnedBalls = Number.isFinite(data.confirmedOwnedBalls) ? data.confirmedOwnedBalls : 0;
    renderConfirmedOwned();

    outputUseBalls = Number.isFinite(data.outputUseBalls) ? data.outputUseBalls : 0;
    setOutputUseBalls(outputUseBalls, true);

    confirmedOutputBalls = Number.isFinite(data.confirmedOutputBalls) ? data.confirmedOutputBalls : 0;
    renderConfirmedOutput();

    playStartHandBalls = Number.isFinite(data.playStartHandBalls)
      ? Math.max(0, Math.floor(data.playStartHandBalls))
      : null;

    investmentsSincePlayBoundary = Number.isFinite(data.investmentsSincePlayBoundary)
      ? Math.max(0, Math.floor(data.investmentsSincePlayBoundary))
      : 0;

    const restoredFinalResult = normalizeFinalResult(data.lastFinalResult);
    calculatedLogCount = Number.isFinite(data.calculatedLogCount)
      ? Math.max(0, Math.min(spinLog.length, Math.floor(data.calculatedLogCount)))
      : restoredFinalResult
        ? spinLog.length
        : 0;


    const restoredStore = normalizeStoreName(data.selectedStore);
    if (restoredStore) {
      selectedStore = restoredStore;
      saveStoreName(selectedStore);
      localStorage.setItem(LS_SELECTED_STORE, selectedStore);
    }
    playSource = ["cash", "owned", "output"].includes(data.playSource) ? data.playSource : "cash";
    if (Number.isFinite(data.dailyHandBalls)) {
      setDailyHandBalls(data.dailyHandBalls);
    }
    if (Number.isFinite(data.dailyCashOnHand)) {
      setDailyCashOnHand(data.dailyCashOnHand);
    }
    renderStoreControls();
    setPlaySource(playSource, false, false, true);

    lastMidCheckBalls = Number.isFinite(data.lastMidCheckBalls) ? data.lastMidCheckBalls : null;
    lastHandBalanceInput = normalizeHandBalanceInput(data.lastHandBalanceInput);
    lastFinalResult = restoredFinalResult;

    const draft = data.draftInputs && typeof data.draftInputs === "object" ? data.draftInputs : {};
    restoreInputValue("counterNow", draft.counterNow);
    restoreInputValue("payoutNow", draft.payoutNow);
    restoreInputValue("fixedPayoutNow", draft.fixedPayoutNow);
    restoreInputValue("hitHandNow", draft.hitHandNow);
    restoreInputValue("endBallsNow", draft.endBallsNow);
    if (endBallsPending && getInputValue("endBallsNow") === "") {
      prepareEndBallsInput(false);
    }
    restoreInputValue("midBallsNow", draft.midBallsNow);
    restoreInputValue("investYen", draft.investYen);
    restoreInputValue("ownedUseBalls", draft.ownedUseBalls);
    restoreInputValue("outputUseBalls", draft.outputUseBalls);

    return true;
  } catch (e) {
    console.warn("loadSession failed:", e);
    return false;
  }
}


function clearSession() {
  try {
    localStorage.removeItem(getSessionKey(selectedMachine.id));
    clearSessionSnapshotsForMachine(selectedMachine.id);
    const activeRaw = localStorage.getItem(LS_ACTIVE_SESSION);
    const active = activeRaw ? JSON.parse(activeRaw) : null;
    if (active?.machineId === selectedMachine.id) {
      localStorage.removeItem(LS_ACTIVE_SESSION);
    }
  } catch {}
}


function getCurrentBorder() {
  return selectedMachine?.border?.[selectedExchange];
}


function getFavoriteMachineIds() {

  try {
    const raw = localStorage.getItem(LS_FAVORITE_MACHINES);
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}


function saveFavoriteMachineIds(ids) {
  localStorage.setItem(LS_FAVORITE_MACHINES, JSON.stringify(ids));
}


function isFavoriteMachine(machineId) {
  return getFavoriteMachineIds().includes(machineId);
}


function toggleFavoriteMachine(machineId) {
  const ids = getFavoriteMachineIds();
  const next = ids.includes(machineId)
    ? ids.filter(id => id !== machineId)
    : [...ids, machineId];
  saveFavoriteMachineIds(next);
}


function getSortedMachines() {
  const favIds = getFavoriteMachineIds();


  const favs = MACHINES.filter(m => favIds.includes(m.id));
  const others = MACHINES.filter(m => !favIds.includes(m.id));


  return [...favs, ...others];
}


function renderFavoriteButton() {
  const btn = $("favoriteBtn");
  if (!btn) return;


  const fav = isFavoriteMachine(selectedMachine.id);
  btn.textContent = fav ? "★ お気に入り" : "☆ お気に入り";
  btn.classList.toggle("is-favorite", fav);
}


function getRecentMachineIds() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_RECENT_MACHINES) || "[]");
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}


function saveRecentMachineIds(ids) {
  localStorage.setItem(LS_RECENT_MACHINES, JSON.stringify(ids.slice(0, 12)));
}


function addRecentMachine(machineId) {
  if (!machineId) return;
  const next = [machineId, ...getRecentMachineIds().filter((id) => id !== machineId)];
  saveRecentMachineIds(next);
}

function markSelectedMachinePlayed() {
  if (selectedMachine?.id) addRecentMachine(selectedMachine.id);
}


function setSelectedMachineDisplay() {
  const nameEl = $("selectedMachineName");
  if (nameEl) nameEl.textContent = selectedMachine?.name || "機種を選択";


  const nativeSelect = $("machineSelect");
  if (nativeSelect) nativeSelect.value = selectedMachine?.id || "";
}


function getMachineSearchText(machine) {
  return [
    machine.id,
    machine.name,
    machine.maker,
    machine.jackpot,
    machine.rushEntry,
    ...(Array.isArray(machine.tags) ? machine.tags : []),
    machine.keyword,
  ].filter(Boolean).join(" ").toLowerCase();
}


function getMachinePickerFilter() {
  return document.querySelector(".machine-picker-tab.is-active")?.dataset.machineFilter || "all";
}

function resetMachinePickerListScroll() {
  const list = $("machinePickerList");
  if (!list) return;

  machinePickerScrollTop = 0;
  list.scrollTop = 0;
  requestAnimationFrame(() => {
    list.scrollTop = 0;
  });
}

function renderMachinePickerList() {
  const list = $("machinePickerList");
  if (!list) return;

  const query = ($("machineSearchInput")?.value || "").trim().toLowerCase();
  const filter = getMachinePickerFilter();
  const favIds = getFavoriteMachineIds();
  const recentIds = getRecentMachineIds();

  const storeJudgeByMachine = new Map();
  if (selectedStore) {
    for (const machine of MACHINES) {
      const totalsForStore = getMachineStoreJudgeTotals(machine.id);
      const judgeForStore = getMachineStoreJudge(totalsForStore);
      if (judgeForStore) {
        storeJudgeByMachine.set(machine.id, { totals: totalsForStore, judge: judgeForStore });
      }
    }
  }

  let machines = getSortedMachines();
  if (filter === "favorite") machines = machines.filter((m) => favIds.includes(m.id));
  if (filter === "recent") {
    const playedIds = [...recentIds];
    for (const machineId of storeJudgeByMachine.keys()) {
      if (!playedIds.includes(machineId)) playedIds.push(machineId);
    }

    machines = playedIds
      .map((id) => MACHINES.find((m) => m.id === id))
      .filter(Boolean);
  }
  if (filter === "storeGood" || filter === "storeBad") {
    machines = machines.filter((m) => {
      const judge = storeJudgeByMachine.get(m.id)?.judge;
      if (!judge) return false;
      return filter === "storeGood" ? judge.isGood : !judge.isGood;
    });
  }
  if (query) {
    machines = machines.filter((m) => getMachineSearchText(m).includes(query));
  }


  list.innerHTML = "";


  if (machines.length === 0) {
    const empty = document.createElement("p");
    empty.className = "machine-picker-empty";
    empty.textContent = (filter === "storeGood" || filter === "storeBad") && !selectedStore
      ? "店舗を選択すると判定で絞り込めます"
      : "該当する機種がありません";
    list.appendChild(empty);
    return;
  }

  for (const machine of machines) {
    const storeSummary = storeJudgeByMachine.get(machine.id);
    const storeJudge = storeSummary?.judge || null;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "machine-picker-item";
    if (machine.id === selectedMachine.id) btn.classList.add("is-current");
    if (storeJudge) {
      btn.classList.add(storeJudge.isGood ? "is-store-good" : "is-store-bad");
    }
    btn.dataset.machineId = machine.id;

    const title = document.createElement("strong");
    title.textContent = `${isFavoriteMachine(machine.id) ? "★ " : ""}${machine.name}`;
    btn.appendChild(title);

    const meta = document.createElement("span");
    meta.className = "machine-picker-item__meta";
    const border = machine?.border?.[selectedExchange];
    const specText = `大当り ${machine.jackpot || "—"} / ${selectedExchange}玉ボーダー ${fmtBorder(border)}回/k`;
    const storeJudgeText = formatMachineStoreJudgeText(storeJudge);
    const spec = document.createElement("span");
    spec.className = "machine-picker-item__spec";
    spec.textContent = specText;
    meta.appendChild(spec);
    if (storeJudgeText) {
      const judge = document.createElement("span");
      judge.className = "machine-picker-item__judge";
      judge.textContent = storeJudgeText;
      meta.appendChild(judge);
    }
    btn.appendChild(meta);

    list.appendChild(btn);
  }
}

function getMachineStoreJudgeTotals(machineId) {
  if (!selectedStore) return null;
  const itemTotals = loadTotalsForStoreMachine(selectedStore, machineId);
  return hasAnyTotals(itemTotals) ? itemTotals : null;
}

function formatMachineStoreJudgeText(itemTotals) {
  if (!itemTotals) return "";
  return `累計${fmtRate1(itemTotals.avgRate)}回/k（${itemTotals.diff >= 0 ? "+" : ""}${fmtRate1(itemTotals.diff)}）`;
}

function getMachineStoreJudge(itemTotals) {
  if (!itemTotals) return null;

  const spin = Number(itemTotals.totalSpin) || 0;
  const consumedK = Number(itemTotals.totalConsumedK) || 0;
  const avgTrueBorder = calcWeightedAverage(
    itemTotals.totalTrueBorderWeighted,
    itemTotals.totalTrueBorderCount
  );

  if (!(spin > 0) || !(consumedK > 0) || avgTrueBorder === null || !Number.isFinite(avgTrueBorder)) {
    return null;
  }

  const avgRate = (spin / consumedK) * 250;
  const diff = avgRate - avgTrueBorder;
  const isGood = diff >= 0;
  return {
    avgRate,
    avgTrueBorder,
    diff,
    isGood,
    mark: isGood ? "○" : "×",
  };
}


function openMachinePicker() {
  const search = $("machineSearchInput");
  if (search) search.value = "";
  $("machinePickerOverlay")?.classList.remove("is-hidden");
  $("machinePickerModal")?.classList.remove("is-hidden");
  renderMachinePickerList();
  resetMachinePickerListScroll();
  setTimeout(() => $("machineSearchInput")?.focus({ preventScroll: true }), 30);
}

function closeMachinePicker() {
  const list = $("machinePickerList");
  if (list) machinePickerScrollTop = list.scrollTop;
  $("machinePickerOverlay")?.classList.add("is-hidden");
  $("machinePickerModal")?.classList.add("is-hidden");
}




function setCounterInputLocked(locked) {
  const el = $("counterNow");
  if (!el) return;
  el.disabled = locked;
}


function getRateTierClass(rate, border) {
  if (!Number.isFinite(rate) || !Number.isFinite(border)) return "";
  const d = rate - border;
  if (d < 0) return "tier-bad";
  if (d <= 1.0) return "tier-blue";
  if (d <= 2.0) return "tier-green";
  return "tier-purple";
}


function setResultTierClass(tierClass) {
  const el = $("result");
  if (!el) return;
  el.classList.remove("tier-bad", "tier-blue", "tier-green", "tier-purple");
  if (tierClass) el.classList.add(tierClass);
}




function setLogMode(mode) {
  const main = $("logActionsMain");
  const after = $("logActionsAfter");
  if (!main || !after) return;


  if (mode === "afterHit") {
    main.classList.add("is-hidden");
    after.classList.remove("is-hidden");
  } else {
    after.classList.add("is-hidden");
    main.classList.remove("is-hidden");
  }
  updateRushEndAdjustUI();
}


function updateRushEndAdjustUI() {
  const row = $("rushEndAdjustRow");
  if (!row) return;


  const canUse = selectedMachine?.rushEndAdjustable;
  const isAfter = !$("logActionsAfter")?.classList.contains("is-hidden");


  if (canUse && isAfter) {
    row.classList.remove("is-hidden");
  } else {
    row.classList.add("is-hidden");
  }
}


function updateStartButton() {
  const btn = $("btnStart");
  if (!btn) return;


  if (hasStarted) {
    btn.disabled = true;
    btn.textContent = "開始済";
    btn.classList.add("is-disabled");
  } else {
    btn.disabled = false;
    btn.textContent = "開始";
    btn.classList.remove("is-disabled");
  }
}




function resetSpinLog(skipSave = false) {
  if (!skipSave) clearFinalResult();
  spinLog = [];
  pendingIndex = -1;
  nextStartCounter = 0;
  payoutConfirmIndex = -1;
  fixedPayoutEditIndex = -1;
  endBallsYame = null;
  endBallsPending = false;
  pendingHitHandData = null;
  lastMidCheckBalls = null;
  lastHandBalanceInput = null;
  playStartHandBalls = null;
  investmentsSincePlayBoundary = 0;
  calculatedLogCount = 0;


  if ($("counterNow")) $("counterNow").value = "";


  $("payoutPanel")?.classList.add("is-hidden");
  if ($("payoutNow")) $("payoutNow").value = "";
  $("fixedPayoutPanel")?.classList.add("is-hidden");
  if ($("fixedPayoutNow")) $("fixedPayoutNow").value = "";
  $("hitHandPanel")?.classList.add("is-hidden");
  if ($("hitHandNow")) $("hitHandNow").value = "";

  $("endBallsPanel")?.classList.add("is-hidden");
  if ($("endBallsNow")) $("endBallsNow").value = "";


  renderSpinLog();
  setLogMode("main");
  setCounterInputLocked(false);
  if (!skipSave) saveSession();
}


function addStartEvent() {
  try {
    const input = $("counterNow");
    const raw = input?.value?.trim();
    if (!raw) {
      alert("データカウンター回転数を入力してください");
      return;
    }


    const now = Number(raw);
    if (!Number.isFinite(now) || now < 0) {
      alert("回転数を正しく入力してください");
      return;
    }

    clearFinalResult();
    markSelectedMachinePlayed();
    nextStartCounter = Math.floor(now);
    playStartHandBalls = getDailyHandBalls();

    spinLog.push({
      from: nextStartCounter,
      to: null,
      add: 0,
      nextStart: nextStartCounter,
      label: "開始",
      payout: null,
      payoutDisp: null,
      startHandBalls: playStartHandBalls,
      startAt: nextStartCounter,
    });

    hasStarted = true;
    investFromStop = false;
    investmentsSincePlayBoundary = 0;
    updateStartButton();


    if (input) input.value = "";


    renderSpinLog();
    setLogMode("main");
    saveSession();
  } catch (e) {
    console.error(e);
    alert("開始処理でエラーが出ています。");
  }


  setCounterInputLocked(false);
}


function addHitEvent() {
  if (pendingIndex !== -1) {
    alert("当たり種別（単発 / RUSH / LT）を先に選んでください");
    return;
  }
  if (payoutConfirmIndex !== -1) {
    alert("先に「表記出玉」を確定してください");
    return;
  }


  if (spinLog.length === 0 || spinLog[spinLog.length - 1].label !== "開始") {
    alert("先に「開始」を押してください");
    return;
  }


  const input = $("counterNow");
  const raw = input?.value?.trim();
  if (!raw) {
    alert("当たった時点のデータカウンター回転数を入力してください");
    return;
  }


  const now = Number(raw);
  if (!Number.isFinite(now) || now < nextStartCounter) {
    alert(`回転数が不正です（開始 ${nextStartCounter} 以上）`);
    return;
  }


  const idx = spinLog.length - 1;
  const row = spinLog[idx];
  const add = now - row.from;
  const hasInvestmentBeforeHit = investmentsSincePlayBoundary > 0;

  finishHitEvent({ idx, now, add, hasInvestmentBeforeHit });
}

function confirmHitHand() {
  if (!pendingHitHandData) return;

  const currentHand = Math.floor(Number($("hitHandNow")?.value));
  if (!Number.isFinite(currentHand) || currentHand < 0) {
    alert("当たった時点の持ち玉（玉）を入力してください");
    return;
  }

  const { idx, now, add, startHand, hasInvestmentBeforeHit } = pendingHitHandData;
  const row = spinLog[idx];
  if (!row) {
    pendingHitHandData = null;
    $("hitHandPanel")?.classList.add("is-hidden");
    setCounterInputLocked(false);
    saveSession();
    return;
  }

  const alreadyUsed = Number(row.outputBalls) || 0;
  const used = Math.max(0, startHand - currentHand - alreadyUsed);
  if (used > 0) row.outputBalls = alreadyUsed + used;
  setDailyHandBalls(currentHand);
  playStartHandBalls = currentHand;
  lastMidCheckBalls = currentHand;
  pendingHitHandData = null;
  $("hitHandPanel")?.classList.add("is-hidden");
  if ($("hitHandNow")) $("hitHandNow").value = "";
  renderConfirmedOutput();

  finishHitEvent({ idx, now, add, hasInvestmentBeforeHit });
}

function finishHitEvent({ idx, now, add, hasInvestmentBeforeHit }) {
  const row = spinLog[idx];
  if (!row) return;

  clearFinalResult();
  markSelectedMachinePlayed();
  row.to = now;
  row.add = add;
  row.nextStart = null;
  row.label = "当たり（未確定）";
  row.payout = null;
  row.payoutDisp = null;


  pendingIndex = idx;


  const input = $("counterNow");
  if (input) input.value = "";


  renderSpinLog();
  setLogMode("afterHit");
  setCounterInputLocked(true);
  investFromStop = false;
  investmentsSincePlayBoundary = 0;
  saveSession();

  if (!hasInvestmentBeforeHit) {
    scrollToInvestCard();
  }
}

function addOutcomePayoutToHand(row, payoutBalls) {
  const balls = Math.max(0, Math.floor(Number(payoutBalls) || 0));
  if (!row || balls <= 0) return;

  const previous = Math.max(0, Math.floor(Number(row.handPayoutAdded) || 0));
  if (previous > 0) {
    setDailyHandBalls(getDailyHandBalls() - previous);
  }

  setDailyHandBalls(getDailyHandBalls() + balls);
  row.handPayoutAdded = balls;
  lastMidCheckBalls = getDailyHandBalls();
  playStartHandBalls = getDailyHandBalls();
  renderOwnedBalance();
}

function getHitOptionLabel(type) {
  const custom = selectedMachine?.hitOptionLabels?.[type];
  if (custom) return custom;

  if (type === "charge") return "チャージ";
  if (type === "tan") return "単発";
  if (type === "CZEnd" || type === "czEnd") return "CZ終了";
  if (type === "rushEnd") return "RUSH終了";
  return "LT終了";
}

function getRowOutcomeType(row) {
  if (row?.outcomeType) return row.outcomeType;
  if (row?.label === "チャージ" || row?.label === "チンアナゴ") return "charge";
  if (row?.label === "単発") return "tan";
  if (row?.label === "CZ終了") return "CZEnd";
  if (row?.label === "RUSH終了") return "rushEnd";
  if (row?.label === "LT終了") return "ltEnd";
  return "";
}

function removeOutcomePayoutFromHand(row) {
  const balls = Math.max(0, Math.floor(Number(row?.handPayoutAdded) || 0));
  if (balls <= 0) return;

  setDailyHandBalls(getDailyHandBalls() - balls);
  if (row) delete row.handPayoutAdded;
  lastMidCheckBalls = getDailyHandBalls();
  playStartHandBalls = getDailyHandBalls();
  renderOwnedBalance();
}

function resetOutcomeRowToPending(row) {
  if (!row) return;

  removeOutcomePayoutFromHand(row);
  row.label = "当たり（未確定）";
  row.nextStart = null;
  row.payout = null;
  row.payoutDisp = null;
  delete row.handPayoutAdded;
  delete row.outcomeType;
}

function isFixedPayoutRow(row) {
  const type = getRowOutcomeType(row);
  return type === "tan" || type === "charge" || type === "CZEnd" || type === "czEnd";
}

function startFixedPayoutAdjust(index) {
  const row = spinLog[index];
  if (!isFixedPayoutRow(row)) return;

  fixedPayoutEditIndex = index;
  $("payoutPanel")?.classList.add("is-hidden");

  const input = $("fixedPayoutNow");
  if (input) {
    input.value = String(Math.max(0, Math.floor(Number(row.payoutDisp ?? row.payout) || 0)));
  }

  $("fixedPayoutPanel")?.classList.remove("is-hidden");
  input?.focus();
  input?.select();
  saveSession();
}

function confirmFixedPayoutAdjust() {
  const row = spinLog[fixedPayoutEditIndex];
  if (!isFixedPayoutRow(row)) return;

  const value = Number($("fixedPayoutNow")?.value);
  if (!Number.isFinite(value) || value < 0) {
    alert("表示出玉を0以上で入力してください");
    return;
  }

  const disp = Math.floor(value);
  const net = calcNetFromDisplayedPayout(disp);
  const previousAdded = Math.max(0, Math.floor(Number(row.handPayoutAdded) || 0));
  const delta = net - previousAdded;

  clearFinalResult();
  if (delta !== 0) {
    setDailyHandBalls(getDailyHandBalls() + delta);
  }

  row.payout = net;
  row.payoutDisp = disp;
  row.handPayoutAdded = net;
  lastMidCheckBalls = getDailyHandBalls();
  playStartHandBalls = getDailyHandBalls();

  fixedPayoutEditIndex = -1;
  $("fixedPayoutPanel")?.classList.add("is-hidden");
  if ($("fixedPayoutNow")) $("fixedPayoutNow").value = "";

  renderOwnedBalance();
  renderSpinLog();
  saveSession();
}

function getRestartValue(type) {
  const map = selectedMachine?.restart || { tan: 0, rushEnd: 0, ltEnd: 0 };
  if (type === "tan") return Number(map.tan) || 0;

  if (type === "rushEnd") {
    let base = Number(map.rushEnd) || 0;


    if (selectedMachine?.rushEndAdjustable) {
      const add = Number($("rushEndAdjust")?.value) || 0;
      base += add;
    }


    return base;
  }


  if (type === "ltEnd") return Number(map.ltEnd) || 0;
  if (type === "CZEnd" || type === "czEnd") return Number(map[type]) || 0;

  return 0;
}

function confirmHitOutcome(type) {
  if (pendingIndex === -1) {
    alert("先に「当たり」を押してください");
    return;
  }

  if (selectedMachine?.restartInput?.[type]) {
    showRestartCounterInputDialog(type);
    return;
  }

  const nextStart = getRestartValue(type);
  completeHitOutcome(type, nextStart);
}

function completeHitOutcome(type, nextStart) {
  if (pendingIndex === -1) return;
  if (!Number.isFinite(Number(nextStart)) || Number(nextStart) < 0) {
    alert("再開回転数を0以上で入力してください");
    return;
  }

  nextStart = Math.floor(Number(nextStart));
  const row = spinLog[pendingIndex];
  clearFinalResult();
  row.nextStart = nextStart;
  row.outcomeType = type;
  row.label = getHitOptionLabel(type);


  nextStartCounter = nextStart;


  if (type === "tan" || type === "charge" || type === "CZEnd" || type === "czEnd") {
    const payout =
      type === "charge"
        ? (selectedMachine.chargePayout ?? { disp: 300, net: 280 })
        : (type === "CZEnd" || type === "czEnd")
          ? (selectedMachine.CZPayout ?? selectedMachine.tanPayout ?? { disp: TAN_PAYOUT_DISP, net: TAN_PAYOUT_NET })
          : (selectedMachine.tanPayout ?? { disp: TAN_PAYOUT_DISP, net: TAN_PAYOUT_NET });

    row.payoutDisp = payout.disp;
    row.payout = payout.net;
    addOutcomePayoutToHand(row, payout.net);

    pendingIndex = -1;


    spinLog.push({
      from: nextStartCounter,
      to: nextStartCounter,
      add: 0,
      nextStart: nextStartCounter,
      label: "開始",
      payout: null,
      payoutDisp: null,
      startHandBalls: playStartHandBalls,
      startAt: nextStartCounter,
    });
    investmentsSincePlayBoundary = 0;

    renderSpinLog();
    setLogMode("main");
    setCounterInputLocked(false);
    saveSession();
    return;
  }


  row.payout = null;
  row.payoutDisp = null;
  payoutConfirmIndex = pendingIndex;
  pendingIndex = -1;


  if ($("payoutNow")) $("payoutNow").value = "";
  $("payoutPanel")?.classList.remove("is-hidden");


  saveSession();
}


function confirmPayout() {
  if (payoutConfirmIndex === -1) return;


  const disp = Number($("payoutNow")?.value);
  if (!Number.isFinite(disp) || disp < 0) {
    alert("リザルト表記出玉（玉）を入力してください");
    return;
  }


  const dispInt = Math.floor(disp);
  const net = calcNetFromDisplayedPayout(dispInt);

  clearFinalResult();
  spinLog[payoutConfirmIndex].payoutDisp = dispInt;
  spinLog[payoutConfirmIndex].payout = net;
  addOutcomePayoutToHand(spinLog[payoutConfirmIndex], net);


  payoutConfirmIndex = -1;


  $("payoutPanel")?.classList.add("is-hidden");
  if ($("payoutNow")) $("payoutNow").value = "";


  spinLog.push({
    from: nextStartCounter,
    to: nextStartCounter,
    add: 0,
    nextStart: nextStartCounter,
    label: "開始",
    payout: null,
    payoutDisp: null,
    startHandBalls: playStartHandBalls,
    startAt: nextStartCounter,
  });
  investmentsSincePlayBoundary = 0;

  renderSpinLog();
  setLogMode("main");
  setCounterInputLocked(false);
  saveSession();
}


function confirmEndBalls() {
  if (!endBallsPending) return;

  const v = Number($("endBallsNow")?.value);
  if (!Number.isFinite(v) || v < 0) {
    alert("ヤメ時の持ち玉（玉）を入力してください");
    return;
  }


  endBallsYame = Math.floor(v);
  endBallsPending = false;
  const hasInvestmentBeforeStop = investmentsSincePlayBoundary > 0;
  clearFinalResult();

  const last = spinLog[spinLog.length - 1];
  if (last && String(last.label).startsWith("ヤメ")) {
    last.label = "ヤメ";
    last.endBalls = endBallsYame;
    applyOutputUseFromCurrentHand(endBallsYame, {
      alertWhenNoUse: false,
      targetRow: last,
      source: "end",
    });
  }

  $("endBallsPanel")?.classList.add("is-hidden");
  if ($("endBallsNow")) $("endBallsNow").value = "";

  renderSpinLog();
  renderConfirmedOutput();
  renderOwnedBalance();
  setCounterInputLocked(false);
  setDailyHandBalls(endBallsYame);
  playStartHandBalls = null;
  investmentsSincePlayBoundary = 0;
  investFromStop = !hasInvestmentBeforeStop;
  saveSession();

  scrollToFinalCalcCard();
}


function undoSpinEventUnified() {
  if (endBallsPending) {
    clearFinalResult();
    endBallsPending = false;
    endBallsYame = null;


    $("endBallsPanel")?.classList.add("is-hidden");
    if ($("endBallsNow")) $("endBallsNow").value = "";


    const last = spinLog[spinLog.length - 1];
    if (last && String(last.label).includes("ヤメ（持ち玉未確定）")) {
      spinLog.pop();
      const prev = spinLog[spinLog.length - 1];
      nextStartCounter = Number(prev?.nextStart) || nextStartCounter;
    }


    renderSpinLog();
    setLogMode("main");
    setCounterInputLocked(false);
    saveSession();
    return;
  }


  if (payoutConfirmIndex !== -1) {
    clearFinalResult();
    const row = spinLog[payoutConfirmIndex];
    resetOutcomeRowToPending(row);

    pendingIndex = payoutConfirmIndex;
    payoutConfirmIndex = -1;


    $("payoutPanel")?.classList.add("is-hidden");
    if ($("payoutNow")) $("payoutNow").value = "";


    renderSpinLog();
    setLogMode("afterHit");
    setCounterInputLocked(true);
    saveSession();
    return;
  }


  if (pendingIndex !== -1) {
    clearFinalResult();
    const row = spinLog[pendingIndex];
    row.label = "開始";
    row.to = row.from;
    row.add = 0;
    row.nextStart = row.from;
    row.payout = null;
    row.payoutDisp = null;
    delete row.outcomeType;

    pendingIndex = -1;


    renderSpinLog();
    setLogMode("main");
    setCounterInputLocked(false);
    saveSession();
    return;
  }


  if (pendingIndex === -1 && payoutConfirmIndex === -1 && spinLog.length >= 2) {
    const last = spinLog[spinLog.length - 1];
    const prev = spinLog[spinLog.length - 2];


    const prevIsOutcome = Boolean(getRowOutcomeType(prev));


    const lastIsAutoStart =
      last.label === "開始" && (Number(last.add) || 0) === 0;


    if (prevIsOutcome && lastIsAutoStart) {
      clearFinalResult();
      spinLog.pop();

      resetOutcomeRowToPending(prev);

      pendingIndex = spinLog.length - 1;


      setLogMode("afterHit");
      setCounterInputLocked(true);


      renderSpinLog();
      saveSession();
      return;
    }
  }


  if (spinLog.length === 0) return;
  clearFinalResult();
  const removed = spinLog.pop();
  removeOutcomePayoutFromHand(removed);


  if (spinLog.length === 0) {
    hasStarted = false;
    pendingIndex = -1;
    payoutConfirmIndex = -1;
    endBallsPending = false;
    endBallsYame = null;
    nextStartCounter = 0;
    setCounterInputLocked(false);
    updateStartButton();


    renderSpinLog();
    setLogMode("main");
    saveSession();
    return;
  }


  const last = spinLog[spinLog.length - 1];
  nextStartCounter = Number(last?.nextStart) || nextStartCounter;


  renderSpinLog();
  setLogMode("main");
  setCounterInputLocked(false);
  saveSession();
}


function addStopEvent() {
  if (!hasStarted || spinLog.length === 0) {
    alert("先に「開始」を押してください");
    return;
  }


  if (pendingIndex !== -1) {
    alert("当たり種別（単発 / RUSH / LT）を先に選んでください");
    return;
  }
  if (payoutConfirmIndex !== -1) {
    alert("先に「表記出玉」を確定してください");
    return;
  }
  if (endBallsPending) {
    alert("先に「持ち玉」を確定してください");
    return;
  }

  const playInputs = getPlayInputsFromRows(getUncalculatedRows());
  if (!(confirmedInvestYen > 0 || confirmedOwnedBalls > 0 || confirmedOutputBalls > 0 || playInputs.investK > 0 || playInputs.ownedBalls > 0 || playInputs.outputBalls > 0)) {
    alert("投資額または貯玉・持ち玉使用を追加してください");
    scrollToInvestCard();
    return;
  }

  const raw = $("counterNow")?.value?.trim();
  const now = raw === "" ? nextStartCounter : Number(raw);


  if (!Number.isFinite(now) || now < nextStartCounter) {
    alert(`回転数が不正です（開始 ${nextStartCounter} 以上）`);
    return;
  }


  const add = now - nextStartCounter;

  clearFinalResult();
  spinLog.push({
    from: nextStartCounter,
    to: now,
    add,
    nextStart: now,
    label: "ヤメ（持ち玉未確定）",
    payout: null,
    payoutDisp: null,
    endBalls: null,
  });


  nextStartCounter = now;
  if ($("counterNow")) $("counterNow").value = "";

  endBallsPending = true;

  const endBallsPrefill = getHandBalancePrefillForCounter(now);
  $("endBallsPanel")?.classList.remove("is-hidden");
  prepareEndBallsInput(true, endBallsPrefill ?? 0);

  renderSpinLog();
  setLogMode("main");
  setCounterInputLocked(true);
  saveSession();
}


function fmtBorder(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return v.toFixed(1);
}


function renderMachineInfo(animate = false) {
  const m = selectedMachine;


  const borderVal = m?.border?.[selectedExchange];


  const borderEl = $("infoBorder");
  const jackpotEl = $("infoJackpot");
  const rushEl = $("infoRush");


  const borderText = `${selectedExchange}ボーダー：${fmtBorder(borderVal)} 回/k`;
  const jackpotText = `図柄当たり確率：${m?.jackpot ?? "—"}`;
  const rushText = `ラッシュ突入率：${m?.rushEntry ?? "—"}`;


  const targets = [
    { el: borderEl, text: borderText },
    { el: jackpotEl, text: jackpotText },
    { el: rushEl, text: rushText },
  ].filter((x) => x.el);


  if (!animate) {
    for (const t of targets) {
      t.el.classList.remove("is-updating", "is-revealing");
      t.el.innerText = t.text;
    }
    return;
  }


  for (const t of targets) {
    t.el.classList.remove("is-revealing");
    t.el.classList.add("is-updating");
  }


  for (const t of targets) {
    t.el.innerText = t.text;
  }


  const baseDelay = 180;
  const stepDelay = 80;


  targets.forEach((t, i) => {
    setTimeout(() => {
      t.el.classList.remove("is-updating");
      t.el.classList.add("is-revealing");


      const onEnd = () => {
        t.el.classList.remove("is-revealing");
        t.el.removeEventListener("animationend", onEnd);
      };
      t.el.addEventListener("animationend", onEnd);
    }, baseDelay + i * stepDelay);
  });
}




function initMachineSelect() {
  const sel = $("machineSelect");
  if (!sel) return;


  sel.innerHTML = "";
for (const m of getSortedMachines()) {
  const opt = document.createElement("option");
  opt.value = m.id;
  opt.textContent = isFavoriteMachine(m.id) ? `★ ${m.name}` : m.name;
  sel.appendChild(opt);
}


  const savedId = localStorage.getItem(LS_SELECTED_MACHINE);
  const found = MACHINES.find((m) => m.id === savedId);
  selectedMachine = found || MACHINES[0];
  sel.value = selectedMachine.id;
  setSelectedMachineDisplay();
  renderFavoriteButton();
  renderMachinePickerList();


  loadTotalsForSelectedMachine();


  const savedExchange = Number(localStorage.getItem(LS_SELECTED_EXCHANGE));
if (isValidExchange(savedExchange)) {
  selectedExchange = savedExchange;
}


  const exchangeSel = $("exchangeSelect");
  if (exchangeSel) {
    exchangeSel.value = String(selectedExchange);
    exchangeSel.addEventListener("change", () => {
      setSelectedExchange(exchangeSel.value);
    });
  }

  sel.addEventListener("change", () => {
    saveSession();
    isSwitchingMachine = true;

    const id = sel.value;
    const m = MACHINES.find((x) => x.id === id);
    if (!m) {
      isSwitchingMachine = false;
      return;
    }

    clearFinalResult();
    const exchangeSel = $("exchangeSelect");
if (exchangeSel) {
  exchangeSel.value = String(selectedExchange);


  exchangeSel.addEventListener("change", () => {
    const v = Number(exchangeSel.value);
    if (![25, 28, 30, 33].includes(v)) return;


    selectedExchange = v;
    localStorage.setItem(LS_SELECTED_EXCHANGE, String(v));


    renderMachineInfo(true);
    renderOwnedBalance();


    clearFinalResult();
  });
}


    selectedMachine = m;
    localStorage.setItem(LS_SELECTED_MACHINE, selectedMachine.id);
    setSelectedMachineDisplay();


    loadTotalsForSelectedMachine();


    setInvestYen(0, true);
    setOwnedUseBalls(0, true);
    setOutputUseBalls(0, true);
    confirmedInvestYen = 0;
    confirmedOwnedBalls = 0;
    confirmedOutputBalls = 0;
    investmentsSincePlayBoundary = 0;
    renderConfirmedInvest();
    renderConfirmedOwned();
    renderConfirmedOutput();


    resetSpinLog(true);
    hasStarted = false;
    updateStartButton();


    const restored = loadSession(false);
    if (restored) {
      renderSpinLog();
      renderFinalResultView();
      if (payoutConfirmIndex !== -1) $("payoutPanel")?.classList.remove("is-hidden");
      if (fixedPayoutEditIndex !== -1) $("fixedPayoutPanel")?.classList.remove("is-hidden");
      if (pendingHitHandData) $("hitHandPanel")?.classList.remove("is-hidden");
      if (endBallsPending) {
        $("endBallsPanel")?.classList.remove("is-hidden");
        if (getInputValue("endBallsNow") === "") prepareEndBallsInput(false);
      }
      setLogMode(pendingIndex !== -1 ? "afterHit" : "main");
      updateStartButton();
    } else {
      resetSpinLog(true);
    }


    isSwitchingMachine = false;
    saveSession();


    const resultEl = $("result");
    if (resultEl) {
      resultEl.innerText = "";
      setResultTierClass("");
    }


    const totalEl = $("total");
    if (totalEl) {
      totalEl.innerText = "累積期待値：0 玉";
      totalEl.style.color = "";
    }
    $("totalSpin") && ($("totalSpin").innerText = "初当たり確率：0 / 0 = —");
    $("totalInvest") && ($("totalInvest").innerText = "累計投資：0 円");
    $("avgRate") && ($("avgRate").innerText = "累計回転率：0.0 回/k");


    updateView();
    renderMachineInfo(true);
    updateHitOptionButtons();
    renderFavoriteButton();
    renderMachinePickerList();
    updateRushEndAdjustUI();
  });
}




function getTotalsKey(machineId) {
  return `${LS_PREFIX}${machineId}`;
}

function getStoreMachineTotalsKey(store, machineId) {
  const clean = normalizeStoreName(store);
  if (!clean || !machineId) return "";
  return `${LS_STORE_MACHINE_TOTALS_PREFIX}${encodeURIComponent(clean)}_${machineId}`;
}


function createEmptyTotals() {
  return {
    totalExpectBalls: 0,
    totalExpectYen: 0,
    totalSpin: 0,
    totalInvestYen: 0,
    totalOwnedBallsUsed: 0,
    totalOutputBallsUsed: 0,
    totalKInvested: 0,
    totalConsumedK: 0,
    totalTrueBorderWeighted: 0,
    totalTrueBorderCount: 0,
    totalOwnedRatioWeighted: 0,
    totalOwnedRatioCount: 0,
    totalHitCount: 0,
    totalTanCount: 0,
    totalRushCount: 0,
    totalLtCount: 0,
    totalRushPayoutDispSum: 0,
    totalRushPayoutDispCount: 0,
    totalLtPayoutDispSum: 0,
    totalLtPayoutDispCount: 0,
  };
}


function normalizeTotals(obj) {
  const expectBalls = Number(obj?.totalExpectBalls) || 0;
  return {
    totalExpectBalls: expectBalls,
    totalExpectYen: Number.isFinite(Number(obj?.totalExpectYen))
      ? Number(obj.totalExpectYen)
      : calcExpectationYenFromBalls(expectBalls),
    totalSpin: Number(obj?.totalSpin) || 0,
    totalInvestYen: Number(obj?.totalInvestYen) || 0,
    totalOwnedBallsUsed: Number(obj?.totalOwnedBallsUsed) || 0,
    totalOutputBallsUsed: Number(obj?.totalOutputBallsUsed) || 0,
    totalKInvested: Number(obj?.totalKInvested) || 0,
    totalConsumedK: Number(obj?.totalConsumedK) || 0,
    totalTrueBorderWeighted: Number(obj?.totalTrueBorderWeighted) || 0,
    totalTrueBorderCount: Number(obj?.totalTrueBorderCount) || 0,
    totalOwnedRatioWeighted: Number(obj?.totalOwnedRatioWeighted) || 0,
    totalOwnedRatioCount: Number(obj?.totalOwnedRatioCount) || 0,
    totalHitCount: Number(obj?.totalHitCount) || 0,
    totalTanCount: Number(obj?.totalTanCount) || 0,
    totalRushCount: Number(obj?.totalRushCount) || 0,
    totalLtCount: Number(obj?.totalLtCount) || 0,
    totalRushPayoutDispSum: Number(obj?.totalRushPayoutDispSum) || 0,
    totalRushPayoutDispCount: Number(obj?.totalRushPayoutDispCount) || 0,
    totalLtPayoutDispSum: Number(obj?.totalLtPayoutDispSum) || 0,
    totalLtPayoutDispCount: Number(obj?.totalLtPayoutDispCount) || 0,
  };
}


function loadTotalsForMachine(machineId) {
  const raw = localStorage.getItem(getTotalsKey(machineId));
  if (!raw) return createEmptyTotals();


  try {
    return normalizeTotals(JSON.parse(raw));
  } catch {
    return createEmptyTotals();
  }
}


function loadTotalsForSelectedMachine() {
  totals = loadTotalsForMachine(selectedMachine.id);
}


function saveTotalsForSelectedMachine() {
  const key = getTotalsKey(selectedMachine.id);
  localStorage.setItem(key, JSON.stringify(totals));
}


function setInvestYen(value, skipSave = false) {
  investYen = Math.round(Number(value) || 0);


  const el = $("investYen");
  if (el) {
    el.value = (investYen === 0 ? "" : String(investYen));
    el.style.color = investYen < 0 ? "#dc2626" : "";
    updateClearButtonForInput(el);
  }


  updateInvestButtons();
  if (!skipSave) saveSession();
}


function setOwnedUseBalls(value, skipSave = false) {
  ownedUseBalls = Math.floor(Number(value) || 0);

  const el = $("ownedUseBalls");
  if (el) {
    el.value = ownedUseBalls === 0 ? "" : String(ownedUseBalls);
    el.style.color = ownedUseBalls < 0 ? "#dc2626" : "";
    updateClearButtonForInput(el);
  }


  if (!skipSave) saveSession();
}

function setOutputUseBalls(value, skipSave = false) {
  outputUseBalls = Math.max(0, Math.floor(Number(value) || 0));

  const el = $("outputUseBalls");
  if (el) {
    el.value = String(outputUseBalls);
    updateClearButtonForInput(el);
  }

  if (!skipSave) saveSession();
}

function selectOutputUseInput() {
  requestAnimationFrame(() => {
    const input = $("outputUseBalls");
    if (!input) return;
    input.focus();
    input.select();
  });
}

function revealInvestSourceBody() {
  const el = $("investSourceBody");
  if (!el) return;

  if (investSourceRevealFrame !== null) {
    cancelAnimationFrame(investSourceRevealFrame);
    investSourceRevealFrame = null;
  }
  if (investSourceRevealCleanup) {
    investSourceRevealCleanup();
  }
  if (investSourceRevealTimer !== null) {
    clearTimeout(investSourceRevealTimer);
    investSourceRevealTimer = null;
  }

  el.classList.remove("is-updating", "is-revealing");
  void el.offsetWidth;

  const cleanup = () => {
    el.classList.remove("is-revealing");
    el.removeEventListener("animationend", cleanup);
    investSourceRevealCleanup = null;
    if (investSourceRevealTimer !== null) {
      clearTimeout(investSourceRevealTimer);
      investSourceRevealTimer = null;
    }
  };

  investSourceRevealFrame = requestAnimationFrame(() => {
    investSourceRevealFrame = null;
    investSourceRevealCleanup = cleanup;
    el.addEventListener("animationend", cleanup);
    el.classList.add("is-revealing");
    investSourceRevealTimer = setTimeout(cleanup, 700);
  });
}

function renderPlaySourceControls(selectOutputInput = false) {
  $("playCashBtn")?.classList.toggle("is-active", playSource === "cash");
  $("playOwnedBtn")?.classList.toggle("is-active", playSource === "owned");
  $("playOutputBtn")?.classList.toggle("is-active", playSource === "output");

  $("investYen")?.closest("label")?.classList.toggle("is-hidden", playSource !== "cash");
  $("calcBtn")?.classList.toggle("is-hidden", playSource !== "cash");
  $("ownedUseLabel")?.classList.toggle("is-hidden", playSource !== "owned");
  $("ownedUseBtn")?.classList.toggle("is-hidden", playSource !== "owned");
  $("outputUseLabel")?.classList.toggle("is-hidden", playSource !== "output");
  $("investCard")?.classList.toggle("is-output-source", playSource === "output");

  if (playSource === "output" && outputUseBalls <= 0) {
    setOutputUseBalls(getDailyHandBalls(), true);
  }
  if (playSource === "output" && selectOutputInput) {
    selectOutputUseInput();
  }

  updateInvestButtons();
  renderConfirmedInvest();
  renderConfirmedOwned();
  renderConfirmedOutput();
}

function setPlaySource(source, selectOutputInput = false, animateBody = false, skipSave = false) {
  const nextSource = ["cash", "owned", "output"].includes(source) ? source : "cash";
  const shouldAnimate = animateBody && playSource !== nextSource;
  playSource = nextSource;
  renderPlaySourceControls(selectOutputInput);
  if (shouldAnimate) revealInvestSourceBody();
  if (!skipSave) saveSession();
}

function selectPlaySourceFromTab(source, selectOutputInput = false) {
  setPlaySource(source, selectOutputInput, true);
  scrollToInvestCard(false);
}


function addInvest(amount) {
  setInvestYen(investYen + amount);
}
function subInvest(amount) {
  setInvestYen(investYen - amount);
}
function updateInvestButtons() {
  const balls = playSource === "owned" || playSource === "output";
  const add500 = $("add500");
  const add1000 = $("add1000");
  const add5000 = $("add5000");
  const sub500 = $("sub500");

  if (add500) add500.textContent = balls ? "+125玉" : "+500円";
  if (add1000) add1000.textContent = balls ? "+250玉" : "+1000円";
  if (add5000) add5000.textContent = balls ? "+1250玉" : "+5000円";
  if (sub500) sub500.textContent = balls ? "-125玉" : "-500円";
}

function addQuickAmount(amount) {
  clearFinalResult();
  if (playSource === "owned") {
    setOwnedUseBalls(ownedUseBalls + amount);
    return;
  }
  setInvestYen(investYen + amount);
}

function clearCurrentPlayInput() {
  clearFinalResult();
  if (playSource === "owned") {
    setOwnedUseBalls(0);
    return;
  }
  setInvestYen(0);
}

function subtractLastLogInvestment(prop, amount) {
  const value = Number(amount) || 0;
  if (!(value > 0)) return;

  for (let i = spinLog.length - 1; i >= 0; i--) {
    const row = spinLog[i];
    const current = Number(row[prop]) || 0;
    if (current <= 0) continue;

    row[prop] = Math.max(0, current - value);
    if (row[prop] === 0) delete row[prop];
    break;
  }
}

function loadTotalsForStoreMachine(store, machineId) {
  const key = getStoreMachineTotalsKey(store, machineId);
  if (!key) return createEmptyTotals();

  const raw = localStorage.getItem(key);
  if (!raw) return createEmptyTotals();

  try {
    return normalizeTotals(JSON.parse(raw));
  } catch {
    return createEmptyTotals();
  }
}

function saveTotalsForStoreMachine(store, machineId, itemTotals) {
  const key = getStoreMachineTotalsKey(store, machineId);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(itemTotals));
}

function resetStoreTotalsForMachine(machineId) {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_STORE_MACHINE_TOTALS_PREFIX) && key.endsWith(`_${machineId}`)) {
      localStorage.removeItem(key);
    }
  }
}

function resetAllStoreMachineTotals() {
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_STORE_MACHINE_TOTALS_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

function undoLastInvest() {
  if (lastConfirmedInvestYen <= 0 && lastConfirmedOwnedBalls <= 0 && lastConfirmedOutputBalls <= 0) {
    alert("戻せる投資・貯玉・持ち玉使用がありません");
    return;
  }

  clearFinalResult();

  if (lastConfirmedInvestYen > 0) {
    confirmedInvestYen -= lastConfirmedInvestYen;
    if (confirmedInvestYen < 0) confirmedInvestYen = 0;
    subtractLastLogInvestment("investK", lastConfirmedInvestYen / 1000);
  }

  if (lastConfirmedOwnedBalls > 0) {
    confirmedOwnedBalls -= lastConfirmedOwnedBalls;
    if (confirmedOwnedBalls < 0) confirmedOwnedBalls = 0;
    addOwnedBalance(lastConfirmedOwnedBalls);
    subtractLastLogInvestment("ownedBalls", lastConfirmedOwnedBalls);
  }

  if (lastConfirmedOutputBalls > 0) {
    confirmedOutputBalls -= lastConfirmedOutputBalls;
    if (confirmedOutputBalls < 0) confirmedOutputBalls = 0;
    subtractLastLogInvestment("outputBalls", lastConfirmedOutputBalls);
  }

  lastConfirmedInvestYen = 0;
  lastConfirmedOwnedBalls = 0;
  lastConfirmedOutputBalls = 0;
  if (investmentsSincePlayBoundary > 0) {
    investmentsSincePlayBoundary -= 1;
  }

  renderConfirmedInvest();
  renderConfirmedOwned();
  renderConfirmedOutput();
  renderSpinLog();
  saveSession();
}


function confirmInvest() {
  const add = Number(investYen);


  if (!Number.isFinite(add) || add === 0) {
    alert("投資額を入力してください");
    return;
  }

  clearFinalResult();
  markSelectedMachinePlayed();
  lastConfirmedInvestYen = add;
  lastConfirmedOwnedBalls = 0;
  lastConfirmedOutputBalls = 0;
  confirmedInvestYen += add;
  if (confirmedInvestYen < 0) confirmedInvestYen = 0;


  const k = add / 1000;


  for (let i = spinLog.length - 1; i >= 0; i--) {
    const row = spinLog[i];
    const a = Number(row.add) || 0;


    if (a > 0) {
      row.investK = (Number(row.investK) || 0) + k;
      if (row.investK < 0) row.investK = 0;
      break;
    }
  }


  setInvestYen(0, true);
  renderConfirmedInvest();
  renderSpinLog();
  investmentsSincePlayBoundary += 1;
  saveSession();
  showInvestmentConfirmedDialog({ cashYen: add });

  if (investFromStop) {
    $("finalCalcCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    scrollToMidCheckButton();
  }


  investFromStop = false;
}


function confirmOwnedUse() {
  const store = normalizeStoreName(selectedStore || $("storeName")?.value);
  if (!store) {
    alert("貯玉を使う店舗を選択してください");
    $("storeName")?.focus();
    return;
  }


  selectedStore = store;
  saveStoreName(selectedStore);
  localStorage.setItem(LS_SELECTED_STORE, selectedStore);


  const add = Math.floor(Number(ownedUseBalls) || 0);
  if (!Number.isFinite(add) || add === 0) {
    alert("使用する貯玉を入力してください");
    return;
  }

  if (add > 0 && add > getOwnedBalance()) {
    alert("登録されている貯玉より多くは使えません");
    return;
  }

  clearFinalResult();
  markSelectedMachinePlayed();
  lastConfirmedInvestYen = 0;
  lastConfirmedOwnedBalls = add;
  lastConfirmedOutputBalls = 0;
  confirmedOwnedBalls += add;
  if (confirmedOwnedBalls < 0) confirmedOwnedBalls = 0;
  addOwnedBalance(-add);


  for (let i = spinLog.length - 1; i >= 0; i--) {
    const row = spinLog[i];
    const a = Number(row.add) || 0;


    if (a > 0) {
      row.ownedBalls = (Number(row.ownedBalls) || 0) + add;
      if (row.ownedBalls < 0) row.ownedBalls = 0;
      if (row.ownedBalls === 0) delete row.ownedBalls;
      break;
    }
  }


  setOwnedUseBalls(0, true);
  renderConfirmedOwned();
  renderSpinLog();
  renderStoreControls();
  investmentsSincePlayBoundary += 1;
  saveSession();
  showInvestmentConfirmedDialog({ ownedBalls: add });

  if (investFromStop) {
    $("finalCalcCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    scrollToMidCheckButton();
  }


  investFromStop = false;
}

function applyOutputUseFromCurrentHand(currentHand, options = {}) {
  const {
    showDialog = false,
    alertWhenNoUse = true,
    scrollAfter = false,
    targetRow = null,
    source = "",
    counter = null,
  } = options;

  if (!Number.isFinite(currentHand) || currentHand < 0) {
    alert("現在の持ち玉を入力してください");
    return false;
  }

  const startHand = Number.isFinite(playStartHandBalls) ? playStartHandBalls : getDailyHandBalls();
  if (!Number.isFinite(startHand) || startHand <= 0) {
    if (source === "end" && currentHand === 0) {
      if (targetRow) delete targetRow.outputBallsFromEnd;
      clearFinalResult();
      setDailyHandBalls(0);
      playStartHandBalls = 0;
      setOutputUseBalls(0, true);
      saveSession();
      return true;
    }

    if (alertWhenNoUse) alert("計算元になる持ち玉がありません");
    return false;
  }

  if (currentHand > startHand) {
    alert("現在の持ち玉が開始時の持ち玉より多くなっています");
    return false;
  }

  const add = startHand - currentHand;
  if (add <= 0) {
    if (alertWhenNoUse) alert("投資された持ち玉はありません");
    if (source === "end" && targetRow) delete targetRow.outputBallsFromEnd;
    clearFinalResult();
    setDailyHandBalls(currentHand);
    playStartHandBalls = currentHand;
    setOutputUseBalls(0, true);
    if (source !== "end") rememberHandBalanceInput(currentHand, counter ?? getCurrentCounterForHandBalanceMemory());
    saveSession();
    return true;
  }

  lastConfirmedInvestYen = 0;
  clearFinalResult();
  markSelectedMachinePlayed();
  lastConfirmedOwnedBalls = 0;
  lastConfirmedOutputBalls = add;
  confirmedOutputBalls += add;

  let appliedRow = targetRow || null;
  if (!appliedRow) {
    for (let i = spinLog.length - 1; i >= 0; i--) {
      const row = spinLog[i];
      const a = Number(row.add) || 0;

      if (a > 0) {
        appliedRow = row;
        break;
      }
    }
  }

  if (appliedRow) {
    appliedRow.outputBalls = (Number(appliedRow.outputBalls) || 0) + add;
    if (source === "end") appliedRow.outputBallsFromEnd = add;
  }

  setOutputUseBalls(0, true);
  renderConfirmedOutput();
  renderSpinLog();
  setDailyHandBalls(currentHand);
  playStartHandBalls = currentHand;
  if (source !== "end") rememberHandBalanceInput(currentHand, counter ?? getCurrentCounterForHandBalanceMemory());
  investmentsSincePlayBoundary += 1;
  saveSession();
  if (showDialog) showInvestmentConfirmedDialog({ outputBalls: add });

  if (scrollAfter && investFromStop) {
    $("finalCalcCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (scrollAfter) {
    scrollToMidCheckButton();
  }

  if (scrollAfter) investFromStop = false;
  return true;
}

function confirmOutputUse() {
  const currentHand = Math.floor(Number(outputUseBalls));
  applyOutputUseFromCurrentHand(currentHand, {
    showDialog: true,
    alertWhenNoUse: true,
    scrollAfter: true,
    counter: getCurrentCounterForHandBalanceMemory(),
  });
}


function calcExpectationBalls(rotationRate, spinCount) {
  const P = selectedMachine.perSpinPayBalls;
  const C = selectedMachine.costPer1kBalls ?? DEFAULT_COST_PER_1K_BALLS;
  const expected = spinCount * (P - C / rotationRate);
  return Math.round(expected);
}


function calcTrueBorder(ownedRatio) {
  const equalBorder = Number(selectedMachine?.border?.[25]);
  const cashBorder = Number(selectedMachine?.border?.[selectedExchange]);
  const ratio = Math.max(0, Math.min(1, Number(ownedRatio) || 0));


  if (!Number.isFinite(equalBorder) || !Number.isFinite(cashBorder)) return null;
  return cashBorder - (cashBorder - equalBorder) * ratio;
}


function calcWeightedAverage(sum, count) {
  const s = Number(sum) || 0;
  const c = Number(count) || 0;
  return c > 0 ? s / c : null;
}


function formatOwnedRatioForTotals(itemTotals) {
  const ratio = calcWeightedAverage(
    itemTotals?.totalOwnedRatioWeighted,
    itemTotals?.totalOwnedRatioCount
  );
  return ratio === null ? "—" : `${Math.round(ratio * 100)}%`;
}


function animateProgressBar(barEl, toValue, duration = 650) {
  if (!barEl) return;


  const startValue = Number(barEl.value) || 0;
  const endValue = Math.max(0, Number(toValue) || 0);


  const start = performance.now();


  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    barEl.value = startValue + (endValue - startValue) * eased;


    if (t < 1) requestAnimationFrame(tick);
  };


  requestAnimationFrame(tick);
}


function hasAnyTotals(t) {
  return (
    (Number(t.totalExpectBalls) || 0) !== 0 ||
    (Number(t.totalSpin) || 0) > 0 ||
    (Number(t.totalInvestYen) || 0) > 0 ||
    (Number(t.totalOwnedBallsUsed) || 0) > 0 ||
    (Number(t.totalHitCount) || 0) > 0
  );
}

function addSessionTotals(itemTotals, data) {
  itemTotals.totalExpectBalls += data.todayBalls;
  itemTotals.totalExpectYen = (Number(itemTotals.totalExpectYen) || 0) + data.todayYen;
  itemTotals.totalSpin += data.spinCount;
  itemTotals.totalInvestYen += data.confirmedInvestYen;
  itemTotals.totalOwnedBallsUsed = (Number(itemTotals.totalOwnedBallsUsed) || 0) + data.ownedBallsUsed;
  itemTotals.totalOutputBallsUsed = (Number(itemTotals.totalOutputBallsUsed) || 0) + data.totalOutputBallsUsed;
  itemTotals.totalKInvested += data.investK;
  itemTotals.totalHitCount += data.outcomeStats.hitCount;
  itemTotals.totalTanCount = (Number(itemTotals.totalTanCount) || 0) + data.outcomeStats.tanCount;
  itemTotals.totalRushCount = (Number(itemTotals.totalRushCount) || 0) + data.outcomeStats.rushCount;
  itemTotals.totalLtCount = (Number(itemTotals.totalLtCount) || 0) + data.outcomeStats.ltCount;
  itemTotals.totalRushPayoutDispSum = (Number(itemTotals.totalRushPayoutDispSum) || 0) + data.outcomeStats.rushPayoutDispSum;
  itemTotals.totalRushPayoutDispCount = (Number(itemTotals.totalRushPayoutDispCount) || 0) + data.outcomeStats.rushPayoutDispCount;
  itemTotals.totalLtPayoutDispSum = (Number(itemTotals.totalLtPayoutDispSum) || 0) + data.outcomeStats.ltPayoutDispSum;
  itemTotals.totalLtPayoutDispCount = (Number(itemTotals.totalLtPayoutDispCount) || 0) + data.outcomeStats.ltPayoutDispCount;
  itemTotals.totalConsumedK += data.consumedBalls;
  itemTotals.totalOwnedRatioWeighted = (Number(itemTotals.totalOwnedRatioWeighted) || 0) + data.ownedRatio * data.spinCount;
  itemTotals.totalOwnedRatioCount = (Number(itemTotals.totalOwnedRatioCount) || 0) + data.spinCount;
  if (data.trueBorder !== null) {
    itemTotals.totalTrueBorderWeighted = (Number(itemTotals.totalTrueBorderWeighted) || 0) + data.trueBorder * data.spinCount;
    itemTotals.totalTrueBorderCount = (Number(itemTotals.totalTrueBorderCount) || 0) + data.spinCount;
  }
}

function getGoalProgress(totalExpectBalls) {
  const totalEvYen = Math.max(0, calcExpectationYenFromBalls(totalExpectBalls));
  const index = calcGoalIndex(totalEvYen);
  const prevGoal = index === 0 ? 0 : GOAL_STEPS[index - 1];
  const nextGoal = GOAL_STEPS[index];
  const span = Math.max(1, nextGoal - prevGoal);
  const value = Math.max(0, Math.min(span, totalEvYen - prevGoal));


  return {
    index,
    max: span,
    value,
    percent: (value / span) * 100,
    nextGoal,
  };
}


function getAllMachineTotals() {
  return MACHINES.reduce((sum, machine) => {
    const itemTotals = machine.id === selectedMachine.id
      ? totals
      : loadTotalsForMachine(machine.id);


    sum.totalExpectBalls += Number(itemTotals.totalExpectBalls) || 0;
    return sum;
  }, createEmptyTotals());
}


function setTotalViewMode(mode, shouldScroll = false) {
  const nextMode = mode === "all" ? "all" : "selected";
  const previousMode = totalViewMode;

  if (nextMode === "all" && previousMode !== "all") {
    totalViewReturnY = window.scrollY;
  }

  totalViewMode = mode === "all" ? "all" : "selected";
  localStorage.setItem(LS_TOTAL_VIEW_MODE, totalViewMode);


  $("totalTabAll")?.classList.toggle("is-active", totalViewMode === "all");
  $("totalTabSelected")?.classList.toggle("is-active", totalViewMode === "selected");
  document.body.classList.toggle("is-total-all-mode", totalViewMode === "all");
  document.body.classList.toggle("is-total-selected-mode", totalViewMode === "selected");


  renderMachineTotalCards();

  if (shouldScroll) {
    $("totalCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (nextMode === "selected" && previousMode === "all" && Number.isFinite(totalViewReturnY)) {
    requestAnimationFrame(() => {
      window.scrollTo({ top: totalViewReturnY, behavior: "auto" });
      totalViewReturnY = null;
    });
  }
}


function renderMachineTotalCards() {
  const wrap = $("machineTotalCards");
  if (!wrap) return;


  wrap.innerHTML = "";


  const selectedHeading = document.querySelector("#totalCard .section-title");
  if (selectedHeading) {
    selectedHeading.textContent = totalViewMode === "all" ? "全機種累計" : "選択機種累計";
  }


  if (totalViewMode === "all") {
    renderAllMachineTotalCard(wrap);
    return;
  }


  const source = [selectedMachine];


  const machinesToShow = source
    .map((machine) => ({
      machine,
      totals: machine.id === selectedMachine.id ? totals : loadTotalsForMachine(machine.id),
    }))
    .filter(({ machine, totals: itemTotals }) => (
      totalViewMode === "selected" ||
      machine.id === selectedMachine.id ||
      hasAnyTotals(itemTotals)
    ));


  for (const { machine, totals: itemTotals } of machinesToShow) {
    const expectBalls = Number(itemTotals.totalExpectBalls) || 0;
    const expectYen = calcExpectationYenFromBalls(expectBalls);
    const ballText = expectBalls > 0 ? `+${fmtInt(expectBalls)}` : fmtInt(expectBalls);
    const yenText = expectYen > 0 ? `+${fmtInt(expectYen)}` : fmtInt(expectYen);
    const hit = Number(itemTotals.totalHitCount) || 0;
    const spin = Number(itemTotals.totalSpin) || 0;
    const avgRate =
      itemTotals.totalConsumedK > 0
        ? (spin / itemTotals.totalConsumedK) * 250
        : 0;
    const avgOwnedRatio = calcWeightedAverage(
      itemTotals.totalOwnedRatioWeighted,
      itemTotals.totalOwnedRatioCount
    );
    const avgTrueBorder = calcWeightedAverage(
      itemTotals.totalTrueBorderWeighted,
      itemTotals.totalTrueBorderCount
    );
    const progress = getGoalProgress(expectBalls);


    const card = document.createElement("article");
    card.className = "machine-total-card";
    if (machine.id === selectedMachine.id) card.classList.add("is-current");


    const title = document.createElement("h3");
    title.className = "machine-total-card__title";
    title.textContent = machine.name;
    card.appendChild(title);


    const addMetricRow = (label, valueBuilder, extraClass = "") => {
      const row = document.createElement("p");
      row.className = `machine-total-card__metric${extraClass ? ` ${extraClass}` : ""}`;
      const labelEl = document.createElement("span");
      labelEl.className = "machine-total-card__metric-label";
      labelEl.textContent = label;
      const colonEl = document.createElement("span");
      colonEl.className = "machine-total-card__metric-colon";
      colonEl.textContent = "：";
      const valueEl = document.createElement("span");
      valueEl.className = "machine-total-card__metric-value";
      valueBuilder(valueEl);
      row.appendChild(labelEl);
      row.appendChild(colonEl);
      row.appendChild(valueEl);
      return row;
    };


    card.appendChild(addMetricRow("累積期待値", (valueEl) => {
      valueEl.textContent = `${ballText}玉（${yenText}円）`;
      setSignedColor(valueEl, expectBalls);
    }, "machine-total-card__metric--ev"));


    card.appendChild(addMetricRow("初当たり確率", (valueEl) => {
      valueEl.textContent = hit > 0 && spin > 0
        ? `${hit} / ${fmtInt(spin)} = 1 / ${Math.round(spin / hit)}`
        : `${hit} / ${fmtInt(spin)} = —`;
    }));


    const outcomeList = document.createElement("div");
    outcomeList.className = "machine-total-card__outcomes";


    const addOutcomeRow = (label, count) => {
      const safeCount = Number(count) || 0;
      if (safeCount <= 0 || hit <= 0) return;
      const pct = hit > 0 ? Math.round((safeCount / hit) * 100) : 0;
      const row = document.createElement("p");
      const name = document.createElement("span");
      name.className = "machine-total-card__outcome-label";
      name.textContent = label;
      const value = document.createElement("span");
      value.className = "machine-total-card__outcome-value";
      value.textContent = `${fmtInt(safeCount)}/${fmtInt(hit)}\uff08${pct}%\uff09`;
      row.appendChild(name);
      row.appendChild(value);
      outcomeList.appendChild(row);
    };


    addOutcomeRow("\u5358\u767a", itemTotals.totalTanCount);
    addOutcomeRow("\u30e9\u30c3\u30b7\u30e5", itemTotals.totalRushCount);
    addOutcomeRow("LT", itemTotals.totalLtCount);
    if (outcomeList.children.length > 0) card.appendChild(outcomeList);


    const rushAvg = itemTotals.totalRushPayoutDispCount > 0
      ? Math.round(itemTotals.totalRushPayoutDispSum / itemTotals.totalRushPayoutDispCount)
      : null;
    const ltAvg = itemTotals.totalLtPayoutDispCount > 0
      ? Math.round(itemTotals.totalLtPayoutDispSum / itemTotals.totalLtPayoutDispCount)
      : null;


    if (rushAvg !== null || ltAvg !== null) {
      if (rushAvg !== null) {
        const rushAvgLine = document.createElement("p");
        rushAvgLine.className = "machine-total-card__payout-average";
        rushAvgLine.textContent = `ラッシュ時平均出玉 ${fmtInt(rushAvg)}`;
        card.appendChild(rushAvgLine);
      }


      if (ltAvg !== null) {
        const ltAvgLine = document.createElement("p");
        ltAvgLine.className = "machine-total-card__payout-average";
        ltAvgLine.textContent = `LT時平均出玉 ${fmtInt(ltAvg)}`;
        card.appendChild(ltAvgLine);
      }
    }


    card.appendChild(addMetricRow("累計投資", (valueEl) => {
      valueEl.textContent =
        `現金${fmtInt(itemTotals.totalInvestYen)}円 / 貯玉${fmtInt(itemTotals.totalOwnedBallsUsed)}玉 / 出玉${fmtInt(itemTotals.totalOutputBallsUsed)}玉`;
    }, "machine-total-card__metric--invest"));

    card.appendChild(addMetricRow("持ち玉比率", (valueEl) => {
      valueEl.textContent = formatOwnedRatioForTotals(itemTotals);
    }));


    card.appendChild(addMetricRow("真ボーダー", (valueEl) => {
      valueEl.textContent = avgTrueBorder !== null
        ? `${fmtRate1(avgTrueBorder)} 回/k`
        : "—";
    }));


    card.appendChild(addMetricRow("累計回転率", (valueEl) => {
      valueEl.appendChild(document.createTextNode(`${fmtRate1(avgRate)} 回/k`));
      if (avgTrueBorder !== null && Number.isFinite(avgTrueBorder)) {
        const rateDiff = avgRate - avgTrueBorder;
        const diffSpan = document.createElement("span");
        diffSpan.className = "rate-diff";
        if (rateDiff > 0) diffSpan.classList.add("is-plus");
        else if (rateDiff < 0) diffSpan.classList.add("is-minus");
        diffSpan.textContent = ` (${rateDiff >= 0 ? "+" : ""}${fmtRate1(rateDiff)})`;
        valueEl.appendChild(diffSpan);
      }
    }));


    const goal = document.createElement("div");
    goal.className = "goal";


    goal.appendChild(addMetricRow("目標期待値", (valueEl) => {
      valueEl.textContent = `${fmtInt(GOAL_STEPS[progress.index])}円（${GOAL_LEVELS[progress.index]}）`;
    }, "goal-title"));


    const bar = document.createElement("progress");
    bar.value = progress.value;
    bar.max = progress.max;
    bar.classList.add(getGoalColorClass(progress.index));
    goal.appendChild(bar);


    goal.appendChild(addMetricRow("達成率", (valueEl) => {
      valueEl.textContent = `${(Math.floor(Math.min(100, progress.percent) * 10) / 10).toFixed(1)} %`;
    }));
    card.appendChild(goal);


    const note = document.createElement("p");
    note.className = "note";
    note.textContent = "※通常ボーダーは選択交換率、真ボーダーは持ち玉比率を加味、期待値は等価換算です";
    card.appendChild(note);


    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "machine-reset-btn";
    reset.dataset.machineId = machine.id;
    reset.textContent = "リセット";
    card.appendChild(reset);


    wrap.appendChild(card);
  }
}


function renderAllMachineTotalCard(wrap) {
  const allTotals = getAllMachineTotals();
  const expectBalls = Number(allTotals.totalExpectBalls) || 0;
  const expectYen = calcExpectationYenFromBalls(expectBalls);
  const ballText = expectBalls > 0 ? `+${fmtInt(expectBalls)}` : fmtInt(expectBalls);
  const yenText = expectYen > 0 ? `+${fmtInt(expectYen)}` : fmtInt(expectYen);
  const progress = getGoalProgress(expectBalls);


  const card = document.createElement("article");
  card.className = "machine-total-card machine-total-card--summary";


  const title = document.createElement("h3");
  title.className = "machine-total-card__title";
  title.textContent = "全機種合計";
  card.appendChild(title);


  const totalLine = document.createElement("p");
  totalLine.className = "machine-total-card__ev";
  totalLine.appendChild(document.createTextNode("累積期待値："));
  const totalValue = document.createElement("span");
  totalValue.textContent = `${ballText}玉（${yenText}円）`;
  setSignedColor(totalValue, expectBalls);
  totalLine.appendChild(totalValue);
  card.appendChild(totalLine);


  const goalTitle = document.createElement("p");
  goalTitle.className = "machine-total-card__goal-label";
    goalTitle.textContent = getGoalLabel(progress.index);
  card.appendChild(goalTitle);


  const goal = document.createElement("div");
  goal.className = "goal";


  const bar = document.createElement("progress");
  bar.value = progress.value;
  bar.max = progress.max;
  bar.classList.add(getGoalColorClass(progress.index));
  goal.appendChild(bar);


  const percent = document.createElement("p");
  percent.textContent = `達成率：${(Math.floor(Math.min(100, progress.percent) * 10) / 10).toFixed(1)} %`;
  goal.appendChild(percent);


  card.appendChild(goal);


  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "machine-reset-btn all-machine-reset-btn";
  reset.dataset.action = "resetAllMachines";
  reset.textContent = "全機種リセット";
  card.appendChild(reset);


  wrap.appendChild(card);
}


function updateView() {
  const totalEl = $("total");
  if (totalEl) {
    const b = totals.totalExpectBalls;


    const yen = calcExpectationYenFromBalls(b);
    const ballText = b > 0 ? `+${fmtInt(b)}` : `${fmtInt(b)}`;
    const yenText  = yen > 0 ? `+${fmtInt(yen)}` : `${fmtInt(yen)}`;


    totalEl.innerText = `累積期待値：${ballText} 玉（${yenText} 円）`;
    setSignedColor(totalEl, b);
  }


  const spinEl = $("totalSpin");
  if (spinEl) {
    const hit = totals.totalHitCount || 0;
    const spin = totals.totalSpin || 0;


    if (hit > 0 && spin > 0) {
      spinEl.innerText =
        `初当たり確率：${hit} / ${fmtInt(spin)} = 1 / ${Math.round(spin / hit)}`;
    } else {
      spinEl.innerText =
        `初当たり確率：${hit} / ${fmtInt(spin)} = —`;
    }
  }


  const invEl = $("totalInvest");
  if (invEl) {
    invEl.innerText =
      `累計投資：現金${fmtInt(totals.totalInvestYen)}円 / 貯玉${fmtInt(totals.totalOwnedBallsUsed)}玉 / 出玉${fmtInt(totals.totalOutputBallsUsed)}玉`;
  }


  const avgRate =
    totals.totalConsumedK > 0
      ? (totals.totalSpin / totals.totalConsumedK) * 250
      : 0;


  const rateEl = $("avgRate");
  if (rateEl) {
    rateEl.innerText = `累計回転率：${fmtRate1(avgRate)} 回/k`;
  }


  const totalEvYenRaw = calcExpectationYenFromBalls(totals.totalExpectBalls);
  const totalEvYen = Math.max(0, totalEvYenRaw);


  currentGoalIndex = calcGoalIndex(totalEvYen);


  const prevGoal =
    currentGoalIndex === 0 ? 0 : GOAL_STEPS[currentGoalIndex - 1];
  const nextGoal = GOAL_STEPS[currentGoalIndex];
  const span = Math.max(1, nextGoal - prevGoal);


  const progressInStep = Math.max(
    0,
    Math.min(span, totalEvYen - prevGoal)
  );


  const goalBar = $("goalBar");
  if (goalBar) {
    goalBar.max = span;
    goalBar.dataset.targetValue = String(progressInStep);
    goalBar.value = Math.min(Number(goalBar.value) || 0, span);


    if (goalBar.dataset.inView === "1") {
      animateProgressBar(goalBar, progressInStep, 650);
    }


    goalBar.classList.remove(
      "goal-blue",
      "goal-yellow",
      "goal-green",
      "goal-red",
      "goal-rainbow"
    );
    goalBar.classList.add(getGoalColorClass(currentGoalIndex));
  }


  const percentEl = $("percent");
  if (percentEl) {
    const pct = (progressInStep / span) * 100;
    percentEl.innerText = `達成率：${(Math.floor(Math.min(100, pct) * 10) / 10).toFixed(1)} %`;
  }


  const goalTitle = document.querySelector(".goal-title");
  if (goalTitle) {
    goalTitle.innerText = getGoalLabel(currentGoalIndex);
  }


const noteEl = document.querySelector(".note");
if (noteEl) {
  noteEl.textContent = "※通常ボーダーは選択交換率、真ボーダーは持ち玉比率を加味、期待値は等価換算です";
}
  renderMachineTotalCards();
}


function renderSpinLog() {
  const list = $("logList");


  const totalSpins = spinLog.reduce((a, x) => a + (Number(x.add) || 0), 0);
  const hitCount = spinLog.filter(x =>
    x.label === "単発" ||
    x.label === "CZ終了" ||
    x.label === "RUSH終了" ||
    x.label === "LT終了"
  ).length;


  const hot = $("hitOverTotal");
  if (hot) {
    let rateText = "—";
    if (hitCount > 0 && totalSpins > 0) {
      rateText = `1/${Math.round(totalSpins / hitCount)}`;
    }
    hot.textContent = `${hitCount} / ${totalSpins}   =   ${rateText}`;
  }


  if (!list) return;
  list.innerHTML = "";


  for (let i = 0; i < spinLog.length; i++) {
    const x = spinLog[i];


    let rangeText = "";


    if (x.label === "開始") {
      const s = Number(x.from);
      rangeText = Number.isFinite(s) ? `${s} ` : "";
    } else {
      const fromText = (x.from === null || x.from === undefined) ? "" : x.from;
      const toText   = (x.to === null || x.to === undefined) ? "" : x.to;


      rangeText =
        toText !== ""
          ? `${fromText} → ${toText}`
          : `${fromText}`;
    }


    const addText =
      x.add > 0
        ? `（+${x.add}回転）`
        : "";


    const investText =
      x.investK && x.investK > 0
        ? ` / ${x.investK.toFixed(1)}k`
        : "";


    const ownedText =
      x.ownedBalls && x.ownedBalls > 0
        ? ` / 貯玉${fmtInt(x.ownedBalls)}玉`
        : "";

    const outputText =
      x.outputBalls && x.outputBalls !== 0
        ? ` / 持ち玉${fmtInt(x.outputBalls)}玉`
        : "";


    const disp = (x.payoutDisp ?? x.payout);
    const hasPayout = disp !== null && disp !== undefined;
    const payoutText =
      !hasPayout
        ? ""
        : ` / 表記出玉：${fmtInt(Number(disp) || 0)}玉`;


    const endBallsText =
      (x.endBalls === null || x.endBalls === undefined)
        ? ""
        : ` / 持ち玉：${x.endBalls}玉`;


    const row = document.createElement("div");
    row.className = "log-item";
    const canAdjustPayout = isFixedPayoutRow(x) && Number.isFinite(Number(x.payout));
    row.innerHTML = `
      <div>
        <div>${x.label}</div>
        <small>
          ${rangeText}${addText}${investText}${ownedText}${outputText}${payoutText}${endBallsText}
        </small>
      </div>
      <div class="log-item__side">
        <small>#${i + 1}</small>
        ${canAdjustPayout ? `<button type="button" class="log-adjust-payout" data-payout-adjust-index="${i}">出玉調整</button>` : ""}
      </div>
    `;
    list.appendChild(row);
  }

  renderFinalCalcPreview();
}


function getTotalSpinsFromLog() {
  return spinLog.reduce((a, x) => a + (Number(x.add) || 0), 0);
}

function getTotalSpinsFromRows(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((a, x) => a + (Number(x.add) || 0), 0);
}

function getCalculatedLogCount() {
  const count = Math.floor(Number(calculatedLogCount) || 0);
  return Math.max(0, Math.min(spinLog.length, count));
}

function getUncalculatedRows() {
  return spinLog.slice(getCalculatedLogCount());
}

function hasConfirmedStopInRows(rows) {
  return (Array.isArray(rows) ? rows : []).some((row) => (
    row?.label === "ヤメ" &&
    Number.isFinite(Number(row.endBalls)) &&
    Number(row.endBalls) >= 0
  ));
}

function getNetPayoutFromLogRow(row) {
  if (!row) return 0;

  const disp = Number(row.payoutDisp);
  if (isFixedPayoutRow(row) && Number.isFinite(disp) && disp > 0) {
    return calcNetFromDisplayedPayout(disp);
  }

  return Number(row.payout) || 0;
}

function getTotalPayoutFromLog() {
  return spinLog.reduce((sum, x) => sum + getNetPayoutFromLogRow(x), 0);
}

function getPlayInputsFromLog() {
  return getPlayInputsFromRows(spinLog);
}

function getPlayInputsFromRows(rows) {
  return (Array.isArray(rows) ? rows : []).reduce((sum, row) => {
    sum.investK += Number(row.investK) || 0;
    sum.ownedBalls += Number(row.ownedBalls) || 0;
    sum.outputBalls += Number(row.outputBalls) || 0;
    return sum;
  }, { investK: 0, ownedBalls: 0, outputBalls: 0 });
}

function getEndDerivedOutputBallsFromLog() {
  return spinLog.reduce((sum, row) => sum + (Number(row.outputBallsFromEnd) || 0), 0);
}

function getSessionStartHandBalls() {
  const row = spinLog.find((item) => Number.isFinite(item?.startHandBalls));
  return Math.max(0, Math.floor(Number(row?.startHandBalls) || 0));
}

function getFinalCalcPreviewInputs() {
  return getFinalCalcInvestInputs();
}

function getActivePlayStartHandBalls() {
  for (let i = spinLog.length - 1; i >= 0; i--) {
    const row = spinLog[i];
    if (row?.label === "開始" && Number.isFinite(row.startHandBalls)) {
      return Math.max(0, Math.floor(Number(row.startHandBalls) || 0));
    }
  }

  if (Number.isFinite(playStartHandBalls)) {
    return Math.max(0, Math.floor(Number(playStartHandBalls) || 0));
  }

  return getDailyHandBalls();
}

function getOutcomeStatsFromLog(rows = spinLog) {
  return (Array.isArray(rows) ? rows : []).reduce((stats, x) => {
    const outcomeType = getRowOutcomeType(x);

    if (outcomeType === "tan") {
      stats.tanCount += 1;
      stats.hitCount += 1;
      return stats;
    }

    if (outcomeType === "rushEnd") {
      stats.rushCount += 1;
      stats.hitCount += 1;

      const disp = Number(x.payoutDisp ?? x.payout);
      if (Number.isFinite(disp) && disp > 0) {
        stats.rushPayoutDispSum += disp;
        stats.rushPayoutDispCount += 1;
      }
      return stats;
    }

    if (outcomeType === "CZEnd" || outcomeType === "czEnd") {
      stats.hitCount += 1;
      return stats;
    }

    if (outcomeType === "ltEnd") {
      stats.rushCount += 1;
      stats.ltCount += 1;
      stats.hitCount += 1;


      const disp = Number(x.payoutDisp ?? x.payout);
      if (Number.isFinite(disp) && disp > 0) {
        stats.ltPayoutDispSum += disp;
        stats.ltPayoutDispCount += 1;
      }
    }


    return stats;
  }, {
    hitCount: 0,
    tanCount: 0,
    rushCount: 0,
    ltCount: 0,
    rushPayoutDispSum: 0,
    rushPayoutDispCount: 0,
    ltPayoutDispSum: 0,
    ltPayoutDispCount: 0,
  });
}


function calc() {
  const calcRows = getUncalculatedRows();
  const spinCount = getTotalSpinsFromRows(calcRows);
  if (spinCount <= 0) { alert("未計算の回転ログがありません"); return; }
  if (payoutConfirmIndex !== -1) { alert("先に「表記出玉」を確定してください"); return; }
  if (endBallsPending) { alert("先に「持ち玉」を確定してください"); return; }
  if (!hasConfirmedStopInRows(calcRows)) {
    alert("ヤメ時の持ち玉が未確定です（ヤメ → 持ち玉を確定）");
    return;
  }


  const {
    investK,
    ownedBalls: ownedBallsUsed,
    outputBalls: outputBallsUsedInput,
  } = getFinalCalcInvestInputs(calcRows);
  if ((!Number.isFinite(investK) || investK <= 0) && ownedBallsUsed <= 0 && outputBallsUsedInput <= 0) {
    alert("総投資または貯玉・持ち玉使用がありません");
    return;
  }


  const cashInvestBalls = investK * 250;
  const consumedBalls = cashInvestBalls + ownedBallsUsed + outputBallsUsedInput;
  const totalOutputBallsUsed = outputBallsUsedInput;
  const playSourceBalls = cashInvestBalls + ownedBallsUsed + totalOutputBallsUsed;
  const ownedRatio = playSourceBalls > 0
    ? Math.max(0, Math.min(1, (ownedBallsUsed + totalOutputBallsUsed) / playSourceBalls))
    : 0;
  const trueBorder = calcTrueBorder(ownedRatio);


  if (!(consumedBalls > 0)) {
    alert("出玉・持ち玉の入力が不正です（消費玉が0以下）");
    return;
  }


  const rotationRate = (spinCount / consumedBalls) * 250;
  const todayBalls = calcExpectationBalls(rotationRate, spinCount);
  const todayYen = calcExpectationYenFromBalls(todayBalls);

  const outcomeStats = getOutcomeStatsFromLog(calcRows);
  const sessionTotals = {
    todayBalls,
    todayYen,
    spinCount,
    confirmedInvestYen,
    ownedBallsUsed,
    totalOutputBallsUsed,
    investK,
    outcomeStats,
    consumedBalls,
    ownedRatio,
    trueBorder,
  };

  addSessionTotals(totals, sessionTotals);

  saveTotalsForSelectedMachine();
  if (selectedStore) {
    const storeTotals = loadTotalsForStoreMachine(selectedStore, selectedMachine.id);
    addSessionTotals(storeTotals, sessionTotals);
    saveTotalsForStoreMachine(selectedStore, selectedMachine.id, storeTotals);
  }

  const borderVal = getCurrentBorder();
  const diffBorder = trueBorder ?? borderVal;
  lastFinalResult = {
    ownedRatio,
    trueBorder,
    rotationRate,
    diffBorder,
    todayYen,
  };
  renderFinalResultView(lastFinalResult);

  calculatedLogCount = spinLog.length;
  hasStarted = false;
  updateStartButton();
  updateView();


  confirmedInvestYen = 0;
  confirmedOwnedBalls = 0;
  confirmedOutputBalls = 0;
  investmentsSincePlayBoundary = 0;
  renderConfirmedInvest();
  renderConfirmedOwned();
  renderConfirmedOutput();
  renderStoreControls();
  saveSession();

  setInvestYen(0);
  lastMidCheckBalls = null;
  lastHandBalanceInput = null;
  scrollToFinalCalcCard();
}


function calcNetFromDisplayedPayout(disp) {
  const v = Math.floor(Number(disp));
  if (!Number.isFinite(v) || v <= 0) return 0;

  const rule = selectedMachine?.payoutRule;
  if (!rule) return calcNetFromFixedDisplayedPayout(v);

  const baseDisp = Math.max(0, Math.floor(Number(rule.baseDisp) || 0));
  const baseNet = Math.max(0, Math.floor(Number(rule.baseNet) || 0));
  const stepDisp = Math.max(0, Math.floor(Number(rule.stepDisp) || 0));
  const stepNet = Math.max(0, Math.floor(Number(rule.stepNet) || 0));
  const unit = Math.max(1, Math.floor(Number(rule.unit) || 15));
  const chunks = [
    stepDisp > 0 && stepNet > 0 ? { disp: stepDisp, net: stepNet } : null,
    baseDisp > 0 && baseNet > 0 ? { disp: baseDisp, net: baseNet } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => b.disp - a.disp);

  let rest = v;
  let net = 0;
  for (const chunk of chunks) {
    const count = Math.floor(rest / chunk.disp);
    if (count <= 0) continue;
    net += count * chunk.net;
    rest -= count * chunk.disp;
  }

  return net + rest - Math.floor(rest / unit);
}

function calcNetFromFixedDisplayedPayout(disp) {
  const v = Math.floor(Number(disp));
  if (!Number.isFinite(v) || v <= 0) return 0;

  return Math.max(0, v - Math.floor(v / 15));
}

function resetAllMachineTotals() {
  if (!confirm("本当に全機種のログを削除しますか？")) return;


  for (const machine of MACHINES) {
    localStorage.setItem(getTotalsKey(machine.id), JSON.stringify(createEmptyTotals()));
  }
  resetAllStoreMachineTotals();

  clearAllDailySessions();
  if (confirmedOwnedBalls > 0) addOwnedBalance(confirmedOwnedBalls);
  clearCurrentDailyState();


  totals = createEmptyTotals();
  currentGoalIndex = 0;


  updateView();
}


function resetMachineTotals(machineId) {
  const machine = MACHINES.find((m) => m.id === machineId);
  if (!machine) return;


  if (machine.id === selectedMachine.id) {
    resetSelectedMachineTotals();
    return;
  }


  if (!confirm(`「${machine.name}」の累積データをリセットしますか？`)) return;

  localStorage.setItem(getTotalsKey(machine.id), JSON.stringify(createEmptyTotals()));
  resetStoreTotalsForMachine(machine.id);
  updateView();
}


function resetSelectedMachineTotals() {
  if (!confirm(`「${selectedMachine.name}」の累積データをリセットしますか？`)) return;

  totals = createEmptyTotals();
  resetStoreTotalsForMachine(selectedMachine.id);

  currentGoalIndex = 0;


  saveTotalsForSelectedMachine();


  const resultEl = $("result");
  if (resultEl) {
    resultEl.innerText = "";
    setResultTierClass("");
  }

  hasStarted = false;
  updateStartButton();

  resetTodayLogState();

  updateView();
}

function resetTodayLogState() {
  setInvestYen(0);
  setOwnedUseBalls(0);
  setOutputUseBalls(0);
  setDailyHandBalls(0);
  setDailyCashOnHand(0);
  if (confirmedOwnedBalls > 0) addOwnedBalance(confirmedOwnedBalls);
  confirmedInvestYen = 0;
  confirmedOwnedBalls = 0;
  confirmedOutputBalls = 0;
  playStartHandBalls = null;
  investmentsSincePlayBoundary = 0;
  calculatedLogCount = 0;

  spinLog = [];
  pendingIndex = -1;
  payoutConfirmIndex = -1;
  fixedPayoutEditIndex = -1;
  endBallsPending = false;
  endBallsYame = null;
  pendingHitHandData = null;
  nextStartCounter = 0;
  hasStarted = false;
  lastMidCheckBalls = null;
  lastHandBalanceInput = null;
  playStartHandBalls = null;


  setCounterInputLocked(false);
  updateStartButton();


  $("counterNow") && ($("counterNow").value = "");
  $("outputUseBalls") && ($("outputUseBalls").value = "");
  $("payoutPanel")?.classList.add("is-hidden");
  $("fixedPayoutPanel")?.classList.add("is-hidden");
  $("endBallsPanel")?.classList.add("is-hidden");
  $("fixedPayoutNow") && ($("fixedPayoutNow").value = "");

  renderConfirmedInvest();
  renderConfirmedOwned();
  renderConfirmedOutput();
  renderOwnedBalance();
  renderSpinLog();
  setLogMode("main");


  const resultEl = $("result");
  if (resultEl) {
    resultEl.innerText = "";
    setResultTierClass("");
  }


  clearFinalResult();

  clearSession();
}

function resetTodayLog() {
  if (!confirm("当日の回転ログをリセットしますか？")) return;
  resetTodayLogState();
}


function calcGoalIndex(totalEvYen) {
  const v = Math.max(0, Number(totalEvYen) || 0);


  for (let i = 0; i < GOAL_STEPS.length; i++) {
    if (v < GOAL_STEPS[i]) return i;
  }
  return GOAL_STEPS.length - 1;
}


const GOAL_STEPS = [
  1_000,
  5_000,
  10_000,
  30_000,
  100_000,
  1_000_000,
];


const GOAL_LEVELS = ["Lv.1", "Lv.2", "Lv.3", "Lv.4", "Lv.5", "Lv.EX"];


function getGoalLabel(index) {
  const safeIndex = Math.max(0, Math.min(GOAL_STEPS.length - 1, Number(index) || 0));
  return `目標期待値：${fmtInt(GOAL_STEPS[safeIndex])}円（${GOAL_LEVELS[safeIndex]}）`;
}


function getGoalColorClass(index) {
  switch (index) {
    case 0: return "goal-blue";
    case 1: return "goal-yellow";
    case 2: return "goal-green";
    case 3: return "goal-red";
    default: return "goal-rainbow";
  }
}




function enableInvestFastTap(areaSelector) {
  const area = document.querySelector(areaSelector);
  if (!area) return;


  let suppressUntil = 0;
  let allowSyntheticClick = false;


  area.addEventListener(
    "touchend",
    (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;


      const now = Date.now();
      e.preventDefault();


      suppressUntil = now + 700;


      allowSyntheticClick = true;
      btn.click();
      allowSyntheticClick = false;
    },
    { passive: false }
  );


  area.addEventListener(
    "click",
    (e) => {
      const now = Date.now();
      if (allowSyntheticClick) return;
      if (now < suppressUntil) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );


  area.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false });
  area.addEventListener("gesturechange", (e) => e.preventDefault(), { passive: false });
  area.addEventListener("gestureend", (e) => e.preventDefault(), { passive: false });
}


function updateHitOptionButtons() {
  const opts = selectedMachine.hitOptions || ["tan", "rushEnd", "ltEnd"];

  const map = {
    charge: $("btnCharge"),
    tan: $("btnTan"),
    CZEnd: $("btnCzEnd"),
    czEnd: $("btnCzEnd"),
    rushEnd: $("btnRushEnd"),
    ltEnd: $("btnLtEnd"),
  };

  Object.values(map).forEach((btn) => btn && btn.classList.add("is-hidden"));

  for (const key of opts) {
    const btn = map[key];
    if (!btn) continue;
    btn.textContent = getHitOptionLabel(key);
    btn.classList.remove("is-hidden");
  }
}


function skipInvest() {
  setInvestYen(0);


  if (investFromStop) {
    $("finalCalcCard")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    scrollToLogCard();
  }


  investFromStop = false;
}


function showMidCheck() {
  const playInputs = getPlayInputsFromRows(getUncalculatedRows());
  if (!(confirmedInvestYen > 0 || confirmedOwnedBalls > 0 || confirmedOutputBalls > 0 || playInputs.investK > 0 || playInputs.ownedBalls > 0 || playInputs.outputBalls > 0)) {
    alert("投資額または貯玉・持ち玉使用を追加してください");
    scrollToInvestCard();
    return;
  }

  midCheckTempCounter = getMidCheckCurrentCounter();
  if (midCheckTempCounter === undefined) return;

  $("midRateVal").textContent = "—";
  setText("midMeterBorderValue", "—");
  $("midDiffVal").textContent = "—";
  $("midDiffVal")?.classList.remove("is-plus", "is-minus");
  clearMidJudgeInline();
  $("midFormulaPreview")?.classList.add("is-hidden");
  if ($("midFormulaPreview")) $("midFormulaPreview").textContent = "";


  const needle = $("midMeterNeedle");
  if (needle) needle.style.left = "50%";


  $("midCheckCard")?.classList.remove("is-hidden");
  $("midOverlay")?.classList.remove("is-hidden");


  const inputWrap = $("midBallsNow")?.closest("label");
  const btn = $("midBallsConfirm");
  const currentHand = getDailyHandBalls();

  if (currentHand > 0) {
    inputWrap?.classList.remove("is-hidden");
    btn?.classList.remove("is-hidden");
    prepareMidBallsInput();
    return;
  }

  inputWrap?.classList.add("is-hidden");
  btn?.classList.add("is-hidden");
  confirmMidCheck(0);
}

function confirmMidCheck(forcedEndBalls = null) {
  if (forcedEndBalls && typeof forcedEndBalls === "object") {
    forcedEndBalls = null;
  }

  let tempEndBalls = forcedEndBalls;
  const inputWrap = $("midBallsNow")?.closest("label");
  const btn = $("midBallsConfirm");

  if (tempEndBalls === null && getDailyHandBalls() > 0) {
    const value = Number($("midBallsNow")?.value);
    if (!Number.isFinite(value) || value < 0) {
      alert("現在の持ち玉（玉）を入力してください");
      return;
    }
    tempEndBalls = Math.floor(value);
    if (!applyOutputUseFromCurrentHand(tempEndBalls, { alertWhenNoUse: false, counter: midCheckTempCounter })) {
      return;
    }
  }

  tempEndBalls = Math.max(0, Math.floor(Number(tempEndBalls) || 0));
  inputWrap?.classList.add("is-hidden");
  btn?.classList.add("is-hidden");

  lastMidCheckBalls = tempEndBalls;


  const result = calcMidRotationRateB(tempEndBalls);
  if (result === undefined) return;
  if (result === null) {
    alert("途中経過を計算できません");
    return;
  }


  const { spinCount, rotationRate, trueBorder, formulaText } = result;
  const border = trueBorder;
  updateMidRateMeter(rotationRate, border);

  const diff = Number.isFinite(border) ? rotationRate - border : null;


  $("midRateVal").textContent   = `${fmtRate1(rotationRate)} 回/k`;
  setText("midMeterBorderValue", `${fmtRate1(border)}`);
  const formulaEl = $("midFormulaPreview");
  if (formulaEl) {
    formulaEl.textContent = formulaText || "";
    formulaEl.classList.toggle("is-hidden", !formulaText);
  }


  const diffEl = $("midDiffVal");
  if (diffEl) {
    if (diff !== null && Number.isFinite(diff)) {
      diffEl.textContent = `${diff >= 0 ? "+" : ""}${fmtRate1(diff)}`;
      diffEl.classList.remove("is-plus", "is-minus");
      if (diff > 0) diffEl.classList.add("is-plus");
      else if (diff < 0) diffEl.classList.add("is-minus");
    } else {
      diffEl.textContent = "—";
      diffEl.classList.remove("is-plus", "is-minus");
    }
  }

  setResultTierClass(getRateTierClass(rotationRate, border));
  updateMidJudgeInline(rotationRate, border);
  showMidJudgePopup(rotationRate, border);
}

function getMidJudgeResult(rotationRate, border) {
  const isGood = Number.isFinite(rotationRate) && Number.isFinite(border) && rotationRate >= border;
  return {
    isGood,
    mark: isGood ? "○" : "×",
    text: isGood ? "打つべし！" : "打つのは危険",
  };
}

function updateMidJudgeInline(rotationRate, border) {
  const inline = $("midJudgeInline");
  const mark = $("midJudgeInlineMark");
  const text = $("midJudgeInlineText");
  if (!inline || !mark || !text) return;

  const result = getMidJudgeResult(rotationRate, border);
  inline.classList.remove("is-good", "is-bad", "is-hidden");
  inline.classList.add(result.isGood ? "is-good" : "is-bad");
  mark.textContent = result.mark;
  text.textContent = result.text;
}

function clearMidJudgeInline() {
  const inline = $("midJudgeInline");
  if (!inline) return;
  inline.classList.remove("is-good", "is-bad");
  inline.classList.add("is-hidden");
}

function showMidJudgePopup(rotationRate, border) {
  const popup = $("midJudgePopup");
  const mark = $("midJudgeMark");
  const text = $("midJudgeText");
  if (!popup || !mark || !text) return;

  const result = getMidJudgeResult(rotationRate, border);
  popup.classList.remove("is-good", "is-bad", "is-hidden");
  popup.classList.add(result.isGood ? "is-good" : "is-bad");
  mark.textContent = result.mark;
  text.textContent = result.text;
  $("midJudgeClose")?.focus();
}


function getMidCheckCurrentCounter() {
  const input = $("counterNow");
  const raw = input?.value?.trim();

  if (raw !== "") {
    const v = Number(raw);
    if (!Number.isFinite(v) || v < nextStartCounter) {
      alert(`回転数が不正です（開始 ${nextStartCounter} 以上）`);
      input?.focus();
      return undefined;
    }
    return Math.floor(v);
  }

  return nextStartCounter;
}


function promptMidCheckCounter() {
  const v = prompt(
    `現在のデータカウンター回転数を入力してください\n（開始 ${nextStartCounter} 以上）`
  );


  if (v === null) return null;


  const n = Number(v);
  if (!Number.isFinite(n) || n < nextStartCounter) {
    alert("回転数が不正です");
    return null;
  }


  return Math.floor(n);
}


function getMidCheckSpinCount(tempCounter, rows = spinLog) {
  const activeRows = Array.isArray(rows) ? rows : [];
  const confirmedSpins = getTotalSpinsFromRows(activeRows);

  if (activeRows.length === 0) return confirmedSpins;

  const last = activeRows[activeRows.length - 1];


  if (last.label === "開始") {
    const add = tempCounter - last.from;
    return confirmedSpins + Math.max(0, add);
  }


  return confirmedSpins;
}


function calcMidRotationRateB(tempEndBalls) {
  let counter = Number.isFinite(midCheckTempCounter) ? midCheckTempCounter : getMidCheckCurrentCounter();
  if (counter === undefined) return undefined;

  if (counter === null) {
    counter = promptMidCheckCounter();
    if (counter === null) return undefined;
  }


  const calcRows = getUncalculatedRows();
  const spinCount = getMidCheckSpinCount(counter, calcRows);
  if (spinCount <= 0) return null;

  const playInputs = getPlayInputsFromRows(calcRows);
  const investK = Number(playInputs.investK) || (confirmedInvestYen / 1000);
  const ownedBallsUsed = Number(playInputs.ownedBalls) || confirmedOwnedBalls;
  const outputBallsUsedInput = Number(playInputs.outputBalls) || confirmedOutputBalls;
  const cashInvestBalls = investK * 250;
  const totalOutputBallsUsed = outputBallsUsedInput;
  const consumedBalls = cashInvestBalls + ownedBallsUsed + outputBallsUsedInput;
  const handInvestBalls = ownedBallsUsed + totalOutputBallsUsed;

  if (consumedBalls <= 0) return null;

  const playSourceBalls = cashInvestBalls + ownedBallsUsed + totalOutputBallsUsed;
  const ownedRatio = playSourceBalls > 0
    ? Math.max(0, Math.min(1, (ownedBallsUsed + totalOutputBallsUsed) / playSourceBalls))
    : 0;

  return {
    spinCount,
    rotationRate: (spinCount / consumedBalls) * 250,
    trueBorder: calcTrueBorder(ownedRatio),
    formulaText: formatMidCheckFormula({ spinCount, investK, handInvestBalls }),
  };
}

function formatMidCheckFormula({ spinCount, investK, handInvestBalls }) {
  const terms = [];
  if (Number.isFinite(investK) && investK !== 0) terms.push(`現金${fmtRate1(investK)}k`);
  if (Number.isFinite(handInvestBalls) && handInvestBalls !== 0) terms.push(`持ち玉${fmtInt(handInvestBalls)}玉`);
  if (!terms.length) return "";
  return `${fmtInt(spinCount)}回 / ( ${terms.join(" + ")} )`;
}


function updateMidRateMeter(rotationRate, border) {
  const meter = $("midRateMeter");
  const needle = $("midMeterNeedle");
  const minEl = $("midMeterMin");
  const maxEl = $("midMeterMax");


  if (!meter || !needle) return;


  if (!Number.isFinite(rotationRate) || !Number.isFinite(border)) {
    meter.classList.add("is-hidden");
    return;
  }


  meter.classList.remove("is-hidden");


  const range = 5;
  const min = border - range;
  const max = border + range;


  if (minEl) minEl.textContent = `${(Math.floor(min * 10) / 10).toFixed(1)}`;
  if (maxEl) maxEl.textContent = `${(Math.floor(max * 10) / 10).toFixed(1)}`;
  setText("midMeterBorderValue", fmtRate1(border));


  let pct = ((rotationRate - min) / (max - min)) * 100;
  pct = Math.max(0, Math.min(100, pct));


  needle.style.left = `${pct}%`;
}


function updateFinalRateMeter(rotationRate, border) {
  const meter = $("finalRateMeter");
  const needle = $("finalMeterNeedle");
  const minEl = $("finalMeterMin");
  const maxEl = $("finalMeterMax");
  if (!meter || !needle || !minEl || !maxEl) return;


  if (!Number.isFinite(rotationRate) || !Number.isFinite(border)) {
    meter.classList.add("is-hidden");
    return;
  }


  const range = 5;
  const min = border - range;
  const max = border + range;


  minEl.textContent = fmtRate1(min);
  maxEl.textContent = fmtRate1(max);
  setText("finalMeterBorderValue", fmtRate1(border));


  let pct = ((rotationRate - min) / (max - min)) * 100;
  pct = Math.max(0, Math.min(100, pct));


  needle.style.left = `${pct}%`;
}


function closeMidCheck() {
  $("midCheckCard")?.classList.add("is-hidden");
  $("midOverlay")?.classList.add("is-hidden");
  closeMidJudgePopup();
  midCheckTempCounter = null;

  const needle = $("midMeterNeedle");
  if (needle) needle.style.left = "50%";
  setText("midMeterBorderValue", "—");
  clearMidJudgeInline();
}

function closeMidJudgePopup() {
  $("midJudgePopup")?.classList.add("is-hidden");
}

function syncInvestInput() {
  const val = Number($("investYen")?.value);
  if (!Number.isFinite(val)) return;
  clearFinalResult();
  setInvestYen(val, true);
  queueSaveSession();
}

function syncOwnedUseInput() {
  const input = $("ownedUseBalls");
  const val = Number(input?.value);
  if (!Number.isFinite(val)) return;
  clearFinalResult();
  ownedUseBalls = Math.floor(val || 0);
  if (input) {
    input.style.color = ownedUseBalls < 0 ? "#dc2626" : "";
    updateClearButtonForInput(input);
  }
  queueSaveSession();
}

function syncOutputUseInput() {
  const input = $("outputUseBalls");
  const val = Number(input?.value);
  if (!Number.isFinite(val)) return;
  clearFinalResult();
  outputUseBalls = Math.max(0, Math.floor(val || 0));
  if (input) updateClearButtonForInput(input);
  queueSaveSession();
}

function init() {
  renderAppVersion();
  initClearableInputs();
  initNumberInputWheelGuard();
  initMachineSelect();
  checkDailyLogRollover();
  renderMachineInfo(false);
  updateHitOptionButtons();


  $("btnStart")?.addEventListener("click", addStartEvent);
  $("btnHit")?.addEventListener("click", addHitEvent);
  $("btnTan")?.addEventListener("click", () => confirmHitOutcome("tan"));
  $("btnCzEnd")?.addEventListener("click", () => confirmHitOutcome("CZEnd"));
  $("btnRushEnd")?.addEventListener("click", () => confirmHitOutcome("rushEnd"));
  $("btnLtEnd")?.addEventListener("click", () => confirmHitOutcome("ltEnd"));
  $("btnUndo")?.addEventListener("click", undoSpinEventUnified);
  $("btnUndo2")?.addEventListener("click", undoSpinEventUnified);
  $("btnStop")?.addEventListener("click", addStopEvent);
  $("btnHitHandConfirm")?.addEventListener("click", confirmHitHand);
  $("btnEndBallsConfirm")?.addEventListener("click", confirmEndBalls);
  $("btnPayoutConfirm")?.addEventListener("click", confirmPayout);
  $("btnFixedPayoutConfirm")?.addEventListener("click", confirmFixedPayoutAdjust);
  $("resetLogBtn")?.addEventListener("click", resetTodayLog);
  $("btnCharge")?.addEventListener("click", () => confirmHitOutcome("charge"));
  $("logList")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-payout-adjust-index]");
    if (!btn) return;
    startFixedPayoutAdjust(Number(btn.dataset.payoutAdjustIndex));
  });


  $("add500")?.addEventListener("click", () => addQuickAmount(playSource === "cash" ? 500 : 125));
  $("add1000")?.addEventListener("click", () => addQuickAmount(playSource === "cash" ? 1000 : 250));
  $("add5000")?.addEventListener("click", () => addQuickAmount(playSource === "cash" ? 5000 : 1250));
  $("sub500")?.addEventListener("click", () => addQuickAmount(playSource === "cash" ? -500 : -125));
  $("ownedUseBtn")?.addEventListener("click", confirmOwnedUse);
  $("outputUseBtn")?.addEventListener("click", confirmOutputUse);
  $("playCashBtn")?.addEventListener("click", () => selectPlaySourceFromTab("cash"));
  $("playOwnedBtn")?.addEventListener("click", () => selectPlaySourceFromTab("owned"));
  $("playOutputBtn")?.addEventListener("click", () => selectPlaySourceFromTab("output", true));
  $("skipInvest")?.addEventListener("click", skipInvest);
  $("clearInvest")?.addEventListener("click", clearCurrentPlayInput);


  $("btnMidCheck")?.addEventListener("click", showMidCheck);
  $("midCheckClose")?.addEventListener("click", closeMidCheck);
  $("midOverlay")?.addEventListener("click", closeMidCheck);
  $("midBallsConfirm")?.addEventListener("click", () => confirmMidCheck());
  $("midJudgeClose")?.addEventListener("click", closeMidJudgePopup);

  $("calcBtn")?.addEventListener("click", confirmInvest);
  $("finalCalcBtn")?.addEventListener("click", () => {
    flashFinalCalcButton();
    calc();
  });
  $("undoInvest")?.addEventListener("click", undoLastInvest);


  $("resetBtn")?.addEventListener("click", resetSelectedMachineTotals);
  $("machineTotalCards")?.addEventListener("click", (e) => {
    const allReset = e.target.closest("[data-action='resetAllMachines']");
    if (allReset) {
      resetAllMachineTotals();
      return;
    }


    const btn = e.target.closest(".machine-reset-btn");
    if (!btn) return;
    resetMachineTotals(btn.dataset.machineId);
  });
  $("totalTabAll")?.addEventListener("click", () => setTotalViewMode("all", true));
  $("totalTabSelected")?.addEventListener("click", () => setTotalViewMode("selected", false));


  $("investYen")?.addEventListener("input", syncInvestInput);
  $("investYen")?.addEventListener("change", syncInvestInput);

  $("ownedUseBalls")?.addEventListener("input", syncOwnedUseInput);
  $("ownedUseBalls")?.addEventListener("change", syncOwnedUseInput);
  $("outputUseBalls")?.addEventListener("input", syncOutputUseInput);
  $("outputUseBalls")?.addEventListener("change", syncOutputUseInput);

  ["counterNow", "payoutNow", "fixedPayoutNow", "hitHandNow", "endBallsNow", "midBallsNow"].forEach((id) => {
    $(id)?.addEventListener("input", queueSaveSession);
    $(id)?.addEventListener("change", queueSaveSession);
  });
  $("dailyCashSaveBtn")?.addEventListener("click", saveDailyCashInput);
  $("ownedBalanceSaveBtn")?.addEventListener("click", saveOwnedBalanceInput);
  $("appDialogInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmAppDialogForm();
    }
  });
  $("appDialogSave")?.addEventListener("click", confirmAppDialogForm);
  $("appDialogCancel")?.addEventListener("click", hideAppDialog);


  $("storeSelect")?.addEventListener("change", () => {
    selectStore($("storeSelect").value);
  });
  $("storePickerOpen")?.addEventListener("click", () => {
    if (selectedStore) return;
    openStorePicker();
  });
  $("storePickerClose")?.addEventListener("click", closeStorePicker);
  $("storePickerOverlay")?.addEventListener("click", closeStorePicker);
  $("appDialogOk")?.addEventListener("click", hideAppDialog);
  $("appDialogOverlay")?.addEventListener("click", hideAppDialog);
  $("storeSearchInput")?.addEventListener("input", renderStorePickerList);
  $("storePickerModal")?.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest("[data-store-delete]");
    if (deleteBtn) {
      deleteStore(deleteBtn.dataset.storeDelete);
      return;
    }


    const selectBtn = e.target.closest("[data-store-name]");
    if (!selectBtn) return;
    selectStore(selectBtn.dataset.storeName);
    closeStorePicker();
  });
  $("storeChangeBtn")?.addEventListener("click", openStorePicker);
  $("storeAddBtn")?.addEventListener("click", startStoreAdd);
  $("storeSaveBtn")?.addEventListener("click", saveNewStore);
  $("storeCancelBtn")?.addEventListener("click", cancelStoreAdd);
  $("storeName")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveNewStore();
    }
  });


  enableInvestFastTap(".invest-buttons");


  selectedStore = normalizeStoreName(localStorage.getItem(LS_SELECTED_STORE));
  if (selectedStore) saveStoreName(selectedStore);
  const initialStoreExchange = getStoreExchange(selectedStore);
  if (initialStoreExchange !== null) {
    setSelectedExchange(initialStoreExchange, false, false);
  } else if (selectedStore) {
    saveStoreExchange(selectedStore, selectedExchange);
  }
  renderStoreControls();
  setPlaySource(playSource, false, false, true);


  const restored = loadSession();
  if (restored) {
    renderSpinLog();
    renderFinalResultView();
    if (payoutConfirmIndex !== -1) $("payoutPanel")?.classList.remove("is-hidden");
    if (fixedPayoutEditIndex !== -1) $("fixedPayoutPanel")?.classList.remove("is-hidden");
    if (pendingHitHandData) $("hitHandPanel")?.classList.remove("is-hidden");
    if (endBallsPending) {
      $("endBallsPanel")?.classList.remove("is-hidden");
      if (getInputValue("endBallsNow") === "") prepareEndBallsInput(false);
    }
    setLogMode(pendingIndex !== -1 ? "afterHit" : "main");
  } else {
    resetSpinLog();
    confirmedInvestYen = 0;
    confirmedOwnedBalls = 0;
    confirmedOutputBalls = 0;
    investmentsSincePlayBoundary = 0;
    renderConfirmedInvest();
    renderConfirmedOwned();
    renderConfirmedOutput();
  }


  currentGoalIndex = 0;
  updateStartButton();
  setTotalViewMode(totalViewMode);
  updateView();
  updateHitOptionButtons();
  renderMachineInfo(false);
  renderAffiliateLinks();
  initBackupControls();


  const goalBar = $("goalBar");
  if (goalBar && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          goalBar.dataset.inView = "1";
          const target = Number(goalBar.dataset.targetValue) || 0;
          animateProgressBar(goalBar, target, 650);
        } else {
          goalBar.dataset.inView = "0";
        }
      }
    }, { threshold: 0.25 });


    io.observe(goalBar);
  } else if (goalBar) {
    goalBar.dataset.inView = "1";
    animateProgressBar(goalBar, Number(goalBar.dataset.targetValue) || 0, 650);
  }


  if (restored || hasActiveDailySession()) {
    saveSession();
  }

  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }


  $("machinePickerOpen")?.addEventListener("click", openMachinePicker);
  $("machinePickerClose")?.addEventListener("click", closeMachinePicker);
  $("machinePickerOverlay")?.addEventListener("click", closeMachinePicker);
  $("machineSearchInput")?.addEventListener("input", () => {
    renderMachinePickerList();
    resetMachinePickerListScroll();
  });
  $("machinePickerModal")?.addEventListener("click", (e) => {
    const tab = e.target.closest(".machine-picker-tab");
    if (tab) {
      document.querySelectorAll(".machine-picker-tab").forEach((el) => {
        el.classList.toggle("is-active", el === tab);
      });
      renderMachinePickerList();
      resetMachinePickerListScroll();
      return;
    }


    const item = e.target.closest(".machine-picker-item");
    if (!item) return;
    const sel = $("machineSelect");
    if (!sel) return;
    sel.value = item.dataset.machineId;
    sel.dispatchEvent(new Event("change"));
    closeMachinePicker();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMachinePicker();
      closeStorePicker();
    }
  });


  $("favoriteBtn")?.addEventListener("click", () => {
    const favBtn = $("favoriteBtn");
    toggleFavoriteMachine(selectedMachine.id);


    const sel = $("machineSelect");
    if (sel) {
      const currentId = selectedMachine.id;
      sel.innerHTML = "";


      for (const m of getSortedMachines()) {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = isFavoriteMachine(m.id) ? `★ ${m.name}` : m.name;
        sel.appendChild(opt);
      }


      sel.value = currentId;
    }


    renderFavoriteButton();
    favBtn?.classList.remove("is-sparkling");
    void favBtn?.offsetWidth;
    favBtn?.classList.add("is-sparkling");
    window.setTimeout(() => favBtn?.classList.remove("is-sparkling"), 560);
    renderMachinePickerList();
    updateRushEndAdjustUI();
  });


  setInterval(checkDailyLogRollover, 60 * 60 * 1000);
  setInterval(flushSessionNow, 30 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      flushSessionNow();
    } else {
      checkDailyLogRollover();
    }
  });
  window.addEventListener("pagehide", flushSessionNow);
  window.addEventListener("beforeunload", flushSessionNow);
  document.addEventListener("freeze", flushSessionNow);
}


document.addEventListener("DOMContentLoaded", init);
