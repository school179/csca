/* CSCA 学习站 — приложение без сборки и зависимостей. Данные: data/*.js */
(function () {
'use strict';

const V = window.VOCAB, TH = window.THEORY, PAS = window.PASSAGES || {};
const SUBJ = {
  m: { zh: '数学', ru: 'Математика', n: 48, sec: 75 },
  p: { zh: '物理', ru: 'Физика', n: 48, sec: 75 },
  l: { zh: '理科中文', ru: 'Технический китайский', n: 80, sec: 67.5 }
};
const DECKS = { q: 'Язык условий', m: 'Математика', p: 'Физика', l: 'Китайский' };
const L = 'ABCDEF', DAY = 864e5, INT = [0, 1, 3, 7, 14, 30];

/* ───── задачи ───── */
const TASKS = [];
(function () {
  const cnt = {};
  const add = b => { const t = { s: b[0], t: b[1], q: b[2], o: b[3], r: b[4] || '', e: b[5] || '', p: b[6] || null, src: b[7] || '' };
    cnt[t.s] = (cnt[t.s] || 0) + 1; t.id = t.s + '-' + cnt[t.s]; TASKS.push(t); };
  (window.TASKS_BASE || []).forEach(add); (window.TASKS_EXTRA || []).forEach(add); (window.TASKS_REAL || []).forEach(add);
})();
const TI = Object.fromEntries(TASKS.map(t => [t.id, t]));
function taskTopics(s) {
  const seen = []; TASKS.forEach(t => { if (t.s === s && !seen.includes(t.t)) seen.push(t.t); });
  const order = (TH[s] || []).map(x => x.t);
  return seen.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
}
const TOPIC_RU = {}; Object.values(TH).forEach(arr => arr.forEach(t => { TOPIC_RU[t.t] = t.ru; }));
Object.assign(TOPIC_RU, { '识解汉字': 'Иероглифы: чтение и значение', '选词填空': 'Выбор слова', '辨析词语': 'Синонимы',
  '补全语句': 'Закончить предложение', '选词成段': 'Порядок предложений', '阅读理解': 'Чтение текста' });

/* ───── хранилище (только этот браузер) ───── */
const KEY = 'csca-study-v1';
let S;
function blank() { return { srs: {}, day: { d: '', n: 0 }, newPerDay: 20, ts: {}, wrong: [], th: {}, set: { ruby: false, sound: true, dir: 'zh' } }; }
try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = blank(); }
S.set = Object.assign(blank().set, S.set || {});
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function dayCheck() { if (S.day.d !== today()) S.day = { d: today(), n: 0 }; }

/* ───── словарь для подсказок ───── */
const DICT = {}; let MAXL = 2;
V.forEach(v => { if (v.zh.length >= 2 && /[㐀-鿿]/.test(v.zh) && !/\s/.test(v.zh) && !DICT[v.zh]) { DICT[v.zh] = v; MAXL = Math.max(MAXL, v.zh.length); } });
const CJK = /[㐀-鿿]/;
function scan(text, cb) {
  let i = 0;
  while (i < text.length) {
    let m = null;
    if (CJK.test(text[i])) for (let l = Math.min(MAXL, text.length - i); l >= 2; l--) { const w = text.substr(i, l); if (DICT[w]) { m = w; break; } }
    cb(m, i, m ? m.length : 1); i += m ? m.length : 1;
  }
}
function termsIn(text) { const out = []; scan(text, (m) => { if (m && !out.includes(DICT[m])) out.push(DICT[m]); }); return out; }
function markTerms(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => CJK.test(n.nodeValue) && !n.parentElement.closest('.term,.nomark,rt,.lx') ? 1 : 2 });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const t = node.nodeValue, frag = document.createDocumentFragment(); let buf = '', hit = false;
    scan(t, (m, i, len) => {
      if (!m) { buf += t[i]; return; }
      if (buf) { frag.append(buf); buf = ''; }
      const v = DICT[m], sp = document.createElement('span');
      sp.className = 'term' + (lvl(v.id) >= 3 ? ' known' : ''); sp.dataset.w = v.id; sp.tabIndex = 0;
      if (S.set.ruby) sp.innerHTML = '<ruby>' + esc(m) + '<rt>' + esc(v.py) + '</rt></ruby>'; else sp.textContent = m;
      frag.append(sp); hit = true;
    });
    if (hit) { if (buf) frag.append(buf); node.replaceWith(frag); }
  });
}

/* ───── утилиты ───── */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = s => esc(s).replace(/\[\[(.+?)\|(.+?)\]\]/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
const plain = s => String(s).replace(/\[\[(.+?)\|(.+?)\]\]/g, '$1/$2');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const mmss = ms => { const t = Math.max(0, Math.round(ms / 1000)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const pct = (c, w) => (c + w) ? Math.round(c / (c + w) * 100) : null;

/* ───── озвучка ───── */
const TTS = 'speechSynthesis' in window;
let zhVoice = null;
function loadVoices() { try { const vs = speechSynthesis.getVoices(); zhVoice = vs.find(v => /zh[-_]CN/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)) || null; } catch (e) {} }
if (TTS) { loadVoices(); try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {} }
function speak(text) {
  if (!TTS) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain(text).replace(/（\s*）/g, ''));
    u.lang = 'zh-CN'; u.rate = 0.85; if (zhVoice) u.voice = zhVoice; speechSynthesis.speak(u);
  } catch (e) {}
}
const ICON_SPK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const spkBtn = (text, label) => TTS ? `<button class="ib" data-act="speak" data-arg="${esc(text)}" aria-label="${label || 'Озвучить'}" title="${label || 'Озвучить'}">${ICON_SPK}</button>` : '';

/* ───── интервальное повторение ───── */
function lvl(id) { const c = S.srs[id]; return c ? c.b : -1; }
function dueIds(deck) { const now = Date.now(); return Object.keys(S.srs).map(Number).filter(id => S.srs[id].due <= now && (!deck || V[id].d.includes(deck))).sort((a, b) => S.srs[a].due - S.srs[b].due); }
function newIds(deck) { return V.filter(v => !S.srs[v.id] && (!deck || v.d.includes(deck))).map(v => v.id); }
function newLeft() { dayCheck(); return Math.max(0, S.newPerDay - S.day.n); }
function deckStats(deck) {
  const ids = V.filter(v => !deck || v.d.includes(deck)).map(v => v.id);
  let learned = 0, learning = 0; ids.forEach(id => { const b = lvl(id); if (b >= 3) learned++; else if (b >= 0) learning++; });
  return { total: ids.length, learned, learning, fresh: ids.length - learned - learning };
}
function rate(id, r) {
  const now = Date.now(); dayCheck();
  let c = S.srs[id];
  if (!c) { c = S.srs[id] = { b: 0, due: now, n: 0 }; S.day.n++; }
  c.n++;
  if (r === 0) { c.b = 0; c.due = now + 6e5; }
  else if (r === 1) { c.b = Math.max(1, Math.min(c.b, 2)); c.due = now + DAY; }
  else { c.b = Math.min(5, c.b + 1); c.due = now + DAY * INT[c.b]; }
  save();
}
function addToSrs(id) { if (!S.srs[id]) { S.srs[id] = { b: 0, due: Date.now(), n: 0 }; } else S.srs[id].due = Date.now(); save(); }

/* ───── состояние интерфейса ───── */
let A = { view: 'home', s: 'm', tab: 'kon', deck: '', topic: null, fc: null, run: null, rd: null, res: null, q: '', confirm: false };
let tick = null;

/* ───── шаблоны ───── */
function bar(p) { return `<span class="bar"><i style="width:${p || 0}%"></i></span>`; }
function chips(words, title) {
  if (!words.length) return '';
  return `<div class="words"><div class="wh"><b>${title || 'Слова'}</b> <span class="muted">${words.length}</span></div><div class="wl">${words.map(v =>
    `<button class="chip lv${Math.max(0, lvl(v.id))}" data-act="pop" data-arg="${v.id}"><span class="zh">${esc(v.zh)}</span><small>${esc(v.py)}</small><em>${esc(v.ru)}</em></button>`).join('')}</div></div>`;
}

function viewHome() {
  dayCheck();
  const due = dueIds('').length, nl = Math.min(newLeft(), newIds('').length), qs = deckStats('q');
  const subj = Object.entries(SUBJ).map(([k, v]) => {
    const tt = TASKS.filter(t => t.s === k); let c = 0, w = 0; tt.forEach(t => { const st = S.ts[t.id]; if (st) { c += st.c; w += st.w; } });
    const p = pct(c, w);
    return `<article class="scard"><div class="sh"><span class="zh big">${v.zh}</span><span class="muted">${v.ru}</span></div>
      <div class="sstat"><span>${(TH[k] || []).length} тем теории</span><span>${tt.length} задач</span><span>${p === null ? 'ещё не решали' : 'верно ' + p + '%'}</span></div>
      <div class="sbtn"><button class="btn" data-act="subj" data-arg="${k}|kon">Конспект</button><button class="btn" data-act="subj" data-arg="${k}|words">Слова</button><button class="btn" data-act="subj" data-arg="${k}|theory">Теория</button><button class="btn" data-act="subj" data-arg="${k}|drill">Тренировка</button><button class="btn" data-act="subj" data-arg="${k}|tasks">Задачи</button><button class="btn" data-act="subj" data-arg="${k}|read">Чтение условий</button></div></article>`;
  }).join('');
  const decks = Object.entries(DECKS).map(([k, n]) => { const st = deckStats(k);
    return `<button class="drow" data-act="deck" data-arg="${k}"><span>${n}</span>${bar(st.learned / st.total * 100)}<span class="mono">${st.learned}/${st.total}</span></button>`; }).join('');
  return `<section class="hero">
    <div class="plan sheet">
      <div class="kicker">План на сегодня</div>
      <h1>Слова каждый день</h1>
      <p class="lead">Без слов не понять условие. 15–20 минут карточек в день дают больше, чем час теории без них.</p>
      <div class="facts"><div><b>${due}</b><span>к повторению</span></div><div><b>${nl}</b><span>новых сегодня</span></div><div><b>${deckStats('').learned}</b><span>выучено</span></div></div>
      <div class="acts">
        <button class="btn dark wide" data-act="fc" data-arg="">Начать повторение${due + nl ? ' · ' + (due + nl) : ''}</button>
        <button class="btn wide" data-act="lx" data-arg="lesson|">Урок · 8 слов в упражнениях</button>
        <button class="btn wide" data-act="fc" data-arg="q">Сначала язык условий · ${qs.learned}/${qs.total}</button>
      </div>
    </div>
    <div class="sheet">
      <div class="kicker">Колоды</div>
      <div class="dlist">${decks}</div>
      <p class="muted small">Слово считается выученным после трёх правильных ответов в карточках с интервалами. Нажмите на любое подчёркнутое слово в теории или задачах — появится перевод и кнопка «В повторение».</p>
    </div>
  </section>
  <h2 class="sec">Предметы</h2>
  <div class="sgrid">${subj}</div>
  <section class="sheet how">
    <h2>Как заниматься, если до экзамена мало времени</h2>
    <ol>
      <li><b>Каждый день — карточки.</b> Начните с колоды «Язык условий»: это слова вроде 已知, 下列说法正确的是, 取值范围, которые есть почти в каждом задании.</li>
      <li><b>Упражнения на слова.</b> «Урок» вводит новые слова и прогоняет их через сопоставление, тоны, пропуск в предложении и написание по памяти. Так слово запоминается с нескольких сторон, а ошибки сразу уходят в карточки.</li>
      <li><b>Конспект на русском.</b> Сначала разберите тему по-русски (вкладка «Конспект» в каждом предмете), китайские термины там кликабельны. Затем переходите к теории на китайском и задачам по той же теме.</li>
      <li><b>Реальные экзамены.</b> В «Задачах CSCA» есть варианты 2025-12 … 2026-06: решайте с разбором по темам или целиком на время.</li>
      <li><b>Теория на китайском.</b> Читайте формулировки вслух, перевод открывайте только после попытки. Кнопка «Учить слова темы» добавит её термины в карточки.</li>
      <li><b>Тренировка теории.</b> Вопросы с пропущенным термином и выбором перевода — проверка, что формулировки понятны.</li>
      <li><b>Задачи и чтение условий.</b> Решайте задачи по темам, а в режиме «Чтение условий» тренируйтесь понимать текст без решения.</li>
      <li><b>Пробный экзамен</b> раз в неделю: 48 задач за 60 минут по математике и физике.</li>
    </ol>
  </section>`;
}

/* ── словарь ── */
function viewVocab() {
  dayCheck();
  const d = A.deck, st = deckStats(d), due = dueIds(d).length, nl = Math.min(newLeft(), newIds(d).length);
  const dchips = [['', 'Все слова'], ...Object.entries(DECKS)].map(([k, n]) => `<button class="pill${A.deck === k ? ' on' : ''}" data-act="deck" data-arg="${k}">${n}</button>`).join('');
  return `<h1 class="pt">Слова</h1>
  <div class="pills">${dchips}</div>
  <div class="vgrid">
    <div class="sheet">
      <div class="facts"><div><b>${st.total}</b><span>всего</span></div><div><b>${st.learned}</b><span>выучено</span></div><div><b>${st.learning}</b><span>в изучении</span></div><div><b>${due}</b><span>к повторению</span></div></div>
      <div class="acts">
        <button class="btn dark wide" data-act="fc" data-arg="${d}">Карточки · ${due} повторить + ${nl} новых</button>
        <button class="btn wide" data-act="vquiz" data-arg="${d}">Тест: выбрать перевод</button>
        ${TTS ? `<button class="btn wide" data-act="vaudio" data-arg="${d}">Тест на слух</button>` : ''}
      </div>
    </div>
    <div class="sheet">
      <div class="kicker">Настройки карточек</div>
      <label class="row">Новых слов в день
        <select id="npd">${[10, 20, 30, 50, 80].map(n => `<option ${S.newPerDay === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="row">Лицевая сторона
        <select id="dir"><option value="zh" ${S.set.dir === 'zh' ? 'selected' : ''}>Китайский → перевод</option><option value="ru" ${S.set.dir === 'ru' ? 'selected' : ''}>Перевод → китайский</option><option value="mix" ${S.set.dir === 'mix' ? 'selected' : ''}>Вперемешку</option></select></label>
      <p class="muted small">«Снова» — карточка вернётся через несколько карточек. «Трудно» — завтра. «Знаю» — через 1, 3, 7, 14, 30 дней.</p>
    </div>
  </div>
  <div class="sheet"><div class="kicker">Упражнения${A.deck ? ' · ' + DECKS[A.deck] : ''}</div>
    <p class="muted small">Сначала берутся слова к повторению и слабые слова, потом новые. Каждая ошибка — слово вернётся в конце упражнения и в карточки.</p>${exGrid(A.deck)}</div>
  <div class="sheet">
    <div class="lhead"><b>Список слов</b><input id="vsearch" type="search" placeholder="Поиск: 函数, hanshu, функция" value="${esc(A.q)}"></div>
    <div class="vlist" id="vlist">${vocabRows()}</div>
  </div>`;
}
function vocabRows() {
  const q = A.q.trim().toLowerCase(), qn = q.replace(/\s/g, '');
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s/g, '').toLowerCase();
  const rows = V.filter(v => (!A.deck || v.d.includes(A.deck)) && (!q || v.zh.includes(q) || v.ru.toLowerCase().includes(q) || norm(v.py).includes(norm(qn)))).slice(0, 300);
  if (!rows.length) return '<p class="muted">Ничего не найдено.</p>';
  return rows.map(v => { const b = lvl(v.id);
    return `<div class="vrow"><span class="zh vz">${esc(v.zh)}</span><span class="vp">${esc(v.py)}</span><span class="vr">${esc(v.ru)}</span>
    <span class="dots" title="${b < 0 ? 'новое' : 'уровень ' + b + ' из 5'}">${[1, 2, 3, 4, 5].map(i => `<i class="${b >= i ? 'on' : ''}"></i>`).join('')}</span>
    <span class="va">${spkBtn(v.zh)}<button class="ib" data-act="add" data-arg="${v.id}" title="В повторение" aria-label="В повторение">＋</button></span></div>`; }).join('') +
    (rows.length === 300 ? '<p class="muted small">Показаны первые 300 — уточните поиск.</p>' : '');
}

/* ── карточки ── */
function startFC(deck, ids) {
  dayCheck();
  let q;
  if (ids) q = ids.slice().sort((a, b) => lvl(a) - lvl(b));
  else q = dueIds(deck).slice(0, 80).concat(newIds(deck).slice(0, newLeft()));
  if (!q.length) { toast('Сейчас нечего повторять. Добавьте новые слова или увеличьте лимит в настройках.'); return; }
  A.fc = { q, i: 0, shown: false, done: 0, again: 0, deck, back: A.view };
  A.view = 'fc'; render();
}
function viewFC() {
  const f = A.fc;
  if (f.i >= f.q.length) return `<div class="sheet center"><div class="kicker">Готово</div><h1>${f.done} карточек</h1><p class="muted">Повторено, из них «Снова» — ${f.again}.</p>
    <div class="acts"><button class="btn dark" data-act="fc" data-arg="${f.deck || ''}">Ещё раз</button><button class="btn" data-act="go" data-arg="${f.back === 'topic' ? 'topic' : 'vocab'}">Назад</button></div></div>`;
  const v = V[f.q[f.i]], dir = S.set.dir === 'mix' ? ((v.id + f.i) % 2 ? 'ru' : 'zh') : S.set.dir, isNew = !S.srs[v.id];
  const front = dir === 'zh' ? `<div class="fz zh">${esc(v.zh)}</div>` : `<div class="fr">${esc(v.ru)}</div>`;
  const back = f.shown ? `<div class="fb">${dir === 'zh' ? '' : `<div class="fz zh">${esc(v.zh)}</div>`}
      <div class="fpy">${esc(v.py)} ${spkBtn(v.zh)}</div>${dir === 'zh' ? `<div class="fr">${esc(v.ru)}</div>` : ''}
      ${v.ex ? `<div class="fex zh">${fmt(v.ex)}</div>` : ''}<div class="muted small">${v.d.map(d => DECKS[d]).join(' · ')}${v.t ? ' · ' + esc(v.t) : ''}</div></div>` : '';
  return `<div class="runbar"><button class="btn" data-act="go" data-arg="${f.back === 'topic' ? 'topic' : 'vocab'}">← Выйти</button><span class="muted mono">${f.i + 1} / ${f.q.length}</span>${isNew ? '<span class="tag">новое</span>' : ''}</div>
  <div class="fcard sheet">${front}${back}
    <div class="facts2">${f.shown ? `<button class="btn r0" data-act="rate" data-arg="0">Снова <kbd>1</kbd></button><button class="btn r1" data-act="rate" data-arg="1">Трудно <kbd>2</kbd></button><button class="btn r2" data-act="rate" data-arg="2">Знаю <kbd>3</kbd></button>`
      : `<button class="btn dark wide" data-act="flip">Показать ответ <kbd>пробел</kbd></button>`}</div></div>`;
}

/* ── единый тренажёр вопросов ── */
function taskItem(t) {
  const ord = shuffle(t.o.map((_, i) => i));
  return { kind: 'task', id: t.id, s: t.s, topic: t.t, zh: t.q, ru: t.r, pre: t.p ? PAS[t.p] : null, src: t.src,
    opts: ord.map(i => ({ html: fmt(t.o[i]), zh: true })), c: ord.indexOf(0), e: t.e };
}
function drillItems(s, ti) {
  const topics = ti == null ? TH[s].map((_, i) => i) : [ti];
  const all = []; TH[s].forEach((tp, i) => tp.items.forEach((it, j) => all.push(Object.assign({ tid: s + i + '-' + j, ti: i }, it))));
  const pool = all.filter(x => topics.includes(x.ti));
  return pick(pool, 12).map((it, n) => {
    const others = all.filter(x => x !== it);
    if (n % 2 === 0 && it.zh.includes(it.k)) {
      const keys = [...new Set(shuffle(others).map(x => x.k))].filter(k => k !== it.k && !it.k.includes(k) && !k.includes(it.k)).slice(0, 3);
      const opts = shuffle([it.k, ...keys]);
      return { kind: 'cloze', id: it.tid, zh: it.zh.replace(it.k, '＿＿＿'), full: it.zh, ru: it.ru, ask: 'Какой термин пропущен?',
        opts: opts.map(o => ({ html: esc(o), zh: true })), c: opts.indexOf(it.k), e: '' };
    }
    const wrong = shuffle(others).slice(0, 3).map(x => x.ru);
    const opts = shuffle([it.ru, ...wrong]);
    return { kind: 'trans', id: it.tid, zh: it.zh, full: it.zh, ru: it.ru, ask: 'Выберите правильный перевод',
      opts: opts.map(o => ({ html: esc(o), zh: false })), c: opts.indexOf(it.ru), e: '' };
  });
}
function vquizItems(deck, audio) {
  const pool = V.filter(v => !deck || v.d.includes(deck));
  const seen = pool.filter(v => S.srs[v.id]);
  const base = seen.length >= 12 ? seen : pool;
  return pick(base, 15).map((v, n) => {
    const others = pick(pool.filter(x => x !== v && x.ru !== v.ru), 3);
    const rev = !audio && n % 2 === 1;
    const opts = shuffle([v, ...others]);
    return { kind: audio ? 'audio' : 'word', id: v.id, w: v, zh: audio ? '' : (rev ? '' : v.zh), ru: rev ? v.ru : '', rev,
      ask: audio ? 'Прослушайте и выберите слово' : rev ? 'Как это по-китайски?' : 'Что значит?',
      opts: opts.map(o => ({ html: (rev || audio) ? `<span class="zh">${esc(o.zh)}</span>` : esc(o.ru), zh: false })), c: opts.indexOf(v), e: '' };
  });
}
function startRun(mode, items, title, extra) {
  if (!items.length) { toast('Нет заданий для этого выбора.'); return; }
  A.run = Object.assign({ mode, items, i: 0, ans: {}, flag: {}, title, start: Date.now(), back: A.view, showTr: false }, extra || {});
  A.view = 'run'; A.confirm = false; render();
  if (items[0].kind === 'audio') setTimeout(() => speak(items[0].w.zh), 300);
}
function viewRun() {
  const r = A.run, it = r.items[r.i], exam = r.mode === 'exam', n = r.items.length;
  const locked = !exam && r.ans[r.i] !== undefined, ok = locked && r.ans[r.i] === it.c;
  const answered = Object.keys(r.ans).length;
  let prompt = '';
  if (it.kind === 'audio') prompt = `<div class="center">${TTS ? `<button class="btn big-spk" data-act="speak" data-arg="${esc(it.w.zh)}">${ICON_SPK} Прослушать ещё раз</button>` : ''}</div>`;
  else if (it.kind === 'word') prompt = it.rev ? `<div class="fr">${esc(it.ru)}</div>` : `<div class="fz zh">${esc(it.zh)}</div>`;
  else prompt = `<p class="stem zh">${fmt(it.zh)}</p>`;
  const pre = it.pre ? `<div class="passage"><div class="pl">阅读短文 · ТЕКСТ ${spkBtn(it.pre.zh)}</div><div class="zh">${esc(it.pre.zh)}</div>${r.showTr ? `<div class="tr">${esc(it.pre.ru)}</div>` : ''}</div>` : '';
  const canTr = (it.kind === 'task' || it.kind === 'cloze');
  const tr = canTr ? (r.showTr || locked ? (it.ru ? `<div class="tr">${fmt(it.ru)}</div>` : `<div class="tr muted">Перевода нет — нажимайте на подчёркнутые слова.</div>`) : '') : '';
  const opts = it.opts.map((o, i) => {
    let cls = 'opt';
    if (locked) { if (i === it.c) cls += ' ok'; else if (r.ans[r.i] === i) cls += ' no'; }
    else if (r.ans[r.i] === i) cls += ' sel';
    return `<button class="${cls}" data-act="pick" data-arg="${i}" ${locked ? 'disabled' : ''}><span class="bub">${L[i]}</span><span class="${o.zh ? 'zh' : ''}">${o.html}</span></button>`;
  }).join('');
  let fb = '';
  if (locked) {
    let body = it.e ? fmt(it.e) : '';
    if (it.kind === 'cloze' || it.kind === 'trans') body = `<div class="zh">${esc(it.full)}</div><div>${esc(it.ru)}</div>`;
    if (it.kind === 'word' || it.kind === 'audio') body = `<span class="zh">${esc(it.w.zh)}</span> · ${esc(it.w.py)} · ${esc(it.w.ru)} ${spkBtn(it.w.zh)}`;
    const words = (it.kind === 'task' || it.kind === 'cloze' || it.kind === 'trans') ? chips(termsIn((it.pre ? it.pre.zh : '') + (it.full || it.zh) + '。' + it.opts.map(o => o.html.replace(/<[^>]+>/g, '')).join('。')), 'Слова из этого задания') : '';
    fb = `<div class="expl ${ok ? 'good' : 'bad'}"><b>${ok ? 'Верно' : 'Неверно — правильный ответ ' + L[it.c]}</b>${body}</div>${words}`;
  }
  const cells = r.items.map((x, i) => {
    let c = 'cell'; if (exam) { if (r.ans[i] !== undefined) c += ' done'; } else if (r.ans[i] !== undefined) c += r.ans[i] === x.c ? ' okc' : ' noc';
    if (i === r.i) c += ' cur'; if (r.flag[i]) c += ' fl';
    return `<button class="${c}" data-act="jump" data-arg="${i}" aria-label="Задание ${i + 1}"><span>${i + 1}</span><i></i></button>`; }).join('');
  return `<div class="runbar"><button class="btn" data-act="leave">← Выйти</button><span class="title">${esc(r.title)}</span><span class="sp"></span>
    ${exam ? `<span class="timer" id="timer">${mmss(r.dur - (Date.now() - r.start))}</span><button class="btn red" data-act="submit">Сдать</button>` : `<span class="muted mono">${answered} / ${n}</span>`}</div>
  <div class="layout">
    <article class="qsheet">
      <div class="qhead"><span class="qno">${it.kind === 'task' ? '第 ' + (r.i + 1) + ' 题' : 'Вопрос ' + (r.i + 1)}</span>${it.src ? `<span class="tag real" title="Задание реального экзамена CSCA">CSCA ${esc(it.src.replace('·', ' · №'))}</span>` : ''}<span class="muted small">${esc(it.ask || (it.topic ? it.topic + ' · ' + (TOPIC_RU[it.topic] || '') : ''))}</span>
        <span class="qtools">${(it.zh && it.kind !== 'word') ? spkBtn(it.full || it.zh) : ''}${canTr && !locked ? `<button class="tg" data-act="tr" aria-pressed="${r.showTr}"><i></i>Перевод</button>` : ''}</span></div>
      ${pre}${prompt}${tr}
      <div class="opts">${opts}</div>${fb}
      <div class="qnav"><button class="btn" data-act="prev" ${r.i === 0 ? 'disabled' : ''}>← Назад</button>
        ${exam ? `<button class="btn flag" data-act="flag" aria-pressed="${!!r.flag[r.i]}">${r.flag[r.i] ? 'Отмечено' : 'Отметить'}</button>` : ''}<span class="sp"></span>
        ${r.i < n - 1 ? `<button class="btn dark" data-act="next">Дальше →</button>` : `<button class="btn ${exam ? 'red' : 'dark'}" data-act="${exam ? 'submit' : 'finish'}">${exam ? 'Сдать' : 'Итог'}</button>`}</div>
      ${A.confirm ? `<div class="confirm"><p>${n - answered ? `Без ответа: <b>${n - answered}</b>. ` : ''}Сдать работу? Ответы больше нельзя будет изменить.</p><div class="row2"><button class="btn red" data-act="finish">Сдать</button><button class="btn" data-act="cancel">Вернуться</button></div></div>` : ''}
      <p class="keys muted small"><kbd>A</kbd>–<kbd>D</kbd> или <kbd>1</kbd>–<kbd>4</kbd> — ответ, <kbd>Enter</kbd> — дальше.</p>
    </article>
    <aside class="card"><h3>答题卡</h3><div class="cgrid">${cells}</div></aside>
  </div>`;
}
function pickAns(i) {
  const r = A.run, it = r.items[r.i];
  if (r.mode !== 'exam' && r.ans[r.i] !== undefined) return;
  r.ans[r.i] = i;
  if (r.mode !== 'exam') { record(it, i === it.c); if (it.kind === 'word' || it.kind === 'audio') speak(it.w.zh); }
  render();
  if (r.mode !== 'exam') { const e = document.querySelector('.expl'); if (e) e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
}
function record(it, ok) {
  if (it.kind === 'task') {
    const st = S.ts[it.id] || { c: 0, w: 0 }; ok ? st.c++ : st.w++; S.ts[it.id] = st;
    if (!ok) { if (!S.wrong.includes(it.id)) S.wrong.push(it.id); } else S.wrong = S.wrong.filter(x => x !== it.id);
  } else if (it.kind === 'cloze' || it.kind === 'trans') {
    const st = S.th[it.id] || { c: 0, w: 0 }; ok ? st.c++ : st.w++; S.th[it.id] = st;
  } else if (!ok) { S.srs[it.id] = Object.assign(S.srs[it.id] || { n: 0 }, { b: 0, due: Date.now() }); }
  save();
}
function finish() {
  const r = A.run; clearInterval(tick); tick = null;
  if (r.mode === 'exam') r.items.forEach((it, i) => { if (r.ans[i] !== undefined) record(it, r.ans[i] === it.c); });
  A.res = Object.assign({}, r, { used: Date.now() - r.start }); A.run = null; A.confirm = false; A.view = 'result'; render(); window.scrollTo(0, 0);
}
function viewResult() {
  const r = A.res, n = r.items.length, c = r.items.filter((it, i) => r.ans[i] === it.c).length;
  const by = {}; r.items.forEach((it, i) => { const k = it.topic || '—'; by[k] = by[k] || { n: 0, c: 0 }; by[k].n++; if (r.ans[i] === it.c) by[k].c++; });
  const tbl = r.items[0].kind === 'task' ? `<div class="tblw"><table class="tbl"><thead><tr><th>Тема</th><th>Верно</th></tr></thead><tbody>${Object.entries(by).map(([k, o]) =>
    `<tr><td><span class="zh">${esc(k)}</span> <span class="muted">${esc(TOPIC_RU[k] || '')}</span></td><td class="num">${o.c} / ${o.n}</td></tr>`).join('')}</tbody></table></div>` : '';
  const list = r.items.map((it, i) => {
    const a = r.ans[i], good = a === it.c;
    if (good && r.mode !== 'exam') return '';
    const pill = a === undefined ? `<span class="pill2 sk">нет ответа · ${L[it.c]}</span>` : good ? `<span class="pill2 ok">${L[a]} верно</span>` : `<span class="pill2 no">${L[a]} → ${L[it.c]}</span>`;
    const head = it.kind === 'word' || it.kind === 'audio' ? `${esc(it.w.zh)} · ${esc(it.w.ru)}` : plain(it.full || it.zh);
    return `<details class="rv"><summary><span class="n mono">${i + 1}</span><span class="s zh">${esc(head)}</span>${pill}</summary><div class="rvb">
      ${it.kind === 'task' ? `<p class="zh">${fmt(it.zh)}</p><p class="zh">${it.opts.map((o, k) => L[k] + '. ' + o.html).join('　')}</p>${it.ru ? `<p class="muted">${fmt(it.ru)}</p>` : ''}<p><b>Разбор.</b> ${fmt(it.e)}</p>` :
        it.kind === 'cloze' || it.kind === 'trans' ? `<p class="zh">${esc(it.full)}</p><p class="muted">${esc(it.ru)}</p>` : `<p>${esc(it.w.py)} ${spkBtn(it.w.zh)}</p>`}</div></details>`;
  }).join('');
  const wrongTasks = r.items.filter((it, i) => it.kind === 'task' && r.ans[i] !== it.c).length;
  return `<div class="runbar"><button class="btn" data-act="go" data-arg="${r.back === 'subj' ? 'subj' : r.back === 'topic' ? 'topic' : r.back}">← Назад</button><span class="title">${esc(r.title)} · итог</span></div>
  <section class="sheet"><div class="score"><div class="big">${r.mode === 'exam' ? Math.round(c / n * 100) + '<small> / 100</small>' : c + '<small> / ' + n + '</small>'}</div>
    <div class="facts"><div><b>${c} / ${n}</b><span>верно</span></div><div><b>${mmss(r.used)}</b><span>время</span></div>${wrongTasks ? `<div><b>${wrongTasks}</b><span>в «Ошибки»</span></div>` : ''}</div></div>
    ${r.mode === 'exam' ? '<p class="muted small">Балл — доля верных ответов по шкале 0–100. Официальный пересчёт CSCA не опубликован.</p>' : ''}${tbl}
    <div class="acts"><button class="btn dark" data-act="again">Ещё раз</button></div></section>
  ${list ? `<h2 class="sec">${r.mode === 'exam' ? 'Разбор всех заданий' : 'Ошибки'}</h2><div class="review">${list}</div>` : '<p class="muted center">Ошибок нет.</p>'}`;
}

/* ── чтение условий ── */
function readingPool(s, topic) {
  const base = TASKS.filter(t => t.s === s && t.r && (!topic || t.t === topic)).map(t => ({ zh: t.q, ru: t.r, pre: t.p ? PAS[t.p] : null, topic: t.t }));
  const extra = (window.READING || []).filter(x => x.s === s && (!topic || x.t === topic)).map(x => ({ zh: x.zh, ru: x.ru, topic: x.t }));
  return base.concat(extra);
}
function startRead(s, topic) {
  const items = pick(readingPool(s, topic), 12);
  if (!items.length) { toast('Нет текстов для этой темы.'); return; }
  A.rd = { items, i: 0, shown: false, got: 0, s, topic, back: A.view }; A.view = 'read'; render();
}
function viewRead() {
  const d = A.rd;
  if (d.i >= d.items.length) return `<div class="sheet center"><div class="kicker">Готово</div><h1>Понятно ${d.got} из ${d.items.length}</h1>
    <div class="acts"><button class="btn dark" data-act="read" data-arg="${d.s}|${d.topic || ''}">Ещё 12 условий</button><button class="btn" data-act="go" data-arg="subj">Назад</button></div></div>`;
  const it = d.items[d.i];
  return `<div class="runbar"><button class="btn" data-act="go" data-arg="subj">← Выйти</button><span class="title">Чтение условий</span><span class="sp"></span><span class="muted mono">${d.i + 1} / ${d.items.length}</span></div>
  <article class="qsheet narrow">
    <p class="muted small">Прочитайте условие и мысленно переведите. Незнакомое слово — нажмите на него. Потом откройте перевод и сверьтесь.</p>
    ${it.pre ? `<div class="passage"><div class="pl">阅读短文 ${spkBtn(it.pre.zh)}</div><div class="zh">${esc(it.pre.zh)}</div></div>` : ''}
    <p class="stem zh">${fmt(it.zh)} ${spkBtn(it.zh)}</p>
    ${d.shown ? `<div class="tr">${fmt(it.ru)}</div>${it.pre ? `<div class="tr">${esc(it.pre.ru)}</div>` : ''}${chips(termsIn((it.pre ? it.pre.zh : '') + it.zh), 'Слова из условия')}
      <div class="facts2"><button class="btn r0" data-act="rd" data-arg="0">Понял не всё <kbd>1</kbd></button><button class="btn r2" data-act="rd" data-arg="1">Понял <kbd>2</kbd></button></div>`
      : `<div class="facts2"><button class="btn dark wide" data-act="rdshow">Показать перевод <kbd>пробел</kbd></button></div>`}
  </article>`;
}

/* ── страница предмета ── */
function viewSubj() {
  const s = A.s, v = SUBJ[s];
  const tabs = [['kon', 'Конспект'], ['words', 'Слова'], ['theory', 'Теория 中文'], ['drill', 'Тренировка теории'], ['tasks', 'Задачи CSCA'], ['read', 'Чтение условий']]
    .map(([k, n]) => `<button class="pill${A.tab === k ? ' on' : ''}" data-act="tab" data-arg="${k}">${n}</button>`).join('');
  let body = '';
  if (A.tab === 'theory' || A.tab === 'drill') {
    const rows = TH[s].map((tp, i) => {
      let c = 0, w = 0; tp.items.forEach((_, j) => { const st = S.th[s + i + '-' + j]; if (st) { c += st.c; w += st.w; } });
      const ws = termsIn(tp.items.map(x => x.zh).join('')); const kn = ws.filter(x => lvl(x.id) >= 3).length;
      return `<button class="trow" data-act="${A.tab === 'theory' ? 'topic' : 'drill'}" data-arg="${i}"><span><span class="zh">${esc(tp.t)}</span><small>${esc(tp.ru)} · ${tp.items.length} пунктов · слов выучено ${kn}/${ws.length}</small></span>
        ${bar(pct(c, w))}<span class="mono muted">${pct(c, w) === null ? '—' : pct(c, w) + '%'}</span></button>`;
    }).join('');
    body = `${A.tab === 'drill' ? `<div class="acts"><button class="btn dark" data-act="drill" data-arg="">Все темы вперемешку · 12 вопросов</button></div><p class="muted small">Вопросы двух видов: вставить пропущенный термин в формулировку и выбрать её перевод. Процент — доля верных ответов.</p>` :
      `<p class="muted small">Формулировки в стиле китайских учебников. Читайте вслух, перевод открывайте после попытки. Процент справа — из тренировки по теме.</p>`}
      <div class="tlist">${rows}</div>`;
  } else if (A.tab === 'tasks') {
    const tps = taskTopics(s), wr = S.wrong.filter(id => TI[id] && TI[id].s === s).length, all = TASKS.filter(t => t.s === s);
    const examN = Math.min(v.n, all.length), examMin = Math.round(examN * v.sec / 60);
    body = `<div class="acts3">
      <button class="act primary" data-act="exam"><b>Пробный экзамен</b><span>${examN} заданий · ${examMin} мин${examN < v.n ? ' (сокращённый, в темпе CSCA)' : ', как на CSCA'}</span></button>
      <button class="act" data-act="tasks" data-arg=""><b>Все задачи вперемешку</b><span>${all.length} задач · разбор после каждой</span></button>
      <button class="act" data-act="wrong" ${wr ? '' : 'disabled'}><b>Работа над ошибками</b><span>${wr ? wr + ' задач с ошибками' : 'пока пусто'}</span></button></div>
      ${realList(s)}<h2 class="sec">По темам</h2>
      <div class="tlist">${tps.map(t => { const tt = all.filter(x => x.t === t); let c = 0, w = 0; tt.forEach(x => { const st = S.ts[x.id]; if (st) { c += st.c; w += st.w; } });
        return `<button class="trow" data-act="tasks" data-arg="${esc(t)}"><span><span class="zh">${esc(t)}</span><small>${esc(TOPIC_RU[t] || '')} · ${tt.length} задач</small></span>${bar(pct(c, w))}<span class="mono muted">${pct(c, w) === null ? '—' : pct(c, w) + '%'}</span></button>`; }).join('')}</div>`;
  } else if (A.tab === 'words') {
    body = viewSubjWords(s);
  } else if (A.tab === 'kon') {
    const K = KON[s] || [];
    body = `<p class="muted small">Разбор всех тем на русском с китайскими терминами (нажмите на подчёркнутое слово — появится перевод). После каждой темы — теория на китайском и задачи CSCA по ней, включая задания реальных экзаменов.</p>
      <div class="tlist">${K.map((k, i) => { const n = TASKS.filter(t => t.s === s && t.t === k.t).length, rn = TASKS.filter(t => t.s === s && t.t === k.t && t.src).length;
        return `<button class="trow" data-act="kon" data-arg="${i}"><span><span class="zh">${esc(k.t)}</span><small>${esc(k.ru)}${n ? ' · ' + n + ' задач' + (rn ? ', из них ' + rn + ' с экзаменов' : '') : ''}</small></span><span class="mono muted">${i + 1}</span></button>`; }).join('')}</div>`;
  } else {
    const tps = [...new Set(readingPool(s).map(x => x.topic))];
    body = `<p class="muted small">Режим для понимания текста: решать не нужно. Читаете условие, проверяете себя по переводу, повторяете слова из него.</p>
      <div class="acts"><button class="btn dark" data-act="read" data-arg="${s}|">Все темы · 12 условий</button></div>
      <div class="tlist">${tps.map(t => `<button class="trow" data-act="read" data-arg="${s}|${esc(t)}"><span><span class="zh">${esc(t)}</span><small>${esc(TOPIC_RU[t] || '')} · ${readingPool(s, t).length} условий</small></span></button>`).join('')}</div>`;
  }
  return `<div class="shead"><h1 class="pt"><span class="zh">${v.zh}</span> <span class="muted">${v.ru}</span></h1></div><div class="pills">${tabs}</div>${body}`;
}

/* ── тема теории ── */
function viewTopic() {
  const s = A.s, ti = A.topic, tp = TH[s][ti];
  const ws = termsIn(tp.items.map(x => x.zh).join(''));
  const items = tp.items.map((it, j) => `<div class="titem" id="ti${j}">
    <div class="tz zh">${esc(it.zh)}</div>${it.f ? `<div class="tf mono">${esc(it.f)}</div>` : ''}
    <div class="ttools">${spkBtn(it.zh)}<button class="tg" data-act="tshow" data-arg="${j}" aria-pressed="${!!(A.tshow && A.tshow[j])}"><i></i>Перевод</button></div>
    ${A.tshow && A.tshow[j] ? `<div class="tr">${esc(it.ru)}</div>` : ''}</div>`).join('');
  const prev = ti > 0 ? `<button class="btn" data-act="topic" data-arg="${ti - 1}">← ${esc(TH[s][ti - 1].t)}</button>` : '';
  const next = ti < TH[s].length - 1 ? `<button class="btn" data-act="topic" data-arg="${ti + 1}">${esc(TH[s][ti + 1].t)} →</button>` : '';
  return `<div class="runbar"><button class="btn" data-act="go" data-arg="subj">← ${SUBJ[s].zh}</button><span class="sp"></span><button class="btn" data-act="tall">${A.tall ? 'Скрыть переводы' : 'Показать все переводы'}</button></div>
  <h1 class="pt"><span class="zh">${esc(tp.t)}</span> <span class="muted">${esc(tp.ru)}</span></h1>
  <div class="tlayout"><div class="tmain">${items}
    <div class="acts"><button class="btn dark" data-act="drill" data-arg="${ti}">Проверить себя по теме</button>${TASKS.some(x => x.s === s && x.t === tp.t) ? `<button class="btn" data-act="tasks" data-arg="${esc(tp.t)}">Задачи по теме</button>` : ''}</div>
    <div class="qnav">${prev}<span class="sp"></span>${next}</div></div>
    <aside class="tside sheet">${chips(ws, 'Термины темы')}<button class="btn dark wide" data-act="lxids" data-arg="lesson|${ws.map(w => w.id).join(',')}|${esc(tp.t)}">Урок по словам темы</button><button class="btn wide" data-act="fcids" data-arg="${ws.map(w => w.id).join(',')}">Карточки · ${ws.length} слов</button></aside></div>`;
}

/* ───── упражнения на лексику ───── */
const LXN = { lesson: 'Урок', match: 'Сопоставление', mc: 'Перевод', py: 'Тоны и пиньинь', cloze: 'Слово в контексте', build: 'Собери слово', type: 'Напиши по памяти', listen: 'На слух' };
const PURE = /^[㐀-鿿]+$/;
const canBuild = v => PURE.test(v.zh) && v.zh.length >= 2 && v.zh.length <= 7;
const canType = v => PURE.test(v.zh) && v.zh.length <= 8;
const canPy = v => PURE.test(v.zh) && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(v.py);
const TONES = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
const TMAP = {}; Object.entries(TONES).forEach(([b, s]) => [...s].forEach((c, i) => { TMAP[c] = [b, i]; }));
function retone(py) {
  const syl = py.split(' '), k = Math.floor(Math.random() * syl.length);
  return syl.map((s, n) => {
    if (n !== k && Math.random() < 0.6) return s;
    let done = false;
    return [...s].map(ch => { if (done || !TMAP[ch]) return ch; done = true; const [b, t] = TMAP[ch]; let nt; do nt = Math.floor(Math.random() * 5); while (nt === t); return nt === 4 ? b : TONES[b][nt]; }).join('');
  }).join(' ');
}
function pyOpts(v) {
  const set = new Set([v.py]);
  for (let n = 0; n < 60 && set.size < 4; n++) set.add(retone(v.py));
  if (set.size < 4) distract(v, 6).forEach(x => { if (set.size < 4) set.add(x.py); });
  return shuffle([...set]);
}
function distract(v, n, f) {
  const c = V.filter(x => x !== v && x.ru !== v.ru && x.zh !== v.zh && !x.zh.includes(v.zh) && !v.zh.includes(x.zh) && x.d.some(d => v.d.includes(d)) && (!f || f(x)));
  const near = c.filter(x => Math.abs(x.zh.length - v.zh.length) <= 1);
  return pick(near.length >= n ? near : c, n);
}
let SENTS = null; const CTXM = {};
function ctxOf(v) {
  if (v.zh.length < 2) return [];
  if (CTXM[v.id]) return CTXM[v.id];
  if (!SENTS) {
    SENTS = [];
    Object.values(TH).forEach(a => a.forEach(t => t.items.forEach(i => SENTS.push({ zh: i.zh, ru: i.ru }))));
    TASKS.forEach(t => SENTS.push({ zh: plain(t.q), ru: plain(t.r) }));
    (window.READING || []).forEach(r => SENTS.push({ zh: r.zh, ru: r.ru }));
  }
  const out = [];
  if (v.ex && v.ex.includes(v.zh)) out.push({ zh: v.ex, ru: '' });
  SENTS.forEach(s => { if (s.zh.length <= 150 && s.zh.includes(v.zh)) out.push(s); });
  return (CTXM[v.id] = out);
}
function mkStep(t, id) {
  const v = V[id];
  if (t === 'mc' || t === 'mcr') {
    const o = shuffle([v, ...distract(v, 3)]);
    return { t: 'mc', id, rev: t === 'mcr', opts: o.map(x => x.id), c: o.indexOf(v) };
  }
  if (t === 'listen') { const o = shuffle([v, ...distract(v, 3)]); return { t, id, opts: o.map(x => x.id), c: o.indexOf(v) }; }
  if (t === 'py') { const o = pyOpts(v); return { t, id, opts: o, c: o.indexOf(v.py) }; }
  if (t === 'cloze') {
    const s = pick(ctxOf(v), 1)[0];
    const o = shuffle([v, ...distract(v, 3, x => !s.zh.includes(x.zh))]);
    return { t, id, s, opts: o.map(x => x.id), c: o.indexOf(v) };
  }
  if (t === 'build') {
    const own = [...v.zh], extra = [];
    distract(v, 8).forEach(x => [...x.zh].forEach(ch => { if (PURE.test(ch) && !own.includes(ch) && !extra.includes(ch)) extra.push(ch); }));
    return { t, id, tiles: shuffle(own.concat(shuffle(extra).slice(0, Math.min(4, own.length + 1)))), picked: [] };
  }
  if (t === 'type') return { t, id, val: '' };
  return { t: 'intro', id };
}
function best(t, v) {
  if (t === 'py' && !canPy(v)) t = 'mcr';
  if (t === 'cloze' && !ctxOf(v).length) t = canBuild(v) ? 'build' : 'mcr';
  if (t === 'build' && !canBuild(v)) t = 'mcr';
  if (t === 'type' && !canType(v)) t = 'mcr';
  if (t === 'listen' && !TTS) t = 'mc';
  return t;
}
function lxChoose(pool, n, newMax) {
  const now = Date.now(), has = id => !!S.srs[id];
  const due = shuffle(pool.filter(id => has(id) && S.srs[id].due <= now));
  const weak = shuffle(pool.filter(id => has(id) && S.srs[id].due > now && S.srs[id].b < 3));
  const fresh = pool.filter(id => !has(id));
  const rest = shuffle(pool.filter(id => has(id) && S.srs[id].due > now && S.srs[id].b >= 3));
  const nNew = Math.min(newMax, fresh.length);
  let out = fresh.slice(0, nNew);
  for (const arr of [due, weak, fresh.slice(nNew), rest]) for (const id of arr) { if (out.length >= n) break; if (!out.includes(id)) out.push(id); }
  return shuffle(out.slice(0, n));
}
function matchStep(ids) { return { t: 'match', ids, left: shuffle(ids), right: shuffle(ids), ok: [], sel: null, bad: null }; }
function startLx(kind, deck, ids, label) {
  dayCheck();
  const pool = (ids || V.filter(v => !deck || v.d.includes(deck)).map(v => v.id)).filter(id => V[id].zh.length <= 12);
  if (!pool.length) { toast('Нет слов для упражнения.'); return; }
  let words, q = [];
  if (kind === 'lesson') {
    words = lxChoose(pool, 8, ids ? 4 : Math.min(4, Math.max(newLeft(), 2)));
    words.filter(id => !S.srs[id]).forEach(id => q.push(mkStep('intro', id)));
    if (words.length >= 4) { const h = Math.ceil(words.length / 2); q.push(matchStep(words.slice(0, h)), matchStep(words.slice(h))); }
    ['mc', 'py', 'cloze', 'type'].forEach(t => shuffle(words).forEach(id => q.push(mkStep(best(t, V[id]), id))));
  } else if (kind === 'match') {
    words = lxChoose(pool, 10, 0);
    for (let i = 0; i < words.length; i += 5) if (words.slice(i, i + 5).length >= 2) q.push(matchStep(words.slice(i, i + 5)));
  } else {
    let p = pool;
    if (kind === 'cloze') p = pool.filter(id => ctxOf(V[id]).length);
    if (kind === 'build') p = pool.filter(id => canBuild(V[id]));
    if (kind === 'py') p = pool.filter(id => canPy(V[id]));
    if (kind === 'type') p = pool.filter(id => canType(V[id]));
    words = lxChoose(p.length ? p : pool, 10, 0);
    words.forEach(id => q.push(mkStep(best(kind === 'mc' ? (Math.random() < .5 ? 'mc' : 'mcr') : kind, V[id]), id)));
  }
  if (!q.length) { toast('Нет слов для упражнения.'); return; }
  A.lx = { kind, q, i: 0, words, err: {}, ok: 0, bad: 0, title: LXN[kind] + (label ? ' · ' + label : ''), back: A.view, again: [kind, deck, ids, label], done: false };
  A.view = 'lx'; render(); window.scrollTo(0, 0);
}
function lxMark(st, good) {
  const x = A.lx;
  st.res = good ? 'ok' : 'no';
  if (good) x.ok++; else { x.bad++; x.err[st.id] = (x.err[st.id] || 0) + 1; if (!st.retry) { const n = mkStep(st.t === 'mc' && st.rev ? 'mcr' : st.t, st.id); n.retry = true; x.q.push(n); } }
  if (S.set.sound) speak(V[st.id].zh);
}
function lxAnswer(i) {
  const st = A.lx.q[A.lx.i];
  if (st.res || !('c' in st)) return;
  st.ans = i; lxMark(st, i === st.c); render();
}
function lxNext() {
  const x = A.lx, st = x.q[x.i];
  if (st.t === 'match' && st.ok.length < st.ids.length) return;
  if (['mc', 'py', 'cloze', 'listen', 'build', 'type'].includes(st.t) && !st.res) return;
  x.i++;
  if (x.i >= x.q.length) lxFinish();
  render(); window.scrollTo(0, 0);
  const n = x.q[x.i];
  if (n && n.t === 'listen') setTimeout(() => speak(V[n.id].zh), 250);
  if (n && n.t === 'intro' && S.set.sound) setTimeout(() => speak(V[n.id].zh), 250);
  const inp = document.getElementById('lxin'); if (inp) inp.focus();
}
function lxFinish() {
  const x = A.lx; x.done = true; const now = Date.now();
  x.words.forEach(id => {
    const e = x.err[id] || 0, c = S.srs[id];
    if (e) rate(id, e >= 2 ? 0 : 1);
    else if (!c) { if (x.kind === 'lesson') rate(id, 2); }
    else if (c.due <= now) rate(id, 2);
  });
  save();
}
function normPy(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/v/g, 'u').replace(/[^a-z㐀-鿿]/g, ''); }
function lxCheckType() {
  const st = A.lx.q[A.lx.i]; if (st.res) return;
  const v = V[st.id], a = (document.getElementById('lxin') || {}).value || st.val || '';
  st.val = a; if (!a.trim()) return;
  lxMark(st, a.replace(/\s/g, '') === v.zh || normPy(a) === normPy(v.py)); render();
}
function lxTile(k) {
  const st = A.lx.q[A.lx.i]; if (st.res || st.picked.includes(k)) return;
  st.picked.push(k);
  if (st.picked.length === V[st.id].zh.length) lxMark(st, st.picked.map(j => st.tiles[j]).join('') === V[st.id].zh);
  render();
}
function lxMatch(side, id) {
  const st = A.lx.q[A.lx.i]; if (st.ok.includes(id)) return;
  st.bad = null;
  if (side === 'L') { st.sel = id; if (S.set.sound) speak(V[id].zh); render(); return; }
  if (st.sel == null) { toast('Сначала выберите слово слева.'); return; }
  if (st.sel === id) { st.ok.push(id); A.lx.ok++; st.sel = null; }
  else { A.lx.err[st.sel] = (A.lx.err[st.sel] || 0) + 1; A.lx.bad++; st.bad = [st.sel, id]; }
  render();
  if (st.ok.length === st.ids.length) setTimeout(() => { if (A.lx && A.lx.q[A.lx.i] === st) lxNext(); }, 700);
}
function wordLine(v) { return `<div class="wline"><span class="zh">${esc(v.zh)}</span><span class="pp">${esc(v.py)}</span><span>${esc(v.ru)}</span>${spkBtn(v.zh)}</div>`; }
function viewLx() {
  const x = A.lx;
  if (x.done) {
    const rows = x.words.map(id => { const v = V[id], e = x.err[id] || 0;
      return `<div class="vrow"><span class="zh vz">${esc(v.zh)}</span><span class="vp">${esc(v.py)}</span><span class="vr">${esc(v.ru)}</span><span class="pill2 ${e ? 'no' : 'ok'}">${e ? 'ошибок: ' + e : 'без ошибок'}</span><span class="va">${spkBtn(v.zh)}</span></div>`; }).join('');
    return `<div class="runbar"><button class="btn" data-act="lxback">← Назад</button><span class="title">${esc(x.title)} · итог</span></div>
    <section class="sheet"><div class="facts"><div><b>${x.ok}</b><span>верных ответов</span></div><div><b>${x.bad}</b><span>ошибок</span></div><div><b>${x.words.length}</b><span>слов</span></div></div>
    <p class="muted small">Слова с ошибками вернутся в карточки уже сегодня или завтра, слова без ошибок — по расписанию повторения.</p>
    <div class="acts"><button class="btn dark" data-act="lxagain">Ещё раз с другими словами</button><button class="btn" data-act="lxback">Назад</button></div></section>
    <div class="sheet"><div class="vlist">${rows}</div></div>`;
  }
  const st = x.q[x.i], v = V[st.id];
  let body = '';
  const optBtn = (html, i, zh) => { let c = 'opt'; if (st.res) { if (i === st.c) c += ' ok'; else if (st.ans === i) c += ' no'; }
    return `<button class="${c}" data-act="lxpick" data-arg="${i}" ${st.res ? 'disabled' : ''}><span class="bub">${L[i]}</span><span class="${zh ? 'zh' : ''}">${html}</span></button>`; };
  if (st.t === 'intro') {
    const cx = ctxOf(v)[0];
    body = `<div class="kicker">Новое слово</div><div class="center"><div class="fz zh">${esc(v.zh)}</div><div class="fpy">${esc(v.py)} ${spkBtn(v.zh)}</div><div class="fr">${esc(v.ru)}</div></div>
      ${cx ? `<div class="fex zh">${esc(cx.zh)}${cx.ru ? `<div class="muted small">${esc(cx.ru)}</div>` : ''}</div>` : ''}
      <p class="muted small center">Произнесите слово вслух 2–3 раза и представьте, где оно встречается в задаче.</p>
      <div class="facts2"><button class="btn dark wide" data-act="lxnext">Запомнил <kbd>Enter</kbd></button></div>`;
  } else if (st.t === 'match') {
    const cls = (id, side) => 'mitem' + (st.ok.includes(id) ? ' ok' : '') + (side === 'L' && st.sel === id ? ' sel' : '') + (st.bad && st.bad[side === 'L' ? 0 : 1] === id ? ' bad' : '');
    body = `<div class="ask">Соедините слово с переводом: нажмите слово слева, затем перевод справа.</div>
      <div class="mgrid"><div>${st.left.map(id => `<button class="${cls(id, 'L')}" data-act="lxL" data-arg="${id}" ${st.ok.includes(id) ? 'disabled' : ''}><span class="zh">${esc(V[id].zh)}</span>${st.ok.includes(id) ? `<small>${esc(V[id].py)}</small>` : ''}</button>`).join('')}</div>
      <div>${st.right.map(id => `<button class="${cls(id, 'R')}" data-act="lxR" data-arg="${id}" ${st.ok.includes(id) ? 'disabled' : ''}>${esc(V[id].ru)}</button>`).join('')}</div></div>`;
  } else if (st.t === 'mc') {
    body = st.rev ? `<div class="ask">Как это по-китайски?</div><div class="fr center">${esc(v.ru)}</div>` : `<div class="ask">Что значит это слово?</div><div class="fz zh center">${esc(v.zh)}</div>`;
    body += `<div class="opts">${st.opts.map((id, i) => optBtn(st.rev ? esc(V[id].zh) : esc(V[id].ru), i, st.rev)).join('')}</div>`;
  } else if (st.t === 'listen') {
    body = `<div class="ask">Прослушайте и выберите слово</div><div class="center"><button class="btn big-spk" data-act="speak" data-arg="${esc(v.zh)}">${ICON_SPK} Прослушать</button></div>
      <div class="opts">${st.opts.map((id, i) => optBtn(esc(V[id].zh), i, true)).join('')}</div>`;
  } else if (st.t === 'py') {
    body = `<div class="ask">Выберите правильное чтение — следите за тонами</div><div class="center"><div class="fz zh">${esc(v.zh)}</div><div class="muted">${esc(v.ru)}</div></div>
      <div class="opts">${st.opts.map((p, i) => optBtn(esc(p), i, false)).join('')}</div>`;
  } else if (st.t === 'cloze') {
    const blank = st.res ? `<b class="fill">${esc(v.zh)}</b>` : '<span class="gap">＿＿＿</span>';
    body = `<div class="ask">Какое слово пропущено?</div><p class="stem zh">${esc(st.s.zh).split(esc(v.zh)).join(blank)}</p>
      ${st.res && st.s.ru ? `<div class="tr">${esc(st.s.ru)}</div>` : ''}
      <div class="opts">${st.opts.map((id, i) => optBtn(esc(V[id].zh) + (st.res ? ` <small class="muted">${esc(V[id].ru)}</small>` : ''), i, true)).join('')}</div>`;
  } else if (st.t === 'build') {
    const n = v.zh.length;
    body = `<div class="ask">Соберите слово из иероглифов</div><div class="fr center">${esc(v.ru)}</div>
      <div class="slots">${Array.from({ length: n }, (_, j) => { const k = st.picked[j]; return k === undefined ? '<span class="slot"></span>' :
        `<button class="slot full zh" data-act="lxun" data-arg="${j}" ${st.res ? 'disabled' : ''}>${esc(st.tiles[k])}</button>`; }).join('')}</div>
      <div class="tiles">${st.tiles.map((ch, k) => `<button class="tile zh" data-act="lxtile" data-arg="${k}" ${st.picked.includes(k) || st.res ? 'disabled' : ''}>${esc(ch)}</button>`).join('')}</div>`;
  } else if (st.t === 'type') {
    body = `<div class="ask">Напишите слово по-китайски иероглифами или пиньинем (тоны не нужны)</div><div class="fr center">${esc(v.ru)}</div>
      <p class="muted small center">${v.zh.length} ${v.zh.length === 1 ? 'иероглиф' : v.zh.length < 5 ? 'иероглифа' : 'иероглифов'}</p>
      <div class="lxrow"><input id="lxin" class="lxin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="например: hanshu или 函数" value="${esc(st.val)}" ${st.res ? 'disabled' : ''}>
      ${st.res ? '' : `<button class="btn dark" data-act="lxcheck">Проверить</button>`}</div>
      ${st.res ? '' : `<button class="btn sm" data-act="lxgive">Не помню — показать</button>`}`;
  }
  let fb = '';
  if (st.res) fb = `<div class="expl ${st.res === 'ok' ? 'good' : 'bad'}"><b>${st.res === 'ok' ? 'Верно' : 'Неверно — это слово появится ещё раз в конце'}</b>${wordLine(v)}</div>
    <div class="facts2"><button class="btn dark wide" data-act="lxnext">Дальше <kbd>Enter</kbd></button></div>`;
  const p = Math.round(x.i / x.q.length * 100);
  return `<div class="runbar"><button class="btn" data-act="lxback">← Выйти</button><span class="title">${esc(x.title)}</span><span class="sp"></span><span class="muted mono">${x.i + 1} / ${x.q.length}</span></div>
  <div class="lxprog">${bar(p)}</div>
  <article class="qsheet narrow lx">${body}${fb}</article>`;
}
function lxKey(e) {
  const x = A.lx; if (!x || x.done) return false;
  const st = x.q[x.i];
  if (e.key === 'Enter') { if (st.t === 'type' && !st.res) lxCheckType(); else lxNext(); return true; }
  const idx = '1234'.indexOf(e.key), k = 'ABCD'.indexOf(e.key.toUpperCase());
  const n = idx >= 0 ? idx : (e.key.length === 1 ? k : -1);
  if (n >= 0 && 'c' in st && !st.res) { lxAnswer(n); return true; }
  if (e.key === 'Backspace' && st.t === 'build' && !st.res && st.picked.length) { st.picked.pop(); render(); return true; }
  return false;
}
function topicWords(s, name) {
  const tp = (TH[s] || []).find(t => t.t === name);
  let text = tp ? tp.items.map(i => i.zh).join('。') : '';
  TASKS.forEach(t => { if (t.s === s && t.t === name) text += '。' + t.q + (t.p && PAS[t.p] ? PAS[t.p].zh : ''); });
  return termsIn(text);
}
function exGrid(arg, idsMode) {
  const act = idsMode ? 'lxids' : 'lx';
  const it = [['lesson', 'Урок · 8 слов', 'Новые слова и все упражнения подряд. Лучший вариант на каждый день'],
    ['match', 'Сопоставление', '10 пар «слово — перевод»'], ['cloze', 'Слово в контексте', 'Пропуск в формулировке теории или условии задачи'],
    ['build', 'Собери слово', 'Иероглифы в правильном порядке'], ['py', 'Тоны и пиньинь', 'Выбрать правильное чтение'],
    ['type', 'Напиши по памяти', 'По переводу — иероглифами или пиньинем'], ['mc', 'Перевод', 'Китайский ⇄ русский']];
  if (TTS) it.push(['listen', 'На слух', 'Узнать слово по звуку']);
  return `<div class="exgrid">${it.map(([k, n, d], i) => `<button class="ex${i === 0 ? ' primary' : ''}" data-act="${act}" data-arg="${k}|${arg}"><b>${n}</b><span>${d}</span></button>`).join('')}</div>`;
}
function viewSubjWords(s) {
  const names = [...new Set((TH[s] || []).map(t => t.t).concat(taskTopics(s)))];
  const rows = names.map(nm => { const ws = topicWords(s, nm); if (!ws.length) return '';
    const kn = ws.filter(w => lvl(w.id) >= 3).length, ids = ws.map(w => w.id).join(',');
    return `<div class="trow wrow"><span><span class="zh">${esc(nm)}</span><small>${esc(TOPIC_RU[nm] || '')} · выучено ${kn} из ${ws.length}</small></span>${bar(kn / ws.length * 100)}
      <span class="wbtns"><button class="btn sm dark" data-act="lxids" data-arg="lesson|${ids}|${esc(nm)}">Урок</button><button class="btn sm" data-act="lxids" data-arg="match|${ids}|${esc(nm)}">Пары</button><button class="btn sm" data-act="fcids" data-arg="${ids}">Карточки</button></span></div>`; }).join('');
  return `<p class="muted small">Слова, которые встречаются в теории и задачах каждой темы. «Урок» вводит до 4 новых слов и прогоняет все слова темы через разные упражнения; ошибки сразу попадают в карточки.</p>
    <div class="acts"><button class="btn dark" data-act="lx" data-arg="lesson|${s}">Урок по всему предмету</button></div>${exGrid(s)}<div class="tlist">${rows}</div>`;
}

/* ───── реальные экзамены ───── */
function realList(s) {
  const ex = (window.REAL_EXAMS || []).filter(e => e.s === s).sort((a, b) => b.d.localeCompare(a.d));
  if (!ex.length) return s === 'p' ? '<p class="muted small">Заданий реальных экзаменов по физике пока нет в банке — добавьте варианты, и они появятся здесь.</p>' : '';
  const v = SUBJ[s];
  return `<h2 class="sec">Реальные экзамены CSCA</h2><div class="tlist">${ex.map(e => { const ids = TASKS.filter(t => t.s === s && t.src && t.src.startsWith(e.d + '·'));
    let c = 0, w = 0; ids.forEach(x => { const st = S.ts[x.id]; if (st) { c += st.c; w += st.w; } });
    return `<div class="trow wrow"><span><span class="mono"><b>${esc(e.d)}</b></span><small>${ids.length} заданий · ${Math.round(ids.length * v.sec / 60)} мин${pct(c, w) === null ? '' : ' · верно ' + pct(c, w) + '%'}</small></span>${bar(pct(c, w))}
      <span class="wbtns"><button class="btn sm dark" data-act="real" data-arg="${e.d}|x">Как на экзамене</button><button class="btn sm" data-act="real" data-arg="${e.d}|p">С разбором</button></span></div>`; }).join('')}</div>
    <p class="muted small">Задания восстановлены по присланным материалам. Где ключ ответов противоречил условию, ответ исправлен и это отмечено в разборе.</p>`;
}
function startReal(s, d, timed) {
  A.s = s; const list = TASKS.filter(t => t.s === s && t.src && t.src.startsWith(d + '·'));
  const v = SUBJ[s];
  startRun(timed ? 'exam' : 'tasks', list.map(taskItem), 'CSCA ' + d + ' · ' + v.zh, Object.assign({ again: ['real', s, d, timed] }, timed ? { dur: Math.round(list.length * v.sec) * 1000 } : {}));
}
/* ───── конспект ───── */
const KON = window.KONSPEKT || {};
function konHtml(x) {
  const out = []; let ul = null;
  x.trim().split('\n').forEach(l => {
    l = l.trim(); if (!l) return;
    if (l.startsWith('- ')) { (ul = ul || []).push('<li>' + fmt(l.slice(2)) + '</li>'); return; }
    if (ul) { out.push('<ul>' + ul.join('') + '</ul>'); ul = null; }
    if (l.startsWith('## ')) out.push('<h3>' + fmt(l.slice(3)) + '</h3>');
    else if (l.startsWith('> ')) out.push('<div class="kf">' + fmt(l.slice(2)) + '</div>');
    else if (l.startsWith('! ')) out.push('<div class="ktip"><b>На экзамене.</b> ' + fmt(l.slice(2)) + '</div>');
    else out.push('<p>' + fmt(l) + '</p>');
  });
  if (ul) out.push('<ul>' + ul.join('') + '</ul>');
  return out.join('');
}
function viewKon() {
  const s = A.s, K = KON[s] || [], i = A.kon, k = K[i];
  if (!k) { A.view = 'subj'; return viewSubj(); }
  const thI = (TH[s] || []).findIndex(x => x.t === k.t);
  const tasks = TASKS.filter(t => t.s === s && t.t === k.t), rn = tasks.filter(t => t.src).length;
  const ws = topicWords(s, k.t).concat(termsIn(k.x)).filter((v, j, a) => a.indexOf(v) === j);
  const prev = i > 0 ? `<button class="btn" data-act="kon" data-arg="${i - 1}">← ${esc(K[i - 1].ru)}</button>` : '';
  const next = i < K.length - 1 ? `<button class="btn" data-act="kon" data-arg="${i + 1}">${esc(K[i + 1].ru)} →</button>` : '';
  return `<div class="runbar"><button class="btn" data-act="go" data-arg="subj">← ${SUBJ[s].zh} · конспект</button><span class="sp"></span><span class="muted mono">${i + 1} / ${K.length}</span></div>
  <h1 class="pt">${esc(k.ru)} <span class="zh muted">${esc(k.t)}</span></h1>
  <div class="tlayout"><article class="sheet kon">${konHtml(k.x)}</article>
  <aside class="tside sheet"><div class="kicker">Дальше по теме</div>
    <div class="steps">
      ${thI >= 0 ? `<button class="act" data-act="th2" data-arg="${esc(k.t)}"><b>1. Теория на китайском</b><span>Те же факты в формулировках учебника</span></button>
      <button class="act" data-act="drill" data-arg="${thI}"><b>2. Тренировка теории</b><span>Пропущенный термин и перевод</span></button>` : ''}
      ${tasks.length ? `<button class="act primary" data-act="tasks" data-arg="${esc(k.t)}"><b>${thI >= 0 ? '3. ' : ''}Задачи CSCA по теме</b><span>${tasks.length} задач${rn ? ', из них ' + rn + ' с реальных экзаменов' : ''}</span></button>` : ''}
      ${ws.length ? `<button class="act" data-act="lxids" data-arg="lesson|${ws.map(w => w.id).join(',')}|${esc(k.t)}"><b>Урок по словам темы</b><span>${ws.length} терминов</span></button>` : ''}
    </div>${chips(ws.slice(0, 40), 'Термины')}</aside></div>
  <div class="qnav">${prev}<span class="sp"></span>${next}</div>`;
}

/* ───── рендер ───── */
const pop = document.getElementById('pop');
function render() {
  hidePop();
  document.querySelectorAll('[data-nav]').forEach(b => b.setAttribute('aria-current', String(navKey() === b.dataset.nav)));
  document.getElementById('tgRuby').setAttribute('aria-pressed', String(S.set.ruby));
  document.getElementById('tgSound').setAttribute('aria-pressed', String(S.set.sound));
  const app = document.getElementById('app');
  const map = { home: viewHome, vocab: viewVocab, fc: viewFC, run: viewRun, result: viewResult, subj: viewSubj, topic: viewTopic, read: viewRead, lx: viewLx, kon: viewKon };
  app.innerHTML = (map[A.view] || viewHome)();
  app.querySelectorAll('.stem, .tz, .passage .zh, .fex, .expl .zh, .rvb .zh, .kon').forEach(markTerms);
  if (A.view === 'run' && A.run.mode === 'exam' && !tick) tick = setInterval(onTick, 1000);
  const vs = document.getElementById('vsearch');
  if (vs) vs.addEventListener('input', e => { A.q = e.target.value; document.getElementById('vlist').innerHTML = vocabRows(); });
  const lxin = document.getElementById('lxin'); if (lxin) { lxin.addEventListener('input', e => { A.lx.q[A.lx.i].val = e.target.value; }); if (!lxin.disabled) setTimeout(() => lxin.focus(), 0); }
  const npd = document.getElementById('npd'); if (npd) npd.addEventListener('change', e => { S.newPerDay = +e.target.value; save(); render(); });
  const dir = document.getElementById('dir'); if (dir) dir.addEventListener('change', e => { S.set.dir = e.target.value; save(); });
  try { const tok = navKey(); if (location.hash.slice(1) !== tok) history.replaceState(null, '', '#' + tok); } catch (e) {}
}
function navKey() { if (A.view === 'kon') return A.s; if (A.view === 'lx') return A.lx && A.lx.back === 'vocab' ? 'vocab' : (['subj', 'topic'].includes(A.lx && A.lx.back) ? A.s : 'home'); return ['subj', 'topic'].includes(A.view) ? A.s : (A.view === 'vocab' || A.view === 'fc') ? 'vocab' : A.view === 'home' ? 'home' : (A.run || A.rd ? A.s : 'home'); }
function onTick() {
  if (!A.run || A.run.mode !== 'exam') { clearInterval(tick); tick = null; return; }
  const left = A.run.dur - (Date.now() - A.run.start), el = document.getElementById('timer');
  if (el) { el.textContent = mmss(left); el.classList.toggle('low', left < 3e5); }
  if (left <= 0) finish();
}
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => { t.hidden = true; }, 3200); }

/* ── всплывающий перевод слова ── */
function showPop(el, id) {
  const v = V[id]; if (!v) return;
  const b = lvl(id);
  pop.innerHTML = `<div class="pz zh">${esc(v.zh)} ${spkBtn(v.zh)}</div><div class="pp">${esc(v.py)}</div><div class="pr">${esc(v.ru)}</div>
    ${v.ex ? `<div class="pe zh">${fmt(v.ex)}</div>` : ''}<div class="pf"><span class="muted small">${b < 0 ? 'не изучалось' : 'уровень ' + b + ' из 5'}</span>
    <button class="btn sm" data-act="add" data-arg="${id}">${b < 0 ? 'В повторение' : 'Повторить сегодня'}</button></div>`;
  pop.hidden = false;
  const r = el.getBoundingClientRect(), w = pop.offsetWidth;
  let x = r.left + window.scrollX; x = Math.min(x, window.scrollX + document.documentElement.clientWidth - w - 12); x = Math.max(12 + window.scrollX, x);
  pop.style.left = x + 'px'; pop.style.top = (r.bottom + window.scrollY + 6) + 'px';
  if (S.set.sound) speak(v.zh);
}
function hidePop() { pop.hidden = true; }

/* ───── события ───── */
function leaveRun() {
  if (A.run && A.run.mode === 'exam' && !A.leaveArmed) { A.leaveArmed = true; toast('Экзамен идёт. Нажмите «Выйти» ещё раз, чтобы выйти без результата.'); setTimeout(() => { A.leaveArmed = false; }, 4000); return; }
  A.leaveArmed = false; clearInterval(tick); tick = null; const back = A.run ? A.run.back : 'home'; A.run = null; A.view = back; render();
}
document.addEventListener('click', e => {
  const term = e.target.closest('.term');
  if (term) { e.preventDefault(); showPop(term, +term.dataset.w); return; }
  const b = e.target.closest('[data-act],[data-nav]');
  if (!b) { if (!e.target.closest('#pop')) hidePop(); return; }
  if (b.dataset.nav) {
    const k = b.dataset.nav; if (A.view === 'run' && A.run.mode === 'exam') { leaveRun(); return; }
    clearInterval(tick); tick = null; A.run = null;
    if (k === 'home') A.view = 'home'; else if (k === 'vocab') A.view = 'vocab'; else { A.s = k; A.view = 'subj'; }
    render(); window.scrollTo(0, 0); return;
  }
  const act = b.dataset.act, arg = b.dataset.arg;
  switch (act) {
    case 'speak': speak(arg); break;
    case 'pop': showPop(b, +arg); e.stopPropagation(); break;
    case 'add': addToSrs(+arg); toast('Слово добавлено в повторение на сегодня.'); if (A.view === 'vocab') document.getElementById('vlist').innerHTML = vocabRows(); hidePop(); break;
    case 'go': if (arg === 'subj') A.view = 'subj'; else if (arg === 'topic') A.view = 'topic'; else A.view = arg || 'home'; A.fc = null; A.rd = null; render(); break;
    case 'subj': { const [s, t] = arg.split('|'); A.s = s; A.tab = t; A.view = 'subj'; render(); window.scrollTo(0, 0); break; }
    case 'tab': A.tab = arg; render(); break;
    case 'deck': A.deck = arg; A.view = 'vocab'; render(); break;
    case 'fc': startFC(arg); break;
    case 'fcids': startFC('', arg.split(',').filter(Boolean).map(Number)); break;
    case 'flip': A.fc.shown = true; render(); if (S.set.sound) speak(V[A.fc.q[A.fc.i]].zh); break;
    case 'rate': fcRate(+arg); break;
    case 'vquiz': startRun('vquiz', vquizItems(arg, false), 'Тест по словам · ' + (DECKS[arg] || 'все')); break;
    case 'vaudio': startRun('vquiz', vquizItems(arg, true), 'Тест на слух · ' + (DECKS[arg] || 'все')); break;
    case 'topic': A.topic = +arg; A.tshow = {}; A.tall = false; A.view = 'topic'; render(); window.scrollTo(0, 0); break;
    case 'tshow': A.tshow = A.tshow || {}; A.tshow[arg] = !A.tshow[arg]; render(); break;
    case 'tall': A.tall = !A.tall; A.tshow = {}; if (A.tall) TH[A.s][A.topic].items.forEach((_, j) => { A.tshow[j] = true; }); render(); break;
    case 'drill': { const ti = arg === '' ? null : +arg; startRun('drill', drillItems(A.s, ti), 'Тренировка · ' + (ti == null ? 'все темы' : TH[A.s][ti].t), { again: ['drill', A.s, ti] }); break; }
    case 'tasks': { const list = TASKS.filter(t => t.s === A.s && (!arg || t.t === arg)); const sel = shuffle(list);
      startRun('tasks', sel.slice(0, 20).map(taskItem), 'Задачи · ' + (arg || 'все темы'), { again: ['tasks', A.s, arg] }); break; }
    case 'wrong': startRun('tasks', S.wrong.filter(id => TI[id] && TI[id].s === A.s).map(id => taskItem(TI[id])), 'Работа над ошибками', { again: ['wrong'] }); break;
    case 'exam': startExam(); break;
    case 'real': { const [d, m] = arg.split('|'); startReal(A.s, d, m === 'x'); break; }
    case 'kon': A.kon = +arg; A.view = 'kon'; render(); window.scrollTo(0, 0); break;
    case 'th2': { const i = TH[A.s].findIndex(x => x.t === arg); if (i >= 0) { A.topic = i; A.tshow = {}; A.tall = false; A.view = 'topic'; render(); window.scrollTo(0, 0); } break; }
    case 'read': { const [s, t] = arg.split('|'); A.s = s; startRead(s, t || null); break; }
    case 'rdshow': A.rd.shown = true; render(); break;
    case 'rd': A.rd.got += +arg; A.rd.i++; A.rd.shown = false; render(); window.scrollTo(0, 0); break;
    case 'pick': pickAns(+arg); break;
    case 'next': if (A.run.i < A.run.items.length - 1) { A.run.i++; render(); topQ(); autoAudio(); } break;
    case 'prev': if (A.run.i > 0) { A.run.i--; A.confirm = false; render(); } break;
    case 'jump': A.run.i = +arg; A.confirm = false; render(); break;
    case 'flag': A.run.flag[A.run.i] = !A.run.flag[A.run.i]; render(); break;
    case 'tr': A.run.showTr = !A.run.showTr; render(); break;
    case 'submit': A.confirm = true; render(); break;
    case 'cancel': A.confirm = false; render(); break;
    case 'finish': finish(); break;
    case 'leave': leaveRun(); break;
    case 'again': again(); break;
    case 'lx': { const [k, d] = arg.split('|'); startLx(k, d || '', null, d ? DECKS[d] : ''); break; }
    case 'lxids': { const [k, ids, nm] = arg.split('|'); startLx(k, '', ids.split(',').filter(Boolean).map(Number), nm || 'тема'); break; }
    case 'lxpick': lxAnswer(+arg); break;
    case 'lxnext': lxNext(); break;
    case 'lxL': lxMatch('L', +arg); break;
    case 'lxR': lxMatch('R', +arg); break;
    case 'lxtile': lxTile(+arg); break;
    case 'lxun': { const st = A.lx.q[A.lx.i]; st.picked.splice(+arg, 1); render(); break; }
    case 'lxcheck': lxCheckType(); break;
    case 'lxgive': { const st = A.lx.q[A.lx.i]; st.val = (document.getElementById('lxin') || {}).value || ''; lxMark(st, false); render(); break; }
    case 'lxback': { const b = A.lx ? A.lx.back : 'home'; A.lx = null; A.view = b === 'lx' ? 'home' : b; render(); break; }
    case 'lxagain': { const a = A.lx.again; A.view = A.lx.back; startLx(a[0], a[1], a[2], a[3]); break; }
    case 'export': exportData(); break;
    case 'import': importData(); break;
    case 'reset': if (A.resetArmed) { S = blank(); save(); A.resetArmed = false; toast('Прогресс сброшен.'); render(); } else { A.resetArmed = true; toast('Нажмите «Сбросить» ещё раз для подтверждения.'); setTimeout(() => { A.resetArmed = false; }, 4000); } break;
  }
});
function fcRate(r) {
  const f = A.fc, id = f.q[f.i]; rate(id, r); f.done++;
  if (r === 0) { f.again++; f.q.splice(Math.min(f.q.length, f.i + 4), 0, id); }
  f.i++; f.shown = false; render();
}
function again() {
  const r = A.res; A.view = r.back;
  if (r.mode === 'exam') return startExam();
  if (r.mode === 'vquiz') return startRun('vquiz', vquizItems(A.deck, r.items[0].kind === 'audio'), r.title);
  const a = r.again || [];
  if (a[0] === 'drill') return startRun('drill', drillItems(a[1], a[2]), r.title, { again: a });
  if (a[0] === 'tasks') { const list = TASKS.filter(t => t.s === a[1] && (!a[2] || t.t === a[2])); return startRun('tasks', shuffle(list).slice(0, 20).map(taskItem), r.title, { again: a }); }
  if (a[0] === 'real') return startReal(a[1], a[2], a[3]);
  if (a[0] === 'wrong') return startRun('tasks', S.wrong.filter(id => TI[id] && TI[id].s === A.s).map(id => taskItem(TI[id])), r.title, { again: a });
  render();
}
function startExam() {
  const v = SUBJ[A.s]; let list = TASKS.filter(t => t.s === A.s);
  if (list.length > v.n) { const keep = new Set(pick(list, v.n).map(t => t.id)); list = list.filter(t => keep.has(t.id)); }
  const order = taskTopics(A.s); list.sort((a, b) => order.indexOf(a.t) - order.indexOf(b.t));
  startRun('exam', list.map(taskItem), 'Пробный экзамен · ' + v.zh, { dur: Math.round(list.length * v.sec) * 1000 });
}
function topQ() { const q = document.querySelector('.qsheet'); if (q && q.getBoundingClientRect().top < 70) q.scrollIntoView({ block: 'start' }); }
function autoAudio() { const it = A.run && A.run.items[A.run.i]; if (it && it.kind === 'audio') setTimeout(() => speak(it.w.zh), 200); }

document.getElementById('tgRuby').addEventListener('click', () => { S.set.ruby = !S.set.ruby; save(); render(); });
document.getElementById('tgSound').addEventListener('click', () => { S.set.sound = !S.set.sound; save(); render(); });
window.addEventListener('resize', hidePop);
document.addEventListener('keydown', e => {
  if (A.view === 'lx' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    if (e.target.id === 'lxin') { if (e.key === 'Enter') { e.preventDefault(); lxKey(e); } return; }
    if (e.target.closest('input,textarea,select')) return;
    if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName === 'BUTTON' && !document.activeElement.matches('[data-act="lxnext"]')) return;
    if (lxKey(e)) e.preventDefault();
    return;
  }
  if (e.target.closest('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape') hidePop();
  if (e.key === 'Enter' && document.activeElement && document.activeElement.classList.contains('term')) { showPop(document.activeElement, +document.activeElement.dataset.w); return; }
  if (A.view === 'fc' && A.fc && A.fc.i < A.fc.q.length) {
    if (e.key === ' ' && !A.fc.shown) { e.preventDefault(); A.fc.shown = true; render(); if (S.set.sound) speak(V[A.fc.q[A.fc.i]].zh); }
    else if (A.fc.shown && '123'.includes(e.key)) fcRate(+e.key - 1);
    return;
  }
  if (A.view === 'read' && A.rd && A.rd.i < A.rd.items.length) {
    if (e.key === ' ' && !A.rd.shown) { e.preventDefault(); A.rd.shown = true; render(); }
    else if (A.rd.shown && '12'.includes(e.key)) { A.rd.got += +e.key - 1; A.rd.i++; A.rd.shown = false; render(); }
    return;
  }
  if (A.view !== 'run' || !A.run) return;
  const k = e.key.toUpperCase(), idx = 'ABCDEF'.includes(k) && k.length === 1 ? 'ABCDEF'.indexOf(k) : '123456'.indexOf(e.key);
  if (idx >= 0 && e.key.length === 1 && idx < A.run.items[A.run.i].opts.length) { e.preventDefault(); pickAns(idx); return; }
  if (e.key === 'Enter' || e.key === 'ArrowRight') {
    if (document.activeElement && document.activeElement.tagName === 'BUTTON' && e.key === 'Enter') return;
    if (A.run.mode !== 'exam' && A.run.ans[A.run.i] === undefined && e.key === 'Enter') return;
    if (A.run.i < A.run.items.length - 1) { A.run.i++; render(); topQ(); autoAudio(); } else if (A.run.mode !== 'exam') finish();
  }
  if (e.key === 'ArrowLeft' && A.run.i > 0) { A.run.i--; render(); }
});

/* ── перенос прогресса между устройствами ── */
function exportData() {
  const box = document.getElementById('xfer'); box.value = JSON.stringify(S); box.hidden = false; box.select();
  try { navigator.clipboard.writeText(box.value).then(() => toast('Прогресс скопирован. Вставьте его на другом устройстве и нажмите «Загрузить».'), () => toast('Скопируйте текст из поля вручную.')); } catch (e) { toast('Скопируйте текст из поля вручную.'); }
}
function importData() {
  const box = document.getElementById('xfer');
  if (box.hidden || !box.value.trim()) { box.hidden = false; box.value = ''; box.focus(); toast('Вставьте скопированный прогресс в поле и нажмите «Загрузить» ещё раз.'); return; }
  try { const d = JSON.parse(box.value); if (!d.srs) throw 0; S = Object.assign(blank(), d); save(); box.hidden = true; toast('Прогресс загружен.'); render(); }
  catch (e) { toast('Не получилось прочитать текст. Проверьте, что он скопирован целиком.'); }
}

/* старт */
(function () {
  const h = (location.hash || '').slice(1);
  if (h === 'vocab') A.view = 'vocab'; else if (SUBJ[h]) { A.s = h; A.view = 'subj'; }
  render();
})();
})();
