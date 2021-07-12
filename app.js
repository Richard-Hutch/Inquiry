const client_id = "45d081854dd645af9ace7d813d3f7ae4";
const redirect_uri = "http://127.0.0.1:5500/mainpage.html";
const authURL = "https://accounts.spotify.com/authorize" + "?client_id=" + client_id + "&response_type=token" + "&redirect_uri=" + encodeURI(redirect_uri) + "&show_dialog=true";
let access_token;
let url = "";


//on each page load, check if user is logged into spotify account. If not, have them log in
checkLoggedIn(1);


//check if user presses the enter key while the focused on the search bar
document.addEventListener("keyup", function(event){
    let element = document.getElementById("search-input");
    if (event.code === "Enter" && element === document.activeElement){
       search(element);
    }
});

function checkLoggedIn(order = 0){
    if (order === 1){
        if (!location.href.includes("halt")){
            if (!location.href.includes("access_token=")){
                location.href = "/halt.html";
            }
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
    //console.log(authURL)
    window.location = authURL;
    //user denied login
    if (location.href.includes("error=access_denied")){
        location.href = "/halt.html";
    }
}
function logout(){
    location.href = "/halt.html"; //by changing url, access_token is lost
}
function search(val = document.getElementById("search-input").value){
    //let val = document.getElementById("search-input").value;
    if (val === ""){
        console.log("Search is empty");
    }else{
        console.log("searching for: " + val);
        access_token = window.location.hash;
        location.href = "/result.html?" + access_token;;
    }
}
function callHomePg(){
    url = "http://127.0.0.1:5500/mainpage.html";
    access_token = window.location.hash;
    if (access_token){
        url = url + "?" + access_token;
    }else{
        console.log("no token: " + access_token);
    }
    location.href = url + "?" + access_token;
}
