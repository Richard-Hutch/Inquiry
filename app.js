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
let playlistMap = new Map();
let trackMap = new Map();
let uniqueCardsMap = new Map();

//PARAMETERS
let SEARCH_ITEM = "&searchItem=";
let SEARCH_OPTION = "&searchOption=";

//on each page load, check if user is logged into spotify account. If not, have them log in
window.onload = function(){
    checkLoggedIn(1);
    checkParameters();
}



//check if user presses the enter key while the focused on the search bar
document.addEventListener("keyup", function(event){
    let element = document.getElementById("search-input");
    if (event.code === "Enter" && element === document.activeElement){
       changePage(2);
    }
});

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
        let val = decodeURI(params.searchItem);
        let option = params.searchOption;
        document.getElementById("searching-for-query-id").innerText = val.toUpperCase();
        doSearch(val,option);
    }
    else if (location.href.includes("profile.html")){
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
* round the values of music analysis to just two decimal places and put val out of, ex: .55/1
*/


async function showTrackAnalysis(ucid, uiid, dataMap){
    let state = document.getElementById(uiid).className;
    let comp = document.querySelector("#"+uiid);
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
        
        
        //GET FEATURES OF THE TRACK
        //dont make a request if a request for this track has already been made before
        featureData = await fetchTrackFeatures(dataMap).catch(error =>{
            confirm('There has been a problem with your fetch operation: ' + error.message);
        });

        //transcribe the key and assign it
        let tempKey = "err";
        switch(featureData.key){
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
        }
        //check if key is major or minor
        if (featureData.mode == 1){
            tempKey += " major";
        }else if (featureData.mode == 0){
            tempKey += " minor";
        }
        dataMap.set("key",              tempKey);
        dataMap.set("danceability",     featureData.danceability);
        dataMap.set("energy",           featureData.energy);
        dataMap.set("loudness",         featureData.loudness);
        dataMap.set("speechiness",      featureData.speechiness);
        dataMap.set("acousticness",     featureData.acousticness);
        dataMap.set("instrumentalness", featureData.instrumentalness);
        dataMap.set("liveness",         featureData.liveness);
        dataMap.set("valence",          featureData.valence);
        dataMap.set("tempo",            featureData.tempo);
        dataMap.set("time_signature",   featureData.time_signature);
        
        console.log(dataMap.get("energy"));
        const TEMPLATE = `
            <div class="info-top-data">
                <p>Duration: ${dataMap.get("duration")}</p>
                <p>Tempo: ${(Math.round(parseFloat(dataMap.get("tempo")))).toString()}</p>
                <p> Key: ${dataMap.get("key")}</p>
                <p>Time Sig: ${dataMap.get("time_signature")}</p>
            </div>
            <div class="analysis-grid">
                <div class="danceability">danceability</div>
                <div class="energy">energy</div>
                <div class="loudness">loudness</div>
                <div class="skill-bar-container">
                    <div class="skills-bar-text dance-bar" style="width: ${(parseFloat(dataMap.get("danceability")) * 100).toString() + "%"};">${(dataMap.get("danceability") * 100).toFixed(2)}</div>
                </div>
                <div class="skill-bar-container">
                    <div class="skills-bar-text energy-bar" style="width: ${(parseFloat(dataMap.get("energy")) * 100).toFixed(2).toString() + "%"};">${(dataMap.get("energy") * 100).toFixed(2)}</div>
                </div>
                <div class="skill-bar-container">
                    <div class="skills-bar-text loudness-bar" style="width: ${((60 - (parseFloat(dataMap.get("loudness")) * -1)) / 60 * 100).toString() + "%"};">${(60 - parseFloat(dataMap.get("loudness")) * -1).toFixed(2)}</div>
                </div>
                <div class="speechiness">speechiness</div>
                <div class="popularity">popularity</div>
                <div class="acousticness">acousticness</div>
                <div class="skill-bar-container">
                    <div class="skills-bar-text speech-bar" style="width: ${(parseFloat(dataMap.get("speechiness")) * 100).toString() + "%"};">${(dataMap.get("speechiness") * 100).toFixed(2)}</div>
                </div>
                <div class="skill-bar-container">
                    <div class="skills-bar-text popularity-bar" style="width: ${dataMap.get("popularity")+ "%"};">${dataMap.get("popularity")}</div>
                </div>
                <div class="skill-bar-container">
                    <div class="skills-bar-text acoustic-bar" style="width: ${(parseFloat(dataMap.get("acousticness")) * 100).toString() + "%"};">${(dataMap.get("acousticness") * 100).toFixed(2).toString()}</div>
                </div>
                <div class="instrumentalness">instrumentalness</div>
                <div class="liveness">liveness</div>
                <div class="valence">valence</div>
                <div class="skill-bar-container">
                    <div class="skills-bar-text instrument-bar" style="width: ${(parseFloat(dataMap.get("instrumentalness")) * 100).toString() + "%"};">${(dataMap.get("instrumentalness") * 100).toFixed(2)}</div>
                </div>
                <div class="skill-bar-container">
                    <div class="skills-bar-text liveness-bar" style="width: ${(parseFloat(dataMap.get("liveness")) * 100).toString() + "%"};">${(dataMap.get("liveness") * 100).toFixed(2)} </div>
                </div>
                <div class="skill-bar-container">
                    <div class="skills-bar-text valence-bar" style="width: ${(parseFloat(dataMap.get("valence")) * 100).toString() + "%"};">${(dataMap.get("valence") * 100).toFixed(2)}</div>
                </div>
            </div>
        `;
        comp.innerHTML = TEMPLATE;
    }
}
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
async function fetchTrackFeatures(dataMap){
    //GET AUDIO FEATURES
    let audioFeatureURL = "https://api.spotify.com/v1/audio-features/" + dataMap.get("id");
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
            confirm('There has been a problem with your fetch operation: ' + error.message);
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
                    dataMap.set("popularity", key.popularity);
                            //GET FEATURES OF THE TRACK
                    let featureData = await fetchTrackFeatures(dataMap).catch(error =>{
                        confirm('There has been a problem with your fetch operation: ' + error.message);
                    });

                    if (featureData.error){
                        if (featureData.error.status === 401){
                            console.log("error 401");
                            logout();
                        }
                    }
                    //console.log(JSON.stringify(featureData, null , 2));
                    //transcribe the key and assign it
                    let tempKey = "err";
                    switch(featureData.key){
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
                    }
                    //check if key is major or minor
                    if (featureData.mode == 1){
                        tempKey += " major";
                    }else if (featureData.mode == 0){
                        tempKey += " minor";
                    }
                    dataMap.set("key",              tempKey);
                    dataMap.set("danceability",     featureData.danceability);
                    dataMap.set("energy",           featureData.energy);
                    dataMap.set("loudness",         featureData.loudness);
                    dataMap.set("speechiness",      featureData.speechiness);
                    dataMap.set("acousticness",     featureData.acousticness);
                    dataMap.set("instrumentalness", featureData.instrumentalness);
                    dataMap.set("liveness",         featureData.liveness);
                    dataMap.set("valence",          featureData.valence);
                    dataMap.set("tempo",            featureData.tempo);
                    dataMap.set("time_signature",   featureData.time_signature);
                    //DYNAMICALLY CREATE THE HTML FOR EACH TRACK
                    createTrackHTML(dataMap, true); 
                    if (uniqueCardsMap.size !== 0){
                        uniqueCardsMap.forEach(function(v, k){
                            document.body.querySelector("#"+k).addEventListener("click", function(){
                                showTrackAnalysis(k,v);
                            });
                        });
                    }
                });
            }
        }
    }
}
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
            uniqueCardsMap.clear(); //any existing items of map will be previous playlist's tracks so remove
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

async function doPlaylistTrackDetails(){
    let playlistID = document.body.querySelector(".slick-current").id;
    let playlistTracksJSON = await fetchPlaylistTracks(playlistMap.get(playlistID).get("trackHREF")).catch(error =>{
        confirm('There has been a problem with your fetch operation: ' + error.message);
    })
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
        dataMap.set("uri", item.track.uri.replace("spotify:track:", ""));
        dataMap.set("id", item.track.id);
        dataMap.set("albumHREF", item.track.album.images[0].url);
        //get and set the duration of the track
        let tempDurationMin = (parseInt((parseFloat(item.track.duration_ms) / 1000) / 60)).toString();
        let tempDurationSeconds = ((Math.round((parseFloat(item.track.duration_ms) / 1000) % 60)*100)/ 100).toString()
        if (parseInt(tempDurationSeconds) < 10){tempDurationSeconds = "0"+tempDurationSeconds;}
        dataMap.set("duration", tempDurationMin + ":" + tempDurationSeconds);
        dataMap.set("popularity", item.track.popularity);
        
        //DYNAMICALLY CREATE THE CARD HTML FOR EACH TRACK
        createTrackHTML(dataMap); 
        if (uniqueCardsMap.size !== 0){
            //k = unique track id
            //v = map with that track's unique ids
            uniqueCardsMap.forEach(function(v, k){
                
                //assign event listener to the play and pause button for each track
                if (v.get("ppid")){
                    document.body.querySelector("#"+v.get("ppid")).addEventListener("click", function(){
                        changePlayPauseBtn(v.get("ppid"), v.get("uaid"), v.get("uacid"), v.get("href")); //pass the unique element id of the play/pause btn and audio id
                    })
                }
                //assign event listener to the drop down arrow for each track
                document.body.querySelector("#"+v.get("ucid")).addEventListener("click", function(){
                    showTrackAnalysis(v.get("ucid"), v.get("uiid"), trackMap.get(v.get("ucid"))); //the unique id of the analysis card and the panel arrow and pass the map with track info
                });
                
            });
        }
    })
}

async function doUserDetails(){
        
    //GET CURRENT USER'S PROFILE DETAILS
    await fetchProfileDetails();

    //                         ----- GET CURRENT USER'S PLAYLISTS -----
    let limit = "limit=50";
    let url = "https://api.spotify.com/v1/me/playlists?" + limit;
    let userPlaylistJSON = await fetchUserPlaylists(url).catch(error =>{
        console.log('There has been a problem with your fetch operation: ' + error.message);
    })

    //console.log(JSON.stringify(userPlaylistJSON, null, 2));

    //GET EACH PLAYLIST'S TRACKS
    let playlistIDCounter = 0; 
    userPlaylistJSON.items.forEach(item=>{
        let currPlaylistMap = new Map();
        currPlaylistMap.set("name", item.name);
        currPlaylistMap.set("albumIMG", item.images[0].url);
        currPlaylistMap.set("trackHREF", item.tracks.href);
        //dynamically add the playlist html
        const TEMPLATE = 
            `<div class = "playlist-item-class id = "${"playlist" + playlistIDCounter}">
                ${currPlaylistMap.get("name")}
                <img src="${currPlaylistMap.get("albumIMG")}" alt="album image" class = "album-img-class">
            </div>`;
        document.body.querySelector(".carousel-wrapper").innerHTML += TEMPLATE;
        playlistIDCounter++;
        playlistMap.set(currPlaylistMap.get("name"), currPlaylistMap);
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
function createTrackHTML(dataMap, embed = false){

    let ucid = "card-svg-id" + unique_id_counter;
    let uiid = "info-card-id" + unique_id_counter;
    let ppid = "play-pause-btn-id" + unique_id_counter;
    let uaid = "audio-id" + unique_id_counter;
    let uacid = "audio-cont-id" + unique_id_counter;
    let utid = "unique-track-id" + unique_id_counter;
    let insert = ``;
    let tempMap = new Map();
    /*
        <audio src="${dataMap.get("previewURL")}" id="${uaid}">
            Your browser does not support the audio tag.
        </audio>
    */
    if (embed){
        insert = `<iframe src="https://open.spotify.com/embed/track/${dataMap.get("uri")}" width="350" height="80" frameborder="0" allowtransparency="true" title="spotify embed"></iframe>`
    }else{
        insert = `                
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
        </div>`;        
    }
    
    const TEMPLATE = `
        <div class = "track-wrapper" id = "${utid}">
            <div class="track-card-container">
                ${insert}
                <div class="track-arrow-img">
                    <img src="resources/down-arrow2.svg" alt="down arrow svg" class="card-svg-down-class" id="${ucid}">
                </div>
            </div>
            <div class="info-card-hide" id="${uiid}">
                
            </div>
        </div>`

        document.body.querySelector(".playlist-tracks").innerHTML += TEMPLATE;
        tempMap.set("ucid", ucid);
        tempMap.set("uiid", uiid);
        //no embedding so it means custom track appearance
        if (!embed){
            tempMap.set("ppid", ppid);
            tempMap.set("uaid", uaid);
            tempMap.set("uacid", uacid);
            tempMap.set("href", dataMap.get("previewURL"));
            trackMap.set(ucid, dataMap); //THIS IS A GLOBAL MAP HOLDING DATA ABOUT EACH TRACK TO DYNAMICALLY CREATE ANALYSIS GRID ON THE SPOT
        }
        uniqueCardsMap.set(utid, tempMap);
        unique_id_counter += 1;
}
