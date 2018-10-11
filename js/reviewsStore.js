
class restaurantDB {

	static openDB(){
	  	//skip creating indexedDB if service worker is not supported
		console.log('inside indexedDB code');
		  if (!navigator.serviceWorker) {
		    return Promise.resolve();
		  }

		let dbPromise = idb.open('restaurant-db', 1, function(upgradeDb) {
		  	switch(upgradeDb.oldVersion){
		  		case 0:
			  		let store = upgradeDb.createObjectStore('restaurant', {
			      	keyPath: 'id'
				    });
				    store.createIndex('id', 'id');
		  	}
		    
			});
			  return dbPromise;
	  }

	   // storing restaurant data
	  static storeJSON(data) {
	  	// body...
	  	console.log('in restaurant')
	  	let dbPromise = restaurantDB.openDB();
	  	dbPromise.then(function(db)
	  		{
		  		let tx = db.transaction('restaurant', 'readwrite');
			  	let store = tx.objectStore('restaurant');
			  	data.forEach(function(restaurant){
			  		store.put(restaurant);
			  	});	
	  		});
	  	

	  }
}