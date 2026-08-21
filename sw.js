/* 다낭 여행 일정표 서비스워커.
   하는 일은 두 가지다.
   1) 홈 화면에 설치할 수 있게 한다 (크롬은 서비스워커가 있어야 설치를 권한다)
   2) 한 번 연 뒤에는 인터넷이 없어도 열리게 한다

   전략은 network-first 다. 인터넷이 되면 항상 최신을 가져오고,
   안 되면 캐시에서 꺼낸다. 일정이 자주 바뀌므로 캐시를 먼저 보면
   옛날 일정을 보게 될 수 있다. */

const CACHE = 'danang-trip-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .catch(() => {})          /* 한 개라도 실패하면 설치가 막히므로 삼킨다 */
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;   /* 지도 링크 등은 건드리지 않는다 */

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit => hit || caches.match('./index.html'))
      )
  );
});
