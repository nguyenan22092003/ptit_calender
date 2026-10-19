import {replaceCalendar} from './google-calendar.mjs';
import {convertPTIT,toICS} from './ptit.mjs';
import {payload,validateEvents,eventId} from './core.mjs';
const $=id=>document.getElementById(id);let events=[],googleToken='',busy=false,demo=false,sourceSemester=null;
const status=t=>{$('status').textContent=t;};
async function request(url,options={}){
 const r=await fetch(url,{...options,signal:AbortSignal.timeout(90000),redirect:'error'});
 if(!r.ok){let detail='';try{const body=await r.json();detail=body.error?.message||body.message||'';}catch{}throw Error(`HTTP ${r.status}. ${detail||'Kiểm tra phiên đăng nhập và quyền truy cập.'}`);}
 const data=await r.json();return data;
}
function task(id,fn){$(id).addEventListener('click',async()=>{if(busy)return;busy=true;$(id).disabled=true;try{await fn();}catch(e){status(e.message||String(e));}finally{busy=false;$(id).disabled=id==='import'&&!events.length;}});}
const savedFields=['semester'];
const saved=await chrome.storage.local.get(savedFields);savedFields.forEach(id=>{if(saved[id]!==undefined)$(id).value=saved[id];$(id).addEventListener('change',()=>chrome.storage.local.set({[id]:$(id).value}));});
async function ptitToken(){const s=await chrome.storage.session.get('ptitToken');return s.ptitToken;}
function render(){
 $('events').replaceChildren();events.forEach((e,i)=>{const tr=document.createElement('tr');const td=document.createElement('td');const c=document.createElement('input');c.type='checkbox';c.checked=true;c.dataset.index=i;c.setAttribute('aria-label',`Chọn ${e.summary}`);td.append(c);tr.append(td);[e.summary,e.start.replace('T',' ').replace('+07:00',''),e.end.replace('T',' ').replace('+07:00',''),e.location].forEach(s=>{const td=document.createElement('td');td.textContent=s;tr.append(td);});$('events').append(tr);});
 $('edited').value=JSON.stringify(events,null,2);$('import').disabled=!events.length;
}
task('portal',async()=>{
 const tab=await chrome.tabs.getCurrent();
 const r=await chrome.runtime.sendMessage({type:'PTIT_OPEN_LOGIN',returnTabId:tab.id});
 if(!r?.ok)throw Error(r?.error||'Không mở được đăng nhập PTIT.');
 status('Đăng nhập trên trang PTIT. Tab sẽ tự đóng sau khi nhận token và đưa bạn về đây.');
});
async function fetchSchedule(){
 const semester=$('semester').value;const body=payload(semester);const token=await ptitToken();if(!token)throw Error('Chưa có token PTIT.');status('Đang lấy lịch PTIT…');
 const meta=await chrome.storage.session.get('idpc');
 let pages=1;
 const results=[];
 for(let page=1;page<=pages;page++){
 status(`Đang lấy lịch trang ${page}/${pages}…`);
 const response=await request('https://qldttx.pttc1.edu.vn/api/sch/w-locdstkbtuanusertheohocky',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,idpc:meta.idpc||'0'},body:JSON.stringify(payload(semester,page))});
 if(response.result===false||response.success===false)throw Error(`Cổng PTIT trả lỗi tại trang ${page}. Kiểm tra token và học kỳ.`);
 results.push(response);
 if(page===1){const total=Number(response.data?.total_pages||1);if(!Number.isInteger(total)||total<1||total>100)throw Error('Số trang API không hợp lệ hoặc vượt 100.');pages=total;}
 }
 const r=pages===1?results[0]:{pages:results};
 $('raw').value=JSON.stringify(r,null,2);sourceSemester=semester;await chrome.storage.session.set({raw:$('raw').value,sourceSemester});events=[];render();demo=false;
 convert();
}
function convert(){
 events=[];sourceSemester=null;render();
 const result=convertPTIT(JSON.parse($('raw').value),$('semester').value);
 events=result.events;sourceSemester=result.semester;demo=false;render();
 $('warnings').textContent=result.warnings.join(' ');
 status(`Đã chuyển ${events.length} buổi học. ${result.warnings.join(' ')}`);
}
task('convert',convert);
task('ics',async()=>{
 if(demo)throw Error('Hãy dùng dữ liệu thật trước khi xuất lịch.');
 if(sourceSemester!==$('semester').value)throw Error('Học kỳ đã đổi. Chuyển lại dữ liệu.');
 const selected=[...$('events').querySelectorAll('input:checked')].map(x=>events[Number(x.dataset.index)]);
 if(!selected.length)throw Error('Chọn ít nhất một buổi học.');
 const url=URL.createObjectURL(new Blob([await toICS(selected,sourceSemester)],{type:'text/calendar;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=`ptit-${sourceSemester}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
 status(`Đã xuất ${selected.length} buổi. Trong Google Calendar: Cài đặt → Nhập và xuất → chọn file .ics.`);
});
task('apply',()=>{events=validateEvents(JSON.parse($('edited').value));sourceSemester=sourceSemester||$('semester').value;render();status(`Đã áp dụng ${events.length} buổi.`);});
async function connect(interactive){
 if(chrome.runtime.getManifest().oauth2.client_id.startsWith('REPLACE_'))throw Error('Cần cấu hình Google OAuth Client ID trong manifest.json. Xem README.');
 const r=await chrome.identity.getAuthToken({interactive});if(!r.token)throw Error('Google chưa cấp token.');googleToken=r.token;return googleToken;
}
task('google',async()=>{await connect(true);status('Đã kết nối Google Calendar.');});
task('disconnect',async()=>{if(googleToken)await chrome.identity.removeCachedAuthToken({token:googleToken});await chrome.identity.clearAllCachedAuthTokens();googleToken='';status('Đã xóa phiên Google của extension.');});
async function importSchedule(){
 if(demo)throw Error('Đây là dữ liệu minh họa. Lấy dữ liệu thật và phân tích trước khi nhập.');
 if(sourceSemester&&sourceSemester!==$('semester').value)throw Error('Học kỳ đã thay đổi. Lấy và phân tích lại dữ liệu.');
 const selected=[...$('events').querySelectorAll('input:checked')].map(x=>events[Number(x.dataset.index)]);validateEvents(selected);if(!selected.length)throw Error('Chọn ít nhất một buổi học.');
 await connect(false);
 const run=async()=>{
 const result=await replaceCalendar({events:selected,semester:sourceSemester,token:googleToken,onProgress:status});
 status(`Đã nhập ${result.created} buổi vào “ptit calendar”; đã xóa ${result.deleted} lịch cũ.${result.cleanupErrors.length?' Còn lịch cũ chưa xóa được: '+result.cleanupErrors.join('; '):''}`);
 };
 if(navigator.locks)await navigator.locks.request('ptit-calendar-import',{ifAvailable:true},async lock=>{if(!lock)throw Error('Một tab khác đang nhập lịch. Chờ hoàn tất rồi thử lại.');await run();});else await run();
}

task('fetch',async()=>{
 if(!await ptitToken())throw Error('Đăng nhập PTIT trước khi lấy lịch.');
 await connect(true);
 await fetchSchedule();
 if(!events.length){status('Học kỳ này không có buổi học để nhập.');return;}
 await importSchedule();
});
task('preview',fetchSchedule);
task('import',async()=>{await connect(true);await importSchedule();});
task('demo',()=>{demo=true;events=validateEvents([{summary:'MINH HỌA · Lập trình web',start:'2026-10-19T07:00:00+07:00',end:'2026-10-19T09:00:00+07:00',location:'Phòng minh họa',description:'Không phải lịch PTIT thật.'}]);render();status('Dữ liệu minh họa — chức năng import bị chặn.');});
task('clear',async()=>{await chrome.identity.clearAllCachedAuthTokens();await chrome.storage.session.clear();googleToken='';events=[];demo=false;sourceSemester=null;['raw','warnings'].forEach(id=>{if('value' in $(id))$(id).value='';else $(id).textContent='';});render();$('ptitState').textContent='Chưa nhận phiên đăng nhập PTIT.';status('Đã xóa dữ liệu phiên.');});
const session=await chrome.storage.session.get(['raw','sourceSemester']);if(session.raw){$('raw').value=session.raw;sourceSemester=session.sourceSemester;}

chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==='session'&&changes.ptitToken?.newValue){$('ptitState').textContent='Đã nhận phiên PTIT. Sẵn sàng lấy lịch.';status('Đã kết nối PTIT. Bấm Lấy lịch & nhập Google.');}
});

if(await ptitToken())$('ptitState').textContent='Đã nhận phiên PTIT. Sẵn sàng lấy lịch.';
