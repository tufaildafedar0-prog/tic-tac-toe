// ------------------- DOM & Sounds -------------------
const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const resetBtn = document.getElementById("reset");
const btnPVP = document.getElementById("btnPVP");
const btnPVAI = document.getElementById("btnPVAI");
const btnBack = document.getElementById("btnBack");

// -------Get AI DOM Elements ----------------
const aiEasyBtn = document.getElementById("aiEasy");
const aiMediumBtn = document.getElementById("aiMedium");
const aiHardBtn = document.getElementById("aiHard");

// Sounds (keep original paths)
const soundX = new Audio("sound/X.wav");
const soundO = new Audio("sound/O.wav");
const soundWin = new Audio("sound/Win.wav");
const soundDraw = new Audio("sound/Draw.wav");
const soundWrong = new Audio("sound/Wrong.wav");

// Scoreboard
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreDrawEl = document.getElementById("scoreDraw");
// Game container
const gameContainer = document.getElementById("gameContainer");

// ------------------- Game state -------------------
let currentPlayer = "X";
let board = Array(9).fill("");
let running = false; // start when mode selected
let gameMode = null; // "PVP" or "AI"
let difficulty = null; // "easy" | "medium" | "hard"
let aiThinking = false;

let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;

// Winning patterns
const winPatterns = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// ------------------- UI bindings -------------------
cells.forEach(cell => cell.addEventListener("click", onCellClick));
resetBtn.addEventListener("click", restartGame);
btnPVP.addEventListener("click", () => startMode("PVP"));
btnBack.addEventListener("click", backToMenu);

// AI modal difficulty buttons (start game after choice)
aiEasyBtn?.addEventListener("click", () => startModeFromModal("AI", "easy"));
aiMediumBtn?.addEventListener("click", () => startModeFromModal("AI", "medium"));
aiHardBtn?.addEventListener("click", () => startModeFromModal("AI", "hard"));

// ------------------- Mode flow -------------------
function startMode(mode) {
  gameMode = mode;
  difficulty = null;
  showGame();
  restartGame();
  running = true;
  setStatus("Player X’s Turn");
  // If PvP, nothing else; if AI but no difficulty chosen, show modal (handled by bootstrap trigger)
}

function startModeFromModal(mode, diff) {
  // close modal programmatically
  const modalEl = document.getElementById('aiModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();

  gameMode = mode;
  difficulty = diff;
  showGame();
  restartGame();
  running = true;
  setStatus(`Player X’s Turn — Mode: ${mode} (${diff})`);
}

// Back to menu
function backToMenu() {
  // reveal menu buttons, hide game
  gameContainer.classList.add('hidden');
  setStatus("Choose a mode to start");
  running = false;
  gameMode = null;
  difficulty = null;
}

// Display/hide game
function showGame() {
  gameContainer.classList.remove('hidden');
}

// Sound latency fix 
function playSound(audio) {
    audio.currentTime = 0;  
    audio.play();
}


// ------------------- Cell click handler -------------------
function onCellClick() {
  if (!running || aiThinking) {
    // block clicks if AI is thinking or game not started
    this.classList.add("shake");
    playSound(soundWrong);
    setTimeout(() => this.classList.remove("shake"), 250);
    return;
  }

  const index = Number(this.dataset.index);
  if (board[index] !== "") {
    this.classList.add("shake");
    playSound(soundWrong);
    setTimeout(() => this.classList.remove("shake"), 250);
    return;
  }

  // human move
  makeMove(index, currentPlayer);

  // if AI mode and game still running and it's now O's turn -> trigger AI
  if (gameMode === "AI" && running && currentPlayer === "O") {
    // AI plays after a short delay for natural feel
    aiThinking = true;
    setTimeout(() => {
      if (difficulty === "easy") aiPlayEasy();
      else if (difficulty === "medium") aiPlayMedium();
      else if (difficulty === "hard") aiPlayHard();
      aiThinking = false;
    }, 650);
  }
}

// ------------------- Core move & winner logic -------------------
function makeMove(index, player) {
  board[index] = player;
  cells[index].innerHTML = `<span>${player}</span>`;
  player === "X" ? playSound(soundX) : playSound(soundO);
  checkWinner();
}

function checkWinner() {
  let winnerFound = false;
  let winningCombo = null;

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      winnerFound = true;
      winningCombo = pattern;
      break;
    }
  }

  if (winnerFound) {
    setStatus(`Player ${currentPlayer} Wins! 🎉`);
    running = false;
    playSound(soundWin);
    winningCombo.forEach(i => cells[i].classList.add("winner"));

    if (currentPlayer === "X") {
      scoreX++; scoreXEl.textContent = scoreX;
    } else {
      scoreO++; scoreOEl.textContent = scoreO;
    }
    return;
  }

  if (!board.includes("")) {
    setStatus("It's a Draw! 🤝");
    running = false;
    playSound(soundDraw);
    scoreDraw++; scoreDrawEl.textContent = scoreDraw;
    return;
  }

  // switch player
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  setStatus(`Player ${currentPlayer}'s Turn`);
}

// ------------------- Restart & Helpers -------------------
function restartGame() {
  board = Array(9).fill("");
  currentPlayer = "X";
  running = true;
  aiThinking = false;
  cells.forEach(c => { c.innerHTML = ""; c.classList.remove("winner"); });
  setStatus("Player X’s Turn");
}

function setStatus(text) {
  statusText.textContent = text;
}

// ------------------- AI Implementations -------------------

// EASY: simple random move
function aiPlayEasy() {
  const empty = getEmptyIndexes(board);
  if (empty.length === 0) return;
  const choice = empty[Math.floor(Math.random() * empty.length)];
  makeMove(choice, "O");
}

// MEDIUM: try win -> block -> center -> corner -> side (some strategy)
function aiPlayMedium() {
  // 1) Try win
  let move = findWinningMove(board, "O");
  if (move !== -1) { makeMove(move, "O"); return; }

  // 2) Try block X
  move = findWinningMove(board, "X");
  if (move !== -1) { makeMove(move, "O"); return; }

  // 3) Take center
  if (board[4] === "") { makeMove(4, "O"); return; }

  // 4) Take opposite corner strategy / available corner
  const corners = [0,2,6,8];
  const availableCorners = corners.filter(i => board[i] === "");
  if (availableCorners.length > 0) {
    const pick = availableCorners[Math.floor(Math.random() * availableCorners.length)];
    makeMove(pick, "O");
    return;
  }

  // 5) fallback random
  aiPlayEasy();
}

// HARD: Minimax (unbeatable)
function aiPlayHard() {
  const best = minimaxDecision(board, "O");
  if (best !== null && best !== undefined) {
    makeMove(best, "O");
  } else {
    aiPlayMedium();
  }
}

// ------------------- Utility helpers -------------------
function getEmptyIndexes(bd) {
  return bd.map((v,i) => v === "" ? i : null).filter(i => i !== null);
}

// Find immediate winning move for player (returns index or -1)
function findWinningMove(bd, player) {
  const empty = getEmptyIndexes(bd);
  for (const idx of empty) {
    const copy = bd.slice();
    copy[idx] = player;
    if (isWinner(copy, player)) return idx;
  }
  return -1;
}

function isWinner(bd, player) {
  return winPatterns.some(p => bd[p[0]] === player && bd[p[1]] === player && bd[p[2]] === player);
}

// ------------------- Minimax (hard mode) -------------------
// Score: +10 for O win, -10 for X win, 0 draw. Minimax chooses max for O, min for X.
function minimaxDecision(bd, player) {
  let bestScore = -Infinity;
  let bestMove = null;
  const empties = getEmptyIndexes(bd);
  if (empties.length === 0) return null;

  for (const idx of empties) {
    const copy = bd.slice();
    copy[idx] = player;
    const score = minimax(copy, 0, false); // next is opponent
    if (score > bestScore) { bestScore = score; bestMove = idx; }
  }
  return bestMove;
}

function minimax(bd, depth, isMaximizing) {
  // terminal checks
  if (isWinner(bd, "O")) return 10 - depth;   // prefer quicker wins
  if (isWinner(bd, "X")) return depth - 10;   // prefer slower losses
  if (!bd.includes("")) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const idx of getEmptyIndexes(bd)) {
      const copy = bd.slice();
      copy[idx] = "O";
      const evalScore = minimax(copy, depth + 1, false);
      maxEval = Math.max(maxEval, evalScore);
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const idx of getEmptyIndexes(bd)) {
      const copy = bd.slice();
      copy[idx] = "X";
      const evalScore = minimax(copy, depth + 1, true);
      minEval = Math.min(minEval, evalScore);
    }
    return minEval;
  }
}
