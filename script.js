/* ========================================= */
/* GLOBAL STATE */
/* ========================================= */
/* ========================================= */
/* FIREBASE CONFIG */
/* ========================================= */

const firebaseConfig = {
    apiKey: "AIzaSyBGJyPSIhAA-Z4vwfyxujQ-AKy7XkRcwGA",
    authDomain: "speedtypinggame.firebaseapp.com",
    databaseURL: "https://speedtypinggame-default-rtdb.firebaseio.com",
    projectId: "speedtypinggame",
    storageBucket: "speedtypinggame.appspot.com",
    messagingSenderId: "",
    appId: ""
};

/* ========================================= */
/* INIT FIREBASE */
/* ========================================= */

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let gameState = {
    playerName: "Player",
    mmr: 1200,
    level: 1,
    xp: 0,

    score: 0,
    combo: 0,
    bestCombo: 0,

    wpm: 0,
    accuracy: 100,

    correct: 0,
    wrong: 0,
    chars: 0,

    inMatch: false
};

/* ========================================= */
/* SCREEN HANDLER */
/* ========================================= */

const screens = document.querySelectorAll(".screen");

function showScreen(id) {
    screens.forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

/* ========================================= */
/* MENU NAVIGATION */
/* ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    // Menu buttons
    const soloBtn = document.getElementById("soloBtn");
    const rankBtn = document.getElementById("rankBtn");
    const customBtn = document.getElementById("customBtn");

    if (soloBtn) {
        soloBtn.onclick = () => startSolo();
    }

    if (rankBtn) {
        rankBtn.onclick = () => findMatch();
    }

    if (customBtn) {
        customBtn.onclick = () => showToast("Custom Room coming soon!");
    }

    // Footer navigation
    document.getElementById("navHome")?.addEventListener("click", () => {
        showScreen("menuScreen");
    });

    document.getElementById("navRank")?.addEventListener("click", () => {
        showScreen("leaderboardScreen");
    });

    document.getElementById("navProfile")?.addEventListener("click", () => {
        showScreen("profileScreen");
    });

    document.getElementById("navShop")?.addEventListener("click", () => {
        showScreen("shopScreen");
    });

});

/* ========================================= */
/* BASIC ACTIONS */
/* ========================================= */

function startSolo() {
    gameState.inMatch = false;
    showToast("Starting Solo Mode...");
    showScreen("gameScreen");
    startGame();
}

function findMatch() {
    showToast("Searching opponent...");
    showScreen("queueScreen");

    setTimeout(() => {
        showScreen("vsScreen");

        setTimeout(() => {
            startCountdown();
        }, 2000);

    }, 2000);
}

function cancelMatch() {
    showToast("Matchmaking cancelled");
    showScreen("menuScreen");
}

/* ========================================= */
/* TOAST SYSTEM */
/* ========================================= */

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

/* ========================================= */
/* SCREEN FLOW HELPERS */
/* ========================================= */

function startCountdown() {
    showScreen("countdownScreen");

    let count = 3;
    const countdownEl = document.getElementById("countdownNumber");

    const interval = setInterval(() => {
        count--;
        if (countdownEl) countdownEl.innerText = count;

        if (count === 0) {
            clearInterval(interval);
            startGame();
        }
    }, 1000);
}

/* ========================================= */
/* START GAME */
/* ========================================= */

function startGame() {
    gameState.inMatch = true;
    showScreen("gameScreen");

    resetStats();
    generateWord();
}

/* ========================================= */
/* RESET STATS */
/* ========================================= */

function resetStats() {
    gameState.score = 0;
    gameState.combo = 0;
    gameState.correct = 0;
    gameState.wrong = 0;
    gameState.chars = 0;
}
/* ========================================= */
/* WORD SYSTEM */
/* ========================================= */

const words = [
    "speed",
    "typing",
    "battle",
    "victory",
    "keyboard",
    "challenge",
    "accuracy",
    "reaction",
    "champion",
    "multiplayer",
    "ranked",
    "esports",
    "engine",
    "firebase",
    "javascript",
    "program",
    "focus",
    "energy",
    "winner",
    "legend"
];

let currentWord = "";
let startTime = null;

/* ========================================= */
/* GENERATE WORD */
/* ========================================= */

function generateWord() {
    const randomIndex = Math.floor(Math.random() * words.length);
    currentWord = words[randomIndex];

    const wordEl = document.getElementById("currentWord");
    if (wordEl) wordEl.innerText = currentWord;

    // reset input
    const input = document.getElementById("typingInput");
    if (input) {
        input.value = "";
        input.focus();
    }

    startTime = new Date();
}

/* ========================================= */
/* INPUT HANDLING */
/* ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("typingInput");

    if (!input) return;

    input.addEventListener("input", (e) => {

        const value = e.target.value.trim();

        gameState.chars = value.length;

        // check correct word
        if (value === currentWord) {

            correctWord();

        } else if (currentWord.startsWith(value)) {

            // still typing (correct so far)
            updateProgress(value.length / currentWord.length);

        } else {

            // wrong typing
            markWrong();

        }

        updateStats();
    });

});

/* ========================================= */
/* CORRECT WORD */
/* ========================================= */
/* ========================================= */
/* INIT GAME */
/* ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadPlayerProfile();
    loadLeaderboard();

});

function correctWord() {

    gameState.correct++;
    gameState.score += 10;
    gameState.combo++;

    if (gameState.combo > gameState.bestCombo) {
        gameState.bestCombo = gameState.combo;
    }

    // WPM update
    calculateWPM();

    // reset for next word
    generateWord();
}

/* ========================================= */
/* WRONG WORD */
/* ========================================= */

function markWrong() {

    gameState.wrong++;
    gameState.combo = 0;

    gameState.score = Math.max(0, gameState.score - 2);

    calculateAccuracy();
}

/* ========================================= */
/* WPM CALCULATION */
/* ========================================= */

function calculateWPM() {

    if (!startTime) return;

    const now = new Date();
    const minutes = (now - startTime) / 60000;

    const wordsTyped = gameState.correct || 1;

    gameState.wpm = Math.floor(wordsTyped / minutes);
}

/* ========================================= */
/* ACCURACY CALCULATION */
/* ========================================= */

function calculateAccuracy() {

    const total = gameState.correct + gameState.wrong;

    if (total === 0) {
        gameState.accuracy = 100;
        return;
    }

    gameState.accuracy = Math.floor((gameState.correct / total) * 100);
}

/* ========================================= */
/* PROGRESS UPDATE */
/* ========================================= */

function updateProgress(percent) {

    const bar = document.getElementById("playerProgress");

    if (bar) {
        bar.style.width = `${percent * 100}%`;
    }
}

/* ========================================= */
/* UPDATE UI STATS */
/* ========================================= */

function updateStats() {

    document.getElementById("score") && (document.getElementById("score").innerText = gameState.score);

    document.getElementById("combo") && (document.getElementById("combo").innerText = gameState.combo);

    document.getElementById("wpm") && (document.getElementById("wpm").innerText = gameState.wpm);

    document.getElementById("accuracy") && (document.getElementById("accuracy").innerText = gameState.accuracy + "%");

    document.getElementById("correctWord") && (document.getElementById("correctWord").innerText = gameState.correct);

    document.getElementById("wrongWord") && (document.getElementById("wrongWord").innerText = gameState.wrong);

    document.getElementById("charTyped") && (document.getElementById("charTyped").innerText = gameState.chars);

    document.getElementById("bestCombo") && (document.getElementById("bestCombo").innerText = gameState.bestCombo);

    calculateAccuracy();
}

/* ========================================= */
/* SIMPLE GAME LOOP (AI OPPONENT SIMULATION) */
/* ========================================= */

setInterval(() => {

    if (!gameState.inMatch) return;

    const enemyBar = document.getElementById("enemyProgressBar");

    if (enemyBar) {

        let current = parseFloat(enemyBar.style.width) || 0;

        current += Math.random() * 3;

        if (current > 100) current = 100;

        enemyBar.style.width = current + "%";
    }

}, 1000);
/* ========================================= */
/* END GAME SYSTEM */
/* ========================================= */

let gameInterval = null;

/* ========================================= */
/* END MATCH */
/* ========================================= */

function endGame() {

    gameState.inMatch = false;

    // stop any loops if needed
    clearInterval(gameInterval);

    calculateAccuracy();

    calculateWPM();

    showResultScreen();
}
/* ========================================= */
/* AFTER MATCH SAVE */
/* ========================================= */

function updateAfterMatch(win) {

    if (win) {
        gameState.wins = (gameState.wins || 0) + 1;
    } else {
        gameState.losses = (gameState.losses || 0) + 1;
    }

    savePlayerProfile();
}
/* ========================================= */
/* SHOW RESULT SCREEN */
/* ========================================= */

function showResultScreen() {

    showScreen("resultScreen");

    const win = gameState.score >= 50;

    document.getElementById("resultTitle").innerText =
        win ? "Victory!" : "Defeat";

    document.getElementById("resultSubtitle").innerText =
        win ? "You dominated the match!" : "Try again and improve!";

    // result stats
    document.getElementById("finalScore").innerText = gameState.score;
    document.getElementById("finalWPM").innerText = gameState.wpm;
    document.getElementById("finalAccuracy").innerText = gameState.accuracy + "%";

    document.getElementById("bestComboResult").innerText = gameState.bestCombo + "x";

    // MMR
    let mmrChange = win ? 25 : -15;
    gameState.mmr += mmrChange;

    document.getElementById("mmrChange").innerText =
        (mmrChange > 0 ? "+" : "") + mmrChange;

    // XP system
    let xpGain = gameState.score + gameState.correct * 5;

    gameState.xp += xpGain;

    document.getElementById("xpEarned").innerText = "+" + xpGain;

    levelUpCheck();

    saveData();
}

/* ========================================= */
/* LEVEL SYSTEM */
/* ========================================= */

function levelUpCheck() {

    let requiredXP = gameState.level * 100;

    if (gameState.xp >= requiredXP) {

        gameState.level++;

        gameState.xp = 0;

        showToast("Level Up! You are now Level " + gameState.level);
    }
}

/* ========================================= */
/* SAVE DATA (LOCAL STORAGE) */
/* ========================================= */

function saveData() {

    localStorage.setItem("typingBattleData", JSON.stringify(gameState));
}

/* ========================================= */
/* LOAD DATA */
/* ========================================= */

function loadData() {

    let data = localStorage.getItem("typingBattleData");

    if (data) {

        gameState = JSON.parse(data);
    }
}

/* ========================================= */
/* BUTTON EVENTS (RESULT SCREEN) */
/* ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadData();

    const playAgainBtn = document.getElementById("playAgainBtn");
    const backMenuBtn = document.getElementById("backMenuBtn");

    if (playAgainBtn) {

        playAgainBtn.onclick = () => {

            showScreen("queueScreen");

            setTimeout(() => {

                showScreen("vsScreen");

                setTimeout(() => {

                    startCountdown();

                }, 1500);

            }, 1500);
        };
    }

    if (backMenuBtn) {

        backMenuBtn.onclick = () => {

            showScreen("menuScreen");
        };
    }

});

/* ========================================= */
/* AUTO END MATCH TIMER (OPTIONAL) */
/* ========================================= */

setInterval(() => {

    if (!gameState.inMatch) return;

    gameState.score += 0; // keep alive

    // auto end match if score high enough
    if (gameState.correct >= 15) {

        endGame();
    }

}, 2000);

/* ========================================= */
/* FINAL CLEANUP */
/* ========================================= */

console.log("Typing Battle Loaded Successfully ⚡");
/* ========================================= */
/* SAVE / UPDATE PLAYER PROFILE */
/* ========================================= */

function savePlayerProfile() {

    let playerId = localStorage.getItem("playerId");

    if (!playerId) {
        playerId = "player_" + Math.floor(Math.random() * 999999);
        localStorage.setItem("playerId", playerId);
    }

    const playerData = {
        name: gameState.playerName,
        mmr: gameState.mmr,
        level: gameState.level,
        xp: gameState.xp,
        wins: gameState.wins || 0,
        losses: gameState.losses || 0,
        wpm: gameState.wpm,
        accuracy: gameState.accuracy
    };

    db.ref("players/" + playerId).set(playerData);
    db.ref("leaderboard/" + playerId).set({
        name: gameState.playerName,
        mmr: gameState.mmr
    });
}
/* ========================================= */
/* LOAD PLAYER PROFILE */
/* ========================================= */

function loadPlayerProfile() {

    let playerId = localStorage.getItem("playerId");

    if (!playerId) return;

    db.ref("players/" + playerId).once("value", (snap) => {

        if (snap.exists()) {

            const data = snap.val();

            gameState = {
                ...gameState,
                ...data
            };

            updateProfileUI();
        }
    });
}
/* ========================================= */
/* UPDATE UI */
/* ========================================= */

function updateProfileUI() {

    document.getElementById("playerName") &&
        (document.getElementById("playerName").innerText = gameState.playerName);

    document.getElementById("playerRank") &&
        (document.getElementById("playerRank").innerText = getRank(gameState.mmr));

    document.getElementById("playerLevel") &&
        (document.getElementById("playerLevel").innerText = gameState.level);

    document.getElementById("mmr") &&
        (document.getElementById("mmr").innerText = gameState.mmr);
}
/* ========================================= */
/* RANK SYSTEM */
/* ========================================= */

function getRank(mmr) {

    if (mmr >= 2400) return "Master";
    if (mmr >= 2000) return "Diamond";
    if (mmr >= 1600) return "Platinum";
    if (mmr >= 1200) return "Gold";
    if (mmr >= 900) return "Silver";
    return "Bronze";
}
/* ========================================= */
/* LOAD LEADERBOARD */
/* ========================================= */

function loadLeaderboard() {

    const list = document.getElementById("leaderboardList");

    db.ref("leaderboard")
        .orderByChild("mmr")
        .limitToLast(10)
        .on("value", (snap) => {

            let data = [];

            snap.forEach(child => {
                data.push(child.val());
            });

            data.reverse();

            if (list) {

                list.innerHTML = "";

                data.forEach((p, i) => {

                    list.innerHTML += `
                        <div class="leaderboard-item">
                            <span>#${i + 1} ${p.name}</span>
                            <span>${p.mmr} MMR</span>
                        </div>
                    `;
                });
            }
        });
}
