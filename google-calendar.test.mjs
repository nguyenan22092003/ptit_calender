import assert from 'node:assert/strict';
import {replaceCalendar,MARKER} from './google-calendar.mjs';
const events=[{summary:'Test',start:'2026-10-19T19:00:00+07:00',end:'2026-10-19T21:50:00+07:00'}];
function mock(fail=false){const calls=[];return {calls,fetcher:async(url,o)=>{
 const path=url.replace('https://www.googleapis.com/calendar/v3','');calls.push([o.method,path,o.body&&JSON.parse(o.body)]);
 const ok=d=>({ok:true,status:200,json:async()=>d});
 if(path.startsWith('/users/me/calendarList'))return ok({items:[{id:'old',summary:'ptit calendar',description:MARKER,accessRole:'owner'},{id:'primary',summary:'ptit calendar',description:MARKER,accessRole:'owner',primary:true},{id:'unrelated',summary:'ptit calendar',accessRole:'owner'}]});
 if(path==='/calendars')return ok({id:'new'});
 if(path==='/calendars/new/events')return fail?{ok:false,status:500,json:async()=>({error:{message:'test failure'}})}:ok({id:'event'});
 if(o.method==='DELETE')return {ok:true,status:204};throw Error('unexpected request');
 }};}
let m=mock();const r=await replaceCalendar({events,semester:20261,token:'mock',fetcher:m.fetcher});assert.equal(r.created,1);assert.deepEqual(m.calls.find(c=>c[1]==='/calendars/new/events')[2].reminders,{useDefault:false,overrides:[{method:'popup',minutes:5},{method:'email',minutes:5}]});assert.equal(r.deleted,1);assert.equal(m.calls.at(-1)[1],'/calendars/old');assert.ok(!m.calls.some(c=>c[0]==='DELETE'&&['/calendars/primary','/calendars/unrelated'].includes(c[1])));assert.equal(m.calls.find(c=>c[1]==='/calendars')[2].summary,'ptit calendar');
m=mock(true);await assert.rejects(replaceCalendar({events,semester:20261,token:'mock',fetcher:m.fetcher}));assert.ok(m.calls.some(c=>c[0]==='DELETE'&&c[1]==='/calendars/new'));assert.ok(!m.calls.some(c=>c[0]==='DELETE'&&c[1]==='/calendars/old'));
m=mock();await assert.rejects(replaceCalendar({events:[],semester:20261,token:'mock',fetcher:m.fetcher}));assert.equal(m.calls.length,0);
console.log('Replacement checks passed: create/populate before delete; protect primary and unrelated; failure rollback; empty schedule preserved.');
