// Runs only in the official PTIT origin, in an isolated extension world.
let previousToken='',running=false;
async function tick(){
 if(running)return;running=true;
 try{
  let user;try{user=JSON.parse(sessionStorage.getItem('CURRENT_USER')||'null');}catch{}
  if(user?.access_token&&user.access_token!==previousToken){
   const r=await chrome.runtime.sendMessage({type:'PTIT_SESSION',token:user.access_token,idpc:sessionStorage.getItem('idpc')||user.idpc||'0'});
   if(r?.ok)previousToken=user.access_token;
  }
 }catch{}finally{running=false;}
}
tick();setInterval(tick,1000);
