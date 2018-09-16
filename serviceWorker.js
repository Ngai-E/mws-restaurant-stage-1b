let cache_name = 'static-cache';
let urlsToCache = [
'/',
'index.html',
'css/styles.css',
'css/responsive.css',
'js/dbhelper.js',
'js/main.js',
'js/restaurant_info.js'
];

//listening for an install event to cache the sites
self.addEventListener('install', function(event) {
event.waitUntil(
caches.open(cache_name)
.then(function(cache) {
return cache.addAll(urlsToCache);
})
);
});