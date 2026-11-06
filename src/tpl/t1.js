//@KEEP 1-11
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

//@KEEP 44-51
function chromeIntentURL(){
  const o = S.onb || {};
  const q = o.mode === 'restore' && o.restore ? `?restore=${o.restore}` : o.token ? `?join=${o.token}` : '';
  return `intent://${location.host}${location.pathname}${q}#Intent;scheme=https;package=com.android.chrome;end`;
}
//@KEEP 56-80

//@KEEP 90-138
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
//@KEEP 207-230

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
//@KEEP 304-350
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

//@KEEP 387-447
//@KEEP 448-456

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
//@KEEP 469-474
