chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
chrome.action.onClicked.addListener(()=>chrome.tabs.create({url:chrome.runtime.getURL('app.html')}));
// Only capture authorization sent to the requested timetable endpoint.
chrome.webRequest.onBeforeSendHeaders.addListener(details=>{
 const h=details.requestHeaders?.find(h=>h.name.toLowerCase()==='authorization');
 if(h?.value?.startsWith('Bearer ')) chrome.storage.session.set({ptitToken:h.value.slice(7),idpc:details.requestHeaders?.find(h=>h.name.toLowerCase()==='idpc')?.value||'0'});
},{urls:['https://qldttx.pttc1.edu.vn/api/sch/w-locdstkbtuanusertheohocky*']},['requestHeaders']);

// Track only login tabs opened by this extension. Other PTIT tabs stay open.
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
 (async()=>{
  if(msg?.type==='PTIT_OPEN_LOGIN'&&sender.url===chrome.runtime.getURL('app.html')){
   const returnTabId=sender.tab?.id??msg.returnTabId;
   // sender.url already authenticates the extension page. tabs.get().url may
   // be hidden without the broad tabs permission; do not require that field.
   if(!Number.isInteger(returnTabId)||returnTabId<0)throw Error('Không xác định được tab của tool. Hãy đóng và mở lại extension.');
   const login=await chrome.tabs.create({url:'about:blank',active:true});
   await chrome.storage.session.set({['loginTab:'+login.id]:{returnTabId,expires:Date.now()+30*60*1000}});
   await chrome.tabs.update(login.id,{url:'https://qldttx.pttc1.edu.vn/#/home'});
   return {ok:true};
  }
  if(!sender.tab||!sender.url?.startsWith('https://qldttx.pttc1.edu.vn/'))throw Error('Nguồn yêu cầu không hợp lệ.');
  if(msg?.type==='PTIT_SESSION'&&typeof msg.token==='string'&&msg.token.length>10){
   await chrome.storage.session.set({ptitToken:msg.token,idpc:String(msg.idpc||'0')});
   const key='loginTab:'+sender.tab.id;const login=(await chrome.storage.session.get(key))[key];
   if(login){
    await chrome.storage.session.remove(key);
    if(login.expires>Date.now()){
     // Save the token before closing its tab; no password is stored.
     await chrome.tabs.remove(sender.tab.id);
     try{await chrome.tabs.update(login.returnTabId,{active:true});}catch{await chrome.tabs.create({url:chrome.runtime.getURL('app.html')});}
    }
   }
   return {ok:true};
  }
  return {ok:false};
 })().then(reply).catch(e=>reply({ok:false,error:e.message}));
 return true;
});
chrome.tabs.onRemoved.addListener(id=>chrome.storage.session.remove('loginTab:'+id));
