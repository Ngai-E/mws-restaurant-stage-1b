let restaurant;
var newMap;
let reviews;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
  DBHelper.serviceWorkerRegistration();
});



/**
 * Initialize leaflet map
 */
initMap = () => {
  
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
      console.log()
    }
  });
}  
 

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = "restaurant photo";

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  createFormHTML();

  fetchReviews();
  


}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

// create reviews form

/**
 * Create all reviews HTML and add them to the webpage.
 */

 console.log()
  fillReviewsHTML = (reviews = self.reviews) => {
  console.log(reviews);
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);


  const date = document.createElement('p');
  let reviewDate = new Date(review.updatedAt);
  date.innerHTML = reviewDate.toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  const deleteButton  = document.createElement('button');
  deleteButton.setAttribute('class', 'delete');
  deleteButton.innerHTML = 'delete';
  deleteButton.addEventListener('click', (event) =>{
    //remove review from database
    deleteReview(review.id, event.target);
  })
 li.appendChild(deleteButton);

  return li;
}


//creating the form for reviews
createFormHTML = (id = self.restaurant.id) => {
  const container = document.getElementById('reviews-container');
  const form = document.createElement('div');
  form.innerHTML = `<form method="POST" id="submit" name="reviewForm" style="max-width: 100%;">
                      <input type="hidden" name="Restaurant_id" value="${id}"><br>
                      <div style="width: 25%" class = "forminput">
                        <label style="color: #666" for="name">Name: </label>
                        <input class="form-input" type="text" name="name" required> 
                      </div>
                      <div class="forminput" style="width: 25%">
                        <label style="color: #666" for="ratings">Ratings</label>
                        <input type="number" class="form-input" name="ratings" min="1" max="5" required> 
                      </div>
                      <br>
                      <div style="width: 25%" class = "forminput">
                        <label style="color: #666" for="comments">comment: </label>
                        <textarea class="form-input"  placeholder="enter comment here" name="comments" required></textarea> 
                      </div>
                      <div style="width: 25%" class = "forminput">
                        <button type="submit" class="buttonReview" >Add Review</button>
                      </div>
                    </form>`;
    
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitForm();
  })
  
   // console.log(form.innerHTML);

  container.appendChild(form);
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}



function submitForm(){


    //validate form first TODO

      let form = document.forms['reviewForm'];
      let restaurant_id = form['Restaurant_id'].value;
      let name = form['name'].value;
      let rating = form['ratings'].value;
      let comments = form['comments'].value;

      console.log(restaurant_id,name,rating,comments)

      postReview({
                            "restaurant_id": restaurant_id,
                            "name": name,
                            "rating": rating,
                            "comments": comments
                            }
                          );

      //add review to page

  
}

//fetch the reviews for this form
function fetchReviews(restaurant = self.restaurant){
  fetch(`http://localhost:1337/reviews/?restaurant_id=${restaurant.id}`)
  .then(response => {
    return response.json();
  })
  .then(data => {
    //console.log(data);
    self.reviews = data;
    // fill reviews
    fillReviewsHTML();
  })
  .catch(e => {
    console.log(`an error occured with code ${e}`)
  })
}

//delete particular review
function deleteReview(id, target){

  fetch(`http://localhost:1337/reviews/${id}`, {method: 'DELETE'})
  .then(response => {
    return response.json();
  })
  .then(data => {
    console.log(data);
    //self.reviews = data;
    target.parentNode.parentNode.removeChild(target.parentNode);
  })
  .catch(e => {
    console.log(`an error occured with code ${e}`)
  })
}

//store reviews data
    function postReview(data){

      //check if user is online

      fetch("http://localhost:1337/reviews/",
             { 
              method: 'post',
              headers: { "Content-type": "application/JSON; charset=UTF-8" },
              body: JSON.stringify(data)
             }) 
      .then(json => {return json.json()}) 
      .then(function (data) {
       console.log('Request succeeded with JSON response', data); 
       let arrayData = [];
       arrayData.push(data)
       fillReviewsHTML(arrayData);
      })
      .catch(function (error) { console.log('Request failed', error); });
    }