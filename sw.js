const V="app-v2",CORE=["./","./index.html","./manifest.json","./icon-192.png"],
LIBS=["app","auth","firestore"].map(n=>"https://www.gstatic.com/firebasejs/10.14.1/firebase-"+n+".js"),
HOSTS=["www.gstatic.com","fonts.googleapis.com","fonts.gstatic.com"];
self.addEventListener("install",e=>{e.waitUntil((async()=>{const c=await caches.open(V);await Promise.all(CORE.concat(LIBS).map(u=>c.add(u).catch(()=>{})));await self.skipWaiting()})())});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==V)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(u.origin===location.origin){if(u.pathname.endsWith("/sw.js"))return}else if(HOSTS.indexOf(u.hostname)<0)return;
  e.respondWith((async()=>{
    const c=await caches.open(V),o={ignoreSearch:true,ignoreVary:true};
    const hit=(await c.match(r,o))||(r.mode==="navigate"?await c.match("./index.html",o):undefined);
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return (await net)||Response.error();
  })());
});
