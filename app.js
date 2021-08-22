const client_id = "45d081854dd645af9ace7d813d3f7ae4";
const redirect_uri = "http://127.0.0.1:5500/mainpage.html";
const scopes = "user-read-email user-read-private playlist-read-private playlist-read-collaborative playlist-modify-private";
const AUTH_URL = "https://accounts.spotify.com/authorize" + 
    "?client_id=" + client_id + 
    "&response_type=token" + 
    "&redirect_uri=" + encodeURI(redirect_uri) + 
    "&show_dialog=true"  +
    "&scope=" + encodeURIComponent(scopes);
let userHash = window.location.hash;
let accessToken;
let unique_id_counter = 0;
// let trackMap = new Map();
// let uniqueCardsMap = new Map();

const MAX_AUDIO_FEATURE_LIMIT = 99;

let allTracks = new Array(); //this 2D array holds all of the tracks displayed on screen holds arrays of track information
let playlistMap = new Map();
let filteredTracks = new Array();
let addedTracks = new Array();


//to work on
/*
create a panel to show what songs have selected and allow the user to remove tracks from there
OR
check if song is in addedTracks array and then make it selected :) i like this idea more
*/



/*
//allTracks visualization example
3 Tracks
[TrackMap, TrackMap, TrackMap]
Track Map visualization
["dataMap" : dataMap, "trackIDs" : idMap]
*/

//PARAMETERS
let SEARCH_ITEM = "&searchItem=";
let SEARCH_OPTION = "&searchOption=";

//on each page load, check if user is logged into spotify account. If not, have them log in
window.onload = function(){
    checkLoggedIn(1);
    checkParameters();
}

function keyTranscriber(tempKey){
    switch(Number(tempKey)){
        case 0:
            tempKey = "C"
            break;
        case 1:
            tempKey = "C#"
            break;
        case 2:
            tempKey = "D"
            break;
        case 3:
            tempKey = "D#"
            break;
        case 4:
            tempKey = "E"
            break;
        case 5:
            tempKey = "F"
            break;
        case 6:
            tempKey = "F#"
            break;
        case 7:
            tempKey = "G"
            break;
        case 8:
            tempKey = "G#"
            break;
        case 9:
            tempKey = "A"
            break;
        case 10:
            tempKey = "A#"
            break;
        case 11:
            tempKey = "B"
            break; 
        default: tempKey = "err";
    }

    return tempKey;
}

function deepCopy(obj) {
  
    if (null === obj || 'object' !== typeof obj) return obj;
      
    switch (obj.constructor) {
      case Boolean:
        return new Boolean(obj);
      case Number:
        return new Number(obj);
      case String:
        return new String(obj);
      case Date:
        return new Date().setTime(obj.getTime());
      case Array:
        return obj.map((o) => deepCopy1(o));
      case RegExp:
        return new RegExp(obj);
      case BigInt:
        return BigInt(obj);
      case Object: {
        let copy = {};
        Object.keys(obj).forEach((key) => {
          if (obj.hasOwnProperty(key)) copy[key] = deepCopy1(obj[key]);
        });
        return copy;
      }
    }
    return obj;
}


//check if user presses the enter key while the focused on the search bar
document.addEventListener("keyup", function(event){
    let element = document.getElementById("search-input");
    if (event.code === "Enter" && element === document.activeElement){
       changePage(2);
    }
});
function menuDropDown(){
    let state = document.getElementById("menu-bars-id").className;
    let contentState = document.getElementById("menu-content-id").className;
    //menu is not showing, show
    if (state === "menu-bars-active"){
        //document.getElementById("menu-content-id").style.display = "inline-block";
        //page just loaded and we do not want to execute animation on content
        if (contentState === "menu-content-hide-first"){
            document.getElementById("menu-content-id").classList.remove("menu-content-hide-first");
        }else{
            document.getElementById("menu-content-id").classList.remove("menu-content-hide");    
        }
        document.getElementById("menu-content-id").classList.add("menu-content-show");
        document.getElementById("menu-bars-id").classList.remove("menu-bars-active");
        document.getElementById("menu-bars-id").classList.add("menu-bars-inactive");
    }

    //menu is showing, hide
    else if (state === "menu-bars-inactive"){
        //document.getElementById("menu-content-id").style.display = "none";
        document.getElementById("menu-content-id").classList.remove("menu-content-show");
        document.getElementById("menu-content-id").classList.add("menu-content-hide");
        document.getElementById("menu-bars-id").classList.remove("menu-bars-inactive");
        document.getElementById("menu-bars-id").classList.add("menu-bars-active");
    }
}

function changePage(page){
    //not on search result page
    if (page != 2){
        userHash = removeHashParameter(SEARCH_ITEM, userHash);
        userHash = removeHashParameter(SEARCH_OPTION, userHash);
    }


    let url = "";
    let change = true;
    //home page
    if (page == 0){
        url = "/mainpage.html#" + userHash;
    }
    //profile page
    else if (page == 1){
        url = "/profile.html#" + userHash;
    }
    //search result page
    else if (page == 2){
        let key = document.getElementById("search-input").value;
        let option = document.getElementById("select-ID").value; //retrieve what criteria to search by
        url = "/result.html#" + userHash + SEARCH_ITEM + key + SEARCH_OPTION + option;
    }
    else if (page == 3){
        url = "/halt.html#";
    }
    else{
        change = false;
        confirm("Error changing to page '" + page + "'");
    }
    //acceptable page to change to, make switch
    if (change){
        window.location.assign(url);
    }


}

function checkLoggedIn(order = 0){
    if (order == 1){
        if (!location.href.includes("halt")){
            //user does not have access token, meaning not logged in
            if (!location.href.includes("access_token=")){
                location.href = "/halt.html";
            }
        }
        //get access token
        if (window.location.hash){
            accessToken = window.location.hash.substring(14, window.location.hash.indexOf("&"));
        }
    }else {
        if (window.location.hash){
            return true;
        }else{ 
            return false;
        }
    }

}
function authorize(){

    window.location = AUTH_URL;
    // //user denied login
    if (location.href.includes("error=access_denied")){
        location.href = "/halt.html";
    }
}

function checkParameters(){
    userHash = window.location.hash.substring(1); //cuts out the '#'
    //GET PARAMETERS OF HASH BY KEY AND VALUE 
    let params = {};
    userHash.split('&').map(key =>{
        let temp = key.split('=');
        params[temp[0]] = temp[1];
    })
    //check if a search is being made
    if (location.href.includes("result.html")){
        addSortFilterEL();
        checkFilterSelected(); //needed to hide the filter slider right off the bat
        let val = decodeURI(params.searchItem);
        let option = params.searchOption;
        document.getElementById("searching-for-query-id").innerText = val.toUpperCase();
        doSearch(val,option);
    }
    else if (location.href.includes("profile.html")){
        addSortFilterEL();
        checkFilterSelected(); //needed to hide the filter slider right off the bat
        doUserDetails();
    }
}
function changePlayPauseBtn(id, uaid, uacid, href){
    let state = document.body.querySelector("#"+id).className;
    let component = document.body.querySelector("#"+id); 
    let contComp = document.body.querySelector("#"+uacid);
    //let audioComp = document.body.querySelector("#"+uaid);
    if (state === "play-button"){
        component.classList.remove("play-button");
        component.classList.add("pause-button");
        component.classList.add("audio-playing");
        //add audio element to track, have to do this on demand because otherwise a large playlist will max out audio element cap in browsers
        const TEMPLATE = `
            <audio src="${href}" id="${uaid}">Your browser does not support the audio tag.</audio>
        `;
        contComp.innerHTML += TEMPLATE;
        component.src = "/resources/pausebutton.svg";
        document.body.querySelector("#"+uaid).play();
    }
    //state === pause-button
    else{
        component.classList.remove("pause-button");
        component.classList.remove("audio-playing");
        component.classList.add("play-button");
        component.src = "/resources/playbutton.svg";
        document.body.querySelector("#"+uaid).pause(); //remove the html with the audio element
        contComp.innerHTML = "";
    }
}
/*
TO-DO: 
* make sure that user does not include & or = in their search
* show amnt of tracks in currently shown playlist
*/
//IMPORTANT! "parameter" must include the & and the = symbols
function removeHashParameter(parameter, hash){
    let ndx;
    let size = hash.length;
    //erase item search parameter
    if ((ndx = hash.search(parameter)) !== -1){
        for (let i = ndx + 6; i < size; i++){
            //there are more parameters so find where item value ends
            if (hash[i] === "&"){
                let strToDelete = hash.substring(ndx, i);
                hash = hash.replace(strToDelete, "");
                break;
            }
            else{
                //there are no further URL parameters
                if (i == size -1){
                    let strToDelete = hash.substr(ndx);
                    hash = hash.replace(strToDelete, "");
                }
            }
        }
    }
    //hash parameter not found
    if (ndx == -1) {
        //confirm("Error: parameter not found");
    }
    return hash;
}


//                      TRACK ANALYSIS/FEATURES
function showTrackAnalysis(ucid, uiid){
    let state = document.getElementById(uiid).className;
    //data is showing, hide it; arrow is showing up, point down
    if (state === "info-card-show"){
        document.getElementById(uiid).classList.remove("info-card-show");
        document.getElementById(uiid).classList.add("info-card-hide");
        document.getElementById(ucid).classList.remove("card-svg-up-class");
        document.getElementById(ucid).classList.add("card-svg-down-class");
    }
    //data is not showing, show it; arrow is pointing down, point up
    else{
        document.getElementById(uiid).classList.remove("info-card-hide");
        document.getElementById(uiid).classList.add("info-card-show");    
        document.getElementById(ucid).classList.remove("card-svg-down-class");
        document.getElementById(ucid).classList.add("card-svg-up-class");  
    }
}
async function fetchTrackFeatures(idString){
    //GET AUDIO FEATURES
    let audioFeatureURL = "https://api.spotify.com/v1/audio-features?ids=" + idString;
    let response = await fetch(audioFeatureURL,{
        method: "GET",
        headers:{
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken
        }
    });
    if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
    let featureData = await response.json();
    return featureData;    
}
//idString: list of ids to append to 'Get Audio Features for Several Tracks' endpoint call
async function handleMusicFeatures(idString, ndxCheckPoint){
    //GET FEATURES OF THE TRACK
    let featureDataJSON = await fetchTrackFeatures(idString).catch(error =>{ 
        if (error.message.includes("401")){
            confirm('Token has timed out. Please log back in');
            changePage(3);
        }else{
            confirm('There has been a problem with your fetch operation: ' + error.message);
        }
    });
    if (featureDataJSON.error){
        if (featureDataJSON.error.status === 401){
            confirm("TOKEN TIMED OUT. PLEASE AUTHENTICATE AGAN");
            logout();
        }else{
            confirm("other error encountered")
        }
    }

    for (let i = ndxCheckPoint, dataNDX = 0; i < allTracks.length; ++i, ++dataNDX){
        let currDataMap = allTracks[dataNDX].get("dataMap");
        let tempKey = "err";
        //transcribe the key and assign it
        tempKey = featureDataJSON.audio_features[dataNDX].key;
        tempKey = keyTranscriber(tempKey);
        if (featureDataJSON.audio_features[dataNDX].mode == 1){
            tempKey += " major";
        }else if (featureDataJSON.audio_features[dataNDX].mode == 0){
            tempKey += " minor";
        }
        currDataMap.set("key",              tempKey);
        currDataMap.set("danceability",     (featureDataJSON.audio_features[dataNDX].danceability * 100).toFixed(2));
        currDataMap.set("energy",           (featureDataJSON.audio_features[dataNDX].energy * 100).toFixed(2));
        currDataMap.set("loudness",         (60 - parseFloat( featureDataJSON.audio_features[dataNDX].loudness) * -1).toFixed(2));
        currDataMap.set("speechiness",      (featureDataJSON.audio_features[dataNDX].speechiness * 100).toFixed(2));
        currDataMap.set("acousticness",     (featureDataJSON.audio_features[dataNDX].acousticness * 100).toFixed(2).toString());
        currDataMap.set("instrumentalness", (featureDataJSON.audio_features[dataNDX].instrumentalness * 100).toFixed(2));
        currDataMap.set("liveness",         (featureDataJSON.audio_features[dataNDX].liveness * 100).toFixed(2));
        currDataMap.set("valence",          (featureDataJSON.audio_features[dataNDX].valence * 100).toFixed(2));
        currDataMap.set("tempo",            (featureDataJSON.audio_features[dataNDX].tempo).toFixed(0));
        currDataMap.set("time_signature",   (featureDataJSON.audio_features[dataNDX].time_signature));
    }
}

//                      SEARCHING
async function fetchTorP(url){
    let response = await fetch(url, 
        {
            method: "GET",
            headers:{
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        });
    if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
    let result = await response.json();
    return result;
}
async function doSearch(val, option){

    if (val === ""){
        alert("Search is empty!");
    }else{

        val = "\""+ val + "\"";
        let market = "&market=from_token";
        let type = "&type=track";
        let limit = "&limit=5";
        url = "https://api.spotify.com/v1/search?q=";
        //append track: to exclusively search track titles
        if (option === "SongStrict"){
            url += "track:";
        }else if (option === "Playlist"){
            type = "&type=playlist";
        }
        url += val + type + limit + market;
        let data = await fetchTorP(url).catch(error =>{

            if (error.message.includes("401")){
                confirm('Token has timed out. Please log back in');
                changePage(3);
            }else{
                confirm('There has been a problem with your fetch operation: ' + error.message);
            }
        });
        //PLAYLIST OPTION!!!!!
        if (option === "Playlist"){
            if (data.playlists.items[0] == null){
                alert("No results found");
            }else{                
                let playlistIDCounter = 0;
                data.playlists.items.forEach(playlist=>{
                    let currPlaylistMap = new Map();
                    //if the playlist has a period in it then it breaks the templating so remove periods
                    currPlaylistMap.set("name", playlist.name);
                    currPlaylistMap.set("albumIMG", playlist.images[0].url);
                    currPlaylistMap.set("trackHREF", playlist.tracks.href);
                    let tempID = "playlist-id" + playlistIDCounter;
                    //console.log("PLAYLIST NAME: " + playlist.name + "\nby: " + playlist.owner.display_name);
                    const TEMPLATE = `            
                        <div class = "playlist-item-class" id ="${tempID}">
                            ${currPlaylistMap.get("name")}
                            <img src="${currPlaylistMap.get("albumIMG")}" alt="album image" class = "album-img-class">
                        </div>`;
                    playlistIDCounter++;
                    document.body.querySelector(".carousel-wrapper").innerHTML += TEMPLATE;
                    playlistMap.set(tempID, currPlaylistMap);
                });
                $(document).ready(function(){
                    $('.carousel-wrapper').slick({
                        centerMode: true,
                        centerPadding: '40px',
                        slidesToShow: 3,
                        variableWidth: true,
                        adaptiveHeight: true,
                        infinite: false
                    });
                    //assinging event listeners to carousel arrow
                    addPlaylistArrowEL();
                    //get track analytics and display to screen
                    doPlaylistTrackDetails();
                })
            }
        }
        //TRACK OPTIONS!!!!!!!!!!
        else{
            //no result from search found
            if (data.tracks.items[0] == null){
                alert("No Result found");
            }else{
                
                //console.log(JSON.stringify(data, null , 2));

                data.tracks.items.forEach(async function(key){
                    
                    let dataMap = new Map();
                    //dataStr = key.name + ", by ";
                    let artists = "";
                    key.artists.forEach(function(key2){
                        artists += key2.name + ", ";
                    });
                    artists = artists.substr(0, artists.length - 2);
                    dataMap.set("artists", artists);

                    //get the id of the track
                    dataMap.set("name", key.name);
                    dataMap.set("uri", key.uri.replace("spotify:track:", ""));
                    dataMap.set("id", key.id);
                    
                    //get and set the duration of the track
                    let tempDurationMin = (parseInt((parseFloat(key.duration_ms) / 1000) / 60)).toString();
                    let tempDurationSeconds = ((Math.round((parseFloat(key.duration_ms) / 1000) % 60)*100)/ 100).toString()
                    if (parseInt(tempDurationSeconds) < 10){tempDurationSeconds = "0"+tempDurationSeconds;}
                    dataMap.set("duration", tempDurationMin + ":" + tempDurationSeconds);
                    dataMap.set("durationMS", key.duration_ms);

                    //dataMap.set("duration", (Math.round(parseFloat(dataMap.get("duration")))).toString());
                    dataMap.set("popularity", key.popularity);
                    
                    

                    let currentTrackMap = new Map();
                    currentTrackMap.set("dataMap", dataMap);
                    allTracks.push(currentTrackMap);
                });
                //GET FEATURES FOR ALL TRACKS
                let idString = ""
                let idCounter = 0;
                let ndxCheckPoint = 0; //holds the ndx of the last track that had audio features fetched for it

                for (let i = 0; i < allTracks.length; ++i){
                    idString += allTracks[i].get("dataMap").get("id") + "%2C"; //the %2C adds commas
                    idCounter++;

                    if (idCounter == MAX_AUDIO_FEATURE_LIMIT){
                        idString = idString.substr(0, idString.length - 3); //cut out the trailing comma from end
                        await handleMusicFeatures(idString, ndxCheckPoint);
                        idString = "";
                        ndxCheckPoint = idCounter; //update ndx of last track that had audio features fetched
                        idCounter = 0;
                    }
                    //amnt of tracks are below request limit
                    else if (idCounter == allTracks.length){
                        idString = idString.substr(0, idString.length - 3); //cut out the trailing comma from end
                        await handleMusicFeatures(idString, ndxCheckPoint); 
                    }
                }

                allTracks.forEach(track=>{
                    //DYNAMICALLY CREATE THE HTML FOR EACH TRACK                    
                    createTrackHTML(track.get("dataMap"), true); 
                });
            }
        }
    }
}
//                      PLAYLISTS
async function fetchPlaylistTracks(playlistURL){
    //the "+ "?market=US"" is because of country permissions and music company licensing 
    //GET PLAYLIST'S TRACKS
    let response = await fetch(playlistURL + "?market=US", {
        method: "GET",
        headers:{
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken
        }
    });
    if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
    let result = await response.json();
    return result;
}
function addPlaylistArrowEL(){
    //set a click event listener to each of the arrow buttons so that that playlists songs can be displayed
    let all = document.body.querySelectorAll(".slick-arrow");
    all.forEach(x =>{
        x.addEventListener("click", function(){
            //clear currently displaying tracks
            document.body.querySelector(".playlist-tracks").innerHTML = "";
            allTracks.splice(0, allTracks.length); //any existing items of the array will be previous playlist's tracks so remove
            //get playlists tracks and get their features
            doPlaylistTrackDetails();
        })
    })
}
async function fetchUserPlaylists(url){
    let response = await fetch(url, 
        {
            method: "GET",
            headers:{
                "Content-Type": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        });
    if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
    const json = await response.json();
    return json;
}
//                      PROFILE DETAILS
async function fetchProfileDetails(){
    let response = await fetch("https://api.spotify.com/v1/me", 
    {
        method: "GET",
        headers:{
            "Authorization": "Bearer " + accessToken
        }
    })
    if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`);}
    let result = await response.json();
    document.getElementById("profile-name-id").innerHTML = result.display_name;
    document.getElementById("profile-link-id").setAttribute("href", result.external_urls.spotify);
    document.getElementById("profile-link-id").setAttribute("target", "_blank"); //open to new tab
    if (result.images[0] != null){
        document.getElementById("user-img-id").setAttribute("src", result.images[0].url);
        document.getElementById("profile-picture-div-id").classList.remove("profile-picture-blank");
        document.getElementById("profile-picture-div-id").classList.add("profile-picture-custom");
    }
    document.getElementById("user-name-id").innerHTML += " " + result.id;
    document.getElementById("email-id").innerHTML += " " + result.email;
    document.getElementById("follower-count-id").innerHTML += " " + result.followers.total;
    return result;

}
async function doUserDetails(){
        
    //GET CURRENT USER'S PROFILE DETAILS
    await fetchProfileDetails();

    //                         ----- GET CURRENT USER'S PLAYLISTS -----
    let limit = "limit=50";
    let url = "https://api.spotify.com/v1/me/playlists?" + limit;
    let userPlaylistJSON = await fetchUserPlaylists(url).catch(error =>{
        if (error.message.includes("401")){
            confirm('Token has timed out. Please log back in');
            changePage(3);
        }else{
            confirm('There has been a problem with your fetch operation: ' + error.message);
        }    })

    //console.log(JSON.stringify(userPlaylistJSON, null, 2));

    //GET EACH PLAYLIST'S TRACKS
    let playlistIDCounter = 0; 
    userPlaylistJSON.items.forEach(item=>{
        let currPlaylistMap = new Map();
        currPlaylistMap.set("name", item.name);
        currPlaylistMap.set("albumIMG", item.images[0].url);
        currPlaylistMap.set("trackHREF", item.tracks.href);
        //dynamically add the playlist html
        let tempID = "playlist-id" + playlistIDCounter;
        //console.log("PLAYLIST NAME: " + playlist.name + "\nby: " + playlist.owner.display_name);
        const TEMPLATE = `            
            <div class = "playlist-item-class" id ="${tempID}">
                ${currPlaylistMap.get("name")}
                <img src="${currPlaylistMap.get("albumIMG")}" alt="album image" class = "album-img-class">
            </div>`;
        playlistIDCounter++;
        document.body.querySelector(".carousel-wrapper").innerHTML += TEMPLATE;
        playlistMap.set(tempID, currPlaylistMap);
    });
    //let playlistName = "BONK";
    $(document).ready(function(){
        $('.carousel-wrapper').slick({
            centerMode: true,
            centerPadding: '40px',
            slidesToShow: 3,
            variableWidth: true,
            adaptiveHeight: true,
            infinite: false
        })
        //assinging event listeners to carousel arrow
        addPlaylistArrowEL();
        //get track analytics and display to screen
        doPlaylistTrackDetails();

    })
}
async function doPlaylistTrackDetails(){
    let playlistID = document.body.querySelector(".slick-current").id;
    let playlistTracksJSON = await fetchPlaylistTracks(playlistMap.get(playlistID).get("trackHREF")).catch(error =>{
        if (error.message.includes("401")){
            confirm('Token has timed out. Please log back in');
            changePage(3);
        }else{
            confirm('There has been a problem with your fetch operation: ' + error.message);
        }    })
    //console.log(JSON.stringify(playlistTracksJSON, null, 2));
    playlistTracksJSON.items.forEach(async function(item){
        //console.log(JSON.stringify(item, null, 2));
        let dataMap = new Map();
        let artists = "";
        item.track.album.artists.forEach(function(key2){
            artists += key2.name + ", ";
        });
        artists = artists.substr(0, artists.length - 2);
        dataMap.set("artists", artists);            
        dataMap.set("name", item.track.name);
        dataMap.set("previewURL", item.track.preview_url);
        //get the id of the track
        //dataMap.set("uri", item.track.uri.replace("spotify:track:", ""));
        dataMap.set("id", item.track.id);
        dataMap.set("albumHREF", item.track.album.images[0].url);
        //get and set the duration of the track
        
        let tempDurationMin = (parseInt((parseFloat(item.track.duration_ms) / 1000) / 60)).toString();
        let tempDurationSeconds = ((Math.round((parseFloat(item.track.duration_ms) / 1000) % 60)*100)/ 100).toString()
        if (parseInt(tempDurationSeconds) < 10){tempDurationSeconds = "0"+tempDurationSeconds;}
        dataMap.set("duration", tempDurationMin + ":" + tempDurationSeconds);
        dataMap.set("durationMS", item.track.duration_ms);
        dataMap.set("popularity", item.track.popularity);

        let currentTrackMap = new Map();
        currentTrackMap.set("dataMap", dataMap);
        allTracks.push(currentTrackMap);
    });
    //GET FEATURES FOR ALL TRACKS
    let idString = ""
    let idCounter = 0;
    let ndxCheckPoint = 0; //holds the ndx of the last track that had audio features fetched for it

    for (let i = 0; i < allTracks.length; ++i){
        idString += allTracks[i].get("dataMap").get("id") + "%2C"; //the %2C adds commas
        idCounter++;

        if (idCounter == MAX_AUDIO_FEATURE_LIMIT){
            idString = idString.substr(0, idString.length - 3); //cut out the trailing comma from end
            await handleMusicFeatures(idString, ndxCheckPoint);
            idString = "";
            ndxCheckPoint = idCounter; //update ndx of last track that had audio features fetched
            idCounter = 0;
        }
        //amnt of tracks are below request limit
        else if (idCounter == allTracks.length){
            idString = idString.substr(0, idString.length - 3); //cut out the trailing comma from end
            await handleMusicFeatures(idString, ndxCheckPoint); 
        }
    }
    //DYNAMICALLY CREATE THE CARD HTML FOR EACH TRACK
    allTracks.forEach(track=>{
        //DYNAMICALLY CREATE THE HTML FOR EACH TRACK                    
        createTrackHTML(track.get("dataMap"), false); 
    });

}

function createTrackHTML(dataMap, embed = false){

    let ucid = "card-svg-id" + unique_id_counter;
    let uiid = "info-card-id" + unique_id_counter;
    let ppid = "play-pause-btn-id" + unique_id_counter;
    let uaid = "audio-id" + unique_id_counter;
    let uacid = "audio-cont-id" + unique_id_counter;
    let utid = "unique-track-id" + unique_id_counter;
    let utbid = "unique-track-button-id" + unique_id_counter;
    let uitbid = "unique-inner-track-button-id" + unique_id_counter;

    let insert = ``;
    if (embed){
        insert = `
        <div class="track-card-container track-only-option">
            <iframe src="https://open.spotify.com/embed/track/${dataMap.get("uri")}" width="420" height="80" frameborder="0" allowtransparency="true" title="spotify embed"></iframe>
            <div class="track-arrow-img">
                <img src="resources/down-arrow2.svg" alt="down arrow svg" class="card-svg-down-class" id="${ucid}">
            </div>
        </div>`;
    }else{
        insert = `
            <div class="track-card-container playlist-option">
                <div class="album-img-container">
                    <img src="${dataMap.get("albumHREF")}"  alt="album img" class = "album-img" id = "album-img-id">
                    <img src="/resources/playbutton.svg" alt="play button" class = "play-button" id = "${ppid}">
                    <div class = "audio-container", id = "${uacid}"></div>
                </div>
                <div class = "track-and-artist">
                    <div class = "track-name">
                        ${dataMap.get("name").toUpperCase()}
                    </div>
                    <div class = "artist-name">
                        ${dataMap.get("artists")}
                    </div>
                </div>
                <div class="track-arrow-img">
                    <img src="resources/down-arrow2.svg" alt="down arrow svg" class="card-svg-down-class" id="${ucid}">
                </div>
            </div>
        `;        
    }
    const TEMPLATE = 
    `
    <div class = "track-wrapper" id = "${utid}">

        <div class = "track-select-btn track-select-btn-outer" id = "${utbid}">
            <div class = "track-select-btn-inner " id= "${uitbid}">
            </div>
        </div>

        ${insert}
        <div class="info-card-hide" id="${uiid}">
        
            <div class="info-top-data">
                <p class = "duration-class">Duration: ${dataMap.get("duration")}</p>
                <p class = "tempo-class">Tempo: ${dataMap.get("tempo")}</p>
                <p class = "key-class"> Key: ${dataMap.get("key")}</p>
                <p class = "time-sig-class">Time Sig: ${dataMap.get("time_signature")}</p>
            </div>
        <div class="analysis-grid">
            <div class="danceability">danceability</div>
            <div class="energy">energy</div>
            <div class="loudness">loudness</div>
            <div class="skill-bar-container">
                <div class="skills-bar-text dance-bar" style="width: ${parseFloat(dataMap.get("danceability")) + "%"};">${dataMap.get("danceability")}</div>
            </div>
            <div class="skill-bar-container">
                <div class="skills-bar-text energy-bar" style="width: ${dataMap.get("energy") + "%"};">${dataMap.get("energy")}</div>
            </div>
            <div class="skill-bar-container">
                <div class="skills-bar-text loudness-bar" style="width: ${dataMap.get("loudness") + "%"};">${dataMap.get("loudness")}</div>
            </div>
            <div class="speechiness">speechiness</div>
            <div class="popularity">popularity</div>
            <div class="acousticness">acousticness</div>
            <div class="skill-bar-container">
                <div class="skills-bar-text speech-bar" style="width: ${dataMap.get("speechiness") + "%"};">${dataMap.get("speechiness")}</div>
            </div>
            <div class="skill-bar-container">
                <div class="skills-bar-text popularity-bar" style="width: ${dataMap.get("popularity")+ "%"};">${dataMap.get("popularity")}</div>
            </div>
            <div class="skill-bar-container">
                <div class="skills-bar-text acoustic-bar" style="width: ${dataMap.get("acousticness") + "%"};">${dataMap.get("acousticness")}</div>
            </div>
            <div class="instrumentalness">instrumentalness</div>
            <div class="liveness">liveness</div>
            <div class="valence">valence</div>
            <div class="skill-bar-container">
                <div class="skills-bar-text instrument-bar" style="width: ${dataMap.get("instrumentalness") + "%"};">${dataMap.get("instrumentalness")}</div>
            </div>
            <div class="skill-bar-container">
                <div class="skills-bar-text liveness-bar" style="width: ${dataMap.get("liveness")+ "%"};">${dataMap.get("liveness")} </div>
            </div>
            <div class="skill-bar-container">
                <div class="skills-bar-text valence-bar" style="width: ${dataMap.get("valence")+ "%"};">${dataMap.get("valence")}</div>
            </div>
        </div>
    </div>
    `;

        document.body.querySelector(".playlist-tracks").innerHTML += TEMPLATE;
        dataMap.set("ucid", ucid);
        dataMap.set("uiid", uiid);
        dataMap.set("utid", utid);
        dataMap.set("uitbid", uitbid);
        //no embedding so it means custom track appearance
        if (!embed){
            dataMap.set("ppid", ppid);
            dataMap.set("uaid", uaid);
            dataMap.set("uacid", uacid);
            //dataMap.set("href", dataMap.get("previewURL"));
            //dataMap.set(ucid, dataMap); //THIS IS A GLOBAL MAP HOLDING DATA ABOUT EACH TRACK TO DYNAMICALLY CREATE ANALYSIS GRID ON THE SPOT
        }
        //idMap.set(utid, tempMap);

        //ADD EVENT LISTENERS TO TRACK ARROWS
        $(document).ready(function(){
            //assign event listener to the play and pause button for each track
            if (!embed){
                document.body.querySelector("#"+ppid).addEventListener("click", function(){
                    changePlayPauseBtn(ppid, uaid, uacid, dataMap.get("previewURL")); //pass the unique element id of the play/pause btn and audio id
                });
            }

            document.body.querySelector("#"+ucid).addEventListener("click", function(){
                showTrackAnalysis(ucid, uiid);
            });
            document.body.querySelector("#"+utbid).addEventListener("click", function(){
                trackBtnSelected(utbid, uitbid);
            });
        })
        unique_id_counter += 1;
}

//                   SORTING AND FILTERING
function checkFilterSelected(){
    //filter was last clicked so now none or sort is selected so hide filter range
    //filtershow is defaulted to false because none is default selected
    let selected = document.getElementsByName("s-or-f");
    let option = "err";
    selected.forEach(btn=>{
        if (btn.checked){
            option = btn.value;
        }
    })

    //if key is disabled from property list, enable it
    if (document.body.querySelector(".property-option-id").hasAttribute("disabled")){
        let items = document.body.querySelectorAll(".property-option-id");
        items.forEach( item =>{
            item.removeAttribute("disabled");
        })
    }

    //hide visuals related to filtering
    if (option === "none" || option === "sort"){
        document.querySelector(".filter-range-div").style.display = "none";
        document.querySelector(".sort-filter-container").classList.remove("filter-range-show");
        //display ascending or descending option
        if (option === "sort"){
            document.querySelector(".ascending-descending-container").style.display = "block";
            //disable key option
            let items = document.body.querySelectorAll(".property-option-id");
            items.forEach( item =>{
                item.setAttribute("disabled", "disabled");
            })
            document.querySelector(".sort-filter-container").classList.add("ascend-descend-show");

        }else{
            document.querySelector(".ascending-descending-container").style.display = "none";
            document.querySelector(".sort-filter-container").classList.remove("ascend-descend-show");
        }
    }else{
        
        if (document.querySelector(".sort-filter-container").classList.contains("ascend-descend-show")){
            document.querySelector(".sort-filter-container").classList.remove("ascend-descend-show");
            document.querySelector(".ascending-descending-container").style.display = "none";
        }
        
        //find out what property is selected and create slider accordingly, then add to html
        let slider = document.querySelector("#property-slider-id");
        let sliderSpan = document.querySelector("#slider-text-id");
        let minSpan = document.querySelector("#slider-min-id");
        let maxSpan = document.querySelector("#slider-max-id");

        let property = document.querySelector("#property-select-id").value;
        let max = min = 0;
        //find the shortest and the greatest duration
        document.body.querySelector("#greater-less-than-id").removeAttribute("disabled"); //in case a list was previously set
        switch(property){
            case "key":
                max = 11;
                min = 0;
                document.body.querySelector("#slider-text-id").innerHTML = "C";
                document.body.querySelector("#greater-less-than-id").setAttribute("disabled", "disabled");
                document.body.querySelector("#property-slider-id").max = max;
                document.body.querySelector("#property-slider-id").min = min;
                break;
            case "timeSig":

                let tempSet = new Set();
                allTracks.forEach(item=>{
                    tempSet.add(Number(item.get("dataMap").get("time_signature")));
                });
                console.log(tempSet);
                max = Math.max(...tempSet); //... means entries
                min = Math.min(...tempSet);

                document.body.querySelector("#property-slider-id").max = max;
                document.body.querySelector("#property-slider-id").min = min;
                document.body.querySelector("#greater-less-than-id").setAttribute("disabled", "disabled");
                break;
            case "duration":
                max = 0;
                //get duration of longest track
                allTracks.forEach(item =>{
                    let durationVal = item.get("dataMap").get("duration").replace(":", "");
                    if (durationVal > max){
                        max = durationVal;
                    }
                })
                let seconds = max.substring(max.length - 2);
                let minutes = max.substring(0, max.length - 2);
                let temp = max;
                max = (minutes * 60000) + (seconds * 1000); //storing max in milliseconds
                document.body.querySelector("#property-slider-id").max = max;
                max = temp;
                max = [max.slice(0, max.length- 2), ":", max.slice(max.length - 2)].join(''); //place the : back into the string
                break;
            case "tempo":
                max = 0;
                min = 0;
                allTracks.forEach(item =>{
                    let tempoVal = item.get("dataMap").get("tempo");

                    if (Number(tempoVal) > Number(max)){
                        max = tempoVal;
                    }
                })
                document.body.querySelector("#property-slider-id").max = max;
                break;
            case "loudness":
                max = 60;
                min = 0;
                document.body.querySelector("#property-slider-id").max = 60;
                break;
            default: 
                max = 100;
                min = 0;
                document.body.querySelector("#property-slider-id").max = 100;
                document.body.querySelector("#property-slider-id").min = 0;
            ;
        }
        //innerText is set when handling key because its a special case
        if (property != "key"){
            sliderSpan.innerText = slider.value;
        }
        slider.oninput = function(){
            if (property === "duration"){
                document.body.querySelector("#property-slider-id").step = 60;
                //convert milliseconds to mm:ss format
                let tempDurationMin = Math.floor(((this.value / 1000) / 60)).toString();
                let tempDurationSeconds = (Math.floor((this.value / 1000)) % 60).toString();
                if (tempDurationSeconds < 10){
                    tempDurationSeconds = "0" + tempDurationSeconds
                }
                let test = tempDurationMin + ":" + tempDurationSeconds;
                sliderSpan.innerText = test;
                //sliderSpan.innerText = [this.value.slice(0, this.value.length- 2), ":", this.value.slice(this.value.length - 2)].join('');
            }
            else{
                document.body.querySelector("#property-slider-id").step = 1;
                if (property === "key"){
                    let temp = this.value;
                    temp = keyTranscriber(temp);
                    sliderSpan.innerText = temp;
                }else{
                    sliderSpan.innerText = this.value;

                }
            }
        }
        maxSpan.innerText = max;
        minSpan.innerText = min;
        document.querySelector(".filter-range-div").style.display = "grid";
        document.querySelector(".sort-filter-container").classList.add("filter-range-show");
    }
}
//add event listeners to radio btns
function addSortFilterEL(){
    document.querySelector("#none-radio-btn").addEventListener("click", function(){
        checkFilterSelected();
    });
    document.querySelector("#sort-radio-btn").addEventListener("click", function(){
        checkFilterSelected();
    });
    document.querySelector("#filter-radio-btn").addEventListener("click", function(){
        checkFilterSelected();
    });
    document.querySelector(".track-properties-list").addEventListener("click", function(){
        checkFilterSelected();
    });
}
function sortOrFilterSubmit(){
    let x = document.getElementsByName("s-or-f");
    let selected = "err";
    x.forEach(btn =>{
        if (btn.checked){
            selected = btn.value;
        }
    })
    let property = document.querySelector("#property-select-id").value;

    if (selected === "filter"){

        let filterOrder = document.body.querySelector("#greater-less-than-id").value;
        let targetValue = document.body.querySelector("#slider-text-id").innerText;
        //convert target value to ms if property == duration
        if (property == "duration" || property =="durationMS"){
            property = "durationMS";
            let tempSecs = Number(targetValue.substring(targetValue.length - 2));
            let tempMins = targetValue.substring(0, targetValue.length - 3);
            targetValue =Number((tempMins * 60000) + (tempSecs * 1000));
        }else if (property == "timeSig"){
            property = "time_signature";
        }
        //make sure filtered tracks array is empty
        filteredTracks.splice(0, filteredTracks.length);
        for (let i = 0; i < allTracks.length; ++i){
            
            if (property == "time_signature" || property == "key"){
                let val = allTracks[i].get("dataMap").get(property);
                if (property == "key"){
                    val = val.split(' ');
                    //key will be in the first ndx;
                    val = val[0];
                    console.log(val);
                }
                if (val == targetValue){
                    filteredTracks.push(allTracks[i]);       
                }
            }else{
                if (filterOrder === "greater-than"){
                    if (Number(allTracks[i].get("dataMap").get(property)) >= targetValue){
                        filteredTracks.push(allTracks[i]);
                    }
                }else if (filterOrder === "less-than"){
                    if (Number(allTracks[i].get("dataMap").get(property)) <= targetValue){
                        filteredTracks.push(allTracks[i]);
                    }
                }else{
                    confirm("ERROR IN FILTERING ORDER");
                }
            }
        }
        //clear shown tracks to display results 
        document.body.querySelector(".playlist-tracks").innerHTML = "";
        for (let j = 0; j < filteredTracks.length; ++j){
            createTrackHTML(filteredTracks[j].get("dataMap"), filteredTracks[j].get("dataMap").has("uri")? true : false);
        }
    }
    //create an array and sort only the tracks in the innerhtml of the playlist-tracks class
    else if (selected === "sort"){
        //not valid options
        if (property == "key" || property == "timeSig"){
            return;
        }
        let direction = document.querySelector("#ascending-descending-wrapper-id").value;
        switch(property){
            case "duration":
                property = "durationMS";
                break;
        }
        let tracksOnScreen = new Array();
        let curTracks = document.body.querySelectorAll(".track-wrapper");
        
        curTracks.forEach(currItem =>{
            allTracks.forEach(allTItem =>{
                if (currItem.id == allTItem.get("dataMap").get("utid")){
                    tracksOnScreen.push(allTItem);
                }
            });   
        });

        if (direction === "ascending"){
            tracksOnScreen.sort(function(a, b){return a.get("dataMap").get(property) - b.get("dataMap").get(property)})

        }else if (direction === "descending"){
            tracksOnScreen.sort(function(a, b){return b.get("dataMap").get(property) - a.get("dataMap").get(property)});
        }else{
            confirm("ERROR with sorting direction");
        }
        document.body.querySelector(".playlist-tracks").innerHTML = ""; //clear the results to prepare for updating
        for (let i = 0; i < tracksOnScreen.length; ++i){
            createTrackHTML(tracksOnScreen[i].get("dataMap"), tracksOnScreen[i].get("dataMap").has("uri")? true : false);
        }
    }
    //NONE is selected
    else{
        document.body.querySelector(".playlist-tracks").innerHTML = "";

        for (let i = 0; i < allTracks.length; ++i){
            createTrackHTML(allTracks[i].get("dataMap"), allTracks[i].get("dataMap").has("uri")? true : false);
        }
    } 
}
function foldPropDefs(){
    //show property definitions
    if (document.body.querySelector("#property-definitions-id").style.display === "none"){
        document.body.querySelector("#property-definitions-id").style.display = "block";
        document.body.querySelector("#property-def-arrow-id").classList.add("property-def-arrow-up");
        document.body.querySelector("#property-def-arrow-id").classList.remove("property-def-arrow-down");

    }
    //hide property definitions
    else{
        document.body.querySelector("#property-definitions-id").style.display = "none";
        document.body.querySelector("#property-def-arrow-id").classList.add("property-def-arrow-down");
        document.body.querySelector("#property-def-arrow-id").classList.remove("property-def-arrow-up");
    }
}
function trackBtnSelected(utbid, uitbid){

    

    if (document.body.querySelector("#"+uitbid).classList.contains("track-select-btn-selected")){
        document.body.querySelector("#"+uitbid).classList.remove("track-select-btn-selected");
        document.body.querySelector(".amnt-tracks-selected-count").innerText =  Number(document.body.querySelector(".amnt-tracks-selected-count").innerText) - 1;
        for (let i = 0; i < addedTracks.length; ++i){
            if (uitbid == addedTracks[i].get("dataMap").get("uitbid")){
                addedTracks.splice(i,1); //remove the entry from the array
                break;
            }
        }
 

    }else{
        document.body.querySelector(".amnt-tracks-selected-count").innerText = 1 + Number(document.body.querySelector(".amnt-tracks-selected-count").innerText);
        document.body.querySelector("#"+uitbid).classList.add("track-select-btn-selected");  
        
        for (let i = 0; i < allTracks.length; ++i){
            if (uitbid == allTracks[i].get("dataMap").get("uitbid")){
                addedTracks.push(allTracks[i]); //add the entry to the array
                break;
            }
        }
    }
}
function createPlaylist(){
    console.log("CREATE PLAYLIST");

    console.log(addedTracks);
    //add addedTracks items to new playlist
}
function addToPlaylist(){
    console.log("ADD TO PLAYLIST");


    console.log(addedTracks);
    //add addedTracks items to new playlist
}
