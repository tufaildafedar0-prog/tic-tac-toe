// Select cells, status text, and reset button
const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const resetBtn = document.getElementById("reset");

//  Sound Effects
const soundX = new Audio("sound/X.wav");
const soundO = new Audio("sound/O.wav");
const soundWin = new Audio("sound/Win.wav");
const soundDraw = new Audio("sound/Draw.wav");
const soundWrong = new Audio("sound/Wrong.wav");

// Scoreboard elements
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreDrawEl = document.getElementById("scoreDraw");

// Game state
let currentPlayer = "X";
let board = ["", "", "", "", "", "", "", "", ""];
let running = true;
let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;

// Winning patterns
const winPatterns = 
[
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// Event listeners
cells.forEach(cell => cell.addEventListener("click", cellClicked));
resetBtn.addEventListener("click", restartGame);

// Cell click handler
function cellClicked() 
{
  const index = this.dataset.index;

  // Invalid click: already filled or game over
  if(board[index] !== "" || !running) 
  {
    this.classList.add("shake");
    soundWrong.play();
    setTimeout(() => this.classList.remove("shake"), 400);
    return;
  }

  // Place player's symbol
  board[index] = currentPlayer;
  this.innerHTML = `<span>${currentPlayer}</span>`;

  // Play move sound
  currentPlayer === "X" ? soundX.play() : soundO.play();

  // Check winner or draw
  checkWinner();
}

// Check Winner / Draw
function checkWinner() 
{
  let winnerFound = false;
  let winningCombo = null;

  for(let pattern of winPatterns) 
  {
    const [a,b,c] = pattern;
    if(board[a] && board[a] === board[b] && board[a] === board[c]) {
      winnerFound = true;
      winningCombo = pattern;
      break;
    }
  }

  if(winnerFound) 
  {
    statusText.textContent = `Player ${currentPlayer} Wins! 🎉`;
    running = false;
    soundWin.play();

    // Highlight winning cells
    winningCombo.forEach(i => cells[i].classList.add("winner"));

    // Update score
    if(currentPlayer === "X") 
    {
      scoreX++;
      scoreXEl.textContent = scoreX;
    } 
    else 
    {
      scoreO++;
      scoreOEl.textContent = scoreO;
    }
  }
  else if(!board.includes("")) 
  {
    statusText.textContent = "It's a Draw! 🤝";
    running = false;
    soundDraw.play();

    scoreDraw++;
    scoreDrawEl.textContent = scoreDraw;
  }
  else 
  {
    currentPlayer = (currentPlayer === "X") ? "O" : "X";
    statusText.textContent = `Player ${currentPlayer}'s Turn`;
  }
}

// Restart game
function restartGame() 
{
  currentPlayer = "X";
  board = ["", "", "", "", "", "", "", "", ""];
  running = true;
  statusText.textContent = "Player X’s Turn";

  cells.forEach(cell => {
    cell.innerHTML = "";
    cell.classList.remove("winner");
  });
}
