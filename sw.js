/* مواعيد الدكاترة - service worker: يخلي التطبيق يفتح أوفلاين */
var V = "docs-v8";
var SHELL = ["index.html", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(V).then(function (c) {
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function put(req, res) {
  if (res && (res.ok || res.type === "opaque")) {
    var cp = res.clone();
    caches.open(V).then(function (c) { c.put(req, cp); });
  }
  return res;
}

async function netFirst(req, ms) {
  var cache = await caches.open(V);
  var fetched = fetch(req).then(function (r) { return put(req, r); });
  fetched.catch(function () {});
  var timeout = new Promise(function (res) { setTimeout(function () { res(null); }, ms); });
  try {
    var r = await Promise.race([fetched, timeout]);
    if (r) return r;
  } catch (e) {}
  var m = (await cache.match(req, { ignoreSearch: true })) || (await cache.match("index.html"));
  if (m) return m;
  return fetched;
}

async function swr(req) {
  var cache = await caches.open(V);
  var m = await cache.match(req);
  var net = fetch(req).then(function (r) { return put(req, r); }).catch(function () { return null; });
  return m || (await net) || Response.error();
}

async function cacheFirst(req) {
  var m = await caches.match(req);
  if (m) return m;
  var r = await fetch(req);
  return put(req, r);
}

self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin === location.origin) {
    if (r.mode === "navigate") e.respondWith(netFirst(r, 3500));
    else e.respondWith(swr(r));
    return;
  }
  if ((u.hostname === "www.gstatic.com" && u.pathname.indexOf("/firebasejs/") === 0) || u.hostname === "fonts.gstatic.com") {
    e.respondWith(cacheFirst(r));
    return;
  }
  if (u.hostname === "fonts.googleapis.com") {
    e.respondWith(swr(r));
  }
});
