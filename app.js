let client_id = "";
let client_secret = "";
let redirect_uri = "http://127.0.0.1:5500/mainpage.html";

const AUTHORIZE = "https://acccounts.spotify.com/authorize";

function requestAuthorization(){
    client_id = document.getElementById("clientId").value;
    client_secret = document.getElementById("clientSecret").value;
    //The localStorage object stores the data with no expiration date. 
    //The data will not be deleted when the browser is closed, and will be available the next day, week, or year.
    //localStorage.setItem("client_id", client_id);
    //localStorage.setItem("client_secret", client_secret);
    /*
    The sessionStorage object is equal to the localStorage object, except that it stores the data for only one session. 
    The data is deleted when the user closes the specific browser tab.
    */
    sessionStorage.setItem("client_id", client_id);
    sessionStorage.setItem("client_secret", client_secret);
    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    window.location.href = url; //show Spotify's authorization screen
}