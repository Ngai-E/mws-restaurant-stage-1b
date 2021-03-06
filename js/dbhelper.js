

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {

    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;    
  }

  /**
 *service worker registration
 */
 static serviceWorkerRegistration() {
  //check if service worker is supported in browser
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('serviceWorker.js', {scope: "/"}) /*register the service worker*/
    .then(function(registration) {
    console.log(`successfull registration of service worker with scope ${registration.scope}`);
    })
    .catch(function(error) {
    console.log('Registration failed: ', error);
    });
  }

  //not supported
  else 
    console.log("service worker not supported");
 }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    let dbPromise = DBHelper.openDB(); //open the restaurant indexedDB

    return dbPromise.then(function(db){

      var index = db.transaction('restaurant')
      .objectStore('restaurant').index('id');

      return index.getAll().then(restaurants => {

        //read the restaurant from the database if already stored
        if(restaurants.length > 0){
         //console.log('reading from database');
          callback(null, restaurants);
        }

        else{
            //fetch the json data and store if the page is loading for the first time
           return fetch(DBHelper.DATABASE_URL)
          .then(response => {
            return response.json();
          })
          .then(restaurants => {
            callback(null, restaurants);
            DBHelper.storeJSON(restaurants);  //store the restaurant details.
          })
          .catch(e => {
            callback(`Request failed. Returned status of ${e}`, null);
          })
        }
        
      }).catch(e => {
        callback(`Request failed. Returned status of ${e}`, null);
      });
    });

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { //Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.hasOwnProperty('photograph'))
      return (`/img/${restaurant.photograph}.jpg`);
    else
      return (`/img/${restaurant.id}.jpg`)

  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 


  static openDB(){
      //skip creating indexedDB if service worker is not supported
    console.log('inside indexedDB code');
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      }

    let dbPromise = idb.open('restaurant-db', 2, function(upgradeDb) {
        switch(upgradeDb.oldVersion){
          case 0:
            let store = upgradeDb.createObjectStore('restaurant', {
              keyPath: 'id'
            });
            store.createIndex('id', 'id');
        case 1: 
        ;
        }
        
      });
        return dbPromise;
    }

     // storing restaurant data
    static storeJSON(data) {
      // body...
      //console.log('in restaurant')
      let dbPromise = DBHelper.openDB();
      dbPromise.then(function(db)
        {
          let tx = db.transaction('restaurant', 'readwrite');
          let store = tx.objectStore('restaurant');
          data.forEach(function(restaurant){
            store.put(restaurant);
          }); 
        });
      

    }

     static openDBReviews(){
      //skip creating indexedDB if service worker is not supported
    //console.log('inside indexedDB code');
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      }

    let dbPromise = idb.open('reviewsDB', 1, function(upgradeDb) {
        switch(upgradeDb.oldVersion){
          case 0:
            let store = upgradeDb.createObjectStore('reviewsOffline', {
              keyPath: 'updatedAt'
            });
            store.createIndex('By-restaurantID', 'restaurant_id');
           
            store.createIndex('By-date', 'updatedAt');
            store = upgradeDb.createObjectStore('reviews', {
              keyPath: 'updatedAt'
            });

          store.createIndex('By-restaurantID', 'restaurant_id');
          case 1: ;
        }
        
      });
        return dbPromise;
    }

     // storing reviews data
    static storeReviews(data) {
      // body...
    
      let dbPromise = DBHelper.openDBReviews();
      dbPromise.then(function(db)
        {
          let tx = db.transaction('reviews', 'readwrite');
          let store = tx.objectStore('reviews');
          data.forEach(function(review){
            store.put(review);
          }); 

        // //only keep first 30 reviews offline
        // store.index('By-date').openCursor(null, 'prev').then(function(cursor){
        //   return cursor.advance(30);
        // }).then(function deleteRest(cursor){
        //   if(!cursor) return;
        //   cursor.delete();
        //   return cursor.continue().then(deleteRest);
        // })
      });
      

    }

    static fetchReviews(id,callback) {

    let dbPromise = DBHelper.openDBReviews(); //open the reviews indexedDB

    return dbPromise.then(function(db){

      var index = db.transaction('reviews')
      .objectStore('reviews').index('By-restaurantID');

      return index.getAll(id).then(reviews => {

        //read the reviews from the database if already stored
        if(reviews.length > 0){
         //console.log('reading from database');
          callback(null, reviews);
        }

        else{
            //fetch the json data and store if the page is loading for the first time
           return fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`)
          .then(response => {
            return response.json();
          })
          .then(reviews => {
            callback(null, reviews);
            DBHelper.storeReviews(reviews);  //store the restaurant details.
          })
          .catch(e => {
            callback(`Request failed. Returned status of ${e}`, null);
          })
        }
        
      }).catch(e => {
        callback(`Request failed. Returned status of ${e}`, null);
      });
    });

   

  }

    //update the restaurant especially if favorite changed
    static updateRestaurant(data, key){
      let dbPromise = DBHelper.openDB();
      dbPromise.then(function(db) {
          var tx = db.transaction('restaurant', 'readwrite');
          var store = tx.objectStore('restaurant');
          store.put(data);
          return tx.complete;
        }).then(function() {
          console.log('item updated!');
      });
    }

    static deleteOfflineReviews(key){
     let dbPromise = DBHelper.openDBReviews();
      dbPromise.then(function(db) {
        var tx = db.transaction('reviewsOffline', 'readwrite');
        var store = tx.objectStore('reviewsOffline');
        store.delete(key);
        return tx.complete;
      }).then(function() {
        console.log('Item deleted');
      });
    }


 // offline storing of reviews
    static storeReviewsoffline(data) {
      // body...
    
      let dbPromise = DBHelper.openDBReviews();
      dbPromise.then(function(db)
        {
          let tx = db.transaction('reviewsOffline', 'readwrite');
          let store = tx.objectStore('reviewsOffline');
          data.forEach(function(review){
            store.put(review);
          }); 

        // //only keep first 30 reviews offline
        // store.index('By-date').openCursor(null, 'prev').then(function(cursor){
        //   return cursor.advance(30);
        // }).then(function deleteRest(cursor){
        //   if(!cursor) return;
        //   cursor.delete();
        //   return cursor.continue().then(deleteRest);
        // })
        return 1;
      });
      

    }

    //offline database
    static fetchReviewsOffline(callback) {

    let dbPromise = DBHelper.openDBReviews(); //open the reviews indexedDB

    return dbPromise.then(function(db){

      var index = db.transaction('reviewsOffline')
      .objectStore('reviewsOffline').index('By-restaurantID');

      return index.getAll().then(reviews => {
        //read the reviews from the database if already stored
        if(reviews.length > 0){
         //console.log('reading from database');
          callback(null, reviews);
        }


        else{
            console.log('everything up to date');   //no review was done offline
            callback(null, []);
        }
        
      }).catch(e => {
        callback(`Request failed. Returned status of ${e}`, null);
      });
    });

   

  }

//delete items reviews
  static deleteReviews(key){
     let dbPromise = DBHelper.openDBReviews();
      dbPromise.then(function(db) {
        var tx = db.transaction('reviews', 'readwrite');
        var store = tx.objectStore('reviews');
        store.delete(key);
        return tx.complete;
      }).then(function() {
        console.log('Item deleted');
      });
    }

}