import { createClient } from '@supabase/supabase-js';
const URL='https://swsssncfzvvvszyywmbo.supabase.co', KEY=process.env.K, SPACE='6e83394b-53e4-4840-901f-39c3ae1e59f7', OWNER_TOKEN='192dd3e1a07f2fcc328243f4';
const mem=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
const dev=async()=>{const c=createClient(URL,KEY,{auth:{storage:mem(),persistSession:true,autoRefreshToken:false}});const r=await c.auth.signInAnonymously();if(r.error)throw r.error;return c;};
let ok=0,bad=0;const T=(name,cond,info='')=>{cond?ok++:bad++;console.log((cond?'OK  ':'FEHLER ')+name+(info?'  → '+info:''));};
const anon=createClient(URL,KEY,{auth:{storage:mem(),persistSession:false}});
let r=await anon.rpc('invite_info',{p_token:OWNER_TOKEN}); T('invite_info Besitzer-Link (ohne Anmeldung)', r.data?.status==='ok'&&r.data.kind==='owner', JSON.stringify(r.data||r.error));
const own=await dev(); r=await own.rpc('redeem_invite',{p_token:OWNER_TOKEN}); T('Besitzerin löst ein', r.data?.is_owner===true, r.error?.message); const O=r.data;
r=await own.rpc('redeem_invite',{p_token:OWNER_TOKEN}); T('gleiches Gerät erneut: nichts verbraucht', r.data?.pid===O.pid, r.error?.message);
r=await anon.rpc('invite_info',{p_token:OWNER_TOKEN}); T('Besitzer-Link danach "used"', r.data?.status==='used');
const x=await dev(); r=await x.rpc('redeem_invite',{p_token:OWNER_TOKEN}); T('fremdes Gerät mit verbrauchtem Link abgewiesen', !!r.error && /Bereits eingelöst/.test(r.error.message), r.error?.message);
const toks=[]; for(let i=1;i<=9;i++){ r=await own.rpc('create_invite',{p_space:SPACE,p_label:'M'+i}); if(r.data) toks.push(r.data.token); }
T('9 Einladungen erstellt', toks.length===9);
r=await own.rpc('create_invite',{p_space:SPACE,p_label:'zuviel'}); T('10. offene Einladung geblockt', !!r.error, r.error?.message);
const M=[]; for(const t of toks){ const c=await dev(); const rr=await c.rpc('redeem_invite',{p_token:t}); if(rr.data) M.push({c,pid:rr.data.pid,restore:rr.data.restore,owner:rr.data.is_owner}); }
T('9 Mitglieder beigetreten, keine Besitzer', M.length===9 && M.every(m=>!m.owner));
r=await own.rpc('create_invite',{p_space:SPACE,p_label:'voll'}); T('bei 10/10 voll', /voll \(10\/10\)/.test(r.error?.message||''), r.error?.message);
r=await M[0].c.rpc('create_invite',{p_space:SPACE,p_label:'x'}); T('Mitglied darf nicht einladen', /Nur die Besitzerin/.test(r.error?.message||''), r.error?.message);
r=await M[0].c.from('invites').select('*').eq('space_id',SPACE); T('Mitglied sieht keine Einladungen', (r.data||[]).length===0, r.error?.message);
r=await own.from('invites').select('*').eq('space_id',SPACE); T('Besitzerin sieht Einladungen', (r.data||[]).length>=10);
r=await M[0].c.from('people').select('*').eq('space_id',SPACE); T('people: 10 sichtbar', r.data?.length===10, r.error?.message);
// Profile + Beitrag
r=await M[0].c.from('profiles').upsert({space_id:SPACE,role:M[0].pid,nick:'Lisa',username:'lisa',emoji:'🦊',color:'#4facfe',updated_at:Date.now()}); T('Profil speichern', !r.error, r.error?.message);
r=await M[0].c.from('profiles').upsert({space_id:SPACE,role:M[1].pid,nick:'Fake'}); T('fremdes Profil schreiben verboten', !!r.error, r.error?.message);
const pid='p'+Date.now(); r=await M[0].c.from('posts').upsert({id:pid,space_id:SPACE,author:M[0].pid,created_at:Date.now(),text:'Hallo'}); T('Beitrag posten', !r.error, r.error?.message);
r=await M[1].c.from('posts').select('*').eq('id',pid); T('anderes Mitglied sieht Beitrag', r.data?.length===1);
r=await M[1].c.from('reactions').upsert({post_id:pid,space_id:SPACE,role:M[1].pid,at:Date.now(),on:true}); T('Like', !r.error, r.error?.message);
r=await M[1].c.from('reactions').upsert({post_id:pid,space_id:SPACE,role:M[1].pid+':repost',at:Date.now(),on:true}); T('Repost-Marke pid:repost', !r.error, r.error?.message);
r=await M[1].c.from('reactions').upsert({post_id:pid,space_id:SPACE,role:M[2].pid+':view',at:Date.now(),on:true}); T('fremde Marke verboten', !!r.error, r.error?.message);
// Direktnachrichten
const mid='m'+Date.now(); r=await M[0].c.from('messages').upsert({id:mid,space_id:SPACE,author:M[0].pid,to_pid:M[1].pid,text:'Geheim',created_at:Date.now()}); T('DM senden', !r.error, r.error?.message);
r=await M[1].c.from('messages').select('*').eq('id',mid); T('Empfänger sieht DM', r.data?.length===1);
r=await M[2].c.from('messages').select('*').eq('id',mid); T('Dritter sieht DM NICHT', (r.data||[]).length===0);
r=await own.from('messages').select('*').eq('id',mid); T('Besitzerin sieht fremde DM NICHT', (r.data||[]).length===0);
r=await M[1].c.from('messages').update({read_at:Date.now()}).eq('id',mid).select(); T('Empfänger setzt gelesen (update)', r.data?.length===1, r.error?.message);
r=await M[1].c.from('messages').upsert({id:mid,space_id:SPACE,author:M[0].pid,to_pid:M[1].pid,text:'Geheim',created_at:Date.now(),read_at:Date.now()}); T('Empfänger-Upsert ganzer Zeile scheitert (darum patch)', !!r.error, r.error?.message);
r=await M[0].c.from('messages').upsert({id:'f'+mid,space_id:SPACE,author:M[1].pid,to_pid:M[0].pid,text:'Fake',created_at:Date.now()}); T('DM im fremden Namen verboten', !!r.error, r.error?.message);
// Realtime
const got={a:0,b:0}; const sub=(c,k)=>c.channel('t'+k).on('postgres_changes',{event:'*',schema:'public',table:'messages',filter:'space_id=eq.'+SPACE},()=>got[k]++).subscribe();
const ca=sub(M[1].c,'a'), cb=sub(M[2].c,'b'); await new Promise(z=>setTimeout(z,4000));
await M[0].c.from('messages').upsert({id:'r'+mid,space_id:SPACE,author:M[0].pid,to_pid:M[1].pid,text:'live',created_at:Date.now()});
await new Promise(z=>setTimeout(z,5000));
T('Realtime: Empfänger bekommt DM live', got.a>=1, JSON.stringify(got)); T('Realtime: Dritter bekommt DM NICHT', got.b===0, JSON.stringify(got));
await M[1].c.removeAllChannels(); await M[2].c.removeAllChannels();
// Speicher
r=await M[0].c.storage.from('media').upload(`${SPACE}/t${Date.now()}.txt`, new Blob(['x'],{type:'text/plain'})); T('Upload Medien', !r.error, r.error?.message);
// Wiederherstellen + Entfernen
const n=await dev(); r=await n.rpc('restore_device',{p_restore:M[0].restore}); T('Wiederherstellen auf neuem Gerät', r.data?.pid===M[0].pid, r.error?.message);
r=await n.from('posts').select('id').eq('id',pid); T('neues Gerät liest', r.data?.length===1);
r=await M[0].c.rpc('remove_person',{p_space:SPACE,p_pid:M[1].pid}); T('Mitglied darf nicht entfernen', !!r.error, r.error?.message);
r=await own.rpc('remove_person',{p_space:SPACE,p_pid:O.pid}); T('Besitzerin kann sich nicht selbst entfernen', !!r.error, r.error?.message);
r=await own.rpc('remove_person',{p_space:SPACE,p_pid:M[8].pid}); T('Besitzerin entfernt M9', r.data===true, r.error?.message);
r=await M[8].c.from('posts').select('id').eq('space_id',SPACE); T('Entfernter liest nichts mehr', (r.data||[]).length===0);
r=await M[8].c.rpc('my_space'); T('my_space für Entfernten leer', r.data===null, JSON.stringify(r.data));
const z=await dev(); r=await z.rpc('restore_device',{p_restore:M[8].restore}); T('Entfernter kann nicht wiederherstellen', /nicht mehr/.test(r.error?.message||''), r.error?.message);
r=await own.rpc('create_invite',{p_space:SPACE,p_label:'neu'}); T('Platz wieder frei → Einladung geht', !!r.data, r.error?.message);
const nt=r.data?.token; r=await own.rpc('revoke_invite',{p_token:nt}); T('Einladung zurückziehen', r.data===true, r.error?.message);
r=await anon.rpc('invite_info',{p_token:nt}); T('zurückgezogen erkannt', r.data?.status==='revoked');
r=await anon.rpc('invite_info',{p_token:'000000000000000000000000'}); T('ungültig erkannt', r.data?.status==='invalid');
r=await anon.rpc('admin_new_space',{p_name:'x',p_test:true}); T('admin-Funktion für App gesperrt', !!r.error, r.error?.message);
r=await own.rpc('admin_new_space',{p_name:'x',p_test:true}); T('admin-Funktion auch angemeldet gesperrt', !!r.error, r.error?.message);
console.log(`\n${ok} OK, ${bad} FEHLER`); process.exit(0);
