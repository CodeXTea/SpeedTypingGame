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
  "energy","rocket","matrix","system","battle"
];

/* =========================
   PLAYER STATE
========================= */
let userId = localStorage.getItem("uid");

if(!userId){
  userId = "user_" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("uid", userId);
}

let roomId = "";
let playerSide = "";
let currentWord = "";

/* =========================
   GAME STATE
========================= */
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
   SCREEN CONTROL
========================= */
function showScreen(name){
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.querySelector("." + name).classList.remove("hidden");
}

/* =========================
   FIND MATCH (QUEUE SYSTEM)
========================= */
function findMatch(){

  showScreen("queue-screen");

  db.ref("queue/" + userId).set({
    mmr: 1200,
    timestamp: Date.now()
  });

  listenQueue();
}

/* =========================
   LISTEN MATCHMAKING
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
    status: "playing",
    players: {
      p1: p1,
      p2: p2
    }
  });

  showScreen("game-screen");

  if(userId === p1) playerSide = "p1";
  else playerSide = "p2";

  listenRoom();
  startGame();
}

/* =========================
   LISTEN ROOM (REAL TIME)
========================= */
function listenRoom(){

  db.ref("rooms/" + roomId).on("value", snap => {
    const data = snap.val();
    if(!data) return;

    currentWord = data.word;
    wordEl.textContent = data.word;

    document.querySelector("#p1Score") && (document.querySelector("#p1Score").textContent = data.p1);
    document.querySelector("#p2Score") && (document.querySelector("#p2Score").textContent = data.p2);

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

  input.disabled = false;
  input.value = "";
  input.focus();

  updateUI();

  timer = setInterval(()=>{
    time--;
    updateUI();

    if(time <= 0){
      finishGame();
    }

  },1000);
}

/* =========================
   INPUT SYSTEM
========================= */
input.addEventListener("input", ()=>{

  if(!gameActive) return;

  if(input.value.toLowerCase() === currentWord.toLowerCase()){

    score++;
    combo++;

    if(combo % 3 === 0) time += 2;

    if(score % 5 === 0){
      level++;
      time += 2;
    }

    db.ref("rooms/" + roomId + "/" + playerSide)
    .transaction(v => (v || 0) + 1);

    db.ref("rooms/" + roomId + "/word")
    .set(randomWord());

    input.value = "";

    updateUI();
  }
});

/* =========================
   FINISH GAME (TIME OUT)
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
   END GAME (RESULT)
========================= */
function endGame(winner){

  clearInterval(timer);
  gameActive = false;

  let resultText = (winner === playerSide) ? "YOU WIN 🏆" : "YOU LOSE 💀";

  document.getElementById("resultTitle").textContent = resultText;

  updateMMR(winner);

  showScreen("result-screen");
}

/* =========================
   RANKED SYSTEM (MMR)
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
}

/* =========================
   UI UPDATE
========================= */
function updateUI(){
  scoreEls.forEach(e => e.textContent = score);
  timeEl.textContent = time;
  levelEl.textContent = level;
  comboEl.textContent = combo;
}

/* =========================
   RANDOM WORD
========================= */
function randomWord(){
  return words[Math.floor(Math.random() * words.length)];
}

/* =========================
   NAVIGATION
========================= */
function backToLobby(){
  showScreen("lobby-screen");
}

function cancelMatch(){
  db.ref("queue/" + userId).remove();
  backToLobby();
}