 let cache_name = 'static-cache3';
 let urlsToCache = [
 					'./',
 					'index.html',
 					'css/styles.css',
 					'css/responsive.css',
 					'js/dbhelper.js',
 					'js/main.js',
 					'js/restaurant_info.js',
					'https:unpkg.com/leaflet@1.3.1/dist/leaflet.js',
					'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css'
 				];

 /*listening for an install event to cache the sites*/
 self.addEventListener('install', function(event) {
 	event.waitUntil(
 		caches.open(cache_name) /*opening static app cache*/
 		.then(function(cache) {
 			return cache.addAll(urlsToCache);  /* add static files to cache for faster load after first visit*/
 		})
 	);
 });

/* delete old caches when new service worker is activating*/
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(allcaches) {
      return Promise.all(
        allcaches.filter(function(cacheName) {
          	return cacheName != cache_name;
          
        }).map(function(cacheName) {
        	//console.log(`trying to delete ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

 /*when a fetch event is triggered, check from cache first */
 self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(cache_name).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        return response || fetchPromise;
      })
    })
  );
});

/* function fetchAndCache(url){

 		return fetch(url)
 				.then(function(response){
 					//check if response is valid
 					if(response.status != 200)
 						throw Error(response.statusText);
 					return caches.open(cache_name)
 							.then(function(cache){
 								cache.put(url, response.clone()); //put the response in cache
 								return response;
 							});
 				})
 				.catch(function(error){
 					console.log("request failed with error: ", error);
 				})

 }*/
/*self.addEventListener('fetch', function(event){
	console.log(event.request.url);
});*/