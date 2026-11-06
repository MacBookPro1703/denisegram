
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
//@KEEP 1186-1193
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
//@KEEP 1235-1242
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
//@KEEP 1308-1324

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

//@KEEP 1439-1449
