import {validateEvents,eventId} from './core.mjs';
export const MARKER='Managed by ptit-calender extension; replacement calendar v1.';
export async function replaceCalendar({events,semester,token,onProgress=()=>{},fetcher=fetch}){
 validateEvents(events);if(!events.length)throw Error('Không có buổi học; giữ nguyên lịch cũ.');
 const base='https://www.googleapis.com/calendar/v3';
 async function api(path,method='GET',body){
 const r=await fetcher(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 if(!r.ok){let message='';try{const d=await r.json();message=d.error?.message||'';}catch{}throw Error(`Google HTTP ${r.status}: ${message||'Không thực hiện được yêu cầu.'}`);}
 return r.status===204?null:await r.json();
 }
 const previous=[];let pageToken;
 do{
 const q=new URLSearchParams({maxResults:'250',showHidden:'true'});if(pageToken)q.set('pageToken',pageToken);
 const page=await api('/users/me/calendarList?'+q);
 for(const c of page.items||[])if(c.summary==='ptit calendar'&&c.description===MARKER&&c.accessRole==='owner'&&!c.primary&&c.id!=='primary')previous.push(c.id);
 pageToken=page.nextPageToken;
 }while(pageToken);
 onProgress('Đang tạo lịch ptit calendar mới…');
 const calendar=await api('/calendars','POST',{summary:'ptit calendar',description:MARKER,timeZone:'Asia/Ho_Chi_Minh'});
 if(!calendar?.id||calendar.id==='primary'||previous.includes(calendar.id))throw Error('Google trả ID lịch mới không hợp lệ.');
 let created=0;
 try{
 for(const e of events){
 onProgress(`Đang nhập ${created+1}/${events.length} vào ptit calendar…`);
 await api(`/calendars/${encodeURIComponent(calendar.id)}/events`,'POST',{id:await eventId(e,semester),summary:e.summary,location:e.location,description:e.description,start:{dateTime:e.start,timeZone:'Asia/Ho_Chi_Minh'},end:{dateTime:e.end,timeZone:'Asia/Ho_Chi_Minh'},reminders:{useDefault:false,overrides:[{method:'popup',minutes:5},{method:'email',minutes:5}]}});created++;
 }
 }catch(error){
 try{await api('/calendars/'+encodeURIComponent(calendar.id),'DELETE');}catch{throw Error(`${error.message} Lịch cũ vẫn giữ nguyên; lịch mới nhập dở chưa xóa được.`);}
 throw Error(`${error.message} Đã hủy lịch mới nhập dở; lịch cũ vẫn giữ nguyên.`);
 }
 let deleted=0;const cleanupErrors=[];
 for(const id of previous){try{onProgress('Đang xóa lịch ptit calendar cũ…');await api('/calendars/'+encodeURIComponent(id),'DELETE');deleted++;}catch(e){cleanupErrors.push(e.message);}}
 return {created,deleted,calendarId:calendar.id,cleanupErrors};
}
