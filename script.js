/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey:"AIzaSyBGJyPSIhAA-Z4vwfyxujQ-AKy7XkRcwGA",
  authDomain:"speedtypinggame.firebaseapp.com",
  databaseURL:"https://speedtypinggame-default-rtdb.firebaseio.com",
  projectId:"speedtypinggame"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ================= PLAYER ================= */
let playerName = localStorage.getItem("name");

if(!playerName){
  playerName = prompt("Enter name:");
  localStorage.setItem("name",playerName);
}

let userId = localStorage.getItem("uid") || "u"+Math.random();

/* ================= WORDS ================= */
const words=["apple","banana","game","speed","keyboard"];

/* ================= STATE ================= */
let word="",score=0,time=10,gameActive=false;

/* ================= SCREEN ================= */
function show(s){
  document.querySelectorAll(".screen").forEach(x=>x.classList.add("hidden"));
  document.querySelector("."+s).classList.remove("hidden");
}

/* ================= SOLO ================= */
function startSolo(){
  show("game-screen");
  score=0;
  time=30;
  gameActive=true;
  nextWord();
  timer();
}

function nextWord(){
  word=words[Math.floor(Math.random()*words.length)];
  document.querySelector(".word").innerText=word;
}

function timer(){
  let t=setInterval(()=>{
    time--;
    document.querySelector(".time").innerText=time;
    if(time<=0){
      clearInterval(t);
      gameActive=false;
      show("result-screen");
    }
  },1000);
}

/* ================= MATCHMAKING ================= */
function findMatch(){
  show("queue-screen");

  db.ref("queue/"+userId).set({
    name:playerName,
    mmr:1200
  });
}

/* ================= PROFILE ================= */
function openProfile(){

  db.ref("users/"+userId).once("value",snap=>{
    let d=snap.val()||{mmr:1200,wins:0,losses:0};

    document.getElementById("profileName").innerText=playerName;
    document.getElementById("profileMmr").innerText=d.mmr;
    document.getElementById("profileWins").innerText=d.wins;
    document.getElementById("profileLosses").innerText=d.losses;

    show("profile-screen");
  });
}

/* ================= BACK ================= */
function backToMenu(){
  show("menu-screen");
}
