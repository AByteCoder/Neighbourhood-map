// foursquare api details
const foursquare = {
  id : "TRXK51Z4CZ4KTSD4G23S0SUKUG2EZT2Z1N4GMM3WFVGHXAWL",
  secret:"Y50G1EUWD5J1LHF3WWTEE2GXAU3MMTKUGV0NBLNDZALXHXQ5"
};
//view model
var viewModel;
//foursquare api base url
const foursquareUrl = "https://api.foursquare.com/v2/venues/";
//foursquare api authentication part
const keyUrl = ("client_id=" + foursquare.id + "&client_secret="
+ foursquare.secret + "&v=20180302&limit=1");
// default center location
const bengaluru = {lat: 12.909973, lng:77.572646};
// will contain all the locations
var locations = [];
// google map api object
var map;
// current blinking marker
var cmarker = null;
// google map geocoder
var geocoder;
/**
* @description Represents a location
* @constructor
* @param {string} name - Name of the location
* @param {string} address - The full address of the location
*/
function Location(name, address) {
  this.name = name;
  this.address = address;
  this.marker = null
  // latitude of the location set to initial default
  this.lat = ko.observable(bengaluru.lat);
  // longitude of the location set to initial default
  this.lng = ko.observable(bengaluru.lng);
  // used to help in display extra info about location using foursquare api
  this.extraInfo = ko.observable({});
  // function invoked when user clicks on the location in the list
  this.showInfo = function() {
    // close the side nav
    document.getElementById('nav-box').cheked = false;
    // center the map to the current location
    if(cmarker !=null)
    cmarker.setAnimation(null)
    map.setCenter({lat:this.lat(),lng:this.lng()});
    // check if infowindow is already created for this location
  if(this.infowindow == undefined)
  {
        var infowindow = new google.maps.InfoWindow({
      content: ('<h4>' + this.name + '</h4><p>'+this.address+'</p>'
      + '<button onclick="moreInfo(event)" class="info-button" data-name="'
      + this.name +'">More Info</button>')
      });
      this.infowindow = infowindow;
  }
  this.marker.setAnimation(google.maps.Animation.BOUNCE)
  cmarker = this.marker
  // show the info window
  this.infowindow.open(map,this.marker);
}.bind(this);
}

// called when more info button clicked in infowindow
function moreInfo(e){
  var b = $(e.target);
  var name = b.attr('data-name');
  console.log(name)
  for(var i = 0; i < locations.length; i++)
  if(locations[i].name == name)
  break;
  var loc = locations[i];
  viewModel.showMoreInfo(true);
  viewModel.showLoader(true);
  viewModel.showData(false);
  viewModel.errorMsg(false);
  $.ajax({
    url : foursquareUrl + "search?ll=" + loc.lat() + "," + loc.lng() +"&intent=checkin&query=" + loc.name + "s&"+keyUrl,
    dataType: "json",
    method:"GET",
    processData :false,
    success: function(result){
      $.ajax({
        url : foursquareUrl + result.response.venues[0].id +"?" +keyUrl,
        dataType: "json",
        method:"GET",
        processData :false,
        success: function(result){
          var venue = result.response.venue;
          viewModel.contactText(venue.contact.phone);
          viewModel.likes(venue.likes.count);
          var photos = [];
          for(var i = 0; i < venue.photos.groups.length; i++)
          {
            var items = venue.photos.groups[i].items;
            for(var j = 0; j < items.length; j++)
            {
              var item = items[j];
              photos.push(item.prefix + "500x500" + item.suffix);
            }
          }
          viewModel.name(loc.name);
          viewModel.address(loc.address);
          viewModel.pics(photos);
          viewModel.ratings(venue.rating);
          viewModel.shortUrl(venue.shortUrl);
          viewModel.picNo(1);
          viewModel.facebook("https://facebook.com/profile.php?id="
          + venue.contact.facebook);
          viewModel.showLoader(false);
          viewModel.showData(true);
        },
        error:function(xhr,status){
          viewModel.showLoader(false);
          viewModel.errorMsg(true);
          $('#retry-button').attr('data-name',loc.name);
        }
      })
    },
    error:function(xhr,status){
      viewModel.showLoader(false);
      viewModel.errorMsg(true);
      $('#retry-button').attr('data-name',loc.name);
      console.log($('#retry-button').attr('data-name'))
    }
  })
}


/**
* @description Represents a location view model we use for the app
* @constructor
*/
function LocationViewModel() {
  // the search string
  this.locationString = ko.observable('');
  //trigger to show more info
  this.showMoreInfo = ko.observable(false);
  //picture url's for slideshows
  this.pics = ko.observableArray(["https://farm3.static.flickr.com/2561/5718401452_7357205305_b.jpg","https://i2.wp.com/media.hungryforever.com/wp-content/uploads/2015/06/Featured-image-meghana-biriyani.jpg?w=1269&strip=all&quality=80"]);
  // current picture position
  this.picNo = ko.observable(1);
  // close button
  this.closeExtra = function(){
    this.showMoreInfo(false)
  }
  // show loader
  this.showLoader = ko.observable(true);
  //show ui
  this.showData = ko.observable(false);
  // show error msg
  this.errorMsg = ko.observable(false);
  // facebook url
  this.facebook = ko.observable("https://facebook.com/profile.php?id=144613672271319")
  // current image in slideshow
  this.currentImage = ko.computed(function(){
    return this.pics()[this.picNo() - 1]
  },this);
  // visiblity of left arrow
  this.leftArrowVisible = ko.computed(function(){
    return this.picNo() > 1
  },this);
  // visiblity of right arrow
  this.rightArrowVisible = ko.computed(function(){
    return this.picNo() < this.pics().length
  },this);
  // left arrow click
  this.leftArrowClick = function(){
    this.picNo(this.picNo() - 1);
  }.bind(this);
  // slideshow information
  this.statusText = ko.computed(function(){
    return this.picNo()+"/"+this.pics().length;
  },this);
  // right arrow click
  this.rightArrowClick = function(){
    this.picNo(this.picNo() + 1);
  }
  // likes for the location
  this.likes = ko.observable(10);
  // rating for the location
  this.ratings = ko.observable(9.2);
  // contact info
  this.contactText = ko.observable("+911234567890");
  this.contactLink = ko.computed(function(){
    return "tel:" + this.contactText()
  },this);
  // short foursquare url
  this.shortUrl = ko.observable("https://www.google.com/")
  // name of the location
  this.name = ko.observable(locations[0].name)
  // address of the location
  this.address = ko.observable(locations[0].address)
  // locations after matching all locations with the location string
  this.filterList = ko.computed(function(){
          // trim and transform the string to lower case
          var s = this.locationString().trim().toLowerCase();
          // build a regular expression
          var r = RegExp(s);
          // remove all previous visible markers in the map
          for(var i = 0; i < locations.length; i++){
            if( locations[i].marker != null )
            locations[i].marker.setMap(null);
          }
          var li =  locations.filter(function(loc,index){
            if ( s == 0 )
            {
              // if the location string is empty display all the locations
              var marker = new google.maps.Marker({
                position: {lat:loc.lat(),lng:loc.lng()},
                map: map
              });
                loc.marker = marker;

                marker.setAnimation(null);
                marker.addListener('click',loc.showInfo);
                return true;
            }else {
              // test if the location string matches with name of the location
              var bool = r.test(loc.name.toLowerCase());
              if(bool){
                // draw the marketr in the map
                var marker = new google.maps.Marker({
                  position: {lat:loc.lat(),lng:loc.lng()},
                  map: map
                });
                marker.setAnimation(null);
                loc.marker = marker;
                marker.addListener('click',loc.showInfo);
              }
          }
          return bool;
        })
        // set the center of the map to the first location
        if( li.length > 0){
            map.setCenter({lat:li[0].lat(),lng:li[0].lng()});
            li[0].marker.setAnimation(google.maps.Animation.BOUNCE);
            cmarker = li[0].marker;
        }
        return li;
      },this);
}

function initMap() {
  // called by the google map api
  map = new google.maps.Map(document.getElementById('map-section'), {
    zoom: 20,
    center: bengaluru
  });

  $(document).ready(function(){
    geocoder = new google.maps.Geocoder()
    // initialize defualt locations
    locations.push(new Location('Meghana Foods',
    '52, 1st Floor, 33rd Cross, 4th Block, Near Cafe Coffee Day, Jaya Nagar, Bengaluru, Karnataka 560011'));
    locations.push(new Location('Taaza Thindi','1005, 26th Main Rd, 4th T Block East, Jayanagara 9th Block, Jayanagar, Bengaluru, Karnataka 560041'))
    locations.push(new Location('Vidyarthi Bhavan','32, Gandhi Bazaar Main Rd, Gandhi Bazaar, Basavanagudi, Bengaluru, Karnataka 560004'))
    locations.push(new Location('JW Kitchen','JW Marriott Bengaluru, 24/1, Vittal Mallya Rd, Ashok Nagar, Bengaluru, Karnataka 560001'))
    locations.push(new Location('Karavalli',' Ground Floor,The Gateway Hotel, #66, Residency Road, Bengaluru, Karnataka 560025'))
    locations.push(new Location('La Brasserie Restaurant','28, Hotel Le Meridien, Sankeys Road, Bengaluru, Karnataka 560052'))
    locations.push(new Location('Persian Terrace',' 26/1, 4th Floor, Sheeraton Grand Bangalore Hotel at Brigade Gateway, Dr. Rajkumar Road, Malleswaram-Rajajinagar, Bengaluru, Karnataka 560055'))
    locations.map(function(l){
      // for each location to be displayed find the actual lattitude and longitude
      // using google geocoder api
      geocoder.geocode( { 'address': l.address}, function(results, status) {
        if (status == 'OK') {
          l.lat(results[0].geometry.location.lat());
          l.lng(results[0].geometry.location.lng());
        } else {
          alert('Geocode was not successful for the following reason: ' + status);
        }
      });
    })
    viewModel = new LocationViewModel()
    // bind the view model to the knockout js
    ko.applyBindings(viewModel);
  })
}
