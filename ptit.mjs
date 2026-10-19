import {validateEvents} from './core.mjs';
export function convertPTIT(raw,expectedSemester){
 const pages=Array.isArray(raw?.pages)?raw.pages:[raw];const events=[],warnings=[],seen=new Set(),semesters=new Set();let cancelled=0,duplicates=0;
 for(const page of pages){
 const d=page?.data;if(!Array.isArray(d?.ds_tiet_trong_ngay)||!Array.isArray(d?.ds_tuan_tkb))throw Error('JSON không đúng cấu trúc PTIT: thiếu ds_tiet_trong_ngay hoặc ds_tuan_tkb.');
 if(Number(d.total_pages)>pages.length)throw Error(`Dữ liệu chưa đủ ${d.total_pages} trang. Hãy lấy đủ trang trước khi chuyển lịch.`);
 const periods=new Map();for(const p of d.ds_tiet_trong_ngay){periods.set(Number(p.tiet),p);if(p.nhhk)semesters.add(String(p.nhhk));}
 for(const week of d.ds_tuan_tkb){
 if(!Array.isArray(week.ds_thoi_khoa_bieu))throw Error('Tuần học thiếu ds_thoi_khoa_bieu.');
 for(const row of week.ds_thoi_khoa_bieu){
 if(row.is_nghi_day===true||row.is_nghi_day===1||row.is_nghi_day==='true'){cancelled++;continue;}
 const name=String(row.ten_mon||'').trim();const date=String(row.ngay_hoc||'').match(/^(\d{4}-\d{2}-\d{2})(?:T|$)/)?.[1];
 const first=Number(row.tiet_bat_dau),count=Number(row.so_tiet);
 if(!name||!date||!Number.isInteger(first)||!Number.isInteger(count)||first<1||count<1)throw Error(`Buổi ${name||'(không tên)'}: thiếu ngày, tiết hoặc số tiết hợp lệ.`);
 for(let n=first;n<first+count;n++)if(!periods.has(n))throw Error(`${name}: thiếu bảng giờ tiết ${n}.`);
 const start=periods.get(first).gio_bat_dau,end=periods.get(first+count-1).gio_ket_thuc;
 const time=/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
 if(!time.test(start)||!time.test(end))throw Error(`${name}: giờ tiết không hợp lệ.`);
 const iso=t=>`${date}T${t.length===5?t+':00':t}+07:00`;
 const notes=[row.ma_mon&&`Mã môn: ${row.ma_mon}`,row.ten_lop&&`Lớp: ${row.ten_lop}`,row.ma_nhom&&`Nhóm: ${row.ma_nhom}`,row.ten_giang_vien&&`Giảng viên: ${row.ten_giang_vien}`,`Tiết ${first}–${first+count-1}`,row.is_day_bu&&'Buổi dạy bù',row.link_hoc_online&&`Học trực tuyến: ${row.link_hoc_online}`,row.gc_kqdk].filter(Boolean).join('\n');
 const event=validateEvents([{summary:name,start:iso(start),end:iso(end),location:String(row.ma_phong||''),description:notes}])[0];
 const key=JSON.stringify([name,event.start,event.end,event.location]);if(seen.has(key)){duplicates++;continue;}seen.add(key);events.push(event);
 }
 }
 }
 if(semesters.size>1)throw Error('Dữ liệu có bảng tiết của nhiều học kỳ; không thể xác định bảng giờ phù hợp.');
 const semester=[...semesters][0]||String(expectedSemester||'');
 if(expectedSemester&&semester!==String(expectedSemester))throw Error(`Dữ liệu thuộc học kỳ ${semester}, khác học kỳ ${expectedSemester} đang chọn.`);
 if(cancelled)warnings.push(`Đã bỏ ${cancelled} buổi nghỉ dạy.`);if(duplicates)warnings.push(`Đã gộp ${duplicates} buổi trùng.`);
 events.sort((a,b)=>a.start.localeCompare(b.start)||a.summary.localeCompare(b.summary));
 return {events,semester,warnings,cancelled,duplicates};
}
export async function toICS(events,semester){
 const {eventId}=await import('./core.mjs');validateEvents(events);
 const escape=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const utc=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PTIT Calender//VI','CALSCALE:GREGORIAN'];
 for(const e of events)lines.push('BEGIN:VEVENT',`UID:${await eventId(e,semester)}@ptit-calender`,`DTSTAMP:${stamp}`,`DTSTART:${utc(e.start)}`,`DTEND:${utc(e.end)}`,`SUMMARY:${escape(e.summary)}`,`LOCATION:${escape(e.location)}`,`DESCRIPTION:${escape(e.description)}`,'END:VEVENT');
 lines.push('END:VCALENDAR');
 // Fold at 75 UTF-8 octets without splitting Vietnamese characters.
 return lines.map(line=>{let out='',n=0;for(const c of line){const size=new TextEncoder().encode(c).length;if(n+size>75){out+='\r\n ';n=1;}out+=c;n+=size;}return out;}).join('\r\n')+'\r\n';
}
