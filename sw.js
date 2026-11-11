'use strict';
// 修改靜態資源時一併遞增版本；新版本於舊分頁全部關閉後啟用，避免混用資源。
const CACHE_PREFIX = `repair-shell-${self.registration.scope}-`;
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const SHELL = ['./', './index.html', './style.css', './app.js', './config.js', './pwa.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];
const localUrls = new Set(SHELL.map(file => new URL(file, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SHELL);
    // CDN 暫時不可用不阻止網頁外殼離線使用；成功載入後會再快取。
    try { await cache.add(new Request(SDK, { mode: 'cors' })); } catch { /* 連線後重試 */ }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  // 僅快取列出的靜態資源；不攔截 Supabase API、POST 或使用者報修資料。
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isNavigation = request.mode === 'navigate' && url.href.startsWith(self.registration.scope);
  if (!localUrls.has(url.href) && url.href !== SDK && !isNavigation) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const key = isNavigation ? new URL('./index.html', self.registration.scope).href : request;
    const cached = await cache.match(key);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && (localUrls.has(url.href) || url.href === SDK)) {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
