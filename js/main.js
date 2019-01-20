let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

let isFavorite;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.serviceWorkerRegistration();
  initMap(); // added  
  fetchNeighborhoods();
  fetchCuisines();
  
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}



/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoibmdhaWFzb2JpIiwiYSI6ImNqbGh3dHFwbjFocnUzdW5qcDhsdGhvMmUifQ.F69Fhgo7scqMjha1iHQWhg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}


/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

  /**
 * Lazy loading images
 */
lazyLoadImage = () => {
  let lazyImages = [].slice.call(document.querySelectorAll("img.restaurant-img"));
  //console.log(document.querySelectorAll(".restaurant-img"));
  let active = false;
  //console.dir(lazyImages);
  if ("IntersectionObserver" in window) {
    //console.log('found');
    //console.log(` images are ${lazyImages}`);
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
         // lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove("lazy");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Possibly fall back to a more compatible method here
    const lazyLoad = function() {
    if (active === false) {
      active = true;

      setTimeout(function() {
        lazyImages.forEach(function(lazyImage) {
          if ((lazyImage.getBoundingClientRect().top <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0) && getComputedStyle(lazyImage).display !== "none") {
            //console.log(lazyImage.data-src);
            lazyImage.src = lazyImage.dataset.src;
            //lazyImage.srcset = lazyImage.dataset.srcset;
            lazyImage.classList.remove("lazy");

            lazyImages = lazyImages.filter(function(image) {
              return image !== lazyImage;
            });

            if (lazyImages.length === 0) {
              document.removeEventListener("scroll", lazyLoad);
              window.removeEventListener("resize", lazyLoad);
              window.removeEventListener("orientationchange", lazyLoad);
            }
          }
        });

        active = false;
      }, 200);
    }
  };

  document.addEventListener("scroll", lazyLoad);
  window.addEventListener("resize", lazyLoad);
  window.addEventListener("orientationchange", lazyLoad);
  
}//end else

}
/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  //console.log(document.querySelectorAll('img.restaurant-img'))
  lazyLoadImage();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  //image.src = "img/icons-192.png";
  image.src = "";
  image.setAttribute("data-src", DBHelper.imageUrlForRestaurant(restaurant));
  //image.src = DBHelper.imageUrlForRestaurant(restaurant);
  //console.log(image.getAttribute('className'));
  image.setAttribute("alt", `${restaurant.name} Restaurant`);
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  //adding feature for marking as favorite
  const favorite = document.createElement('div');
  favorite.setAttribute('class', 'favorite');
  const star = document.createElement('span');   
  star.setAttribute('id', `star${restaurant.id}`);

  //initialize the favorite
  isFavorite = restaurant.is_favorite;

  if(isFavorite === 'true'){
    console.log(isFavorite);
    star.setAttribute('class', 'fa fa-star checked');
    star.innerHTML = ` &nbsp UNFAVORITE`
  }

  else {
    console.log(isFavorite)
    star.setAttribute('class', 'fa fa-star');
    star.innerHTML = `&nbsp  ADD AS FAVORITE`
  }
 
  favorite.append(star);

 // console.log(restaurant.is_favorite)
  favorite.addEventListener('click', (event) =>{
    //console.log(restaurant.id)
    //alert(restaurant.id)
    processFavorite(restaurant.id);
    
  })
 // li.append('<br>')
  li.append(favorite)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 


//favorite or unfavorite a restaurant
function processFavorite(id){
  
  //favorite the restaurant
  if(isFavorite === 'false'){
   // console.log(self.restaurants[id-1].is_favorite)
    self.restaurants[id-1].is_favorite = 'true';
    DBHelper.updateRestaurant(self.restaurants[id-1], id-1);
    fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=true`,
             { 
              method: 'PUT',
             }) 
      .then(json => {return json.json()}) 
      .then(function (data) {
      // console.log('Request succeeded with JSON response', data); 
       //do something when it is succeeded like toggling the like star
        //toggleClass(`star${id}`, 'checked');
        document.getElementById(`star${id}`).style.color = 'orange';
        document.getElementById(`star${id}`).innerHTML = '&nbsp &nbsp &nbsp UNFAVORITE';

       isFavorite = 'true';
      })
      .catch(function (error) { console.log('Request failed', error); });
  }

  //unfavorite the restaurant
  else {
   // console.log(self.restaurants[id-1].is_favorite)
    self.restaurants[id-1].is_favorite = 'false';
    DBHelper.updateRestaurant(self.restaurants[id-1], id-1);
     fetch(`http://localhost:1337/restaurants/${id}/?is_favorite=false`,
             { 
              method: 'PUT',
             }) 
      .then(json => {return json.json()}) 
      .then(function (data) {
      // console.log('Request succeeded with JSON response', data); 
       //do something when it is succeeded like toggling the like star
        //toggleClass(`star${id}`, 'checked');
        document.getElementById(`star${id}`).style.color = '#333';
        document.getElementById(`star${id}`).innerHTML = '&nbsp  ADD AS FAVORITE';
       isFavorite = 'false';
      })
      .catch(function (error) { console.log('Request failed', error); });
  }

  
}


function toggleClass(id, classNam){
  var element = document.getElementById(id);

  if (element.classList) { 
    element.classList.toggle(classNam);
  } else {
    // For IE9
    var classes = element.className.split(" ");
    var i = classes.indexOf(classNam);

    if (i >= 0) 
      classes.splice(i, 1);
    else 
      classes.push(classNam);
      element.className = classes.join(" "); 
  }
}
