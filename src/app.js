
'use strict';
/* ==========================================================================
   KONFIGURATION – Supabase-Zugang. Leer = App läuft nur lokal auf dem Gerät.
   (Der anon-Key ist öffentlich gedacht; geschützt wird alles über Row Level Security.)
   ========================================================================== */
const CONFIG = {
  SUPABASE_URL: '__SUPABASE_URL__',
  SUPABASE_ANON_KEY: '__SUPABASE_ANON_KEY__'
};

const APP_NAME = 'Denisegram';
const APP_VERSION = '1.0';
const MAX_PEOPLE = 10;
const DAY = 864e5;
const GRADS = [
  'linear-gradient(135deg,#ff7a59,#e8457c)',
  'linear-gradient(135deg,#ffc15e,#ff7a59)',
  'linear-gradient(135deg,#4facfe,#7b61ff)',
  'linear-gradient(135deg,#43c6ac,#2b8a99)',
  'linear-gradient(135deg,#2b2b2b,#555555)'
];
const EMOJIS = ['🙂','😎','🦊','🐻','🐶','🐱','🦁','🐧','🌻','🌸','🌙','☀️','🔥','🎸','🎧','⚓️','🚲','🏡','❤️','✨','🍀','🐘','🦋','🍓'];
const COLORS = ['#e8457c','#ff7a59','#ffc15e','#43c6ac','#4facfe','#7b61ff','#b46cff','#2b2b2b','#8d6e63','#9ccc65'];

/* ---------- Helfer ---------- */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const isAndroid = () => /Android/i.test(navigator.userAgent);
const isSamsungBrowser = () => /SamsungBrowser/i.test(navigator.userAgent);
const isInAppBrowser = () => /(FBAN|FBAV|Instagram|WhatsApp|Line\/|wv\))/i.test(navigator.userAgent);
function chromeIntentURL(){
  const o = S.onb || {};
  const q = o.mode === 'restore' && o.restore ? `?restore=${o.restore}` : o.token ? `?join=${o.token}` : '';
  return `intent://${location.host}${location.pathname}${q}#Intent;scheme=https;package=com.android.chrome;end`;
}
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const hhmm = t => new Date(t).toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'});
const dmy = t => new Date(t).toLocaleDateString('de-DE', {day:'numeric', month:'numeric'});

function ago(t){
  const d = (Date.now() - t) / 1000;
  if (d < 60) return 'gerade eben';
  if (d < 3600) return `vor ${Math.floor(d/60)} Min.`;
  if (d < 86400) return `vor ${Math.floor(d/3600)} Std.`;
  if (d < 172800) return 'gestern';
  if (d < 7*86400) return `vor ${Math.floor(d/86400)} Tagen`;
  const dt = new Date(t), o = {day:'numeric', month:'long'};
  if (dt.getFullYear() !== new Date().getFullYear()) o.year = 'numeric';
  return dt.toLocaleDateString('de-DE', o);
}
function dayLabel(t){
  const d = new Date(t); d.setHours(0,0,0,0);
  const n = new Date(); n.setHours(0,0,0,0);
  const diff = Math.round((n - d) / DAY);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Gestern';
  return new Date(t).toLocaleDateString('de-DE', {weekday:'long', day:'numeric', month:'long'});
}
function shortDate(t){ const d = new Date(t); return `${d.getDate()}<br>${d.toLocaleDateString('de-DE',{month:'short'}).replace('.','')}`; }

let toastT;
function toast(msg){
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2800);
}

/* ---------- Icons ---------- */
const sv = (p, fill) => `<svg viewBox="0 0 24 24" fill="${fill?'currentColor':'none'}" stroke="currentColor" stroke-width="${fill?0:1.9}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const HEART = '<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.9 1.3-1.8 2.9-2.9 4.9-2.9 3.5 0 5.6 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/>';
const I = {
  home:     sv('<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>'),
  homeOn:   sv('<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>', true),
  search:   sv('<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>'),
  searchOn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>`,
  plus:     sv('<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>'),
  heart:    sv(HEART),
  heartOn:  sv(HEART, true),
  comment:  sv('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.5L3.5 20.5l1.4-4.6a8.4 8.4 0 1 1 15.6-4.3z"/>'),
  chat:     sv('<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z"/>'),
  more:     sv('<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>'),
  close:    sv('<path d="M5 5l14 14M19 5 5 19"/>'),
  grid:     sv('<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/>'),
  archive:  sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  book:     sv('<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/>'),
  video:    sv('<path d="M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><path d="m16 10.5 5-3v9l-5-3"/>'),
  muted:    sv('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 5M22 9l-5 5"/>'),
  sound:    sv('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12"/>'),
  back:     sv('<path d="M15 5l-7 7 7 7"/>'),
  gear:     sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  plusPlain:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 4v16M4 12h16"/></svg>`,
  burger:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9h16M8 15h12"/></svg>`,
  person:   sv('<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="10" r="3.3"/><path d="M5.8 18.6a7.5 7.5 0 0 1 12.4 0"/>'),
  sendOn:   sv('<path d="M21.5 3 3 10.2l7.2 3.1L21.5 3zM10.2 13.3l3.1 7.2L21.5 3"/>', true),
  reels:    sv('<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 8.5h18M8 3l3 5.5M14 3l3 5.5"/><path d="M10 12v6l5-3z" fill="currentColor" stroke="none"/>'),
  reelsOn:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 8.5h18M8 3l3 5.5M14 3l3 5.5"/><path d="M10 12v6l5-3z" fill="currentColor" stroke="none"/></svg>`,
  pin:      sv('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.6"/>'),
  pinOn:    `<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="currentColor"/><circle cx="12" cy="9.5" r="2.6" fill="var(--bg)"/></svg>`,
  save:     sv('<path d="M6 3.5h12v17l-6-4.5-6 4.5z"/>'),
  saveOn:   sv('<path d="M6 3.5h12v17l-6-4.5-6 4.5z"/>', true),
  chev:     sv('<path d="m6 9 6 6 6-6"/>'),
  check:    sv('<path d="m5 12.5 4.5 4.5L19 7"/>'),
  people:   sv('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18.5 20a6.5 6.5 0 0 0-3-5.5"/>'),
  star:     sv('<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z"/>'),
  repost:   sv('<path d="M17 2.5l3 3-3 3"/><path d="M4 11v-1.5a4 4 0 0 1 4-4h12"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 13v1.5a4 4 0 0 1-4 4H4"/>'),
  send:     sv('<path d="M21.5 3 3 10.2l7.2 3.1L21.5 3zM10.2 13.3l3.1 7.2L21.5 3"/>'),
  play:     sv('<path d="M7 4.5v15l12-7.5z"/>'),
  bell:     sv('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>')
};
I.menu = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>`;

/* ---------- Lokaler Speicher (IndexedDB) ---------- */
const TABLES = {
  people:{ key:r => r.id },
  profiles:{ key:r => r.role },
  posts:{ key:r => r.id },
  reactions:{ key:r => r.post_id + '|' + r.role },
  comments:{ key:r => r.id },
  stories:{ key:r => r.id },
  story_views:{ key:r => r.story_id + '|' + r.role },
  messages:{ key:r => r.id }
};
const READONLY = new Set(['people']);
const DB = (() => {
  let dbp;
  const STORES = [...Object.keys(TABLES), 'media', 'meta', 'outbox'];
  function open(){
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('denisegram-v1', 1);
      r.onupgradeneeded = () => STORES.forEach(s => { if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const st = async (n, m='readonly') => (await open()).transaction(n, m).objectStore(n);
  return {
    get: async (n, k) => req((await st(n)).get(k)),
    put: async (n, v, k) => req((await st(n, 'readwrite')).put(v, k)),
    del: async (n, k) => req((await st(n, 'readwrite')).delete(k)),
    all: async n => req((await st(n)).getAll()),
    entries: async n => { const s = await st(n); const [ks, vs] = await Promise.all([req(s.getAllKeys()), req(s.getAll())]); return ks.map((k, i) => [k, vs[i]]); },
    putMany: async (n, items) => { const d = await open(); return new Promise((res, rej) => { const tx = d.transaction(n, 'readwrite'); const s = tx.objectStore(n); items.forEach(([k, v]) => s.put(v, k)); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
  };
})();
const meta = { get: k => DB.get('meta', k), set: (k, v) => DB.put('meta', v, k) };

/* ---------- Zustand ---------- */
const D = {}; Object.keys(TABLES).forEach(t => D[t] = new Map());
const S = { me:null, spaceId:null, isOwner:false, restore:null, removed:false, tab:'home', chatWith:null, profileOf:null, profileTab:'grid', q:'', feedMode:'all', onb:null };
const isActive = pid => { const p = D.people.get(pid); return !p || !p.removed_at; };
const activePids = () => [...D.people.values()].filter(p => !p.removed_at).map(p => p.id);
const others = () => activePids().filter(p => p !== S.me);
const prof  = r => D.profiles.get(r) || { role:r, nick:'Mitglied', emoji:'🙂', avatar_path:null };
const nick  = r => prof(r).nick || 'Mitglied';
const slug  = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/\s+/g, '_').replace(/[^a-z0-9._]/g, '').slice(0, 24);
const uname = r => prof(r).username || slug(nick(r)) || 'mitglied';
const colorOf = r => { const c = prof(r).color; return /^#[0-9a-f]{6}$/i.test(c || '') ? c : ''; };
const posts = () => [...D.posts.values()].filter(p => !p.deleted && isActive(p.author)).sort((a,b) => b.created_at - a.created_at);
const likesOf = id => [...D.reactions.values()].filter(r => r.post_id === id && r.on && !String(r.role).includes(':') && isActive(r.role)).sort((a,b) => a.at - b.at);
const marks = (id, kind) => [...D.reactions.values()].filter(r => r.post_id === id && r.on && String(r.role).endsWith(':' + kind));
const msgText = t => { const m = /^\[\[post:([\w-]+)\]\]$/.exec(t || ''); return m ? '📎 hat dir einen Beitrag geschickt' : t; };
const isFav = id => { const r = D.reactions.get(id + '|' + S.me + ':fav'); return !!(r && r.on); };
const commentsOf = id => [...D.comments.values()].filter(c => c.post_id === id && !c.deleted && isActive(c.author)).sort((a,b) => a.created_at - b.created_at);
const storiesAll = () => [...D.stories.values()].filter(s => !s.deleted && isActive(s.author)).sort((a,b) => a.created_at - b.created_at);
const storiesOf = (r, active) => storiesAll().filter(s => s.author === r && (!active || Date.now() - s.created_at < DAY));
const viewersOf = id => [...D.story_views.values()].filter(v => v.story_id === id && isActive(v.role)).map(v => v.role);
const messages = () => [...D.messages.values()].filter(m => !m.deleted && (m.author === S.me || m.to_pid === S.me)).sort((a,b) => a.created_at - b.created_at);
const chatMsgs = pid => messages().filter(m => (m.author === S.me && m.to_pid === pid) || (m.author === pid && m.to_pid === S.me));
const unreadFrom = pid => messages().filter(m => m.author === pid && m.to_pid === S.me && !m.read_at).length;
const unread = () => messages().filter(m => m.to_pid === S.me && !m.read_at && isActive(m.author)).length;
const nameList = names => names.length <= 2 ? names.join('</b> und <b>') : `${names[0]}</b> und <b>${names.length - 1} weiteren Personen`;

/* ---------- Abgleich mit Supabase ---------- */
const Sync = {
  sb:null, ready:false, channel:null, status:'lokal',
  get configured(){ return !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && window.supabase); },
  client(){
    if (!this.sb && this.configured) this.sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, { auth:{ persistSession:true, autoRefreshToken:true, storageKey:'dg-auth' } });
    return this.sb;
  },
  async ensureAuth(){
    const sb = this.client();
    let { data:{ session } } = await sb.auth.getSession();
    let fresh = false;
    if (!session) { const r = await sb.auth.signInAnonymously(); if (r.error) throw r.error; session = r.data.session; fresh = true; }
    return { session, fresh };
  },
  async start(){
    if (!this.configured || !S.spaceId) { this.status = 'lokal'; return; }
    try {
      const { fresh } = await this.ensureAuth();
      if (fresh && S.restore) { const r = await this.sb.rpc('restore_device', { p_restore:S.restore }); if (r.error && /nicht mehr/i.test(r.error.message || '')) { await setRemoved(); return; } if (r.error) throw r.error; }
      const ms = await this.sb.rpc('my_space');
      if (ms.error) throw ms.error;
      if (!ms.data) {
        if (S.restore) { const r = await this.sb.rpc('restore_device', { p_restore:S.restore }); if (r.error) { if (/nicht mehr|ungültig/i.test(r.error.message || '')) { await setRemoved(); return; } throw r.error; } }
        else { await setRemoved(); return; }
      } else if (ms.data.pid === S.me) { S.isOwner = !!ms.data.is_owner; S.restore = ms.data.restore || S.restore; await saveDevice(); }
      this.ready = true; this.status = 'verbunden';
      this.subscribe(); await this.pull(); Outbox.flush();
    } catch (e) { this.status = 'offline'; console.warn('Sync', e); setTimeout(() => this.start(), 20000); }
  },
  subscribe(){
    if (this.channel) this.sb.removeChannel(this.channel);
    const ch = this.sb.channel('sp-' + S.spaceId);
    Object.keys(TABLES).forEach(t => ch.on('postgres_changes', { event:'*', schema:'public', table:t, filter:'space_id=eq.' + S.spaceId }, p => { if (p.new && Object.keys(p.new).length) onRemote(t, p.new, true); }));
    ch.subscribe(st => { if (st === 'SUBSCRIBED') { this.status = 'verbunden'; } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { this.status = 'offline'; } });
    this.channel = ch;
  },
  async pull(){
    if (!this.ready) return;
    const res = await Promise.all(Object.keys(TABLES).map(t => this.sb.from(t).select('*').eq('space_id', S.spaceId).then(r => [t, r])));
    const pend = await Outbox.pendingKeys();
    for (const [t, { data, error }] of res) {
      if (error) { console.warn(t, error); Outbox.lastError = t + ': ' + error.message; continue; }
      const items = [];
      data.forEach(row => { const k = TABLES[t].key(row); if (pend.has(t + '|' + k)) return; const prev = D[t].get(k); D[t].set(k, row); items.push([k, row]); effects(t, row, prev, false); });
      if (items.length) await DB.putMany(t, items);
    }
    const me = D.people.get(S.me);
    if (me && me.removed_at) { await setRemoved(); return; }
    scheduleRender();
  },
  // to: 'all' (alle anderen) · pid (eine Person) · self:true (Test an mich)
  async push(kind, title, body, to){
    if (!this.ready || !to || to === S.me) return;
    try { await this.sb.functions.invoke('send-push', { body:{ space_id:S.spaceId, kind, title, body, tag:kind, to } }); } catch (_) {}
  }
};
const Outbox = {
  busy:false, timer:null, lastError:'',
  async add(job){ const oid = newId(); job.tries = 0; await DB.put('outbox', job, oid); this.flush(); },
  async count(){ return (await DB.entries('outbox')).length; },
  async pendingKeys(){ const set = new Set(); (await DB.entries('outbox')).forEach(([, j]) => { if (j.table && j.row) set.add(j.table + '|' + TABLES[j.table].key(j.row)); }); return set; },
  async flush(){
    if (this.busy) { this.again = true; return; }
    if (!Sync.ready || !navigator.onLine) return;
    this.busy = true; this.again = false; let failed = false;
    const failedUploads = new Set();
    try {
      const jobs = (await DB.entries('outbox')).sort((a,b) => a[0] < b[0] ? -1 : 1);
      for (const [oid, job] of jobs) {
        let err = null;
        try {
          if (job.type === 'upload') {
            const m = await DB.get('media', job.path);
            if (m) { const r = await Sync.sb.storage.from('media').upload(job.path, m.blob, { contentType:m.blob.type || 'image/jpeg', upsert:true }); err = r.error; }
          } else if (job.type === 'patch') {
            const r = await Sync.sb.from(job.table).update(job.set).eq('id', job.id); err = r.error;
          } else if (job.type === 'remove') {
            await Sync.sb.storage.from('media').remove([job.path]);
          } else {
            const row = { ...job.row }; if (row.space_id !== S.spaceId && S.spaceId) row.space_id = S.spaceId;
            const mp = row.media_path || row.avatar_path;
            if (mp && failedUploads.has(mp)) err = { message:'Bild noch nicht hochgeladen' };
            else { const r = await Sync.sb.from(job.table).upsert(row); err = r.error; }
          }
        } catch (e) { err = e; }
        if (err) {
          failed = true; this.lastError = (job.table || job.type) + ': ' + (err.message || err.error || String(err));
          console.warn('Outbox', this.lastError);
          if (job.type === 'upload') failedUploads.add(job.path);
          job.tries = (job.tries || 0) + 1;
          if (job.tries >= 8 && !/fetch|network|Failed|timeout/i.test(this.lastError)) { await DB.del('outbox', oid); meta.set('lastDropped', { at:Date.now(), err:this.lastError }); }
          else await DB.put('outbox', job, oid);
          continue;
        }
        await DB.del('outbox', oid);
      }
    } catch (e) { console.warn('Outbox', e); failed = true; this.lastError = String(e.message || e); }
    if (!failed) this.lastError = '';
    this.busy = false;
    if (this.again) { this.again = false; setTimeout(() => this.flush(), 400); return; }
    if ((await this.count()) > 0) { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), failed ? 15000 : 1000); }
  }
};
window.addEventListener('online', () => { Outbox.flush(); if (Sync.ready) Sync.pull(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Sync.ready) { Sync.pull(); Outbox.flush(); } });
async function saveDevice(){ await meta.set('device', { pid:S.me, spaceId:S.spaceId, isOwner:S.isOwner, restore:S.restore }); }
async function setRemoved(){
  S.removed = true; Sync.ready = false; Sync.status = 'entfernt';
  if (Sync.channel) { try { Sync.sb.removeChannel(Sync.channel); } catch (_) {} Sync.channel = null; }
  scheduleRender();
}
async function put(table, row){
  row.space_id = S.spaceId;
  const k = TABLES[table].key(row);
  D[table].set(k, row);
  await DB.put(table, row, k);
  if (Sync.configured && S.spaceId) Outbox.add({ type:'row', table, row });
}
// Nur einzelne Felder ändern (z. B. "gelesen" beim Empfänger – der darf die Nachricht nicht als Ganzes schreiben)
async function patch(table, row, set){
  const k = TABLES[table].key(row); const nr = { ...row, ...set };
  D[table].set(k, nr); await DB.put(table, nr, k);
  if (Sync.configured && S.spaceId) Outbox.add({ type:'patch', table, id:row.id, set });
}
function onRemote(t, row, live){
  const k = TABLES[t].key(row); const prev = D[t].get(k);
  if (t === 'profiles' && prev && prev.updated_at && row.updated_at && prev.updated_at > row.updated_at) return;
  D[t].set(k, row); DB.put(t, row, k);
  if (t === 'people' && row.id === S.me && row.removed_at) { setRemoved(); return; }
  effects(t, row, prev, live);
  scheduleRender();
}
function effects(t, row, prev, live){
  if (!live || prev) return;
  if (t === 'messages' && row.author !== S.me && row.to_pid === S.me) {
    if (S.tab === 'chat' && S.chatWith === row.author && document.visibilityState === 'visible') markRead();
    else toast(`💬 ${nick(row.author)}: ${msgText(row.text).slice(0, 60)}`);
  }
  if (t === 'posts' && row.author !== S.me) toast(`✨ ${nick(row.author)} hat einen Beitrag geteilt`);
  if (t === 'stories' && row.author !== S.me) toast(`⭕ ${nick(row.author)} hat eine Story geteilt`);
  if (t === 'comments' && row.author !== S.me) { const p = D.posts.get(row.post_id); if (p && p.author === S.me) toast(`💬 ${nick(row.author)} hat kommentiert`); }
}

/* ---------- Medien ---------- */
const urlCache = new Map();
async function mediaURL(path){
  if (!path) return '';
  if (urlCache.has(path)) return urlCache.get(path);
  let m = await DB.get('media', path);
  if (!m && Sync.ready) {
    const { data, error } = await Sync.sb.storage.from('media').download(path);
    if (!error && data) { m = { blob:data, type:(data.type || '').startsWith('video') ? 'video' : 'image' }; await DB.put('media', m, path); }
  }
  if (!m) return '';
  const u = URL.createObjectURL(m.blob); urlCache.set(path, u); return u;
}
function hydrate(root){
  $$('[data-media]', root).forEach(el => mediaURL(el.dataset.media).then(u => { if (u && el.getAttribute('src') !== u) el.src = u; }));
}
function loadImg(file){
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Bild konnte nicht gelesen werden.')); i.src = URL.createObjectURL(file); });
}
async function processFile(file, max=1600){
  if ((file.type || '').startsWith('video/')) {
    if (file.size > 50e6) throw new Error('Das Video ist zu groß (max. 50 MB). Kürzer aufnehmen hilft.');
    const m = await new Promise(res => {
      const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
      v.onloadedmetadata = () => res({ w:v.videoWidth, h:v.videoHeight, d:v.duration }); v.onerror = () => res({ w:9, h:16, d:0 });
      v.src = URL.createObjectURL(file);
    });
    return { blob:file, type:'video', w:m.w || 9, h:m.h || 16, d:m.d || 0, ext:(file.type.includes('quicktime') ? 'mov' : 'mp4') };
  }
  let src = null;
  if (window.createImageBitmap) { try { src = await createImageBitmap(file); } catch (_) { src = null; } }
  if (!src) src = await loadImg(file);
  const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight, k = Math.min(1, max / Math.max(w, h));
  const cw = Math.round(w * k), ch = Math.round(h * k);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  c.getContext('2d').drawImage(src, 0, 0, cw, ch);
  if (src.close) src.close(); else if (src.src) URL.revokeObjectURL(src.src);
  // Schutz: manche Browser (z. B. Samsung Internet) liefern hier ein schwarzes Bild
  let blank = false;
  try {
    const t = document.createElement('canvas'); t.width = 32; t.height = 32; const tc = t.getContext('2d');
    tc.drawImage(c, 0, 0, 32, 32); const d = tc.getImageData(0, 0, 32, 32).data; let mx = 0;
    for (let i = 0; i < d.length; i += 4) mx = Math.max(mx, d[i] + d[i + 1] + d[i + 2]);
    blank = mx < 15;
  } catch (_) {}
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
  const suspicious = !blob || (blob.size < 20000 && file.size > 100000 && blob.size < file.size * 0.05);
  if (blank || suspicious) {
    const t = (file.type || 'image/jpeg').toLowerCase();
    const ext = t.includes('png') ? 'png' : t.includes('webp') ? 'webp' : t.includes('heic') || t.includes('heif') ? 'heic' : 'jpg';
    if (file.size > 25e6) throw new Error('Das Foto ist zu groß zum Hochladen.');
    return { blob:file, type:'image', w, h, ext };
  }
  return { blob, type:'image', w:cw, h:ch, ext:'jpg' };
}
async function storeMedia(pr){
  const path = `${S.spaceId}/${newId()}.${pr.ext}`;
  await DB.put('media', { blob:pr.blob, type:pr.type }, path);
  if (Sync.configured && S.spaceId !== 'local') await Outbox.add({ type:'upload', path });
  return path;
}
async function saveToPhone(path){
  const m = await DB.get('media', path); if (!m) { toast('Datei ist noch nicht geladen'); return; }
  const ext = path.split('.').pop();
  const file = new File([m.blob], `denisegram-${Date.now()}.${ext}`, { type:m.blob.type || (ext === 'jpg' ? 'image/jpeg' : 'video/mp4') });
  try { if (navigator.canShare && navigator.canShare({ files:[file] })) { await navigator.share({ files:[file] }); return; } }
  catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove(); toast('Gespeichert im Download-Ordner');
}

/* ---------- Bausteine ---------- */
function avatar(r, size){
  const p = prof(r), c = colorOf(r), st = `width:${size}px;height:${size}px;font-size:${Math.round(size*0.56)}px${c && !p.avatar_path ? `;background:${c}26` : ''}`;
  if (p.avatar_path) return `<div class="av" style="${st}"><img data-media="${esc(p.avatar_path)}" alt=""></div>`;
  return `<div class="av" style="${st}">${esc(p.emoji || '🙂')}</div>`;
}
function ringAvatar(r){
  const p = prof(r), c = colorOf(r);
  if (p.avatar_path) return `<div class="av"><img data-media="${esc(p.avatar_path)}" alt=""></div>`;
  return `<div class="av" style="font-size:36px${c ? `;background:${c}26` : ''}">${esc(p.emoji || '🙂')}</div>`;
}
// großes Profilbild mit Lieblingsfarbe als Ring
function bigAvatar(r, size){
  const c = colorOf(r);
  return `<span class="favring" style="display:inline-block;border-radius:50%;padding:3px;background:${c || 'transparent'}"><span style="display:block;border-radius:50%;padding:3px;background:var(--bg)">${avatar(r, size)}</span></span>`;
}
const textBox = (text, bg, cls='tp') => `<div class="${cls}" style="background:${bg || GRADS[0]}">${esc(text)}</div>`;
function thumb(it){
  if (it.media_path) return it.media_type === 'video' ? `<video data-media="${esc(it.media_path)}" muted playsinline preload="metadata"></video>` : `<img data-media="${esc(it.media_path)}" alt="" loading="lazy">`;
  return textBox(it.text, it.bg);
}
const ratio = p => Math.max(0.8, Math.min(1.91, (p.w || 1) / (p.h || 1))).toFixed(3);


/* ---------- Ansichten ---------- */
let rq = 0;
function scheduleRender(){ if (rq) return; rq = requestAnimationFrame(() => { rq = 0; render(); }); }
function render(){
  const app = $('#app');
  if (S.onb) { app.innerHTML = onbHTML(); hydrate(app); return; }
  if (!S.me) return;
  if (S.removed) { app.innerHTML = `<div class="step"><div class="grow" style="display:flex;flex-direction:column;justify-content:center;text-align:center"><div class="wordmark" style="font-size:52px">${esc(APP_NAME)}</div><p style="margin-top:14px"><b>Du bist nicht mehr im Inner Circle.</b></p><p class="muted">Wenn das ein Versehen war, frag nach einer neuen Einladung.</p></div></div>`; return; }
  const ae = document.activeElement, aid = ae && ae.id && app.contains(ae) ? ae.id : null;
  const sel = aid && 'selectionStart' in ae ? [ae.selectionStart, ae.selectionEnd, ae.value] : null;
  document.body.classList.toggle('dark-tab', S.tab === 'reels');
  if (S.tab === 'chat' && S.chatWith) { renderChat(); return; }
  let h = '';
  if (S.tab === 'home') h = homeHTML();
  else if (S.tab === 'chat') h = inboxHTML();
  else if (S.tab === 'search') h = searchHTML();
  else if (S.tab === 'activity') h = activityHTML();
  else if (S.tab === 'profile') h = profileHTML(S.profileOf || S.me);
  else if (S.tab === 'ufeed') h = ufeedHTML(S.profileOf);
  else if (S.tab === 'editprof') { if ($('#editprof')) return; app.innerHTML = editProfHTML(); hydrate(app); return; }
  else if (S.tab === 'reels') {
    if ($('#reels') && $('#reels').dataset.n === String(posts().filter(p => p.media_type === 'video').length)) { $$('.reel').forEach(r => updateReel(r.id.slice(2))); return; }
    h = reelsHTML();
  }
  app.innerHTML = h + tabbarHTML();
  document.body.classList.toggle('dark-tab', S.tab === 'reels');
  hydrate(app); watchVideos(); watchViews();
  if (S.tab === 'reels') { const r = $('#reels'); if (r) r.dataset.n = String(posts().filter(p => p.media_type === 'video').length); watchReels(); }
  if (S.tab === 'home') logoSwap();
  if (S.tab === 'activity') { S.actSeen = Date.now(); meta.set('actSeen', S.actSeen); }
  if (aid) { const n = document.getElementById(aid); if (n) { if (sel) { n.value = sel[2]; try { n.setSelectionRange(sel[0], sel[1]); } catch (_) {} } n.focus({ preventScroll:true }); } }
}

const FEED_MODES = { all:'Für dich', other:'Gefolgt', fav:'Favoriten' };
function feedPosts(){
  if (S.feedMode === 'other') return posts().filter(p => p.author !== S.me);
  if (S.feedMode === 'fav') return posts().filter(p => isFav(p.id));
  return posts();
}
function homeHTML(){
  const mode = S.feedMode, list = feedPosts();
  const newAct = activityCount();
  let empty;
  if (mode === 'other') empty = `<div class="empty"><div class="big">👀</div><b>Noch nichts von den anderen</b>Hier erscheinen die Beiträge aus deinem Inner Circle.</div>`;
  else if (mode === 'fav') empty = `<div class="empty"><div class="big">🔖</div><b>Noch keine Favoriten</b>Tipp bei einem Beitrag unten rechts auf das Lesezeichen – dann landet er hier.</div>`;
  else empty = emptyFeedHTML();
  return `<header class="topbar hometop">
      <button class="icon-btn plusbtn" data-act="create" aria-label="Erstellen">${I.plusPlain}</button>
      <button class="feedsel" data-act="feed-menu" aria-label="Feed wählen">${S.logoDone ? feedLabel() : `<span class="wordmark">${esc(APP_NAME)}</span>`}</button>
      <button class="icon-btn hbtn" data-act="tab" data-tab="activity" aria-label="Aktivität">${I.heart}${newAct ? '<span class="dot sm"></span>' : ''}</button>
    </header>
    ${mode === 'all' ? storiesBarHTML() : ''}
    <main class="feed">${list.length ? list.map(postHTML).join('') : empty}</main>
    <div class="syncline">${syncLine()}</div>`;
}
function feedLabel(){ return `<span class="fm">${FEED_MODES[S.feedMode]}${I.chev}</span>`; }
let logoT = 0;
function logoSwap(){
  if (S.logoDone || logoT) return;
  logoT = setTimeout(() => { S.logoDone = true; const f = $('.feedsel'); if (f) { f.innerHTML = feedLabel(); f.firstElementChild.classList.add('fadein'); } }, 2200);
}
function activityCount(){
  const seen = S.actSeen || 0;
  return activityItems().filter(i => i.at > seen && i.mine).length;
}
function openFeedMenu(){
  closeFeedMenu();
  const m = document.createElement('div'); m.className = 'popmenu'; m.id = 'popmenu';
  m.innerHTML = [['all', I.homeOn], ['other', I.people], ['fav', I.star]].map(([k, ic]) =>
    `<button data-act="feed-mode" data-m="${k}"><span>${FEED_MODES[k]}</span>${S.feedMode === k ? `<i class="ck">${I.check}</i>` : `<i>${ic}</i>`}</button>`).join('');
  document.body.appendChild(m);
}
function closeFeedMenu(){ const m = $('#popmenu'); if (m) m.remove(); }

/* ---------- Reels ---------- */
function reelsHTML(){
  const vids = posts().filter(p => p.media_type === 'video');
  if (!vids.length) return `<div class="reels empty-reels"><div class="rtop"><b>Reels</b></div><div class="empty" style="color:#ddd"><div class="big">🎬</div><b style="color:#fff">Noch keine Videos</b>Kurze Videos aus euren Momenten laufen hier nacheinander durch.<div style="max-width:220px;margin:18px auto 0"><button class="btn primary" data-act="create">Video teilen</button></div></div></div>`;
  return `<div class="reels" id="reels"><div class="rtop"><b>Reels</b></div>${vids.map(p => reelItemHTML(p)).join('')}</div>`;
}
function reelItemHTML(p){
  const likes = likesOf(p.id), liked = likes.some(l => l.role === S.me), cms = commentsOf(p.id).length, fav = isFav(p.id);
  return `<section class="reel" id="r-${p.id}">
    <video data-media="${esc(p.media_path)}" muted playsinline loop preload="metadata" data-act="reel-tap" data-id="${p.id}"></video>
    <div class="bigheart">${I.heartOn}</div>
    <div class="rside">
      <button class="icon-btn like ${liked ? 'on' : ''}" data-act="like" data-id="${p.id}">${liked ? I.heartOn : I.heart}<small>${likes.length || ''}</small></button>
      <button class="icon-btn" data-act="comments" data-id="${p.id}">${I.comment}<small>${cms || ''}</small></button>
      <button class="icon-btn" data-act="fav" data-id="${p.id}">${fav ? I.saveOn : I.save}</button>
      <button class="icon-btn rmute" data-act="reel-mute">${I.muted}</button>
    </div>
    <div class="rcap"><button class="who" data-act="profile" data-u="${p.author}">${avatar(p.author, 30)}<b>${esc(nick(p.author))}</b></button>${p.text ? `<p>${esc(p.text)}</p>` : ''}<small>${ago(p.created_at)}</small></div>
  </section>`;
}
let reelMuted = true, reelObs;
function watchReels(){
  if (reelObs) reelObs.disconnect();
  const root = $('#reels'); if (!root || !('IntersectionObserver' in window)) return;
  reelObs = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && e.intersectionRatio > 0.7) { v.muted = reelMuted; v.play().catch(() => {}); } else v.pause(); }), { threshold:[0, .7, 1] });
  $$('.reel video', root).forEach(v => reelObs.observe(v));
}
function updateReel(id){
  const el = $('#r-' + id), p = D.posts.get(id); if (!el || !p) return false;
  const likes = likesOf(id), liked = likes.some(l => l.role === S.me);
  const lb = $('[data-act=like]', el); lb.className = 'icon-btn like ' + (liked ? 'on bump' : ''); lb.innerHTML = (liked ? I.heartOn : I.heart) + `<small>${likes.length || ''}</small>`;
  $('[data-act=fav]', el).innerHTML = isFav(id) ? I.saveOn : I.save;
  return true;
}

function syncLine(){
  if (!Sync.configured || S.spaceId === 'local') return 'Nur auf diesem Gerät gespeichert';
  return Sync.status === 'verbunden' ? '● Live verbunden' : 'Offline – Änderungen werden nachgeschickt';
}
function emptyFeedHTML(){
  return `<div class="empty"><div class="big">✨</div><b>Noch keine Beiträge</b>
    Teile den ersten Moment – ein Foto, ein kurzes Video oder ein paar Worte.
    <div style="max-width:220px;margin:18px auto 0"><button class="btn primary" data-act="create">Ersten Beitrag teilen</button></div></div>`;
}
function storiesBarHTML(){
  const me = S.me, mine = storiesOf(me, true);
  let h = `<div class="stories">
    <button class="story" data-act="${mine.length ? 'story-user' : 'create-story'}" data-u="${me}">
      <div class="ring ${mine.length ? '' : 'none'}">${ringAvatar(me)}${mine.length ? '' : `<span class="plus">${I.plusPlain}</span>`}</div><small>Deine Story</small></button>`;
  const withStory = others().map(o => { const st = storiesOf(o, true); return { o, st, seen:st.every(s => viewersOf(s.id).includes(me)), last:st.length ? st[st.length - 1].created_at : 0 }; })
    .filter(x => x.st.length).sort((a,b) => (a.seen - b.seen) || (b.last - a.last));
  withStory.forEach(x => { h += `<button class="story" data-act="story-user" data-u="${x.o}"><div class="ring ${x.seen ? 'seen' : ''}">${ringAvatar(x.o)}</div><small>${esc(uname(x.o))}</small></button>`; });
  return h + '</div>';
}

function postHTML(p){
  const likes = likesOf(p.id), cms = commentsOf(p.id), liked = likes.some(l => l.role === S.me);
  const heart = `<div class="bigheart">${I.heartOn}</div>`;
  let media;
  if (p.media_path) {
    media = `<div class="media" data-act="media-tap" data-id="${p.id}" style="aspect-ratio:${ratio(p)}">` +
      (p.media_type === 'video'
        ? `<video data-media="${esc(p.media_path)}" muted playsinline loop preload="metadata"></video><span class="mute">${I.muted}</span>`
        : `<img data-media="${esc(p.media_path)}" alt="">`) + heart + '</div>';
  } else {
    media = `<div class="media textpost" data-act="media-tap" data-id="${p.id}" style="background:${p.bg || GRADS[0]}"><p>${esc(p.text)}</p>${heart}</div>`;
  }
  const likers = likes.map(l => l.role === S.me ? 'dir' : esc(uname(l.role)));
  const reposts = marks(p.id, 'repost'), shares = marks(p.id, 'share'), myRepost = reposts.some(r => r.role === S.me + ':repost');
  const viewers = p.author === S.me ? marks(p.id, 'view').map(v => v.role.split(':')[0]).filter(r => r !== S.me && isActive(r)) : [];
  let cm = '';
  if (cms.length > 2) cm += `<button class="link" data-act="comments" data-id="${p.id}">Alle ${cms.length} Kommentare ansehen</button>`;
  cm += cms.slice(-2).map(c => `<p><b>${esc(uname(c.author))}</b> ${esc(c.text)}</p>`).join('');
  cm += `<button class="link" data-act="comments" data-id="${p.id}">Kommentar hinzufügen …</button>`;
  return `<article class="post" id="p-${p.id}">
    <header class="ph"><button class="who" data-act="profile" data-u="${p.author}">${avatar(p.author, 38)}</button>
      <div class="phn" data-act="profile" data-u="${p.author}"><b>${esc(uname(p.author))}</b><small>${esc(nick(p.author))}</small></div>
      <button class="icon-btn more" data-act="post-menu" data-id="${p.id}" aria-label="Mehr">${I.burger}</button></header>
    ${media}
    <div class="pa">
      <button class="icon-btn like ${liked ? 'on' : ''}" data-act="like" data-id="${p.id}" aria-label="Gefällt mir">${liked ? I.heartOn : I.heart}${likes.length ? `<span class="cnt">${likes.length}</span>` : ''}</button>
      <button class="icon-btn" data-act="comments" data-id="${p.id}" aria-label="Kommentieren">${I.comment}${cms.length ? `<span class="cnt">${cms.length}</span>` : ''}</button>
      <button class="icon-btn ${myRepost ? 'rp-on' : ''}" data-act="repost" data-id="${p.id}" aria-label="In Story reposten">${I.repost}${reposts.length ? `<span class="cnt">${reposts.length}</span>` : ''}</button>
      <button class="icon-btn" data-act="share-post" data-id="${p.id}" aria-label="Senden">${I.send}${shares.length ? `<span class="cnt">${shares.length}</span>` : ''}</button>
      <button class="icon-btn" style="margin-left:auto" data-act="fav" data-id="${p.id}" aria-label="Zu Favoriten">${isFav(p.id) ? I.saveOn : I.save}</button></div>
    <div class="pb">${likers.length ? `<div class="likes"><span class="lav">${likes.slice(0, 2).map(l => avatar(l.role, 20).replace(/<div/g, '<span').replace(/<\/div>/g, '</span>')).join('')}</span>Gefällt <b>${nameList(likers)}</b></div>` : ''}
      ${p.media_path && p.text ? `<p><b>${esc(uname(p.author))}</b> ${esc(p.text)}</p>` : ''}${cm}<p class="time">${ago(p.created_at)}${viewers.length ? ` · Gesehen von ${viewers.map(r => esc(uname(r))).join(', ')}` : ''}</p></div>
  </article>`;
}

function tabbarHTML(){
  const t = S.tab, own = (t === 'profile' || t === 'ufeed') && (!S.profileOf || S.profileOf === S.me);
  const u = unread(), pa = prof(S.me).avatar_path;
  const b = (tab, on, icon, label, extra='') => `<button class="icon-btn ${on ? 'act' : ''}" data-act="tab" data-tab="${tab}" aria-label="${label}">${icon}${extra}</button>`;
  return `<nav class="tabbar">
    ${b('home', t === 'home', t === 'home' ? I.homeOn : I.home, 'Home')}
    ${b('reels', t === 'reels', t === 'reels' ? I.reelsOn : I.reels, 'Reels')}
    ${b('chat', t === 'chat', I.send, 'Nachrichten', u ? `<span class="dot">${u}</span>` : '')}
    ${b('search', t === 'search', t === 'search' ? I.searchOn : I.search, 'Suche')}
    ${b('profile', own, pa ? avatar(S.me, 26) : I.person, 'Profil')}
  </nav>`;
}
function safeLink(l){ l = (l || '').trim(); if (!l) return ''; if (!/^https?:\/\//i.test(l)) l = 'https://' + l; try { const u = new URL(l); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (_) { return ''; } }
function gridHTML(list, ufeed){
  if (!list.length) return `<div class="empty">Hier ist noch nichts.</div>`;
  return `<div class="grid">${list.map(p => `<button class="tile" data-act="${ufeed ? 'ufeed' : 'open-post'}" data-u="${p.author}" data-id="${p.id}">${thumb(p)}${p.media_type === 'video' ? `<span class="badge">${I.video}</span>` : ''}</button>`).join('')}</div>`;
}
function searchHTML(){
  return `<div class="searchbar"><input type="text" id="q" placeholder="Beiträge durchsuchen" value="${esc(S.q)}" autocomplete="off" enterkeyhint="search"></div>
    <div id="sres">${gridHTML(searchPosts())}</div>`;
}
function searchPosts(){
  const q = S.q.trim().toLowerCase(); if (!q) return posts();
  return posts().filter(p => (p.text || '').toLowerCase().includes(q) || commentsOf(p.id).some(c => (c.text || '').toLowerCase().includes(q)) || nick(p.author).toLowerCase().includes(q));
}
function activityItems(){
  const items = [];
  posts().forEach(p => {
    if (p.author === S.me) {
      likesOf(p.id).filter(l => l.role !== S.me).forEach(l => items.push({ at:l.at, u:l.role, txt:'gefällt dein Beitrag.', p, mine:true }));
      commentsOf(p.id).filter(c => c.author !== S.me).forEach(c => items.push({ at:c.created_at, u:c.author, txt:`hat kommentiert: ${c.text}`, p, mine:true }));
    } else items.push({ at:p.created_at, u:p.author, txt:'hat einen neuen Beitrag geteilt.', p });
  });
  storiesOf(S.me).forEach(s => likesOf(s.id).filter(l => l.role !== S.me).forEach(l => items.push({ at:l.at, u:l.role, txt:'gefällt deine Story.', mine:true })));
  return items.sort((a,b) => b.at - a.at);
}
function activityHTML(){
  const items = activityItems();
  const body = items.length ? items.slice(0, 150).map(i => `<div class="act">
      <button class="who" style="background:none;border:0;padding:0" data-act="profile" data-u="${i.u}">${avatar(i.u, 44)}</button>
      <p><b>${esc(uname(i.u))}</b> ${esc(i.txt)} <span class="muted">${ago(i.at)}</span></p>
      ${i.p ? `<button class="thumb" data-act="open-post" data-id="${i.p.id}">${thumb(i.p)}</button>` : ''}</div>`).join('')
    : `<div class="empty"><div class="big">💛</div><b>Noch ruhig hier</b>Wenn jemand aus deinem Inner Circle etwas teilt, likt oder kommentiert, siehst du es hier.</div>`;
  return `<header class="topbar"><h1>Aktivität</h1></header>${body}`;
}
function profileHTML(r){
  if (!isActive(r)) r = S.me;
  const ps = posts().filter(p => p.author === r);
  const st = storiesOf(r).slice().reverse();
  const own = r === S.me, p = prof(r);
  const head = own
    ? `<h1>${esc(uname(r))}</h1><div class="hr"><button class="icon-btn hbtn" data-act="tab" data-tab="activity" aria-label="Aktivität">${I.heart}${activityCount() ? '<span class="dot sm"></span>' : ''}</button><button class="icon-btn" data-act="settings" aria-label="Menü">${I.menu}</button></div>`
    : `<div style="display:flex;align-items:center;gap:4px"><button class="icon-btn" data-act="tab" data-tab="home" aria-label="Zurück">${I.back}</button><h1>${esc(uname(r))}</h1></div>`;
  let body;
  if (S.profileTab === 'archive' && own) {
    body = st.length ? `<div class="grid">${st.map(s => `<button class="tile tall" data-act="archive-open" data-u="${r}" data-id="${s.id}">${thumb(s)}<span class="date">${shortDate(s.created_at)}</span></button>`).join('')}</div>`
      : `<div class="empty">Noch keine Stories. Jede Story landet nach 24 Stunden automatisch hier im Archiv.</div>`;
  } else body = ps.length ? gridHTML(ps, r) : `<div class="empty"><div class="big">📷</div><b>Noch keine Beiträge</b>${own ? 'Teile deinen ersten Moment.' : esc(nick(r)) + ' hat noch nichts geteilt.'}</div>`;
  const hasStory = storiesOf(r, true).length > 0;
  const pic = hasStory
    ? `<button class="story" style="width:auto" data-act="avatar-big" data-u="${r}"><div class="ring ${r !== S.me && storiesOf(r, true).every(s => viewersOf(s.id).includes(S.me)) ? 'seen' : ''}" style="width:92px;height:92px" data-hold-avatar="${r}">${ringAvatar(r)}</div></button>`
    : `<button class="who" style="background:none;border:0;padding:0;cursor:zoom-in" data-act="avatar-big" data-u="${r}">${bigAvatar(r, 80)}</button>`;
  return `<header class="topbar">${head}</header>
    <section class="prof">${pic}
      <div class="stats"><div><b>${ps.length}</b><span>Beiträge</span></div><div><b>${st.length}</b><span>Stories</span></div><div><b>${activePids().length || 1}</b><span>Inner Circle</span></div></div></section>
    <div class="pname"><b>${esc(nick(r))}${p.pronouns ? ` <span class="muted" style="font-weight:400">${esc(p.pronouns)}</span>` : ''}</b>${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}${safeLink(p.link) ? `<a class="plink" href="${esc(safeLink(p.link))}" target="_blank" rel="noopener">🔗 ${esc(safeLink(p.link).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>` : ''}</div>
    ${own ? `<div class="pact"><button class="btn" data-act="edit-profile">Profil bearbeiten</button><button class="btn" data-act="create-story">Story hinzufügen</button></div>` : `<div class="pact"><button class="btn" data-act="chat-with" data-u="${r}">Nachricht</button></div>`}
    <div class="ptabs"><button class="${S.profileTab !== 'archive' || !own ? 'on' : ''}" data-act="ptab" data-t="grid" aria-label="Beiträge">${I.grid}</button>
      ${own ? `<button class="${S.profileTab === 'archive' ? 'on' : ''}" data-act="ptab" data-t="archive" aria-label="Story-Archiv">${I.archive}</button>` : ''}</div>
    ${body}`;
}
function ufeedHTML(r){
  const ps = posts().filter(p => p.author === r);
  return `<header class="topbar" style="justify-content:flex-start;gap:6px"><button class="icon-btn" data-act="profile" data-u="${r}" aria-label="Zurück">${I.back}</button>
    <div style="line-height:1.15"><small class="muted" style="font-size:12px;font-weight:600">${esc(nick(r))}</small><h1 style="font-size:16px">Beiträge</h1></div></header>
    <main class="feed">${ps.map(postHTML).join('')}</main>`;
}

/* ---------- Direktnachrichten (1:1) ---------- */
function inboxHTML(){
  const list = others().map(o => { const ms = chatMsgs(o); const last = ms[ms.length - 1]; return { o, last, n:unreadFrom(o) }; })
    .sort((a,b) => ((b.last ? b.last.created_at : 0) - (a.last ? a.last.created_at : 0)) || nick(a.o).localeCompare(nick(b.o)));
  const rows = list.length ? list.map(x => `<button class="act inbox-row" data-act="chat-with" data-u="${x.o}" style="width:100%;background:none;border:0;text-align:left;cursor:pointer">
      ${avatar(x.o, 52)}<p><b>${esc(nick(x.o))}</b><br><span class="${x.n ? '' : 'muted'}" style="${x.n ? 'font-weight:600' : ''}">${x.last ? esc((x.last.author === S.me ? 'Du: ' : '') + msgText(x.last.text).slice(0, 48)) + ' · ' + ago(x.last.created_at) : 'Noch keine Nachrichten'}</span></p>
      ${x.n ? `<span class="dot" style="position:static">${x.n}</span>` : ''}</button>`).join('')
    : `<div class="empty"><div class="big">💬</div><b>Noch niemand da</b>Sobald jemand deinem Inner Circle beitritt, könnt ihr euch hier schreiben.</div>`;
  return `<header class="topbar"><h1>${esc(uname(S.me))}</h1></header><h4 class="act-h">Nachrichten</h4>${rows}`;
}
function renderChat(){
  const app = $('#app'), o = S.chatWith;
  if (!isActive(o)) { S.chatWith = null; render(); return; }
  if (!$('#clog') || $('#clog').dataset.u !== o) {
    app.innerHTML = `<div class="chat"><header class="topbar"><button class="icon-btn" data-act="inbox" aria-label="Zurück">${I.back}</button>
      <button class="who" style="background:none;border:0;padding:0;display:flex;align-items:center;gap:10px;cursor:pointer" data-act="profile" data-u="${o}">${avatar(o, 32)}<h1>${esc(nick(o))}</h1></button></header><div class="clog" id="clog" data-u="${o}"></div>
      <form class="cbar" id="cbar"><input type="text" id="cmsg" placeholder="Nachricht …" autocomplete="off" enterkeyhint="send" maxlength="2000">
      <button class="link strong" type="submit">Senden</button></form></div>`;
    hydrate(app);
  }
  const ms = chatMsgs(o); const log = $('#clog');
  let h = '', lastDay = '';
  ms.forEach(m => {
    const dl = dayLabel(m.created_at);
    if (dl !== lastDay) { h += `<div class="daysep">${esc(dl)}</div>`; lastDay = dl; }
    const pm = /^\[\[post:([\w-]+)\]\]$/.exec(m.text || ''), sp = pm && D.posts.get(pm[1]);
    if (pm) h += `<button class="bub pcard ${m.author === S.me ? 'me' : 'them'}" data-act="open-post" data-id="${pm[1]}">${sp && !sp.deleted ? `<div class="pc-th">${thumb(sp)}</div><b>${esc(uname(sp.author))}</b><span>${esc((sp.text || '').slice(0, 60))}</span>` : '<span>Beitrag nicht mehr da</span>'}<time>${hhmm(m.created_at)}</time></button>`;
    else h += `<div class="bub ${m.author === S.me ? 'me' : 'them'}">${esc(m.text)}<time>${hhmm(m.created_at)}</time></div>`;
  });
  const lastMine = [...ms].reverse().find(m => m.author === S.me);
  if (lastMine && ms[ms.length - 1] === lastMine) h += `<div class="rd">${lastMine.read_at ? 'Gesehen ' + hhmm(lastMine.read_at) : 'Gesendet'}</div>`;
  if (!ms.length) h = `<div class="empty">Schreib ${esc(nick(o))} die erste Nachricht 💬</div>`;
  const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 80;
  log.innerHTML = h; hydrate(log);
  if (!ms.length) window.scrollTo(0, 0);
  else if (atBottom || !log.dataset.init) { window.scrollTo(0, document.body.scrollHeight); log.dataset.init = '1'; }
  markRead();
}
async function markRead(){
  if (document.visibilityState !== 'visible' || S.tab !== 'chat' || !S.chatWith) return;
  const now = Date.now();
  for (const m of chatMsgs(S.chatWith).filter(m => m.author === S.chatWith && !m.read_at)) await patch('messages', m, { read_at:now });
}
async function sendMessage(text, to){
  text = text.trim(); to = to || S.chatWith; if (!text || !to) return;
  await put('messages', { id:newId(), author:S.me, to_pid:to, text, created_at:Date.now(), read_at:null, deleted:false });
  if (S.tab === 'chat' && S.chatWith === to) { renderChat(); window.scrollTo(0, document.body.scrollHeight); }
  Sync.push('message', nick(S.me), msgText(text).slice(0, 140), to);
}
function openChat(pid){ closeSheet(); S.tab = 'chat'; S.chatWith = pid; $('#app').innerHTML = ''; render(); }

/* ---------- Sheets ---------- */
function openSheet(html, cls=''){
  closeSheet();
  const b = document.createElement('div'); b.className = 'backdrop';
  b.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  b.addEventListener('click', e => { if (e.target === b) closeSheet(); });
  document.body.appendChild(b); requestAnimationFrame(() => b.classList.add('open')); hydrate(b);
  return b;
}
function closeSheet(){ $$('.backdrop').forEach(b => b.remove()); }

/* ---------- Erstellen ---------- */
const C = { mode:'post', pr:null, previewURL:null, bg:GRADS[0] };
function openCreate(mode){
  C.mode = mode || 'post'; C.pr = null; C.bg = GRADS[0];
  if (C.previewURL) { URL.revokeObjectURL(C.previewURL); C.previewURL = null; }
  openSheet(`<div class="seg"><button data-act="cmode" data-m="post" class="${C.mode === 'post' ? 'on' : ''}">Beitrag</button><button data-act="cmode" data-m="story" class="${C.mode === 'story' ? 'on' : ''}">Story</button></div>
    <div class="cprev" id="cprev"></div>
    <div class="pick"><label class="btn">Foto / Video<input type="file" id="cfile" accept="image/*,video/*" hidden></label>
      <label class="btn">Kamera<input type="file" id="ccam" accept="image/*,video/*" capture="environment" hidden></label></div>
    <textarea id="ctext" rows="3" maxlength="2200" placeholder="Was gibt’s Neues?"></textarea>
    <div class="grads" id="cgrads">${GRADS.map((g,i) => `<button data-act="cbg" data-i="${i}" class="${i === 0 ? 'on' : ''}" style="background:${g}" aria-label="Hintergrund ${i+1}"></button>`).join('')}</div>
    <button class="btn primary" data-act="publish" id="cpub">Teilen</button>
    <p class="fine" id="chint" style="text-align:center;margin:10px 0 0"></p>`, 'tall');
  updatePreview();
}
function updatePreview(){
  const box = $('#cprev'); if (!box) return;
  box.className = 'cprev' + (C.mode === 'story' ? ' story' : '');
  const text = ($('#ctext') || {}).value || '';
  box.innerHTML = C.pr
    ? (C.pr.type === 'video' ? `<video src="${C.previewURL}" muted playsinline autoplay loop></video>` : `<img src="${C.previewURL}" alt="">`) + `<button class="icon-btn x" data-act="cclear" aria-label="Entfernen">${I.close}</button>`
    : `<div class="tp" style="background:${C.bg}">${esc(text || (C.mode === 'story' ? 'Deine Story …' : 'Dein Beitrag …'))}</div>`;
  const g = $('#cgrads'); if (g) g.style.display = C.pr ? 'none' : 'flex';
  const hint = $('#chint'); if (hint) hint.textContent = C.mode === 'story' ? 'Die Story ist 24 Stunden im Ring zu sehen und bleibt danach im Archiv.' : 'Der Beitrag erscheint bei allen im Inner Circle.';
}
async function onPickFile(input){
  const f = input.files && input.files[0]; if (!f) return;
  const pub = $('#cpub'); if (pub) { pub.disabled = true; pub.textContent = 'Wird vorbereitet …'; }
  try { C.pr = await processFile(f); if (C.previewURL) URL.revokeObjectURL(C.previewURL); C.previewURL = URL.createObjectURL(C.pr.blob); updatePreview(); }
  catch (e) { toast(e.message || 'Datei konnte nicht geladen werden'); }
  if (pub) { pub.disabled = false; pub.textContent = 'Teilen'; }
  input.value = '';
}
async function publish(){
  const text = ($('#ctext').value || '').trim();
  if (!C.pr && !text) { toast('Wähle ein Foto/Video oder schreib ein paar Worte.'); return; }
  const pub = $('#cpub'); pub.disabled = true; pub.textContent = 'Wird geteilt …';
  const base = { id:newId(), author:S.me, created_at:Date.now(), text, media_path:null, media_type:null, w:0, h:0, d:0, bg:C.pr ? null : C.bg, deleted:false };
  if (C.pr) { base.media_path = await storeMedia(C.pr); base.media_type = C.pr.type; base.w = C.pr.w; base.h = C.pr.h; base.d = C.pr.d || 0; }
  if (C.mode === 'story') {
    await put('stories', base); closeSheet(); S.tab = 'home'; render(); toast('Story geteilt');
    Sync.push('story', `${uname(S.me)} hat eine Story geteilt ⭕`, text.slice(0, 120), 'all');
  } else {
    await put('posts', base); closeSheet(); S.tab = 'home'; render(); window.scrollTo({ top:0 }); toast('Beitrag geteilt');
    Sync.push('post', `${uname(S.me)} hat einen Beitrag geteilt ✨`, text.slice(0, 120), 'all');
  }
}

/* ---------- Likes, Kommentare, Menü ---------- */
function refreshPost(p, pop){
  const el = $('#p-' + p.id);
  if (!el) { scheduleRender(); return; }
  el.outerHTML = postHTML(p);
  const n = $('#p-' + p.id); hydrate(n); watchVideos(); if (viewObs) viewObs.observe(n);
  if (pop) $('.bigheart', n).classList.add('pop');
  const lb = $('.like', n); if (lb && lb.classList.contains('on')) lb.classList.add('bump');
}
async function setLike(id, mode){
  const p = D.posts.get(id); if (!p) return;
  const cur = D.reactions.get(id + '|' + S.me), on = cur && cur.on;
  if (on && mode === 'toggle') await put('reactions', { post_id:id, role:S.me, at:cur.at, on:false });
  else if (!on) { await put('reactions', { post_id:id, role:S.me, at:Date.now(), on:true }); if (p.author !== S.me) Sync.push('like', `${uname(S.me)} gefällt dein Beitrag ❤️`, (p.text || '').slice(0, 80), p.author); }
  if (S.tab === 'reels' && updateReel(id)) { if (mode === 'on') { const h = $('#r-' + id + ' .bigheart'); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); } return; }
  refreshPost(p, mode === 'on');
}
async function repostPost(id){
  const p = D.posts.get(id); if (!p) return;
  const by = p.author === S.me ? '' : `↻ ${uname(p.author)}: `;
  await put('stories', { id:newId(), author:S.me, created_at:Date.now(), text:(by + (p.text || '')).trim(), media_path:p.media_path, media_type:p.media_type, w:p.w, h:p.h, d:p.d || 0, bg:p.bg || GRADS[0], deleted:false });
  await put('reactions', { post_id:id, role:S.me + ':repost', at:Date.now(), on:true });
  toast('In deiner Story geteilt ↻'); refreshPost(p);
  Sync.push('story', `${uname(S.me)} hat eine Story geteilt ⭕`, '', 'all');
}
const SEND = { id:null, sel:new Set() };
function openSendPicker(id){
  SEND.id = id; SEND.sel = new Set();
  const os = others();
  if (!os.length) { toast('Noch niemand im Inner Circle'); return; }
  openSheet(`<h3 class="sh-title">Senden an …</h3><div class="clist" style="max-height:50vh">${os.map(o => `<button class="act sendpick" data-act="send-pick" data-u="${o}" style="width:100%;background:none;border:0;text-align:left;cursor:pointer">${avatar(o, 40)}<p><b>${esc(nick(o))}</b><br><span class="muted">${esc(uname(o))}</span></p><span class="pk" style="width:24px;height:24px;border-radius:50%;border:2px solid var(--line);display:inline-flex;align-items:center;justify-content:center"></span></button>`).join('')}</div>
    <button class="btn primary" data-act="send-go" id="sendgo" disabled>Senden</button>`, 'tall');
}
async function sendPostTo(){
  const p = D.posts.get(SEND.id); if (!p || !SEND.sel.size) return;
  for (const to of SEND.sel) {
    await put('messages', { id:newId(), author:S.me, to_pid:to, text:`[[post:${p.id}]]`, created_at:Date.now(), read_at:null, deleted:false });
    Sync.push('message', nick(S.me), '📎 hat dir einen Beitrag geschickt', to);
  }
  await put('reactions', { post_id:p.id, role:S.me + ':share', at:Date.now(), on:true });
  closeSheet(); toast(SEND.sel.size === 1 ? `An ${nick([...SEND.sel][0])} geschickt ✈` : `An ${SEND.sel.size} Personen geschickt ✈`); refreshPost(p);
}
let viewObs; const viewT = {};
function watchViews(){
  if (viewObs) viewObs.disconnect();
  if (!('IntersectionObserver' in window)) return;
  viewObs = new IntersectionObserver(es => es.forEach(e => {
    const id = e.target.id.replace(/^[pr]-/, '');
    if (e.isIntersecting && e.intersectionRatio > 0.6) { if (!viewT[id]) viewT[id] = setTimeout(() => markView(id), 1200); }
    else { clearTimeout(viewT[id]); viewT[id] = 0; }
  }), { threshold:[0, .6, 1] });
  $$('.feed .post, .reel').forEach(el => viewObs.observe(el));
}
async function markView(id){
  const p = D.posts.get(id); if (!p || p.author === S.me) return;
  const k = id + '|' + S.me + ':view'; if (D.reactions.get(k)) return;
  await put('reactions', { post_id:id, role:S.me + ':view', at:Date.now(), on:true });
}
async function toggleFav(id){
  const p = D.posts.get(id); if (!p) return;
  const k = S.me + ':fav', on = isFav(id);
  await put('reactions', { post_id:id, role:k, at:Date.now(), on:!on });
  toast(on ? 'Aus Favoriten entfernt' : 'Zu Favoriten hinzugefügt 🔖');
  if (S.tab === 'reels' && updateReel(id)) return;
  if (S.tab === 'home' && S.feedMode === 'fav') { scheduleRender(); return; }
  refreshPost(p);
}
const taps = {};
function mediaTap(id, el){
  const now = Date.now();
  if (taps[id] && now - taps[id] < 320) { taps[id] = 0; setLike(id, 'on'); return; }
  taps[id] = now;
  const v = $('video', el);
  if (v) { v.muted = !v.muted; const m = $('.mute', el); if (m) m.innerHTML = v.muted ? I.muted : I.sound; if (v.paused) v.play().catch(() => {}); }
}
function openComments(id){
  const p = D.posts.get(id); if (!p) return;
  const cms = commentsOf(id);
  const list = cms.length ? cms.map(c => `<div class="citem">${avatar(c.author, 32)}<div><p><b>${esc(nick(c.author))}</b> ${esc(c.text)}</p><small>${ago(c.created_at)}</small></div></div>`).join('')
    : `<p class="muted" style="text-align:center;margin-top:30px">Noch keine Kommentare.</p>`;
  const head = p.text ? `<div class="citem" style="border-bottom:1px solid var(--line);padding-bottom:12px">${avatar(p.author, 32)}<div><p><b>${esc(nick(p.author))}</b> ${esc(p.text)}</p><small>${ago(p.created_at)}</small></div></div>` : '';
  openSheet(`<h3 class="sh-title">Kommentare</h3><div class="clist">${head}${list}</div>
    <form class="cform" data-id="${id}">${avatar(S.me, 32)}<input type="text" name="t" placeholder="Kommentar hinzufügen …" autocomplete="off" enterkeyhint="send" maxlength="1000"><button class="link strong" type="submit">Posten</button></form>`);
  const cl = $('.clist'); if (cl) cl.scrollTop = cl.scrollHeight;
}
async function addComment(id, text){
  const p = D.posts.get(id); if (!p || !text.trim()) return;
  await put('comments', { id:newId(), post_id:id, author:S.me, text:text.trim(), created_at:Date.now(), deleted:false });
  openComments(id); if (S.tab === 'home') refreshPost(p);
  if (p.author !== S.me) Sync.push('comment', `${uname(S.me)} hat kommentiert`, text.trim().slice(0, 120), p.author);
}
function postMenu(id){
  const p = D.posts.get(id); if (!p) return;
  openSheet(`<div class="menu">
    ${p.media_path ? `<button class="btn" data-act="save-media" data-id="${esc(p.media_path)}">In Fotos sichern</button>` : ''}
    ${p.author === S.me ? `<button class="btn danger" data-act="del-post-ask" data-id="${id}">Löschen</button>` : ''}
    <button class="btn" data-act="close-sheet">Abbrechen</button></div>`);
}
function delPostAsk(id){
  openSheet(`<h3 class="sh-title">Beitrag löschen?</h3><p class="muted" style="text-align:center;margin:0 0 14px">Der Beitrag ist danach für alle weg.</p>
    <div class="menu"><button class="btn danger" data-act="del-post" data-id="${id}">Löschen</button><button class="btn" data-act="close-sheet">Behalten</button></div>`);
}
async function delPost(id){
  const p = D.posts.get(id); if (!p) return;
  await put('posts', { ...p, deleted:true });
  if (p.media_path) { await DB.del('media', p.media_path); if (Sync.configured && S.spaceId !== 'local') Outbox.add({ type:'remove', path:p.media_path }); }
  closeSheet(); render(); toast('Gelöscht');
}
function openSinglePost(id){ const p = D.posts.get(id); if (p) openSheet(`<div style="margin:0 -16px">${postHTML(p)}</div>`, 'tall'); }

/* ---------- Story-Ansicht ---------- */
const V = { list:[], i:0, raf:0, last:0, elapsed:0, dur:5000, paused:false, downAt:0, ready:true };
function openViewer(items, i){
  if (!items.length) return;
  V.list = items; V.i = Math.max(0, Math.min(i || 0, items.length - 1));
  const el = document.createElement('div'); el.className = 'viewer'; el.id = 'viewer'; el.innerHTML = '<div class="vwrap"></div>';
  document.body.appendChild(el); document.body.style.overflow = 'hidden';
  el.addEventListener('focusin', e => { if (e.target.id === 'vrin') { V.paused = true; V.typing = true; const v = $('#viewer video'); if (v) v.pause(); } });
  el.addEventListener('focusout', e => { if (e.target.id === 'vrin') { V.typing = false; V.paused = false; } });
  el.addEventListener('pointerdown', e => { if (e.target.closest('[data-act="viewer-close"],[data-act="viewer-profile"],.vreply')) return; V.downAt = Date.now(); V.paused = true; const v = $('#viewer video'); if (v) v.pause(); });
  const resume = () => { if (!$('#viewer') || V.typing) return; V.paused = false; const v = $('#viewer video'); if (v && V.ready) v.play().catch(() => {}); };
  el.addEventListener('pointerup', resume); el.addEventListener('pointercancel', resume); el.addEventListener('pointerleave', resume);
  showItem();
}
function showItem(){
  cancelAnimationFrame(V.raf);
  const it = V.list[V.i], wrap = $('#viewer .vwrap'); if (!it || !wrap) return;
  const bars = `<div class="vbars">${V.list.map((_, k) => `<i><b style="width:${k < V.i ? 100 : 0}%"></b></i>`).join('')}</div>`;
  const close = `<button class="icon-btn" data-act="viewer-close" aria-label="Schließen">${I.close}</button>`;
  let body = '', head = '', foot = '';
  if (it.type === 'title') {
    body = `<div class="vbody" style="background:${it.bg}"><div class="vtitle"><small>${esc(APP_NAME)}</small><b>${esc(it.title)}</b><span>${esc(it.sub)}</span></div></div>`;
    head = `<div class="vhead"><span></span>${close}</div>`;
  } else {
    const s = it.type === 'story' ? it.s : it.p;
    body = `<div class="vbody">${s.media_path ? (s.media_type === 'video' ? `<video data-media="${esc(s.media_path)}" playsinline></video>` : `<img data-media="${esc(s.media_path)}" alt="">`) : textBox(s.text, s.bg)}</div>`;
    const archived = it.type === 'story' && Date.now() - s.created_at > DAY;
    head = `<div class="vhead"><button class="vwho" data-act="viewer-profile" data-u="${s.author}">${avatar(s.author, 32)}<b>${esc(nick(s.author))}</b></button><span>${it.type === 'post' ? dayLabel(s.created_at) : ago(s.created_at)}</span>${archived ? '<span class="tag">Archiv</span>' : ''}${close}</div>`;
    if (it.type === 'story' && s.media_path && s.text) foot = `<div class="vcap">${esc(s.text)}</div>`;
    if (it.type === 'post' && s.media_path && s.text) foot = `<div class="vpost-cap"><p>${esc(s.text)}</p></div>`;
    if (it.type === 'story' && s.author === S.me) { const vs = viewersOf(s.id), lk = likesOf(s.id).filter(l => l.role !== S.me); if (vs.length || lk.length) foot += `<div class="vseen">${vs.length ? 'Gesehen von ' + vs.map(r => esc(nick(r))).join(', ') : ''}${lk.length ? ' · ❤️ Gefällt ' + lk.map(l => esc(nick(l.role))).join(', ') : ''}</div>`; }
    if (it.type === 'story' && s.author !== S.me) {
      const liked = likesOf(s.id).some(l => l.role === S.me);
      foot += `<form class="vreply" id="vreply" data-id="${s.id}"><input type="text" id="vrin" placeholder="Antworten …" autocomplete="off" enterkeyhint="send" maxlength="500">
        <button type="button" class="icon-btn ${liked ? 'on' : ''}" data-act="story-like" data-id="${s.id}" aria-label="Gefällt mir">${liked ? I.heartOn : I.heart}</button>
        <button type="submit" class="icon-btn" aria-label="Senden">${I.send}</button></form>`;
    }
    if (it.type === 'story' && s.author !== S.me && !viewersOf(s.id).includes(S.me)) put('story_views', { story_id:s.id, role:S.me, at:Date.now() });
  }
  wrap.innerHTML = `${body}${foot}<div class="vtap l" data-act="vprev"></div><div class="vtap r" data-act="vnext"></div><div class="vtop">${bars}${head}</div>`;
  hydrate(wrap);
  V.elapsed = 0; V.last = 0; V.dur = it.type === 'title' ? 3500 : 5000; V.ready = true;
  const v = $('video', wrap);
  if (v) {
    V.ready = false;
    const go = () => { V.dur = Math.min(30, v.duration || 5) * 1000; V.ready = true; if (!V.paused) v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); };
    if (v.readyState >= 1) go(); else v.addEventListener('loadedmetadata', go, { once:true });
    setTimeout(() => { if (!V.ready) { V.ready = true; } }, 6000);
  }
  V.raf = requestAnimationFrame(loop);
}
function loop(now){
  if (!$('#viewer')) return;
  if (!V.last) V.last = now;
  if (!V.paused && V.ready) V.elapsed += now - V.last;
  V.last = now;
  const bar = $(`#viewer .vbars i:nth-child(${V.i + 1}) b`); if (bar) bar.style.width = Math.min(100, V.elapsed / V.dur * 100) + '%';
  if (V.elapsed >= V.dur) { nextItem(); return; }
  V.raf = requestAnimationFrame(loop);
}
function nextItem(){ if (V.i < V.list.length - 1) { V.i++; showItem(); } else closeViewer(); }
function prevItem(){ if (V.i > 0) V.i--; showItem(); }
function closeViewer(){ cancelAnimationFrame(V.raf); const el = $('#viewer'); if (el) el.remove(); document.body.style.overflow = ''; render(); }


/* ---------- Profil-Formular (Einrichtung + Bearbeiten) ---------- */
const E = { emoji:null, color:'', avatarPr:null, avatarURL:null, removePhoto:false, unameTouched:false };
function colorPickHTML(){
  return `<div class="colors" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${COLORS.map(c => `<button type="button" data-act="e-color" data-c="${c}" aria-label="Farbe ${c}" style="width:32px;height:32px;border-radius:50%;border:${E.color === c ? '3px solid var(--fg)' : '2px solid var(--line)'};background:${c};padding:0"></button>`).join('')}
    <label style="display:inline-flex;align-items:center;gap:6px;font-size:13px" class="muted">eigene <input type="color" id="ecolor" value="${E.color || '#e8457c'}" style="width:36px;height:32px;border:0;padding:0;background:none"></label></div>`;
}
function profileFormHTML(){
  const p = prof(S.me || '');
  E.emoji = p.emoji || '🙂'; E.color = p.color || ''; E.avatarPr = null; E.removePhoto = false; E.unameTouched = !!p.username;
  if (E.avatarURL) { URL.revokeObjectURL(E.avatarURL); E.avatarURL = null; }
  return `<div style="display:flex;justify-content:center;margin:6px 0 10px" id="eav"><div class="av" style="width:86px;height:86px;font-size:48px">${esc(E.emoji)}</div></div>
    <div class="pick"><label class="btn">Foto als Profilbild<input type="file" id="efile" accept="image/*" hidden></label></div>
    <label class="fl" for="enick">Name</label>
    <input type="text" id="enick" value="${esc(p.nick && p.nick !== 'Mitglied' ? p.nick : '')}" maxlength="24" placeholder="z. B. Denise" autocomplete="off">
    <label class="fl" for="euname">Benutzername</label>
    <input type="text" id="euname" value="${esc(p.username || '')}" maxlength="24" placeholder="z. B. denise" autocomplete="off" autocapitalize="none" spellcheck="false">
    <p class="fine" style="margin:6px 0 0">Kleinbuchstaben, Zahlen, Punkt und Unterstrich.</p>
    <label class="fl">Oder ein Emoji als Bild</label>
    <div class="emojis">${EMOJIS.map(e => `<button data-act="e-emoji" data-e="${e}" class="${e === E.emoji ? 'on' : ''}">${e}</button>`).join('')}</div>
    <label class="fl">Lieblingsfarbe <span class="fine">(als Ring um dein Profilbild)</span></label>
    ${colorPickHTML()}`;
}
function refreshEditAvatar(){
  const box = $('#eav'); if (!box) return;
  if (S.tab === 'editprof') {
    const p = prof(S.me), photo = E.avatarURL ? `<img src="${E.avatarURL}" alt="">` : (!E.removePhoto && p.avatar_path ? `<img data-media="${esc(p.avatar_path)}" alt="">` : I.person);
    box.innerHTML = `<div class="ep-c ep-photo">${photo}</div><div class="ep-c ep-emoji">${esc(E.emoji)}</div>`; hydrate(box); return;
  }
  box.innerHTML = E.avatarURL ? `<div class="av" style="width:86px;height:86px"><img src="${E.avatarURL}" alt=""></div>` : `<div class="av" style="width:86px;height:86px;font-size:48px">${esc(E.emoji)}</div>`;
}
async function saveProfileForm(){
  const r = S.me, p = { ...prof(r), role:r };
  delete p.sound;
  const n = ($('#enick') && $('#enick').value || '').trim();
  if ($('#enick')) p.nick = n || p.nick || 'Mitglied';
  const un = slug(($('#euname') && $('#euname').value) || '');
  if ($('#euname')) p.username = un || slug(p.nick) || null;
  p.emoji = E.emoji || p.emoji || '🙂'; p.color = E.color || null; p.updated_at = Date.now();
  if ($('#ebio')) p.bio = $('#ebio').value.trim().slice(0, 150);
  if ($('#elink')) p.link = $('#elink').value.trim().slice(0, 200);
  if ($('#epron')) p.pronouns = $('#epron').value.trim().slice(0, 20);
  if (E.avatarPr) p.avatar_path = await storeMedia(E.avatarPr);
  else if (E.removePhoto) p.avatar_path = null;
  await put('profiles', p);
  if (E.avatarURL) { URL.revokeObjectURL(E.avatarURL); E.avatarURL = null; }
}
function openProfileEdit(){
  const p = prof(S.me);
  E.emoji = p.emoji || '🙂'; E.color = p.color || ''; E.avatarPr = null; E.removePhoto = false; E.unameTouched = true;
  if (E.avatarURL) { URL.revokeObjectURL(E.avatarURL); E.avatarURL = null; }
  closeSheet(); S.tab = 'editprof'; $('#app').innerHTML = ''; render(); window.scrollTo(0, 0);
}
function editProfHTML(){
  const r = S.me, p = prof(r);
  const photo = E.avatarURL ? `<img src="${E.avatarURL}" alt="">` : (!E.removePhoto && p.avatar_path ? `<img data-media="${esc(p.avatar_path)}" alt="">` : I.person);
  return `<div id="editprof" class="editprof">
    <header class="ep-top"><button class="icon-btn ep-back" data-act="e-back" aria-label="Zurück">${I.back}</button><h1>Profil bearbeiten</h1><span></span></header>
    <div class="ep-pic" id="eav"><div class="ep-c ep-photo">${photo}</div><div class="ep-c ep-emoji">${esc(E.emoji)}</div></div>
    <button class="ep-edit" data-act="e-picmenu">Bild oder Avatar bearbeiten</button>
    <div class="ep-rows">
      <label class="er"><span>Name</span><input type="text" id="enick" value="${esc(nick(r))}" maxlength="24" autocomplete="off"></label>
      <label class="er"><span>Benutzername</span><input type="text" id="euname" value="${esc(uname(r))}" maxlength="24" autocomplete="off" autocapitalize="none" spellcheck="false"></label>
      <label class="er"><span>Pronomen</span><input type="text" id="epron" value="${esc(p.pronouns || '')}" maxlength="20" placeholder="Pronomen" autocomplete="off"></label>
      <label class="er"><span>Bio</span><textarea id="ebio" rows="1" maxlength="150" placeholder="Bio">${esc(p.bio || '')}</textarea></label>
      <label class="er"><span>Links</span><input type="text" id="elink" value="${esc(p.link || '')}" maxlength="200" placeholder="Link hinzufügen" autocomplete="off" inputmode="url"></label>
      <div class="er" style="display:block"><span style="display:block;margin-bottom:8px">Lieblingsfarbe</span>${colorPickHTML()}</div>
    </div>
  </div>`;
}
function openPicMenu(){
  const has = prof(S.me).avatar_path && !E.removePhoto || E.avatarURL;
  openSheet(`<div class="ep-pics">${avatar(S.me, 56)}</div><div class="menu">
    <label class="btn">Neues Profilbild<input type="file" id="efile" accept="image/*" hidden></label>
    <button class="btn" data-act="e-emojis">Avatar (Emoji) wählen</button>
    ${has ? '<button class="btn danger" data-act="e-nophoto">Aktuelles Bild entfernen</button>' : ''}
    <button class="btn" data-act="close-sheet">Abbrechen</button></div>`);
}
async function leaveEditProf(){
  await saveProfileForm(); S.tab = 'profile'; S.profileOf = null; S.profileTab = 'grid'; $('#app').innerHTML = ''; render(); window.scrollTo(0, 0); toast('Gespeichert');
}

/* ---------- Links ---------- */
const BASE = () => `${location.origin}${location.pathname}`;
const inviteURL = token => `${BASE()}#join=${token}`;
const restoreURL = () => `${BASE()}#restore=${S.restore}`;
const JOIN_RX = /join=([a-f0-9]{24})/i, RESTORE_RX = /restore=([a-f0-9]{32})/i;

/* ---------- Einstellungen (≡) ---------- */
function openRestoreLink(){
  const u = restoreURL(), txt = `Mein ${APP_NAME}-Wiederherstellen-Link – nicht weitergeben: ${u}`;
  openSheet(`<h3 class="sh-title">Dein Wiederherstellen-Link</h3>
    <p class="muted" style="margin:0 0 6px">Damit holst du dein ${APP_NAME} mit einem Tipp zurück – z. B. wenn du die App neu auf den Home-Bildschirm legst oder ein neues Handy hast. Alles ist danach wieder da.</p>
    <p style="margin:0 0 6px;font-size:13px"><b>Nur für dich.</b> Wer diesen Link hat, ist in der App du.</p>
    <div class="linkbox">${esc(u)}</div>
    <button class="btn primary" data-act="copy-restore">Link kopieren</button>
    <a class="btn" style="text-decoration:none" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Per WhatsApp an mich schicken</a>
    <button class="btn" data-act="share-restore">Teilen / in Notizen sichern …</button>
    <p class="fine" style="margin-top:12px"><b>So geht’s später:</b> App öffnen → „Wiederherstellen“ → Einfügen → fertig.</p>`, 'tall');
}
async function doRestore(token){
  if (!Sync.configured) throw new Error('Kein Server eingerichtet');
  await Sync.ensureAuth();
  const r = await Sync.sb.rpc('restore_device', { p_restore:token }); if (r.error) throw r.error;
  S.spaceId = r.data.space_id; S.me = r.data.pid; S.isOwner = !!r.data.is_owner; S.restore = r.data.restore; S.removed = false;
  await saveDevice();
  if (location.hash || location.search) history.replaceState(null, '', location.pathname);
  await Sync.start();
  const needPush = 'Notification' in window && Notification.permission !== 'granted' && !(isIOS() && !standalone());
  if (needPush) { S.onb = { step:'push', mode:'restore' }; render(); }
  else { S.onb = null; S.tab = 'home'; render(); }
  toast(`Willkommen zurück, ${nick(S.me)} ✓`);
}
async function openSettings(){
  const pend = await Outbox.count();
  const pushOk = 'Notification' in window && Notification.permission === 'granted';
  openSheet(`<h3 class="sh-title">Einstellungen</h3><div class="menu">
    <button class="btn" data-act="edit-profile">Profil bearbeiten</button>
    <button class="btn" data-act="perm-push">${pushOk ? '✓ Benachrichtigungen aktiv – neu verbinden' : 'Benachrichtigungen einschalten'}</button>
    ${pushOk ? '<button class="btn" data-act="push-test">Test-Benachrichtigung an mich</button>' : ''}
    ${S.isOwner ? '<button class="btn" data-act="circle">Inner Circle & Einladen</button>' : ''}
    ${S.restore ? '<button class="btn" data-act="restore-link">Mein Wiederherstellen-Link</button>' : ''}
    ${!standalone() ? `<button class="btn" data-act="${S.installEvt ? 'install' : 'howto'}">${isAndroid() ? 'Auf den Startbildschirm (Android)' : 'Auf den Home-Bildschirm'}</button>` : ''}
    <button class="btn" data-act="howto">So funktioniert’s</button>
    <button class="btn" data-act="close-sheet">Schließen</button></div>
    <p class="fine" style="text-align:center;margin-top:12px">Version ${APP_VERSION} · ${esc(syncLine())}${pend ? ` · ${pend} Änderung(en) warten` : ''}</p>
    ${pend ? `<button class="btn" data-act="flush-now">Jetzt senden</button>` : ''}
    ${Outbox.lastError ? `<p class="fine" style="text-align:center;color:var(--danger)">Problem: ${esc(Outbox.lastError.slice(0, 160))}</p>` : ''}`, 'tall');
}
function openHowto(){
  openSheet(`<h3 class="sh-title">So funktioniert’s</h3>
    <p><b>Nur ihr</b><br>${APP_NAME} ist ein privater Kreis mit höchstens ${MAX_PEOPLE} Personen. Rein kommt nur, wer eine Einladung bekommt – Einladungen verschickt nur die Besitzerin.</p>
    <p><b>Benachrichtigungen</b><br>Auf dem iPhone kommen sie nur, wenn die App auf dem Home-Bildschirm liegt (Teilen → „Zum Home-Bildschirm“). Auf Android klappt es auch in Chrome; als App installieren geht über ⋮ → „App installieren“.</p>
    <p><b>Fotos</b><br>Ein Foto ins Fotos-Album holen: beim Beitrag auf das Menü → „In Fotos sichern“.</p>
    <p><b>Neues Handy?</b><br>Einstellungen → „Mein Wiederherstellen-Link“. Den Link gut aufheben.</p>
    <button class="btn" data-act="close-sheet">Alles klar</button>`, 'tall');
}
async function enablePush(){
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
    throw new Error(isIOS() && !standalone() ? 'Auf dem iPhone geht das erst, wenn die App auf dem Home-Bildschirm liegt.' : 'Dieses Gerät oder dieser Browser kann keine Push-Nachrichten.');
  if (!Sync.ready) throw new Error('Erst mit dem Server verbinden (Internet?).');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Benachrichtigungen wurden nicht erlaubt. In den Handy-Einstellungen änderbar.');
  const reg = await navigator.serviceWorker.ready;
  const { data, error } = await Sync.sb.functions.invoke('send-push', { body:{ action:'key' } });
  if (error || !data || !data.publicKey) throw new Error('Push-Dienst nicht erreichbar.');
  const key = Uint8Array.from(atob((data.publicKey + '='.repeat((4 - data.publicKey.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  let sub = await reg.pushManager.getSubscription();
  if (sub) { try { await sub.unsubscribe(); } catch (_) {} }
  sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:key });
  const r = await Sync.sb.from('push_subs').upsert({ endpoint:sub.endpoint, space_id:S.spaceId, role:S.me, sub:sub.toJSON() });
  if (r.error) throw r.error;
  return true;
}

/* ---------- Inner Circle & Einladen (nur Besitzerin) ---------- */
async function openInvites(){
  if (!Sync.ready) return [];
  const r = await Sync.sb.from('invites').select('*').eq('space_id', S.spaceId).eq('kind', 'member').is('used_at', null).is('revoked_at', null).order('created_at');
  if (r.error) { toast(r.error.message); return []; }
  return r.data || [];
}
async function openCircle(){
  if (!S.isOwner) return;
  if (!Sync.ready) { toast('Nicht verbunden – Internet?'); return; }
  const inv = await openInvites(), act = activePids(), full = act.length >= MAX_PEOPLE, blocked = act.length + inv.length >= MAX_PEOPLE;
  const mem = act.filter(p => p !== S.me).map(p => `<div class="act">${avatar(p, 40)}<p><b>${esc(nick(p))}</b><br><span class="muted">${esc(uname(p))}</span></p><button class="link" style="color:var(--danger)" data-act="rm-ask" data-u="${p}">Entfernen</button></div>`).join('');
  const op = inv.map(i => `<div class="act"><div class="av" style="width:40px;height:40px;font-size:20px">💌</div><p><b>${esc(i.label || 'Einladung')}</b><br><span class="muted">offen · ${ago(new Date(i.created_at).getTime())}</span></p>
    <button class="link strong" data-act="inv-share" data-id="${i.token}" data-l="${esc(i.label || '')}">Teilen</button><button class="link" style="color:var(--danger);margin-left:8px" data-act="inv-revoke" data-id="${i.token}">Zurückziehen</button></div>`).join('');
  openSheet(`<h3 class="sh-title">Inner Circle</h3>
    <p style="text-align:center;margin:0 0 4px;font-size:17px"><b>${act.length} von ${MAX_PEOPLE} Plätzen belegt</b></p>
    <p class="muted" style="text-align:center;margin:0 0 12px">${inv.length ? `${inv.length} ${inv.length === 1 ? 'Einladung ist' : 'Einladungen sind'} noch offen` : 'Keine offenen Einladungen'}</p>
    ${full ? `<p style="text-align:center;font-weight:600">Dein Inner Circle ist voll (${MAX_PEOPLE}/${MAX_PEOPLE})</p>`
      : blocked ? `<p class="muted" style="text-align:center">Alle Plätze sind belegt oder schon als Einladung unterwegs. Zieh eine offene Einladung zurück, um jemand anderen einzuladen.</p>`
      : `<label class="fl" for="invfor">Neue Einladung – für wen?</label><input type="text" id="invfor" maxlength="40" placeholder="z. B. Lisa" autocomplete="off"><button class="btn primary" data-act="inv-new" id="invnew" style="margin-top:8px">Einladung erstellen</button>`}
    ${inv.length ? `<h4 class="act-h">Offene Einladungen</h4>${op}` : ''}
    <h4 class="act-h">Mitglieder</h4>
    <div class="act">${avatar(S.me, 40)}<p><b>${esc(nick(S.me))}</b><br><span class="muted">Du · Besitzerin</span></p></div>${mem}
    <p class="fine" style="text-align:center;margin-top:12px">Jede Einladung gilt für genau eine Person und nur einmal.</p>`, 'tall');
}
function showInvite(token, label){
  const u = inviteURL(token), txt = `${label ? 'Hey ' + label + '! ' : ''}Du bist in meinem ${APP_NAME} – meinem eigenen kleinen Instagram nur für meine Liebsten 💛 Öffne den Link (iPhone: in Safari, Android: in Chrome), dort steht, wie es weitergeht: ${u}`;
  openSheet(`<h3 class="sh-title">Einladung${label ? ' für ' + esc(label) : ''}</h3>
    <p class="muted" style="margin:0 0 6px">Dieser Link gilt einmal – für genau eine Person. Kein Passwort, kein Konto.</p>
    <div class="linkbox">${esc(u)}</div>
    <a class="btn primary" style="text-decoration:none" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Per WhatsApp schicken</a>
    <button class="btn" data-act="inv-native" data-id="${token}" data-l="${esc(label || '')}">Teilen …</button><button class="btn" data-act="inv-copy" data-id="${token}">Link kopieren</button>
    <button class="btn" data-act="circle">Zurück</button>`, 'tall');
}

/* ---------- Einrichtung ---------- */
function onbSteps(){
  const o = S.onb;
  if (o.mode === 'restore') return o.step === 'push' ? ['push'] : ['welcome'];
  let s = ['welcome', 'profile', 'home', 'push', 'info'];
  if (o.info && o.info.kind === 'owner') s.push('invite');
  if (!((isIOS() || isAndroid()) && !standalone())) s = s.filter(x => x !== 'home');
  else if (isAndroid()) s = [...s.filter(x => x !== 'home'), 'home'];
  return s;
}
const STATUS_TXT = {
  used:['🔑', 'Bereits eingelöst', 'Diese Einladung wurde schon benutzt. Wenn du das warst: nutze deinen Wiederherstellen-Link.'],
  revoked:['🚫', 'Einladung zurückgezogen', 'Diese Einladung gilt nicht mehr. Frag nach einer neuen.'],
  invalid:['❓', 'Link ungültig', 'Dieser Link funktioniert nicht. Prüf, ob er vollständig kopiert wurde.'],
  full:['🔒', `Der Inner Circle ist voll (${MAX_PEOPLE}/${MAX_PEOPLE})`, 'Gerade ist kein Platz frei.']
};
function pasteBox(restoreOnly){
  return `<div id="joinbox" style="display:none"><input type="text" id="joinin" placeholder="${restoreOnly ? 'Wiederherstellen-Link einfügen' : 'Einladungs- oder Wiederherstellen-Link einfügen'}" autocomplete="off" style="margin-bottom:8px">
    <button class="btn primary" data-act="onb-join" id="joingo">Weiter</button></div>`;
}
function onbHTML(){
  const o = S.onb, steps = onbSteps(), i = steps.indexOf(o.step);
  const dots = `<div class="dots">${steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>`;
  const next = (label='Weiter', act='onb-next') => `<button class="btn primary" data-act="${act}">${label}</button>`;
  const skip = `<button class="btn" data-act="onb-next" style="background:none;color:var(--muted)">Später</button>`;
  const owner = o.info && o.info.kind === 'owner';
  switch (o.step) {
    case 'welcome': {
      if (isAndroid() && (isSamsungBrowser() || isInAppBrowser()) && !standalone() && !o.forceHere && (o.token || o.restore)) return `<div class="step"><div class="ico">🌐</div><h2>Bitte in Chrome öffnen</h2>
        <p>Du bist gerade im ${isSamsungBrowser() ? 'Samsung-Internet-Browser' : 'eingebauten Browser einer App'}. Der installiert ${APP_NAME} nicht sauber – daher kommt sonst die Warnung „ältere Android-Version / nicht sicher“. ${APP_NAME} selbst ist nicht unsicher.</p>
        <p>In <b>Chrome</b> klappt alles: Einrichten und mit einem Tipp installieren.</p>
        <div class="grow"></div><a class="btn primary" style="text-decoration:none" href="${chromeIntentURL()}">In Chrome öffnen</a>
        <button class="btn" data-act="onb-here" style="background:none;color:var(--muted)">Trotzdem hier weiter</button></div>`;
      if (o.mode === 'restore') {
        if (isIOS() && !standalone()) return `<div class="step"><div class="ico">🔑</div><h2>Wiederherstellen</h2>
          <p>Auf dem iPhone in dieser Reihenfolge:</p>
          <ol><li>Unten auf <b>„Link kopieren“</b> tippen</li><li>In Safari auf <b>Teilen</b> → <b>„Zum Home-Bildschirm“</b></li><li>Die App über das neue Symbol öffnen</li><li><b>„Wiederherstellen“</b> → <b>„Einfügen“</b></li></ol>
          <div class="grow"></div><button class="btn primary" data-act="copy-join">Link kopieren</button>
          <button class="btn" data-act="onb-restore-go" style="background:none;color:var(--muted)">Lieber hier im Browser</button></div>`;
        return `<div class="step"><div class="grow" style="display:flex;flex-direction:column;justify-content:center;text-align:center">
          <div class="wordmark" style="font-size:58px">${esc(APP_NAME)}</div><p style="margin-top:12px">Willkommen zurück 🔑</p></div>
          <button class="btn primary" data-act="onb-restore-go" id="rstgo">Wiederherstellen</button><p class="fine" id="rsterr" style="color:var(--danger);text-align:center"></p></div>`;
      }
      if (o.mode === 'join') {
        if (!o.info) return `<div class="step"><div class="grow" style="display:flex;flex-direction:column;justify-content:center;text-align:center"><div class="wordmark" style="font-size:58px">${esc(APP_NAME)}</div><p class="muted" style="margin-top:12px">Einladung wird geprüft …</p></div></div>`;
        const st = STATUS_TXT[o.info.status];
        if (st) return `<div class="step"><div class="ico">${st[0]}</div><h2>${esc(st[1])}</h2><p>${esc(st[2])}</p><div class="grow"></div>
          ${o.info.status === 'used' ? `${pasteBox(true)}<button class="btn primary" data-act="onb-paste" data-r="1">🔑 Wiederherstellen-Link einfügen</button>` : ''}
          <button class="btn" data-act="onb-start" style="background:none;color:var(--muted)">Zum Anfang</button></div>`;
        if (isIOS() && !standalone()) return `<div class="step"><div class="ico">💌</div><h2>${owner ? 'Dein eigenes ' + esc(APP_NAME) : 'Du wurdest eingeladen'}</h2>
          <p>Auf dem iPhone in dieser Reihenfolge:</p>
          <ol><li>Unten auf <b>„Einladung kopieren“</b> tippen</li><li>In Safari auf <b>Teilen</b> (Quadrat mit Pfeil) → <b>„Zum Home-Bildschirm“</b></li>
          <li>Die App über das neue Symbol öffnen</li><li>Dort <b>„Ich habe eine Einladung“</b> → <b>„Einfügen“</b></li></ol>
          <div class="grow"></div><button class="btn primary" data-act="copy-join">Einladung kopieren</button>
          <button class="btn" data-act="onb-next" style="background:none;color:var(--muted)">Lieber hier im Browser weiter</button></div>`;
        return `<div class="step"><div class="grow" style="display:flex;flex-direction:column;justify-content:center;text-align:center">
          <div class="wordmark" style="font-size:58px">${esc(APP_NAME)}</div>
          <p style="margin-top:12px">${owner ? 'Dein eigenes Instagram – nur für dich und deine 10 Liebsten 💛' : 'Du wurdest in einen Inner Circle eingeladen 💛 Ein paar Schritte, dann bist du dabei.'}</p></div>
          ${dots}${next('Los geht’s')}</div>`;
      }
      return `<div class="step"><div class="grow" style="display:flex;flex-direction:column;justify-content:center;text-align:center">
        <div class="wordmark" style="font-size:58px">${esc(APP_NAME)}</div>
        <p style="margin-top:12px">Ein privater Kreis für höchstens ${MAX_PEOPLE} Personen. Rein kommst du nur mit einer Einladung.</p></div>
        ${pasteBox(false)}
        <button class="btn primary" data-act="onb-paste" id="joinpaste">Ich habe eine Einladung</button>
        <button class="btn" data-act="onb-paste" data-r="1">🔑 Wiederherstellen</button></div>`;
    }
    case 'profile': return `<div class="step"><h2>Dein Profil</h2>${profileFormHTML()}<div class="grow" style="min-height:16px"></div>${dots}
        <button class="btn primary" data-act="onb-profile" id="onbgo">Einrichtung abschließen</button><p class="fine" id="onberr" style="color:var(--danger);text-align:center"></p></div>`;
    case 'home': if (isAndroid()) return `<div class="step"><div class="ico">📲</div><h2>Letzter Schritt: ${esc(APP_NAME)} auf den Startbildschirm</h2>
        <p>Dann startet ${esc(APP_NAME)} wie eine richtige App – mit eigenem Symbol, ohne Browser-Leiste. Alles, was du gerade eingerichtet hast, bleibt erhalten.</p>
        ${isSamsungBrowser() || isInAppBrowser() ? '<p><b>Hinweis:</b> Installieren bitte nur über <b>Chrome</b>. Öffne dazu deinen Wiederherstellen-Link (Profil → ≡) in Chrome.</p>'
          : S.installed ? `<p class="ok">✓ ${esc(APP_NAME)} ist installiert. Du findest es jetzt auf deinem Startbildschirm.</p>`
          : S.installEvt ? '<p>Ein Tipp auf den Knopf – dein Handy fragt einmal nach, dann ist es erledigt.</p>'
          : `<p>Falls kein Knopf erscheint, geht es so:</p><ol><li>Oben rechts in Chrome auf die <b>drei Punkte ⋮</b> tippen</li><li><b>„App installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b> wählen</li><li>Bestätigen – fertig</li></ol>`}
        <div class="grow"></div>${dots}
        ${S.installed ? next('Fertig') : S.installEvt ? '<button class="btn primary" data-act="install">App installieren</button>' + `<button class="btn" data-act="onb-next" style="background:none;color:var(--muted)">Später</button>` : next('Erledigt – fertig')}</div>`;
      return `<div class="step"><div class="ico">📲</div><h2>Auf den Home-Bildschirm</h2>
        <p>Auf dem iPhone kommen Benachrichtigungen nur, wenn die App auf dem Home-Bildschirm liegt:</p>
        <ol><li>Erst in den Einstellungen (Profil → ≡) deinen <b>Wiederherstellen-Link kopieren</b></li><li>Unten in Safari auf <b>Teilen</b> → <b>„Zum Home-Bildschirm“</b></li><li>Die App über das neue Symbol öffnen → „Wiederherstellen“ → Einfügen</li></ol>
        <div class="grow"></div>${dots}${next('Erledigt / Weiter')}</div>`;
    case 'push': return `<div class="step"><div class="ico">🔔</div><h2>Benachrichtigungen</h2>
        <p>Damit du merkst, wenn dir jemand schreibt, etwas teilt, kommentiert oder deinen Beitrag likt.</p>
        <p id="pushst">${'Notification' in window && Notification.permission === 'granted' ? '<span class="ok">✓ Bereits erlaubt</span>' : ''}</p>
        <div class="grow"></div>${dots}<button class="btn primary" data-act="onb-push">Erlauben</button>${skip}</div>`;
    case 'info': return `<div class="step"><div class="ico">📸</div><h2>Fotos & Speicher</h2>
        <p>Fotos, Nachrichten und Profile liegen auf deinem Handy und werden im Inner Circle abgeglichen – auch ohne Netz kommt alles später nach.</p>
        <p>Ein Foto ins Fotos-Album holen: beim Beitrag auf das Menü → <b>„In Fotos sichern“</b>.</p>
        <p><b>Wichtig:</b> Unter Profil → ≡ findest du deinen <b>Wiederherstellen-Link</b>. Heb ihn gut auf – damit kommst du auch auf einem neuen Handy wieder rein.</p>
        <div class="grow"></div>${dots}${next()}</div>`;
    case 'invite': return `<div class="step"><div class="ico">💌</div><h2>Lade deine Liebsten ein</h2>
        <p>Du bist die Besitzerin. Nur du kannst einladen und Leute entfernen – höchstens ${MAX_PEOPLE} Personen insgesamt, dich eingerechnet.</p>
        <p>Jede Einladung ist ein eigener Link für genau eine Person. Du findest das jederzeit unter Profil → ≡ → <b>„Inner Circle & Einladen“</b>.</p>
        <div class="grow"></div>${dots}<button class="btn primary" data-act="onb-invite">Jetzt jemanden einladen</button>${next('Später')}</div>`;
  }
  return '';
}
async function onbNext(){
  const steps = onbSteps(), i = steps.indexOf(S.onb.step);
  if (i >= steps.length - 1 || i < 0) { await finishOnb(); return; }
  S.onb.step = steps[i + 1]; render(); window.scrollTo(0, 0);
}
async function finishOnb(){
  S.onb = null; S.tab = 'home';
  if (location.hash || location.search) history.replaceState(null, '', location.pathname);
  render(); toast(`Hallo ${nick(S.me)}!`);
}
async function loadInviteInfo(){
  try {
    const sb = Sync.client(); if (!sb) throw new Error('Kein Server');
    const r = await sb.rpc('invite_info', { p_token:S.onb.token });
    S.onb.info = r.error ? { status:'invalid' } : r.data;
  } catch (e) { S.onb.info = { status:'invalid', err:String(e.message || e) }; }
  render();
}
async function onbProfile(){
  const btn = $('#onbgo'), err = $('#onberr');
  const n = ($('#enick').value || '').trim();
  if (!n) { err.textContent = 'Bitte gib deinen Namen ein.'; $('#enick').focus(); return; }
  btn.disabled = true; btn.textContent = 'Einen Moment …'; err.textContent = '';
  try {
    await Sync.ensureAuth();
    const r = await Sync.sb.rpc('redeem_invite', { p_token:S.onb.token });
    if (r.error) throw r.error;
    S.spaceId = r.data.space_id; S.me = r.data.pid; S.isOwner = !!r.data.is_owner; S.restore = r.data.restore; S.removed = false;
    await saveDevice();
    await saveProfileForm();
    Sync.start().then(scheduleRender);
    await onbNext();
  } catch (e) {
    console.warn(e); btn.disabled = false; btn.textContent = 'Nochmal versuchen';
    err.textContent = (e && e.message) ? e.message : 'Verbindung fehlgeschlagen. Internet prüfen.';
  }
}

/* ---------- Videos im Feed ---------- */
let vObs;
function watchVideos(){
  if (vObs) vObs.disconnect();
  if (!('IntersectionObserver' in window)) return;
  vObs = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting && e.intersectionRatio > 0.6) v.play().catch(() => {}); else v.pause(); }), { threshold:[0, .6, 1] });
  $$('.feed video').forEach(v => vObs.observe(v));
}

/* ---------- Ereignisse ---------- */
async function copyText(t){ try { await navigator.clipboard.writeText(t); toast('Link kopiert'); } catch (_) { toast('Kopieren ging nicht – Link bitte markieren'); } }

document.addEventListener('click', async e => {
  if ($('#popmenu') && !e.target.closest('#popmenu') && !e.target.closest('[data-act=feed-menu]')) closeFeedMenu();
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, id = t.dataset.id, u = t.dataset.u;
  switch (a) {
    case 'tab': closeSheet(); closeFeedMenu(); S.tab = t.dataset.tab; if (S.tab === 'chat') S.chatWith = null; if (S.tab === 'profile') { S.profileOf = null; S.profileTab = 'grid'; } $('#app').innerHTML = ''; render(); window.scrollTo({ top:0 }); break;
    case 'inbox': S.chatWith = null; $('#app').innerHTML = ''; render(); window.scrollTo({ top:0 }); break;
    case 'chat-with': openChat(u); break;
    case 'create': openCreate('post'); break;
    case 'create-story': openCreate('story'); break;
    case 'cmode': C.mode = t.dataset.m; openCreate(C.mode); break;
    case 'cbg': C.bg = GRADS[+t.dataset.i]; $$('#cgrads button').forEach(b => b.classList.toggle('on', b === t)); updatePreview(); break;
    case 'cclear': C.pr = null; updatePreview(); break;
    case 'publish': publish(); break;
    case 'like': setLike(id, 'toggle'); break;
    case 'fav': toggleFav(id); break;
    case 'repost': repostPost(id); break;
    case 'share-post': openSendPicker(id); break;
    case 'send-pick': {
      if (SEND.sel.has(u)) SEND.sel.delete(u); else SEND.sel.add(u);
      const on = SEND.sel.has(u), pk = $('.pk', t); if (pk) { pk.style.background = on ? 'var(--fg)' : ''; pk.style.borderColor = on ? 'var(--fg)' : ''; pk.innerHTML = on ? `<span style="color:var(--bg);width:16px;height:16px;display:inline-flex">${I.check}</span>` : ''; }
      const g = $('#sendgo'); if (g) { g.disabled = !SEND.sel.size; g.textContent = SEND.sel.size > 1 ? `An ${SEND.sel.size} senden` : 'Senden'; }
      break;
    }
    case 'send-go': sendPostTo(); break;
    case 'feed-menu': e.stopPropagation(); if (!S.logoDone) { S.logoDone = true; clearTimeout(logoT); t.innerHTML = feedLabel(); } if ($('#popmenu')) closeFeedMenu(); else openFeedMenu(); break;
    case 'feed-mode': S.feedMode = t.dataset.m; meta.set('feedMode', S.feedMode); closeFeedMenu(); render(); window.scrollTo({ top:0 }); break;
    case 'reel-tap': { const now = Date.now(); if (taps[id] && now - taps[id] < 320) { taps[id] = 0; setLike(id, 'on'); t.play().catch(() => {}); } else { taps[id] = now; const v = t; if (v.paused) v.play().catch(() => {}); else v.pause(); } break; }
    case 'reel-mute': reelMuted = !reelMuted; $$('.reel video').forEach(v => v.muted = reelMuted); $$('.rmute').forEach(b => b.innerHTML = reelMuted ? I.muted : I.sound); break;
    case 'media-tap': mediaTap(id, t); break;
    case 'comments': openComments(id); break;
    case 'post-menu': postMenu(id); break;
    case 'save-media': closeSheet(); saveToPhone(id); break;
    case 'del-post-ask': delPostAsk(id); break;
    case 'del-post': delPost(id); break;
    case 'close-sheet': closeSheet(); break;
    case 'open-post': openSinglePost(id); break;
    case 'profile': closeSheet(); S.tab = 'profile'; S.profileOf = u; S.profileTab = 'grid'; $('#app').innerHTML = ''; render(); window.scrollTo({ top:0 }); break;
    case 'ptab': S.profileTab = t.dataset.t; render(); break;
    case 'story-user': { const list = storiesOf(u, true); const f = list.findIndex(s => u !== S.me && !viewersOf(s.id).includes(S.me)); openViewer(list.map(s => ({ type:'story', s })), f < 0 ? 0 : f); break; }
    case 'ufeed': closeSheet(); S.tab = 'ufeed'; S.profileOf = u; render(); { const el = document.getElementById('p-' + id); if (el) el.scrollIntoView(); } break;
    case 'archive-open': { const list = storiesOf(u); openViewer(list.map(s => ({ type:'story', s })), list.findIndex(s => s.id === id)); break; }
    case 'vnext': if (Date.now() - V.downAt < 250) nextItem(); break;
    case 'vprev': if (Date.now() - V.downAt < 250) prevItem(); break;
    case 'viewer-close': e.stopPropagation(); closeViewer(); break;
    case 'avatar-big': showAvatarBig(u); break;
    case 'avbig-story': { $$('.avbig').forEach(x => x.remove()); const list = storiesOf(u, true); openViewer(list.map(s => ({ type:'story', s })), 0); break; }
    case 'story-like': {
      e.stopPropagation();
      const cur = D.reactions.get(id + '|' + S.me), on = !(cur && cur.on);
      await put('reactions', { post_id:id, role:S.me, at:Date.now(), on });
      t.classList.toggle('on', on); t.innerHTML = on ? I.heartOn : I.heart;
      if (on) { t.classList.add('bump'); const st = D.stories.get(id); if (st) Sync.push('like', `${uname(S.me)} gefällt deine Story ❤️`, st.text ? st.text.slice(0, 80) : '', st.author); }
      break;
    }
    case 'viewer-profile': e.stopPropagation(); cancelAnimationFrame(V.raf); { const el = $('#viewer'); if (el) el.remove(); } document.body.style.overflow = '';
      S.tab = 'profile'; S.profileOf = u; S.profileTab = 'grid'; $('#app').innerHTML = ''; render(); window.scrollTo({ top:0 }); break;
    case 'settings': openSettings(); break;
    case 'edit-profile': openProfileEdit(); break;
    case 'e-emoji': E.emoji = t.dataset.e; if (S.tab !== 'editprof') { E.removePhoto = true; E.avatarPr = null; if (E.avatarURL) { URL.revokeObjectURL(E.avatarURL); E.avatarURL = null; } } $$('.emojis button').forEach(b => b.classList.toggle('on', b === t)); refreshEditAvatar(); if (S.tab === 'editprof') closeSheet(); break;
    case 'e-color': E.color = t.dataset.c; $$('[data-act=e-color]').forEach(b => b.style.border = b === t ? '3px solid var(--fg)' : '2px solid var(--line)'); { const c = $('#ecolor'); if (c) c.value = E.color; } break;
    case 'e-picmenu': openPicMenu(); break;
    case 'e-back': leaveEditProf(); break;
    case 'e-emojis': openSheet(`<h3 class="sh-title">Emoji als Profilbild</h3><div class="emojis">${EMOJIS.map(x => `<button data-act="e-emoji" data-e="${x}" class="${x === E.emoji ? 'on' : ''}">${x}</button>`).join('')}</div>`); break;
    case 'e-nophoto': E.removePhoto = true; E.avatarPr = null; E.avatarURL = null; refreshEditAvatar(); if (S.tab === 'editprof') closeSheet(); break;
    case 'push-test': {
      if (!Sync.ready) { toast('Nicht verbunden – Internet?'); break; }
      try {
        const { data, error } = await Sync.sb.functions.invoke('send-push', { body:{ space_id:S.spaceId, kind:'test', title:`${APP_NAME} 🔔`, body:'Test: Benachrichtigungen kommen an ✓', self:true } });
        if (error) throw error;
        toast(data && data.sent ? `Gesendet an ${data.sent} Gerät(e) – App jetzt kurz schließen` : 'Kein Gerät registriert – bitte „Benachrichtigungen einschalten“');
      } catch (err) { toast('Test fehlgeschlagen: ' + (err.message || err)); }
      break;
    }
    case 'perm-push': try { await enablePush(); toast('Benachrichtigungen aktiv ✓'); } catch (err) { toast(err.message); } break;
    case 'howto': openHowto(); break;
    case 'circle': openCircle(); break;
    case 'inv-new': {
      const label = ($('#invfor').value || '').trim();
      t.disabled = true; t.textContent = 'Wird erstellt …';
      const r = await Sync.sb.rpc('create_invite', { p_space:S.spaceId, p_label:label });
      if (r.error) { toast(r.error.message); t.disabled = false; t.textContent = 'Einladung erstellen'; break; }
      showInvite(r.data.token, r.data.label || label); break;
    }
    case 'inv-share': showInvite(id, t.dataset.l); break;
    case 'inv-native': try { await navigator.share({ title:APP_NAME, text:`Du bist in meinem ${APP_NAME} 💛 Der Link ist dein Schlüssel:`, url:inviteURL(id) }); } catch (_) { copyText(inviteURL(id)); } break;
    case 'inv-copy': copyText(inviteURL(id)); break;
    case 'inv-revoke': {
      const r = await Sync.sb.rpc('revoke_invite', { p_token:id });
      if (r.error) toast(r.error.message); else { toast('Einladung zurückgezogen'); openCircle(); }
      break;
    }
    case 'rm-ask': openSheet(`<h3 class="sh-title">${esc(nick(u))} entfernen?</h3><p class="muted" style="text-align:center;margin:0 0 14px">${esc(nick(u))} sieht danach nichts mehr aus deinem Inner Circle. Der Platz wird frei.</p>
        <div class="menu"><button class="btn danger" data-act="rm-go" data-u="${u}">Entfernen</button><button class="btn" data-act="circle">Abbrechen</button></div>`); break;
    case 'rm-go': {
      const r = await Sync.sb.rpc('remove_person', { p_space:S.spaceId, p_pid:u });
      if (r.error) { toast(r.error.message); break; }
      const pe = D.people.get(u); if (pe) { const row = { ...pe, removed_at:new Date().toISOString() }; D.people.set(u, row); DB.put('people', row, u); }
      toast(`${nick(u)} wurde entfernt`); openCircle(); scheduleRender(); break;
    }
    case 'onb-invite': await finishOnb(); openCircle(); break;
    case 'onb-next': onbNext(); break;
    case 'onb-here': S.onb.forceHere = true; render(); break;
    case 'onb-start': if (location.hash || location.search) history.replaceState(null, '', location.pathname); S.onb = { step:'welcome', mode:'start' }; render(); break;
    case 'install': {
      let ok = false;
      if (S.installEvt) { const ev = S.installEvt; S.installEvt = null; ev.prompt(); try { ok = (await ev.userChoice).outcome === 'accepted'; } catch (_) {} }
      if (ok) { S.installed = true; toast(`${APP_NAME} wird installiert ✓`); }
      if (S.onb) { if (ok) render(); else onbNext(); } else closeSheet();
      break;
    }
    case 'copy-join': copyText(location.href); t.textContent = '✓ Kopiert – jetzt Teilen → Zum Home-Bildschirm'; break;
    case 'onb-paste': {
      $('#joinbox').style.display = 'block'; $$('[data-act=onb-paste]').forEach(b => b.style.display = 'none');
      try { const c = await navigator.clipboard.readText(); if (JOIN_RX.test(c) || RESTORE_RX.test(c)) $('#joinin').value = c.trim(); } catch (_) {}
      $('#joinin').focus(); break;
    }
    case 'onb-join': {
      const v = ($('#joinin').value || '').trim(), rr = v.match(RESTORE_RX), mm = v.match(JOIN_RX);
      if (rr) { t.disabled = true; t.textContent = 'Stelle wieder her …'; try { await doRestore(rr[1].toLowerCase()); } catch (err) { t.disabled = false; t.textContent = 'Weiter'; toast(err.message || 'Wiederherstellen fehlgeschlagen'); } break; }
      if (!mm) { toast(`Das sieht nicht nach einem Link von ${APP_NAME} aus`); break; }
      S.onb = { step:'welcome', mode:'join', token:mm[1].toLowerCase(), info:null }; render(); loadInviteInfo(); window.scrollTo(0, 0); break;
    }
    case 'onb-restore-go': { const b = $('#rstgo'); if (b) { b.disabled = true; b.textContent = 'Stelle wieder her …'; }
      try { await doRestore(S.onb.restore); } catch (err) { if (b) { b.disabled = false; b.textContent = 'Nochmal versuchen'; } const x = $('#rsterr'); if (x) x.textContent = err.message || 'Fehlgeschlagen'; else toast(err.message || 'Fehlgeschlagen'); } break; }
    case 'restore-link': openRestoreLink(); break;
    case 'flush-now': if (!Sync.ready) await Sync.start(); await Outbox.flush(); closeSheet(); openSettings(); break;
    case 'copy-restore': copyText(restoreURL()); break;
    case 'share-restore': try { await navigator.share({ title:`${APP_NAME} – Wiederherstellen`, url:restoreURL() }); } catch (_) { copyText(restoreURL()); } break;
    case 'onb-profile': onbProfile(); break;
    case 'onb-push': try { await enablePush(); const p = $('#pushst'); if (p) p.innerHTML = '<span class="ok">✓ Benachrichtigungen aktiv</span>'; setTimeout(onbNext, 700); } catch (err) { const p = $('#pushst'); if (p) p.textContent = err.message; } break;
  }
});
document.addEventListener('change', async e => {
  if (e.target.id === 'cfile' || e.target.id === 'ccam') onPickFile(e.target);
  if (e.target.id === 'efile') {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try { E.avatarPr = await processFile(f, 600); E.removePhoto = false; if (E.avatarURL) URL.revokeObjectURL(E.avatarURL); E.avatarURL = URL.createObjectURL(E.avatarPr.blob); refreshEditAvatar(); if (S.tab === 'editprof') closeSheet(); }
    catch (err) { toast(err.message); }
    e.target.value = '';
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'ctext') updatePreview();
  if (e.target.id === 'ecolor') { E.color = e.target.value; $$('[data-act=e-color]').forEach(b => b.style.border = '2px solid var(--line)'); }
  if (e.target.id === 'euname') { const c = e.target.selectionStart, v = slug(e.target.value); if (v !== e.target.value) { e.target.value = v; try { e.target.setSelectionRange(c, c); } catch (_) {} } E.unameTouched = true; }
  if (e.target.id === 'enick' && S.onb && !E.unameTouched) { const un = $('#euname'); if (un) un.value = slug(e.target.value); }
  if (e.target.id === 'q') { S.q = e.target.value; const r = $('#sres'); if (r) { r.innerHTML = gridHTML(searchPosts()); hydrate(r); } }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('.cform');
  if (f) { e.preventDefault(); addComment(f.dataset.id, f.elements.t.value); return; }
  if (e.target.id === 'vreply') {
    e.preventDefault(); const i = $('#vrin'); const v = (i.value || '').trim(); if (!v) return;
    const st = D.stories.get(e.target.dataset.id); if (!st) return;
    put('messages', { id:newId(), author:S.me, to_pid:st.author, text:`↩️ Zu deiner Story${st.text ? ' „' + st.text.slice(0, 40) + '“' : ''}: ${v}`, created_at:Date.now(), read_at:null, deleted:false });
    Sync.push('message', nick(S.me), `↩️ Antwort auf deine Story: ${v.slice(0, 100)}`, st.author);
    i.value = ''; i.blur(); toast('Gesendet ✓'); return;
  }
  if (e.target.id === 'cbar') { e.preventDefault(); const i = $('#cmsg'); const v = i.value; i.value = ''; sendMessage(v); i.focus(); }
});
document.addEventListener('keydown', e => {
  if (!$('#viewer')) { if (e.key === 'Escape') closeSheet(); return; }
  if (e.target && e.target.id === 'vrin') return;
  if (e.key === 'Escape') closeViewer();
  if (e.key === 'ArrowRight') nextItem();
  if (e.key === 'ArrowLeft') prevItem();
});
setInterval(() => { if (S.me && !S.onb && S.tab === 'home' && !$('.backdrop') && !$('#viewer')) scheduleRender(); }, 60000);

/* ---------- Profilbild groß ---------- */
function showAvatarBig(r){
  $$('.avbig').forEach(x => x.remove());
  const p = prof(r), el = document.createElement('div'); el.className = 'avbig';
  const hasStory = storiesOf(r, true).length > 0;
  el.innerHTML = `<div class="avbig-c">${p.avatar_path ? `<img data-media="${esc(p.avatar_path)}" alt="">` : `<span>${esc(p.emoji || '🙂')}</span>`}</div><b>${esc(nick(r))}</b>${hasStory ? `<button class="btn primary" style="width:auto;padding:10px 22px" data-act="avbig-story" data-u="${r}">Story ansehen</button>` : ''}`;
  el.addEventListener('click', e => { if (!e.target.closest('[data-act=avbig-story]')) el.remove(); });
  document.body.appendChild(el); hydrate(el);
}
let holdT = 0, held = false;
document.addEventListener('pointerdown', e => { const h = e.target.closest('[data-hold-avatar]'); held = false; if (!h) return; holdT = setTimeout(() => { held = true; showAvatarBig(h.dataset.holdAvatar); }, 450); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => document.addEventListener(ev, () => clearTimeout(holdT)));
document.addEventListener('click', e => { if (held && e.target.closest('[data-hold-avatar]')) { e.stopPropagation(); e.preventDefault(); held = false; } }, true);

/* ---------- Nach unten ziehen = aktualisieren ---------- */
const PTR = { y0:null, dist:0, busy:false, el:null };
function ptrEl(){
  if (!PTR.el) { PTR.el = document.createElement('div'); PTR.el.className = 'ptr'; PTR.el.innerHTML = '<div class="ptr-spin"></div>'; document.body.appendChild(PTR.el); }
  return PTR.el;
}
function ptrAllowed(){
  return S.me && !S.onb && !PTR.busy && !$('.backdrop') && !$('#viewer') && !$('.alert') && !['reels', 'map'].includes(S.tab) && window.scrollY <= 0;
}
document.addEventListener('touchstart', e => { PTR.y0 = ptrAllowed() && e.touches.length === 1 ? e.touches[0].clientY : null; PTR.dist = 0; }, { passive:true });
document.addEventListener('touchmove', e => {
  if (PTR.y0 == null) return;
  const d = e.touches[0].clientY - PTR.y0;
  if (d <= 0 || window.scrollY > 0) { PTR.dist = 0; ptrEl().style.transform = 'translate(-50%,-60px)'; return; }
  PTR.dist = Math.min(110, d * 0.5);
  const el = ptrEl(); el.style.transition = 'none'; el.style.transform = `translate(-50%,${PTR.dist - 50}px) rotate(${PTR.dist * 4}deg)`;
  el.classList.toggle('ready', PTR.dist > 65);
}, { passive:true });
document.addEventListener('touchend', () => {
  if (PTR.y0 == null) return; PTR.y0 = null;
  const el = ptrEl(); el.style.transition = '';
  if (PTR.dist > 65) refreshAll(); else el.style.transform = 'translate(-50%,-60px)';
  PTR.dist = 0;
});
async function refreshAll(){
  if (PTR.busy) return; PTR.busy = true;
  const el = ptrEl(); el.classList.add('spinning'); el.style.transform = 'translate(-50%,16px)';
  try {
    // 1) neue App-Version? → neu laden
    try {
      const html = await fetch('./index.html?ts=' + Date.now(), { cache:'no-store' }).then(r => r.text());
      const v = (html.match(/APP_VERSION = '([^']+)'/) || [])[1];
      if (v && v !== APP_VERSION) {
        toast('Neue Version ' + v + ' – wird geladen …');
        const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
        if (reg) { try { await reg.update(); } catch (_) {} }
        if ('caches' in window) { try { for (const k of await caches.keys()) await caches.delete(k); } catch (_) {} }
        setTimeout(() => location.reload(), 600); return;
      }
    } catch (_) {}
    // 2) Daten neu holen
    if (Sync.ready) { await Sync.pull(); Outbox.flush(); } else await Sync.start();
    render(); toast('Aktualisiert ✓');
  } finally {
    setTimeout(() => { el.classList.remove('spinning', 'ready'); el.style.transform = 'translate(-50%,-60px)'; PTR.busy = false; }, 350);
  }
}


/* ---------- Start ---------- */
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; if (S.onb && S.onb.step === 'home') render(); });
window.addEventListener('appinstalled', () => { S.installed = true; S.installEvt = null; if (S.onb && S.onb.step === 'home') render(); });
async function boot(){
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const hadCtrl = !!navigator.serviceWorker.controller; let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadCtrl && !reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.register('./sw.js', { updateViaCache:'none' }).then(r => r.update()).catch(() => {});
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {}); });
  }
  for (const t of Object.keys(TABLES)) (await DB.entries(t)).forEach(([k, v]) => D[t].set(k, v));
  S.feedMode = (await meta.get('feedMode')) || 'all';
  S.actSeen = (await meta.get('actSeen')) || 0;
  const dev = await meta.get('device');
  const hs = location.hash + ' ' + location.search;
  const m = hs.match(JOIN_RX), rh = hs.match(RESTORE_RX);
  if (dev && dev.pid) {
    S.me = dev.pid; S.spaceId = dev.spaceId; S.isOwner = !!dev.isOwner; S.restore = dev.restore || null;
    if (m) toast('Dieses Handy ist schon dabei.');
    if (location.hash || location.search) history.replaceState(null, '', location.pathname);
    render(); Sync.start().then(scheduleRender);
  } else if (rh) {
    S.onb = { step:'welcome', mode:'restore', restore:rh[1].toLowerCase() }; render();
  } else if (m) {
    S.onb = { step:'welcome', mode:'join', token:m[1].toLowerCase(), info:null }; render(); loadInviteInfo();
  } else {
    S.onb = { step:'welcome', mode:'start' }; render();
  }
}
boot().catch(err => { $('#app').innerHTML = `<div class="empty"><b>Speicher nicht verfügbar</b>${esc(err.message || err)}<br>Im privaten Modus funktioniert die App nicht.</div>`; });
