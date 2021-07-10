let client_id = "45d081854dd645af9ace7d813d3f7ae4";
let redirect_uri = "http://127.0.0.1:5500/mainpage.html";
let authURL = "https://accounts.spotify.com/authorize" + "?client_id=" + client_id + "&response_type=token" + "&redirect_uri=" + encodeURI(redirect_uri) + "&show_dialog=true";


async function authorize(){
    //console.log(authURL);
    window.location = authURL;
}