const client_id = "45d081854dd645af9ace7d813d3f7ae4";
const redirect_uri = "http://127.0.0.1:5500/mainpage.html";
const scopes = "user-read-email user-read-private"
const authURL = "https://accounts.spotify.com/authorize" + 
    "?client_id=" + client_id + 
    "&response_type=token" + 
    "&redirect_uri=" + encodeURI(redirect_uri) + 
    "&show_dialog=true"  +
    "&scope=" + encodeURIComponent(scopes);
let userHash;
let accessToken;
let url = "";

//on each page load, check if user is logged into spotify account. If not, have them log in
checkLoggedIn(1);

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
    //console.log(authURL)

    const time_limit =  .5; //amnt of minutes
    startTimer(time_limit * 60 * 1000); //amnt of minutes * 60 seconds * 60 milliseconds
    window.location = authURL;
    //user denied login
    if (location.href.includes("error=access_denied")){
        location.href = "/halt.html";
    }
}

function startTimer(time_limit){
    let currTimer = time_limit;
    setInterval(function(){
        currTimer -= 1000;
        console.log("called");
        if (currTimer <= 0){
            alert("Reauthentication Required.")
            clearInterval();
        }
    }, 1000);
}

function logout(){
    location.href = "/halt.html"; //by changing url, userHash is lost
}
/*

IDEA: create drop down box that allows user to select to search for song, playlist, or both

*/

async function search(val = document.getElementById("search-input").value){

    if (val === ""){
        alert("Search is empty!");
    }else{
        val = "\""+ val + "\"";
        console.log("searching for: " + val);
        let market = "&market=from_token";
        let type = "&type=track";
        let limit = "&limit=5";
        url = "https://api.spotify.com/v1/search?q=" + val + type + limit + market;
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
            //console.log(data);
            //let str = JSON.stringify(data);
            if (data.tracks.items[0] == null){
                alert("No Result found");
            }else{
                console.log(JSON.stringify(data, null , 2));
                //console.log("\n" + JSON.stringify(data.tracks.items[0].name, null, 2));
                //for each item, get the name
                data.tracks.items.forEach(function(key){
                    let tempStr = key.name + ", by ";
                    //for each artist in the item get the name
                    key.artists.forEach(function(key2){
                        tempStr += key2.name + ", ";
                    });
                    console.log(tempStr);
                });
                hash = window.location.hash;
                window.location.href = "/result.html?" + hash;
            }
        })
        .catch(function(error){
            console.log("Error: " + error);
        })
    }
}
function callHomePg(){
    url = "http://127.0.0.1:5500/mainpage.html";
    userHash = window.location.hash;
    if (userHash){
        url = url + "?" + userHash;
    }else{
        console.log("no token: " + userHash);
    }
    location.href = url + "?" + userHash;
}
async function userDetails(){
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
        console.log(result);
    })
    .catch(function(error){
        console.log("Error: " + error);
    })
}
function menuDropDown(){
    let state = document.getElementById("menu-content-id").style.display;
    if (state === "none" || state === ""){ //the "" is because DOM doesn't know the display in master css yet
        state = "inline-block";
        document.getElementById("bar1-id").style.width = "25px";
        document.getElementById("bar1-id").style.transform = "translate(5px, 9px) rotate(45deg)";
        document.getElementById("bar2-id").style.transform = "rotate(130deg)";
        document.getElementById("bar3-id").style.visibility = "hidden";
    }
    else{
        document.getElementById("bar1-id").style.transform = "rotate(0deg)";
        document.getElementById("bar1-id").style.width = "35px";
        //document.getElementById("bar1-id").style.transform = "translate(5px, -5px)";

        document.getElementById("bar2-id").style.transform = "rotate(0deg)";
        document.getElementById("bar3-id").style.visibility = "visible";
         state = "none";
    }
    document.getElementById("menu-content-id").style.display = state;
}