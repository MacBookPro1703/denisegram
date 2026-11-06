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
//@KEEP 1592-1600
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

//@KEEP 1627-1688

/* ---------- Start ---------- */
//@KEEP 1690-1691
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
