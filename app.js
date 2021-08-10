const client_id = "45d081854dd645af9ace7d813d3f7ae4";
const redirect_uri = "http://127.0.0.1:5500/mainpage.html";
const scopes = "user-read-email user-read-private playlist-read-private playlist-read-collaborative";
const authURL = "https://accounts.spotify.com/authorize" + 
    "?client_id=" + client_id + 
    "&response_type=token" + 
    "&redirect_uri=" + encodeURI(redirect_uri) + 
    "&show_dialog=true"  +
    "&scope=" + encodeURIComponent(scopes);
let userHash;
let accessToken;
let url = "";
let unique_id_counter = 0;

//PARAMETERS
let SEARCH_ITEM = "&searchItem=";
let SEARCH_OPTION = "&searchOption=";
let PROFILE_PAGE = "&profilePage=";

//on each page load, check if user is logged into spotify account. If not, have them log in
window.onload = function(){
    checkLoggedIn(1);
    checkParameters();
}


//check if user presses the enter key while the focused on the search bar
document.addEventListener("keyup", function(event){
    let element = document.getElementById("search-input");
    if (event.code === "Enter" && element === document.activeElement){
       search(element.value);
    }
});

function checkLoggedIn(order = 0){
    if (order === 1){
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
    window.location = authURL;
    //user denied login
    if (location.href.includes("error=access_denied")){
        location.href = "/halt.html";
    }else{
        timerActive = true;
    }
}

function logout(){
    location.href = "/halt.html"; //by changing url, userHash is lost
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
    if (params.searchItem && params.searchOption){
        let val = decodeURI(params.searchItem);
        let option = params.searchOption;
        document.getElementById("searching-for-query-id").innerText = val.toUpperCase();
        doSearch(val,option);
    }
    if (params.profilePage){
        doUserDetails();
    }
}
/*
TO-DO: 
* make sure that user does not include & or = in their search
* round the values of music analysis to just two decimal places and put val out of, ex: .55/1
*/
function search(){
    let key = document.getElementById("search-input").value;
    let option = document.getElementById("select-ID").value; //retrieve what criteria to search by
    window.location.assign("/result.html?" + window.location.hash + SEARCH_ITEM + key + SEARCH_OPTION + option);
}

async function getTrackFeatures(dataMap){
    let tempMap = new Map();
    //GET AUDIO FEATURES
    let audioFeatureURL = "https://api.spotify.com/v1/audio-features/" + dataMap.get("id");
    return fetch(audioFeatureURL,{
        method: "GET",
        headers:{
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken
        }
    })
    .then(response => response.json())
    .then(featureData => {
        if (featureData.error){
            if (featureData.error.status === 401){
                console.log("error 401");
                logout(); //NOT CONFIRMED THIS IS BUG FREE
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
        tempMap.set("key",              tempKey);
        tempMap.set("danceability",     featureData.danceability);
        tempMap.set("energy",           featureData.energy);
        tempMap.set("loudness",         featureData.loudness);
        tempMap.set("speechiness",      featureData.speechiness);
        tempMap.set("acousticness",     featureData.acousticness);
        tempMap.set("instrumentalness", featureData.instrumentalness);
        tempMap.set("liveness",         featureData.liveness);
        tempMap.set("valence",          featureData.valence);
        tempMap.set("tempo",            featureData.tempo);
        tempMap.set("time_signature",   featureData.time_signature);
        return tempMap;
    })
    .catch((error) => {
        console.log("error in feature request", error);
        return null;
    });
    
}
function doSearch(val, option){
    let dataStr = null;

    if (val === ""){
        alert("Search is empty!");
    }else{
        //
        //console.log("option = " + option);
        val = "\""+ val + "\"";
        //console.log("searching for: " + val);
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
        dataStr = "Data not found";
        fetch(url, 
        {
            method: "GET",
            headers:{
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + accessToken
            }
        })
        .then((response)=>response.json())
        .then(function(data){

            //handle playlist searching
            if (option === "Playlist"){
                if (data.playlists.items[0] == null){
                    alert("No results found");
                }else{
                    //console.log(JSON.stringify(data, null , 2));
                    data.playlists.items.forEach(playlist=>{
                        console.log("PLAYLIST NAME: " + playlist.name + "\nby: " + playlist.owner.display_name);
                    })
                }
            }
            //handle track searching
            else{
                //no result from search found
                if (data.tracks.items[0] == null){
                    alert("No Result found");
                }else{
                    
                    //console.log(JSON.stringify(data, null , 2));
                    //for each item, get the name
                    data.tracks.items.forEach(function(key){
                        let dataMap = new Map();
                        //dataStr = key.name + ", by ";
                        //for each artist in the item get the name
                        let artists = "";
                        key.artists.forEach(function(key2){
                            artists += key2.name + ", ";
                        });
                        artists = artists.substr(0, artists.length - 2);
                        //get the id of the track
                        dataMap.set("name", key.name);
                        dataMap.set("artists", artists);
                        dataMap.set("uri", key.uri.replace("spotify:track:", ""));
                        dataMap.set("id", key.id);
                        //get and set the duration of the track
                        let tempDurationMin = (parseInt((parseFloat(key.duration_ms) / 1000) / 60)).toString();
                        let tempDurationSeconds = ((Math.round((parseFloat(key.duration_ms) / 1000) % 60)*100)/ 100).toString()
                        if (parseInt(tempDurationSeconds) < 10){tempDurationSeconds = "0"+tempDurationSeconds;}
                        dataMap.set("duration", tempDurationMin + ":" + tempDurationSeconds);
                        dataMap.set("popularity", key.popularity);
                        getTrackFeatures(dataMap).then(featureResult =>{
                            featureResult.forEach((v, k)=>{
                                dataMap.set(k, v);
                            });
                            createHTML(dataMap);
                            
                        });
                    });
                }
            }
        })
        .catch(function(error){
            if (error == "TypeError: Failed to fetch"){
                confirm("Error fetching data.");

            }else{
                confirm("Access Token Expired. Please login again.");
            }
            console.log("Error in track/playlist request: " + error);
        })
    }
}
function showTrackAnalysis(ucid, uiid){
    //console.log("uid = " + uid);
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
function callHomePg(page){
    url = "http://127.0.0.1:5500/mainpage.html";
    userHash = window.location.hash;
    //hash exists
    if (userHash){
        if (page === "result"){
            userHash = removeHashParameter(SEARCH_ITEM, userHash);
            userHash = removeHashParameter(SEARCH_OPTION, userHash);
        }else if (page === "profile"){
            userHash = removeHashParameter(PROFILE_PAGE, userHash);
        }else {
            confirm("error in callHomePg()");
        }

        url = url + "?" + userHash;
    }else{
        url = url + "?" + userHash;
        console.log("no token: " + userHash);
    }
    location.href = url;
}
function getPlaylistTracks(playlistURL, playlistName){
    //GET PLAYLIST'S TRACKS
    fetch(playlistURL, {
        method: "GET",
        headers:{
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken
        }
    }).then(function(response){
        return response.json();
    }).then(function(result){
        console.log("PLAYLIST NAME = " + playlistName);
        // result.items.forEach(track=>{
        //     console.log(track.track.name + "\n" + track.track.href);
        // })
        // for (let x = 0; x < 10; x++){
        //     console.log(x);
        // }
    }).catch(function(error){
        if (error == "TypeError: Failed to fetch"){
            confirm("Error fetching data.");
        }else{
            confirm("Access Token Expired. Please login again.");
        }
        console.log("Error in fetching playlist items: " + error);
    });            
}
function userDetails(){
    window.location.assign("/profile.html?" + window.location.hash + "&profilePage=true");
}
function doUserDetails(){
    //GET CURRENT USER'S PROFILE DETAILS
    fetch("https://api.spotify.com/v1/me", 
    {
        method: "GET",
        headers:{
            "Authorization": "Bearer " + accessToken
        }
    })
    .then(function(response){
        return response.json();
    })
    .then(function(result){

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

        //console.log(JSON.stringify(result, null, 2));
    })
    .catch(function(error){
        if (error == "TypeError: Failed to fetch"){
            confirm("Error fetching data.");
        }else{
            confirm("Access Token Expired. Please login again.");
        }
        console.log("Error: " + error);
    });
    let limit = "limit=50";
    let url = "https://api.spotify.com/v1/me/playlists?" + limit;
    //GET CURRENT USER'S PLAYLIST
    fetch(url, 
    {
        method: "GET",
        headers:{
            "Content-Type": "application/json",
            "Authorization": "Bearer " + accessToken
        }
    })
    .then(function(response){
        return response.json();
    })
    .then(function(result){

        //console.log(JSON.stringify(result, null, 2));
        //GET EACH PLAYLIST'S TRACKS
        result.items.forEach(item=>{
            // let ndx = item.images.length;
            // if (ndx > 0){
            //     //spotify lists album imgs in descending order in regards to display size.
            //     //typically just large, medium, small, so if there are 3 or more albm img sizes get the second to smallest one
            //     if (ndx >= 3){
            //         ndx -= 2;
            //     }else{
            //         ndx = 0;
            //     }
            // }else{

            //}
            console.log(item.images[0].url);
            getPlaylistTracks(item.tracks.href, item.name);
        });

    })
    .catch(function(error){
        if (error == "TypeError: Failed to fetch"){
            confirm("Error fetching data.");
        }else{
            confirm("Access Token Expired. Please login again.");
        }
        console.log("Error: " + error);
    });
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
function createHTML(dataMap){
    console.log("MAP = ", dataMap);

    let ucid = "";
    ucid = "card-svg-id" + unique_id_counter;
    let uiid = "";
    uiid = "info-card-id" + unique_id_counter;

    const BODY = document.querySelector('body');

    const WRAPPER_DIV = document.createElement('div'); 
    const CONTAINER_DIV = document.createElement('div'); 
    const TRACK_ARROW_IMG_DIV = document.createElement('div'); 
    const FRAME_CONT = document.createElement("div");
    const IFRAME_ATR = document.createElement('iframe');
    const IMG_ATR = document.createElement('img');
    BODY.append(WRAPPER_DIV);
    WRAPPER_DIV.append(CONTAINER_DIV);
    CONTAINER_DIV.append(FRAME_CONT);
    FRAME_CONT.append(IFRAME_ATR);
    CONTAINER_DIV.append(TRACK_ARROW_IMG_DIV);
    TRACK_ARROW_IMG_DIV.append(IMG_ATR);
        
    WRAPPER_DIV.setAttribute("class", "track-wrapper");
    CONTAINER_DIV.setAttribute("class", "track-card-container");
    FRAME_CONT.setAttribute("class", "iframe-container");

    IFRAME_ATR.setAttribute("src", "https://open.spotify.com/embed/track/" + dataMap.get("uri"));
    IFRAME_ATR.setAttribute("width", "350");
    IFRAME_ATR.setAttribute("height", "80");
    IFRAME_ATR.setAttribute("frameborder", "0");
    IFRAME_ATR.setAttribute("allowtransparency", "true");
    //IFRAME_ATR.setAttribute("allow", "encypted-media");
    IFRAME_ATR.setAttribute("title", "spotify embed");
    TRACK_ARROW_IMG_DIV.setAttribute("class", "track-arrow-img");
    IMG_ATR.setAttribute("src","resources/down-arrow2.svg");
    IMG_ATR.setAttribute("alt","down arrow svg");
    IMG_ATR.setAttribute("class", "card-svg-down-class");

    /////////////////////////////////////////
    const INFO_CARD_DIV = document.createElement("div");
    const INFO_TOP_DATA_DIV = document.createElement("div");
    const DURATION_P = document.createElement("p");
    const TEMPO_P = document.createElement("p");
    const KEY_P = document.createElement("p");
    const TIME_SIG_P = document.createElement("p");
     
    WRAPPER_DIV.append(INFO_CARD_DIV);
    INFO_CARD_DIV.append(INFO_TOP_DATA_DIV);
    INFO_TOP_DATA_DIV.append(DURATION_P, TEMPO_P, KEY_P, TIME_SIG_P);

    INFO_CARD_DIV.setAttribute("class", "info-card-hide");
    INFO_TOP_DATA_DIV.setAttribute("class", "info-top-data");
    // DURATION_P.setAttribute("id", "duration");
    // TEMPO_P.setAttribute("id", "tempo");
    // KEY_P.setAttribute("id", "key");
    // TIME_SIG_P.setAttribute("id", "time-signature");
    
    /////ORDER IS ESSENTIAL. INFO_CARD_DIV and IMG_ATR must be created and appended to their parents already
    IMG_ATR.setAttribute("id", ucid);
    INFO_CARD_DIV.setAttribute("id", uiid);
    IMG_ATR.addEventListener("click", function(){
        showTrackAnalysis(ucid, uiid);
    })
    


    DURATION_P.innerHTML = "Duration: " + dataMap.get("duration");

    TEMPO_P.innerHTML = "Tempo: " + (Math.round(parseFloat(dataMap.get("tempo")))).toString();
    KEY_P.innerHTML = " Key: " + dataMap.get("key");
    TIME_SIG_P.innerHTML = "Time Sig: " + dataMap.get("time_signature");


    const ANALYSIS_GRID_DIV = document.createElement("div");
    INFO_CARD_DIV.append(ANALYSIS_GRID_DIV);
    ANALYSIS_GRID_DIV.setAttribute("class", "analysis-grid");

    const DANCEABILITY_DIV = document.createElement("div");
    const ENERGY_DIV = document.createElement("div");
    const LOUDNESS_DIV = document.createElement("div");
    const DANCE_BAR_CONT_DIV = document.createElement("div");
    const DANCE_BAR_DIV = document.createElement("div");
    const ENERGY_BAR_CONT_DIV = document.createElement("div");
    const ENERGY_BAR_DIV = document.createElement("div");
    const LOUDNESS_BAR_CONT_DIV = document.createElement("div");
    const LOUDNESS_BAR_DIV = document.createElement("div");
    ANALYSIS_GRID_DIV.append(DANCEABILITY_DIV, ENERGY_DIV, LOUDNESS_DIV, DANCE_BAR_CONT_DIV, ENERGY_BAR_CONT_DIV, LOUDNESS_BAR_CONT_DIV);
    DANCE_BAR_CONT_DIV.append(DANCE_BAR_DIV);
    ENERGY_BAR_CONT_DIV.append(ENERGY_BAR_DIV);
    LOUDNESS_BAR_CONT_DIV.append(LOUDNESS_BAR_DIV);

    DANCEABILITY_DIV.setAttribute("class", "danceability");
    ENERGY_DIV.setAttribute("class", "energy");
    LOUDNESS_DIV.setAttribute("class", "loudness");
    DANCE_BAR_CONT_DIV.setAttribute("class", "skill-bar-container");
    DANCE_BAR_DIV.setAttribute("class", "skills-bar-text dance-bar");
    ENERGY_BAR_CONT_DIV.setAttribute("class", "skill-bar-container");
    ENERGY_BAR_DIV.setAttribute("class", "skills-bar-text energy-bar")
    LOUDNESS_BAR_CONT_DIV.setAttribute("class", "skill-bar-container");
    LOUDNESS_BAR_DIV.setAttribute("class", "skills-bar-text loudness-bar");

    DANCEABILITY_DIV.innerHTML = "danceability";
    ENERGY_DIV.innerHTML = "energy";
    LOUDNESS_DIV.innerHTML = "loudness";
    DANCE_BAR_DIV.innerHTML = dataMap.get("danceability");
    DANCE_BAR_DIV.style.width = (parseFloat(dataMap.get("danceability")) * 100).toString() + "%";
    ENERGY_BAR_DIV.innerHTML = dataMap.get("energy");
    ENERGY_BAR_DIV.style.width = (parseFloat(dataMap.get("energy")) * 100).toString() + "%";
    LOUDNESS_BAR_DIV.innerHTML = (parseFloat(dataMap.get("loudness")) * -1).toString();
    LOUDNESS_BAR_DIV.style.width = (parseFloat(dataMap.get("loudness")) * -1 / 60 * 100).toString() + "%";   


    const SPEECH_DIV = document.createElement("div");
    const POP_DIV = document.createElement("div");
    const ACOUS_DIV = document.createElement("div");
    const SPEECH_BAR_CONT_DIV = document.createElement("div");
    const SPEECH_BAR_DIV = document.createElement("div");
    const POP_BAR_CONT_DIV = document.createElement("div");
    const POP_BAR_DIV = document.createElement("div");
    const ACOUS_BAR_CONT_DIV = document.createElement("div");
    const ACOUS_BAR_DIV = document.createElement("div");
    ANALYSIS_GRID_DIV.append(SPEECH_DIV, POP_DIV, ACOUS_DIV, SPEECH_BAR_CONT_DIV, POP_BAR_CONT_DIV, ACOUS_BAR_CONT_DIV);
    SPEECH_BAR_CONT_DIV.append(SPEECH_BAR_DIV);
    POP_BAR_CONT_DIV.append(POP_BAR_DIV);
    ACOUS_BAR_CONT_DIV.append(ACOUS_BAR_DIV);

    SPEECH_DIV.innerHTML = "speechiness";
    POP_DIV.innerHTML = "popularity";
    ACOUS_DIV.innerHTML = "acousticness";
    POP_BAR_DIV.innerHTML = dataMap.get("popularity");
    POP_BAR_DIV.style.width = dataMap.get("popularity")+ "%";
    SPEECH_BAR_DIV.innerHTML = dataMap.get("speechiness");
    SPEECH_BAR_DIV.style.width = (parseFloat(dataMap.get("speechiness")) * 100).toString() + "%";
    ACOUS_BAR_DIV.innerHTML = dataMap.get("acousticness");
    ACOUS_BAR_DIV.style.width = (parseFloat(dataMap.get("acousticness")) * 100).toString() + "%";

    SPEECH_DIV.setAttribute("class", "speechiness");
    POP_DIV.setAttribute("class", "popularity");
    ACOUS_DIV.setAttribute("class", "acousticness");
    SPEECH_BAR_CONT_DIV.setAttribute("class", "skill-bar-container");
    SPEECH_BAR_DIV.setAttribute("class", "skills-bar-text speech-bar");
    POP_BAR_CONT_DIV.setAttribute("class", "skill-bar-container");
    POP_BAR_DIV.setAttribute("class", "skills-bar-text popularity-bar")
    ACOUS_BAR_CONT_DIV.setAttribute("class", "skill-bar-container");
    ACOUS_BAR_DIV.setAttribute("class", "skills-bar-text acoustic-bar");

    const INSTRUMENT_DIV = document.createElement("div");
    const LIVENESS_DIV = document.createElement("div");
    const VALENCE_DIV = document.createElement("div");
    const INSTRUMENT_BAR_CONT_DIV = document.createElement("div");
    const INSTRUMENT_BAR_DIV = document.createElement("div");
    const LIVENESS_BAR_CONT_DIV = document.createElement("div");
    const LIVENESS_BAR_DIV = document.createElement("div");
    const VALENCE_BAR_CONT_DIV = document.createElement("div");
    const VALENCE_BAR_DIV = document.createElement("div");
    ANALYSIS_GRID_DIV.append(INSTRUMENT_DIV, LIVENESS_DIV, VALENCE_DIV, INSTRUMENT_BAR_CONT_DIV, LIVENESS_BAR_CONT_DIV,VALENCE_BAR_CONT_DIV);
    INSTRUMENT_BAR_CONT_DIV.append(INSTRUMENT_BAR_DIV);
    LIVENESS_BAR_CONT_DIV.append(LIVENESS_BAR_DIV);
    VALENCE_BAR_CONT_DIV.append(VALENCE_BAR_DIV);

    INSTRUMENT_DIV.setAttribute("class", "instrumentalness");
    LIVENESS_DIV.setAttribute("class", "liveness");
    VALENCE_DIV.setAttribute("class", "valence");
    INSTRUMENT_BAR_CONT_DIV.setAttribute("class", "skill-bar-container");
    INSTRUMENT_BAR_DIV.setAttribute("class", "skills-bar-text instrument-bar");
    LIVENESS_BAR_CONT_DIV.setAttribute("class", "skill-bar-container");
    LIVENESS_BAR_DIV.setAttribute("class", "skills-bar-text liveness-bar")
    VALENCE_BAR_CONT_DIV.setAttribute("class", "skill-bar-container");
    VALENCE_BAR_DIV.setAttribute("class", "skills-bar-text valence-bar");

    INSTRUMENT_DIV.innerHTML = "instrumentalness";
    LIVENESS_DIV.innerHTML = "liveness";
    VALENCE_DIV.innerHTML = "valence";
    
    INSTRUMENT_BAR_DIV.innerHTML = dataMap.get("instrumentalness");
    INSTRUMENT_BAR_DIV.style.width = (parseFloat(dataMap.get("instrumentalness")) * 100).toString() + "%";
    LIVENESS_BAR_DIV.innerHTML = dataMap.get("liveness");
    LIVENESS_BAR_DIV.style.width = (parseFloat(dataMap.get("liveness")) * 100).toString() + "%";
    VALENCE_BAR_DIV.innerHTML = dataMap.get("valence");
    VALENCE_BAR_DIV.style.width = (parseFloat(dataMap.get("valence")) * 100).toString() + "%";

    unique_id_counter += 1;
}
