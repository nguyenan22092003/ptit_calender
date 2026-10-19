export function payload(semester,page=1){
 if(!/^\d{5}$/.test(String(semester))) throw Error('Mã học kỳ phải gồm 5 chữ số.');
 return {filter:{hoc_ky:Number(semester),ten_hoc_ky:''},additional:{paging:{limit:100,page},ordering:[{name:null,order_type:null}]}};
}
export function validateEvents(input){
 if(!Array.isArray(input)||input.length>5000) throw Error('Cần mảng events, tối đa 5.000 buổi.');
 const seen=new Set();
 return input.map((x,i)=>{
  if(!x||typeof x.summary!=='string'||!x.summary.trim()||x.summary.length>500) throw Error(`Buổi ${i+1}: thiếu tên môn hợp lệ.`);
  const pattern=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/;
  if(!pattern.test(x.start)||!pattern.test(x.end)||!Number.isFinite(Date.parse(x.start))||!Number.isFinite(Date.parse(x.end))||Date.parse(x.end)<=Date.parse(x.start)) throw Error(`Buổi ${i+1}: cần giờ bắt đầu/kết thúc ISO +07:00 hợp lệ.`);
  for(const value of [x.start,x.end]){const local=new Date(Date.parse(value)+7*3600000).toISOString().slice(0,19);if(local!==value.slice(0,19))throw Error(`Buổi ${i+1}: ngày hoặc giờ không tồn tại.`);}
  if(x.start.slice(0,10)!==x.end.slice(0,10)) throw Error(`Buổi ${i+1}: giờ kết thúc phải cùng ngày.`);
  const e={summary:x.summary.trim(),start:x.start,end:x.end,location:String(x.location||'').slice(0,1000),description:String(x.description||'').slice(0,8000)};
  const key=JSON.stringify(e);if(seen.has(key))throw Error(`Buổi ${i+1}: trùng trong bản xem trước.`);seen.add(key);return e;
 });
}
export async function eventId(e,semester){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([String(semester),e.summary,e.start,e.end,e.location])));
 return 'ptit'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
export function parseAI(text){
 const data=JSON.parse(text);return validateEvents(data.events);
}
