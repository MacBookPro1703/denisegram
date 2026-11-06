
/* ---------- Ansichten ---------- */
//@KEEP 502-503
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
//@KEEP 556-561
function activityCount(){
  const seen = S.actSeen || 0;
  return activityItems().filter(i => i.at > seen && i.mine).length;
}
//@KEEP 568-575

//@KEEP 577-610

//@KEEP 651-654
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

//@KEEP 736-760
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
//@KEEP 816-821

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

//@KEEP 928-937

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
//@KEEP 956-973
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
//@KEEP 992-999
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
//@KEEP 1022-1064
async function addComment(id, text){
  const p = D.posts.get(id); if (!p || !text.trim()) return;
  await put('comments', { id:newId(), post_id:id, author:S.me, text:text.trim(), created_at:Date.now(), deleted:false });
  openComments(id); if (S.tab === 'home') refreshPost(p);
  if (p.author !== S.me) Sync.push('comment', `${uname(S.me)} hat kommentiert`, text.trim().slice(0, 120), p.author);
}
//@KEEP 1071-1077
function delPostAsk(id){
  openSheet(`<h3 class="sh-title">Beitrag löschen?</h3><p class="muted" style="text-align:center;margin:0 0 14px">Der Beitrag ist danach für alle weg.</p>
    <div class="menu"><button class="btn danger" data-act="del-post" data-id="${id}">Löschen</button><button class="btn" data-act="close-sheet">Behalten</button></div>`);
}
//@KEEP 1082-1088

/* ---------- Story-Ansicht ---------- */
//@KEEP 1105-1144
//@KEEP 1146-1167
