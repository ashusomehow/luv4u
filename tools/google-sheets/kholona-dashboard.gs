/**
 * Kholona daily money dashboard for Google Sheets.
 *
 * You type each day's ad spend in the "Ad spend" tab. Everything else comes from Kholona's own database
 * (Supabase), so revenue is real payments, not what Meta reports: Meta misses buyers who come back later
 * by typing the URL. The script saves your ad spend to Supabase too (table ad_spend), and refreshes every hour.
 *
 * Set up once (docs/DASHBOARD.md has the same steps with pictures in words):
 *   1. Create a new Google Sheet. Extensions -> Apps Script. Delete what is there, paste this whole file, save.
 *   2. Reload the Sheet. A "Kholona" menu appears. Kholona -> Set up the dashboard (allow access when asked).
 *   3. Paste the access key (REPORT_TOKEN from Vercel) when asked. Done.
 * This file is plain ASCII on purpose (special characters are written as \uXXXX), so it survives any copy and paste.
 * Each morning: type yesterday's spend from Ads Manager in "Ad spend" (and Meta's purchase count if you like).
 */

const TZ = 'Asia/Kolkata';
const KEY_PROP = 'KHOLONA_REPORT_KEY';
const TAB = { settings: 'Settings', spend: 'Ad spend', daily: 'Daily', dash: 'Dashboard', chart: 'Chart data' };
const INK = '#3a1f2b', PINK = '#e0457b', SOFT = '#fdf0f4', LINE = '#f1d6df', GOOD_BG = '#e3f5e9', GOOD = '#1e7b45', BAD_BG = '#fde2e1', BAD = '#b3261e', MEH_BG = '#fff4d6';
const MONEY = '"\u20b9"#,##0', MONEY2 = '"\u20b9"#,##0.00', X = '0.00"x"', PCT = '0%', INT = '#,##0', DATE = 'ddd d mmm yyyy';

/* ------------------------------------------------------------------ menu */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Kholona')
    .addItem('Refresh now', 'refresh')
    .addItem('Set access key\u2026', 'setKey')
    .addSeparator()
    .addItem('Set up the dashboard (or repair it)', 'setup')
    .addToUi();
}

function setKey() {
  const ui = SpreadsheetApp.getUi();
  const answer = ui.prompt('Kholona access key', 'Paste REPORT_TOKEN (Vercel \u2192 your project \u2192 Settings \u2192 Environment Variables).', ui.ButtonSet.OK_CANCEL);
  if (answer.getSelectedButton() !== ui.Button.OK) return false;
  const key = answer.getResponseText().trim();
  if (key.length < 24) { ui.alert('That key looks too short. Copy the whole REPORT_TOKEN value.'); return false; }
  PropertiesService.getScriptProperties().setProperty(KEY_PROP, key);
  return true;
}

/** Builds (or repairs) every tab, the charts and the hourly refresh. Your typed ad spend and settings are kept. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(TZ);
  ss.setSpreadsheetLocale('en_IN');
  buildSettings_(ss);
  buildSpend_(ss);
  buildDaily_(ss);
  buildChartData_(ss);
  buildDashboard_(ss);
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'refresh').forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('refresh').timeBased().everyHours(1).create();
  ss.setActiveSheet(ss.getSheetByName(TAB.dash));
  let hasKey = !!PropertiesService.getScriptProperties().getProperty(KEY_PROP);
  if (!hasKey) { try { hasKey = setKey(); } catch (e) { /* no dialog when run from the script editor */ } }
  if (hasKey) refresh();
  else status_(ss, 'Almost there: Kholona \u2192 Set access key\u2026, then Kholona \u2192 Refresh now.');
}

/* --------------------------------------------------------------- refresh */

/** Saves the typed ad spend to Supabase, then reloads the daily numbers. Runs every hour, and from the menu. */
function refresh() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName(TAB.dash) || !ss.getSheetByName(TAB.daily)) { status_(ss, 'Run Kholona \u2192 Set up the dashboard first.'); return; }
  const key = PropertiesService.getScriptProperties().getProperty(KEY_PROP);
  if (!key) { status_(ss, 'Add the access key: Kholona \u2192 Set access key\u2026'); return; }
  const settings = ss.getSheetByName(TAB.settings);
  const base = String(settings.getRange('B3').getValue() || 'https://kholona.in').trim().replace(/\/+$/, '');
  const days = Math.max(7, Math.min(400, Math.floor(Number(settings.getRange('B7').getValue()) || 120)));
  const spendTab = ss.getSheetByName(TAB.spend);
  addMissingDates_(spendTab);

  const pushed = pushSpend_(spendTab, base, key);
  if (pushed.error) { status_(ss, pushed.error); return; }

  const res = UrlFetchApp.fetch(base + '/api/admin/daily?days=' + days, { headers: { Authorization: 'Bearer ' + key }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) { status_(ss, explain_(res)); return; }
  const rows = JSON.parse(res.getContentText()).rows || [];
  writeDaily_(ss.getSheetByName(TAB.daily), rows);
  settings.getRange('B10').setValue(new Date());
  status_(ss, 'OK \u00b7 ' + rows.length + ' days loaded \u00b7 ad spend saved for ' + pushed.saved + ' day(s)' + (pushed.skipped ? ' \u00b7 ' + pushed.skipped + ' cell(s) in Ad spend are not numbers, so they were skipped' : ''));
}

function explain_(res) {
  const code = res.getResponseCode();
  let msg = '';
  try { msg = JSON.parse(res.getContentText()).error || ''; } catch (e) { msg = res.getContentText().slice(0, 120); }
  if (code === 401) return 'The access key was refused. Kholona \u2192 Set access key\u2026 and paste REPORT_TOKEN again.';
  if (code === 503) return 'The website says: ' + msg + ' (run the Supabase migration, see docs/DASHBOARD.md).';
  return 'Could not reach the website (' + code + '): ' + msg;
}

/** Sends every row of "Ad spend" to Supabase. A blank spend cell clears that day there too: the sheet is the source of truth. */
function pushSpend_(sheet, base, key) {
  const last = sheet.getLastRow();
  if (last < 2) return { saved: 0, skipped: 0 };
  const values = sheet.getRange(2, 1, last - 1, 4).getValues();
  const spend = [];
  let skipped = 0;
  values.forEach((r) => {
    if (!(r[0] instanceof Date)) return;
    const date = Utilities.formatDate(r[0], TZ, 'yyyy-MM-dd');
    const amount = toNumber_(r[1]);
    if (amount === undefined) { skipped++; return; }
    const meta = toNumber_(r[2]);
    spend.push({ date: date, spend: amount, metaPurchases: meta === undefined ? null : Math.round(meta), note: String(r[3] || '').slice(0, 200) });
  });
  let saved = 0;
  for (let i = 0; i < spend.length; i += 400) {
    const res = UrlFetchApp.fetch(base + '/api/admin/daily', {
      method: 'post', contentType: 'application/json', payload: JSON.stringify({ spend: spend.slice(i, i + 400) }),
      headers: { Authorization: 'Bearer ' + key }, muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) return { error: 'Saving ad spend failed. ' + explain_(res) };
    saved += JSON.parse(res.getContentText()).saved || 0;
  }
  return { saved: saved, skipped: skipped };
}

/** A number, null for a blank cell, or undefined for something that is not a number ("Rs 1,200" counts as 1200). */
function toNumber_(v) {
  if (v === '' || v === null) return null;
  if (typeof v === 'number') return v >= 0 ? v : undefined;
  const n = Number(String(v).replace(/[\u20b9,\s]/g, ''));
  return isFinite(n) && n >= 0 ? n : undefined;
}

const dateOf_ = (ymd) => Utilities.parseDate(ymd, TZ, 'yyyy-MM-dd');
const todayYmd_ = () => Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
const addDays_ = (ymd, n) => Utilities.formatDate(new Date(dateOf_(ymd).getTime() + n * 864e5 + 12 * 36e5), TZ, 'yyyy-MM-dd');

/** Keeps a row for every day up to today at the top of "Ad spend", newest first. */
function addMissingDates_(sheet) {
  const today = todayYmd_();
  const first = sheet.getLastRow() >= 2 ? sheet.getRange(2, 1).getValue() : '';
  let newest = first instanceof Date ? Utilities.formatDate(first, TZ, 'yyyy-MM-dd') : addDays_(today, -61);
  const missing = [];
  while (newest < today) { newest = addDays_(newest, 1); missing.unshift([dateOf_(newest)]); }
  if (!missing.length) return;
  sheet.insertRowsBefore(2, missing.length);
  sheet.getRange(2, 1, missing.length, 1).setValues(missing).setNumberFormat(DATE);
  sheet.getRange(2, 2, missing.length, 1).setNumberFormat(MONEY2);
  sheet.getRange(2, 3, missing.length, 1).setNumberFormat(INT);
}

/** Writes the numbers from Supabase into "Daily"; the money columns are formulas, so typed spend shows at once. */
function writeDaily_(sheet, rows) {
  const last = sheet.getLastRow();
  if (last >= 2) sheet.getRange(2, 1, last - 1, 26).clearContent();
  if (!rows.length) return;
  const out = rows.map((r, i) => {
    const n = i + 2;
    const look = (col) => `=IFNA(IF(VLOOKUP(A${n},'${TAB.spend}'!$A:$C,${col},FALSE)="","",VLOOKUP(A${n},'${TAB.spend}'!$A:$C,${col},FALSE)),"")`;
    return [
      dateOf_(r.day), look(2), `=IF(B${n}="","",B${n}*(1+GST))`, r.sales, r.revenue, `=E${n}*(1-FEE)`, `=F${n}-N(C${n})`,
      `=IF(N(C${n})>0,F${n}/C${n},"")`, `=IF(AND(N(C${n})>0,D${n}>0),C${n}/D${n},"")`, look(3), `=IF(AND(J${n}<>"",D${n}>0),J${n}/D${n},"")`,
      r.ad_sales, `=D${n}-L${n}`, r.visitors, r.ad_visitors, r.makers, r.gifts_made, r.unlock_views, r.pay_clicks, r.checkouts,
      `=IF(N${n}>0,D${n}/N${n},"")`, r.birthday_sales, r.sorry_sales, `=D${n}-V${n}-W${n}`, r.creator_sales, r.free_unlocks,
    ];
  });
  sheet.getRange(2, 1, out.length, 26).setValues(out);
}

function status_(ss, text) {
  const s = ss.getSheetByName(TAB.settings);
  if (s) s.getRange('B11').setValue(text);
}

/* ------------------------------------------------------------- the tabs */

function tab_(ss, name, index) {
  return ss.getSheetByName(name) || ss.insertSheet(name, Math.min(index, ss.getSheets().length));
}

function header_(range) {
  range.setFontWeight('bold').setBackground(INK).setFontColor('#ffffff').setVerticalAlignment('middle').setWrap(true);
}

function buildSettings_(ss) {
  const s = tab_(ss, TAB.settings, 4);
  s.getRange('A1').setValue('Kholona dashboard \u00b7 settings').setFontSize(14).setFontWeight('bold').setFontColor(INK);
  const rows = [
    ['Website', 'https://kholona.in', 'Where Kholona runs.'],
    ['GST Meta adds to ad spend', 0.18, 'Meta bills 18% GST on top of what Ads Manager shows. Set 0% if you claim it back.'],
    ['Razorpay fee (incl. GST)', 0.0236, '2% + 18% GST on the fee. Change it if your plan differs.'],
    ['Price', 199, 'Used for break-even before there are sales.'],
    ['Days to load', 120, 'At most 400.'],
  ];
  rows.forEach((r, i) => {
    const row = 3 + i;
    s.getRange(row, 1).setValue(r[0]).setFontWeight('bold');
    if (s.getRange(row, 2).getValue() === '') s.getRange(row, 2).setValue(r[1]);
    s.getRange(row, 3).setValue(r[2]).setFontColor('#8a6b78');
  });
  s.getRange('B4:B5').setNumberFormat('0.00%');
  s.getRange('B6').setNumberFormat(MONEY);
  s.getRange('A10').setValue('Last refreshed').setFontWeight('bold');
  s.getRange('B10').setNumberFormat('d mmm yyyy, h:mm am/pm');
  s.getRange('A11').setValue('Status').setFontWeight('bold');
  s.setColumnWidth(1, 230); s.setColumnWidth(2, 260); s.setColumnWidth(3, 520);
  ss.setNamedRange('GST', s.getRange('B4'));
  ss.setNamedRange('FEE', s.getRange('B5'));
  ss.setNamedRange('PRICE', s.getRange('B6'));
}

function buildSpend_(ss) {
  const s = tab_(ss, TAB.spend, 1);
  s.getRange('A1:D1').setValues([['Date', 'Ad spend \u20b9 (as in Ads Manager, before GST)', 'Meta purchases (optional)', 'Note (optional)']]);
  header_(s.getRange('A1:D1'));
  s.setFrozenRows(1);
  s.setColumnWidth(1, 150); s.setColumnWidth(2, 250); s.setColumnWidth(3, 190); s.setColumnWidth(4, 320);
  s.getRange('B1').setNote('Each morning, type yesterday\u2019s "Amount spent" from Ads Manager (all campaigns). Leave a day blank if you did not run ads.');
  s.getRange('C1').setNote('Purchases (or "Website purchases") Ads Manager shows for that day. The dashboard compares it with real sales to show how much Meta misses.');
  s.getRange('B2:B').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).setHelpText('A number, like 812.40').build());
  s.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).setHelpText('A whole number').build());
  s.getRange('A2:A').setNumberFormat(DATE);
  s.getRange('B2:B').setNumberFormat(MONEY2);
  s.getRange('B2:C').setBackground(SOFT);
  addMissingDates_(s);
}

const DAILY_HEADERS = [
  ['Date', ''], ['Ad spend (Ads Manager)', 'Typed in "Ad spend"'], ['Ad spend incl. GST', 'What the ads really cost'],
  ['Sales', 'Real paid orders (Razorpay), by India date'], ['Revenue', 'What buyers paid'], ['Revenue after fees', 'After the Razorpay fee'],
  ['Profit', 'Revenue after fees minus ad spend incl. GST'], ['Real ROAS', 'Revenue after fees \u00f7 ad spend incl. GST. Above 1.0x = profit'],
  ['Cost per sale', 'Ad spend incl. GST \u00f7 sales'], ['Meta purchases', 'Typed in "Ad spend" (optional)'], ['Meta saw', 'Meta purchases \u00f7 real sales'],
  ['Sales from ad clicks', 'Buyer arrived from a Meta ad click'], ['Other sales', 'Direct, WhatsApp, creators, or an ad click not kept'],
  ['Visitors', 'People on the site (not gift links)'], ['Visitors from ads', ''], ['Started making', 'Opened the gift maker'], ['Gifts made', ''],
  ['Saw the price', 'Reached the unlock page'], ['Tapped pay', ''], ['Checkouts', 'Payment windows opened'], ['Visitor \u2192 sale', 'Sales \u00f7 visitors'],
  ['Birthday sales', ''], ['Sorry sales', ''], ['Other gift sales', 'Other gift types, or a deleted gift'], ['Creator-code sales', ''], ['Free-code unlocks', 'Not revenue'],
];

function buildDaily_(ss) {
  const s = tab_(ss, TAB.daily, 2);
  s.getRange(1, 1, 1, 26).setValues([DAILY_HEADERS.map((h) => h[0])]);
  DAILY_HEADERS.forEach((h, i) => { if (h[1]) s.getRange(1, i + 1).setNote(h[1]); });
  header_(s.getRange(1, 1, 1, 26));
  s.setRowHeight(1, 42);
  s.setFrozenRows(1); s.setFrozenColumns(1);
  s.setColumnWidth(1, 130);
  const fmt = { A: DATE, B: MONEY, C: MONEY, D: INT, E: MONEY, F: MONEY, G: MONEY, H: X, I: MONEY, J: INT, K: PCT, L: INT, M: INT, N: INT, O: INT, P: INT, Q: INT, R: INT, S: INT, T: INT, U: '0.0%', V: INT, W: INT, X: INT, Y: INT, Z: INT };
  Object.keys(fmt).forEach((c) => s.getRange(c + '2:' + c).setNumberFormat(fmt[c]));
  s.getRange('C2:H').setBackground(SOFT);
  const roas = s.getRange('H2:H'), profit = s.getRange('G2:G');
  s.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(1).setBackground(BAD_BG).setFontColor(BAD).setRanges([roas]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThanOrEqualTo(1.5).setBackground(GOOD_BG).setFontColor(GOOD).setRanges([roas]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(1, 1.5).setBackground(MEH_BG).setRanges([roas]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(0).setFontColor(BAD).setRanges([profit]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThan(0).setFontColor(GOOD).setRanges([profit]).build(),
  ]);
}

/** A hidden tab the charts read: the last 30 days oldest first, the funnel, the gift mix and the funnel's step rates. */
function buildChartData_(ss) {
  const s = tab_(ss, TAB.chart, 5);
  s.clear();
  s.getRange('A1:H1').setValues([['Date', 'Ad spend incl. GST', 'Revenue after fees', 'Profit', 'Real ROAS', 'Sales from ad clicks', 'Other sales', 'Break-even (1.0x)']]);
  s.getRange('A2').setFormula(`=IFERROR(SORT(FILTER({'${TAB.daily}'!A2:A,'${TAB.daily}'!C2:C,'${TAB.daily}'!F2:F,'${TAB.daily}'!G2:G,'${TAB.daily}'!H2:H,'${TAB.daily}'!L2:L,'${TAB.daily}'!M2:M},'${TAB.daily}'!A2:A>=TODAY()-30,'${TAB.daily}'!A2:A<=TODAY()),1,TRUE),"")`);
  s.getRange('H2').setFormula('=ARRAYFORMULA(IF(A2:A32="","",1))');
  s.getRange('A2:A').setNumberFormat('d mmm');
  const d = TAB.dash;
  s.getRange('J1:K7').setValues([
    ['Step (last 7 days)', 'People'],
    ['Visitors', `='${d}'!D17`], ['Gifts made', `='${d}'!D19`], ['Saw the price', `='${d}'!D20`], ['Tapped pay', `='${d}'!D21`], ['Paid', `='${d}'!D11`], ['', ''],
  ]);
  s.getRange('M1:N4').setValues([
    ['Gift (last 30 days)', 'Sales'],
    ['Birthday', `=SUMIFS('${TAB.daily}'!V:V,'${TAB.daily}'!A:A,">="&'${d}'!E5,'${TAB.daily}'!A:A,"<="&'${d}'!E6)`],
    ['Sorry', `=SUMIFS('${TAB.daily}'!W:W,'${TAB.daily}'!A:A,">="&'${d}'!E5,'${TAB.daily}'!A:A,"<="&'${d}'!E6)`],
    ['Other', `=SUMIFS('${TAB.daily}'!X:X,'${TAB.daily}'!A:A,">="&'${d}'!E5,'${TAB.daily}'!A:A,"<="&'${d}'!E6)`],
  ]);
  // how many people get through each step (last 7 days); the smallest is the biggest leak
  s.getRange('P1:Q5').setValues([
    ['Step', 'Get through'],
    ['visitors who make a gift', '=IF(K2>0,K3/K2,1)'],
    ['gift makers who reach the price', '=IF(K3>0,K4/K3,1)'],
    ['people who see the price and tap pay', '=IF(K4>0,K5/K4,1)'],
    ['people who tap pay and finish paying', '=IF(K5>0,K6/K5,1)'],
  ]);
  s.hideSheet();
}

function buildDashboard_(ss) {
  const s = tab_(ss, TAB.dash, 0);
  s.getCharts().forEach((c) => s.removeChart(c));
  s.clear();
  s.setHiddenGridlines(true);
  const D = `'${TAB.daily}'`;
  const sum = (col, c) => `=SUMIFS(${D}!$${col}:$${col},${D}!$A:$A,">="&${c}$5,${D}!$A:$A,"<="&${c}$6)`;

  s.getRange('A1').setValue('Kholona \u00b7 daily money').setFontSize(20).setFontWeight('bold').setFontColor(INK);
  s.getRange('A2').setFormula(`="Updated "&IF('${TAB.settings}'!B10="","never (Kholona \u2192 Refresh now)",TEXT('${TAB.settings}'!B10,"d mmm, h:mm am/pm"))&" \u00b7 revenue is real payments, not Meta\u2019s count \u00b7 "&'${TAB.settings}'!B11`).setFontColor('#8a6b78');

  s.getRange('A4:F4').setValues([['', 'Today so far', 'Yesterday', 'Last 7 days', 'Last 30 days', 'This month']]);
  header_(s.getRange('A4:F4'));
  s.getRange('A5:F6').setValues([
    ['from', '=TODAY()', '=TODAY()-1', '=TODAY()-7', '=TODAY()-30', '=EOMONTH(TODAY(),-1)+1'],
    ['to', '=TODAY()', '=TODAY()-1', '=TODAY()-1', '=TODAY()-1', '=TODAY()'],
  ]);
  s.getRange('A5:F6').setFontColor('#a38f98').setFontSize(9).setNumberFormat('d mmm');

  const metrics = [
    ['Ad spend (incl. GST)', (c) => sum('C', c), MONEY],
    ['Revenue after fees', (c) => sum('F', c), MONEY],
    ['Profit', (c) => `=${c}8-${c}7`, MONEY],
    ['Real ROAS', (c) => `=IF(${c}7>0,${c}8/${c}7,"\u2013")`, X],
    ['Sales', (c) => sum('D', c), INT],
    ['Cost per sale', (c) => `=IF(AND(${c}7>0,${c}11>0),${c}7/${c}11,"\u2013")`, MONEY],
    ['Revenue per sale', (c) => `=IF(${c}11>0,${sum('E', c).slice(1)}/${c}11,"\u2013")`, MONEY],
    ['Sales from ad clicks', (c) => sum('L', c), INT],
    ['Meta purchases (typed)', (c) => sum('J', c), INT],
    ['Meta saw', (c) => `=IF(AND(${c}11>0,${c}15>0),${c}15/${c}11,"\u2013")`, PCT],
    ['Visitors', (c) => sum('N', c), INT],
    ['Visitor \u2192 sale', (c) => `=IF(${c}17>0,${c}11/${c}17,"\u2013")`, '0.0%'],
    ['Gifts made', (c) => sum('Q', c), INT],
    ['Saw the price', (c) => sum('R', c), INT],
    ['Tapped pay', (c) => sum('S', c), INT],
    ['Free-code unlocks', (c) => sum('Z', c), INT],
  ];
  metrics.forEach((m, i) => {
    const row = 7 + i;
    s.getRange(row, 1).setValue(m[0]).setFontWeight('bold').setFontColor(INK);
    ['B', 'C', 'D', 'E', 'F'].forEach((c, j) => s.getRange(row, 2 + j).setFormula(m[1](c)).setNumberFormat(m[2]));
  });
  s.getRange('A7:F22').setBorder(null, null, true, null, null, true, LINE, SpreadsheetApp.BorderStyle.SOLID);
  s.getRange('B7:F22').setHorizontalAlignment('right');
  s.getRange('A8:F10').setFontWeight('bold').setFontSize(12);
  const profitRow = s.getRange('B9:F9'), roasRow = s.getRange('B10:F10');
  s.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(0).setBackground(BAD_BG).setFontColor(BAD).setRanges([profitRow]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThan(0).setBackground(GOOD_BG).setFontColor(GOOD).setRanges([profitRow]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberLessThan(1).setBackground(BAD_BG).setFontColor(BAD).setRanges([roasRow]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThanOrEqualTo(1.5).setBackground(GOOD_BG).setFontColor(GOOD).setRanges([roasRow]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenNumberBetween(1, 1.5).setBackground(MEH_BG).setRanges([roasRow]).build(),
  ]);

  // what the numbers say, in plain words (D = last 7 days, E = last 30 days)
  const C = `'${TAB.chart}'`;
  const prev7 = `SUMIFS(${D}!F:F,${D}!A:A,">="&(TODAY()-14),${D}!A:A,"<="&(TODAY()-8))`;
  const perSale = `IF(E11>0,E8/E11,PRICE*(1-FEE))`;
  const best = `SORT(FILTER({${D}!A2:A,${D}!G2:G},${D}!A2:A>=E5,${D}!A2:A<=E6),2,FALSE)`;
  const insights = [
    `=IF(D7=0,"Type your ad spend in the \u2018Ad spend\u2019 tab to see profit and ROAS.",IF(D10>=1.5,"\u2705 Last 7 days made money: real ROAS "&TEXT(D10,"0.0")&"x, profit \u20b9"&TEXT(D9,"#,##0")&". Try raising the budget of the best ad set by about 20%.",IF(D10>=1,"\u{1f7e1} Last 7 days are near break-even: real ROAS "&TEXT(D10,"0.0")&"x. Test new hooks or creatives before spending more.","\u{1f534} Last 7 days lost \u20b9"&TEXT(-D9,"#,##0")&" (real ROAS "&TEXT(D10,"0.0")&"x). Pause the weakest ad, or fix the biggest leak below.")))`,
    `="Break-even: one sale leaves you \u20b9"&TEXT(${perSale},"#,##0")&" after fees, so keep cost per purchase in Ads Manager under \u20b9"&TEXT(${perSale}/(1+GST),"#,##0")&" (\u20b9"&TEXT(${perSale},"#,##0")&" once GST is added)."`,
    `=IF(D11=0,"No sales in the last 7 days yet.",IF(D15=0,"Type Meta\u2019s purchase count in \u2018Ad spend\u2019 (column C) to see how many real sales Meta misses.","Meta counted "&TEXT(D15,"0")&" of your "&TEXT(D11,"0")&" real sales in the last 7 days ("&TEXT(D16,"0%")&"). Judge ads by Real ROAS here, not Meta\u2019s ROAS."))`,
    `="Revenue, last 7 days vs the 7 before: "&IF(${prev7}=0,"not enough history yet.",TEXT(D8/${prev7}-1,"+0%;-0%")&" (\u20b9"&TEXT(D8,"#,##0")&" vs \u20b9"&TEXT(${prev7},"#,##0")&").")`,
    `=IFERROR("Best day in the last 30: "&TEXT(INDEX(${best},1,1),"ddd d mmm")&", profit \u20b9"&TEXT(INDEX(${best},1,2),"#,##0")&".","")`,
    `="Funnel, last 7 days: "&TEXT(D17,"#,##0")&" visitors \u2192 "&TEXT(D19,"#,##0")&" made a gift \u2192 "&TEXT(D20,"#,##0")&" saw the price \u2192 "&TEXT(D21,"#,##0")&" tapped pay \u2192 "&TEXT(D11,"#,##0")&" paid."`,
    `=IF(D17=0,"","Biggest leak: only "&TEXT(MIN(${C}!Q2:Q5),"0%")&" of "&INDEX(${C}!P2:P5,MATCH(MIN(${C}!Q2:Q5),${C}!Q2:Q5,0))&". Work on that step first.")`,
    `=IF(E11=0,"","Last 30 days: "&TEXT(E14/E11,"0%")&" of sales came from a Meta ad click; birthday "&TEXT(${C}!N2/E11,"0%")&", sorry "&TEXT(${C}!N3/E11,"0%")&", other "&TEXT(${C}!N4/E11,"0%")&" of sales.")`,
  ];
  s.getRange('H4').setValue('What the numbers say').setFontWeight('bold').setFontColor(PINK).setFontSize(13);
  insights.forEach((f, i) => {
    const r = s.getRange(5 + i, 8, 1, 7);
    r.merge().setWrap(true).setVerticalAlignment('top');
    s.getRange(5 + i, 8).setFormula(f);
    s.setRowHeight(5 + i, 40);
  });
  s.getRange('H5:N12').setBackground(SOFT).setFontColor(INK);
  s.setColumnWidth(1, 190);
  for (let c = 2; c <= 6; c++) s.setColumnWidth(c, 112);
  s.setColumnWidth(7, 24);
  for (let c = 8; c <= 14; c++) s.setColumnWidth(c, 92);

  // charts
  const cd = ss.getSheetByName(TAB.chart);
  const chart = (type, ranges, row, col, title, options) => {
    let b = s.newChart().setChartType(type).setPosition(row, col, 0, 0).setOption('title', title).setOption('width', 600).setOption('height', 320)
      .setOption('legend', { position: 'bottom' }).setOption('titleTextStyle', { color: INK, fontSize: 14, bold: true });
    ranges.forEach((r) => { b = b.addRange(cd.getRange(r)); });
    Object.keys(options || {}).forEach((k) => { b = b.setOption(k, options[k]); });
    s.insertChart(b.build());
  };
  chart(Charts.ChartType.COLUMN, ['A1:A32', 'B1:C32'], 25, 1, 'Ad spend vs revenue, last 30 days', { colors: ['#b9a3ad', PINK], vAxis: { format: '\u20b9#,##0' } });
  chart(Charts.ChartType.LINE, ['A1:A32', 'E1:E32', 'H1:H32'], 25, 8, 'Real ROAS by day (above the dashed line = profit)', { colors: [PINK, '#8a6b78'], series: { 1: { lineDashStyle: [6, 4] } }, interpolateNulls: false });
  chart(Charts.ChartType.COLUMN, ['A1:A32', 'F1:G32'], 42, 1, 'Sales by day: from an ad click vs everything else', { isStacked: true, colors: [PINK, '#f3b6c8'] });
  chart(Charts.ChartType.BAR, ['J1:K6'], 42, 8, 'Funnel, last 7 days', { colors: [PINK], legend: { position: 'none' } });
  chart(Charts.ChartType.PIE, ['M1:N4'], 59, 1, 'Sales by gift, last 30 days', { colors: [PINK, '#a855f7', '#f3b6c8'], pieHole: 0.45 });
  chart(Charts.ChartType.COLUMN, ['A1:A32', 'D1:D32'], 59, 8, 'Profit by day, last 30 days', { colors: [GOOD], vAxis: { format: '\u20b9#,##0' } });
}
