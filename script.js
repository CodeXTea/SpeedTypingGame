/* =========================
   FIREBASE INIT
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyBGJyPSIhAA-Z4vwfyxujQ-AKy7XkRcwGA",
  authDomain: "speedtypinggame.firebaseapp.com",
  databaseURL: "https://speedtypinggame-default-rtdb.firebaseio.com",
  projectId: "speedtypinggame",
  storageBucket: "speedtypinggame.firebasestorage.app",
  messagingSenderId: "590469790918",
  appId: "1:590469790918:web:d6f315007dd8e01f3a2bc7",
  measurementId: "G-LBRG20MBJD"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* =========================
   WORD LIST
========================= */
const words = [
  "apple","banana","computer","keyboard","speed",
  "react","node","game","typing","focus",
  "energy","rocket","matrix","system","battle",
  "legend","victory","online","multiplayer","ranked"
];

/* =========================
   PLAYER ID SYSTEM
========================= */
let userId = localStorage.getItem("uid");

if(!userId){
  userId = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("uid", userId);
}

/* =========================
   GAME STATE
========================= */
let roomId = "";
let playerSide = "";
let currentWord = "";

let score = 0;
let time = 10;
let level = 1;
let combo = 0;
let gameActive = false;
let timer;

/* =========================
   ELEMENTS
========================= */
const wordEl = document.querySelector(".word");
const input = document.querySelector("input");

const scoreEls = document.querySelectorAll(".score");
const timeEl = document.querySelector(".time");
const levelEl = document.querySelector(".level-display");
const comboEl = document.querySelector(".combo-display");

/* =========================
   SCREEN SYSTEM
========================= */
function showScreen(name){
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.querySelector("." + name).classList.remove("hidden");
}

/* =========================
   SOLO MODE
========================= */
let soloActive = false;
let soloTime = 30;
let soloScore = 0;
let soloTimer;

function startSolo(){

  showScreen("game-screen");

  soloActive = true;
  soloTime = 30;
  soloScore = 0;

  currentWord = randomWord();
  wordEl.textContent = currentWord;

  input.value = "";
  input.focus();

  soloTimer = setInterval(()=>{

    soloTime--;
    timeEl.textContent = soloTime;

    if(soloTime <= 0){
      endSolo();
    }

  },1000);
}

/* =========================
   SOLO INPUT HANDLER
========================= */
input.addEventListener("input", ()=>{

  if(soloActive && !gameActive){

    if(input.value.toLowerCase() === currentWord.toLowerCase()){

      soloScore++;

      input.value = "";
      currentWord = randomWord();
      wordEl.textContent = currentWord;

      scoreEls.forEach(e => e.textContent = soloScore);
    }
  }

  if(gameActive){
    handleMultiplayerInput();
  }
});

/* =========================
   END SOLO
========================= */
function endSolo(){

  clearInterval(soloTimer);
  soloActive = false;

  alert("Solo Finished! Score: " + soloScore);

  showScreen("menu-screen");
}

/* =========================
   MATCHMAKING SYSTEM
========================= */
function findMatch(){

  showScreen("queue-screen");

  db.ref("queue/" + userId).set({
    mmr: 1200,
    time: Date.now()
  });

  listenQueue();
}

/* =========================
   LISTEN QUEUE
========================= */
function listenQueue(){

  db.ref("queue").on("value", snap => {

    const data = snap.val();
    if(!data) return;

    const users = Object.keys(data);

    if(users.length >= 2){

      const p1 = users[0];
      const p2 = users[1];

      createRoom(p1, p2);

      db.ref("queue/" + p1).remove();
      db.ref("queue/" + p2).remove();
    }
  });
}

/* =========================
   CREATE ROOM
========================= */
function createRoom(p1, p2){

  roomId = "room_" + Date.now();

  db.ref("rooms/" + roomId).set({
    word: randomWord(),
    p1: 0,
    p2: 0,
    winner: "",
    players: {
      p1: p1,
      p2: p2
    }
  });

  if(userId === p1) playerSide = "p1";
  else playerSide = "p2";

  showVsScreen();
  listenRoom();

  setTimeout(()=>{
    showScreen("game-screen");
    startGame();
  }, 2500);
}

/* =========================
   VS SCREEN
========================= */
function showVsScreen(){

  db.ref("users/" + userId).once("value").then(snap => {
    let me = snap.val() || { mmr: 1200 };

    document.getElementById("p1Mmr").textContent = me.mmr;
    document.getElementById("p2Mmr").textContent = 1200;
  });

  showScreen("vs-screen");
}

/* =========================
   LISTEN ROOM
========================= */
function listenRoom(){

  db.ref("rooms/" + roomId).on("value", snap => {

    const data = snap.val();
    if(!data) return;

    currentWord = data.word;
    wordEl.textContent = data.word;

    if(data.winner){
      endGame(data.winner);
    }
  });
}

/* =========================
   START GAME
========================= */
function startGame(){

  score = 0;
  time = 10;
  level = 1;
  combo = 0;

  gameActive = true;

  input.value = "";
  input.focus();

  timer = setInterval(()=>{

    time--;
    timeEl.textContent = time;

    if(time <= 0){
      finishGame();
    }

  },1000);
}

/* =========================
   MULTIPLAYER INPUT
========================= */
function handleMultiplayerInput(){

  if(input.value.toLowerCase() === currentWord.toLowerCase()){

    score++;
    combo++;

    if(combo % 3 === 0) time += 2;
    if(score % 5 === 0) level++;

    db.ref("rooms/" + roomId + "/" + playerSide)
      .transaction(v => (v || 0) + 1);

    db.ref("rooms/" + roomId + "/word")
      .set(randomWord());

    input.value = "";
  }

  updateUI();
}

/* =========================
   FINISH GAME
========================= */
function finishGame(){

  clearInterval(timer);
  gameActive = false;

  db.ref("rooms/" + roomId).once("value", snap => {

    const data = snap.val();

    if(!data.winner){

      let winner = data.p1 > data.p2 ? "p1" : "p2";

      db.ref("rooms/" + roomId + "/winner").set(winner);
    }
  });
}

/* =========================
   END GAME + RANKED SYSTEM
========================= */
function endGame(winner){

  clearInterval(timer);
  gameActive = false;

  let result = (winner === playerSide) ? "YOU WIN 🏆" : "YOU LOSE 💀";

  document.getElementById("resultTitle").textContent = result;

  updateMMR(winner);

  showScreen("result-screen");
}

/* =========================
   MMR SYSTEM
========================= */
function updateMMR(winner){

  db.ref("users/" + userId).transaction(user => {

    if(!user){
      user = { mmr: 1200, wins: 0, losses: 0 };
    }

    if(winner === playerSide){
      user.mmr += 25;
      user.wins++;
    } else {
      user.mmr -= 20;
      user.losses++;
    }

    document.getElementById("rankChange").textContent =
      (winner === playerSide ? "+25 MMR" : "-20 MMR");

    return user;
  });

  updateLeaderboard();
}

/* =========================
   LEADERBOARD SYSTEM
========================= */
function updateLeaderboard(){

  db.ref("users/" + userId).once("value", snap => {

    const data = snap.val();

    db.ref("leaderboard/" + userId).set({
      mmr: data.mmr,
      wins: data.wins || 0
    });
  });
}

/* =========================
   UTILITY FUNCTIONS
========================= */
function randomWord(){
  return words[Math.floor(Math.random() * words.length)];
}

function updateUI(){
  scoreEls.forEach(e => e.textContent = score);
  timeEl.textContent = time;
  levelEl.textContent = level;
  comboEl.textContent = combo;
}

/* =========================
   NAVIGATION
========================= */
function backToMenu(){
  showScreen("menu-screen");
}

function cancelMatch(){
  db.ref("queue/" + userId).remove();
  backToMenu();
}

function leaveGame(){
  backToMenu();
}
