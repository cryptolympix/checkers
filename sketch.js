let CANVAS_DIM = 800;
if (window.innerWidth <= 900) CANVAS_DIM = (9 * window.innerWidth) / 10;

let SHOW_MOVES = false;
let SHOW_MOVES_WEIGHT = false;

let AI_COLOR = '#DEB887';
let HUMAN_COLOR = '#8B0000';
let FOCUS_COLOR = '#6666';
let INFO_COLOR = '#4682B4';
let SHOW_COLOR = '#4682B4';
let DARK_SQUARE_COLOR = 'black';
let LIGHT_SQUARE_COLOR = 'white';

let kingImg;
let infoView;
let toggleButton;

let gameMsg = "It's your turn";
let gameMsgColor = HUMAN_COLOR;

let end;
let board;
let players = { HUMAN: 'human', AI: 'ai' };
let currentPlayer;

let pieceSelected = null;
let pieceInAnimation = null;
let requiredMoves = [];

function preload() {
  kingImg = loadImage('https://image.flaticon.com/icons/svg/2057/2057084.svg');
}

function setup() {
  infoView = createDiv();
  createCanvas(CANVAS_DIM, CANVAS_DIM);
  toggleButton = createButton();
  board = new Board(CANVAS_DIM, 10);
  currentPlayer = players.HUMAN;
  end = false;
}

function draw() {
  background(255);

  drawGameInfo();
  board.draw();
  drawToggleButton();

  // The AI plays when it's his turn and when the move animation of the human is end
  if (currentPlayer === players.AI && !pieceInAnimation) {
    gameMsg = 'AI is searching a move...';
    gameMsgColor = AI_COLOR;
    setTimeout(function () {
      AI();
      gameMsg = "It's your turn";
      gameMsgColor = HUMAN_COLOR;
    }, 500);
  }

  if (end) {
    noLoop();
  }
}

function drawGameInfo() {
  infoView.html(
    `<div class="info-block">
      <div class="count-block">
        <span class="circle red"></span>
        <p class="count">${board.getNumberOfPieces(players.HUMAN)}</p>
      </div>
      <div class="count-block">
        <span class="circle brown"></span>
        <p class="count">${board.getNumberOfPieces(players.AI)}</p>
      </div>
    </div>
    <div class="info-block">
      <p class="game-msg" style="color:${gameMsgColor}">${gameMsg}</p>
    </div>`
  );
  infoView.id('info');
}

function drawToggleButton() {
  toggleButton.html(`<span>${SHOW_MOVES ? 'Hide the moves' : 'Show the moves'}</span>`);
  toggleButton.class('toggle-button');
  toggleButton.style('opacity', currentPlayer === players.AI ? '0.5' : '1');
  toggleButton.mousePressed(function () {
    if (currentPlayer === players.HUMAN) {
      SHOW_MOVES = !SHOW_MOVES;
    }
  });
}

function mouseReleased() {
  if (
    end ||
    mouseX < 0 ||
    mouseX > board.pixelDim ||
    mouseY < 0 ||
    mouseY > board.pixelDim
  )
    return;

  /**
   * Find a mose specifying a destination
   * @param {Number} toCol - The column of the destination
   * @param {Number} toRow - The row of the destination
   * @param {Number} moves - An array of moves
   */
  function findMove(toCol, toRow, moves) {
    for (let move of moves) {
      if (move.to.col === toCol && move.to.row === toRow) {
        return move;
      }
    }
  }

  /**
   * Get the jumping moves for a player
   */
  function getJumpingMoves() {
    let result = [];
    for (let piece of board.getAllPieces(players.HUMAN)) {
      let moves = piece.getAvailableMoves();
      for (let move of moves) {
        if (move.isJumpingMove()) result.push(move);
      }
    }
    return result;
  }

  /**
   * Return true if the player can play a jumping move
   */
  function canPlayJumpingMove() {
    return getJumpingMoves().length > 0;
  }

  if (currentPlayer === players.HUMAN) {
    let i = floor(mouseX / board.squareDim);
    let j = floor(mouseY / board.squareDim);

    requiredMoves = [];

    if (board.hasPiece(i, j)) {
      // If we don't have selected a piece to move
      if (!pieceSelected) {
        if (board.getPiece(i, j).player === players.HUMAN)
          pieceSelected = board.getPiece(i, j);
      }
      // If we change the selected piece to move
      else {
        let piece = board.getPiece(i, j);
        if (piece.player === players.HUMAN) {
          pieceSelected = board.getPiece(i, j);
        } else {
          pieceSelected = null;
        }
      }
    }
    // If we have selected a piece and press on a free case
    else if (pieceSelected) {
      let moves = pieceSelected.getAvailableMoves();
      let wishedMove = findMove(i, j, moves);

      if (!wishedMove) {
        pieceSelected = null;
        return;
      }

      if (wishedMove.isJumpingMove()) {
        board.movePiece(pieceSelected, i, j);
        pieceSelected = null;
        let result = checkWinner();
        if (result) {
          end = true;
        } else {
          currentPlayer = players.AI;
        }
      } else {
        // If the player wants to play a basic move but a jumping move
        // is available, he must plays it instead of the basic one.
        if (canPlayJumpingMove()) {
          // Add the jumping moves to the required moves
          for (let move of getJumpingMoves()) {
            if (move.isJumpingMove()) {
              requiredMoves.push(move);
            }
          }
        } else {
          board.movePiece(pieceSelected, i, j);
          pieceSelected = null;
          let result = checkWinner();
          if (result) {
            end = true;
          } else {
            currentPlayer = players.AI;
          }
        }
      }
    }
  }
}

function AI() {
  /**
   * Check if the player can play
   * @param {String} player
   */
  function hasAvailableMove(player) {
    let total = 0;
    let pieces = board.getAllPieces(player);
    for (let piece of pieces) {
      total += piece.getAvailableMoves().length;
    }
    return total > 0;
  }

  if (currentPlayer === players.AI) {
    let bestMove = getBestMove();
    if (bestMove) {
      let pieceToMove = board.getPiece(bestMove.from.col, bestMove.from.row);
      board.movePiece(pieceToMove, bestMove.to.col, bestMove.to.row);
      let result = checkWinner();
      if (result) {
        end = true;
      } else {
        if (hasAvailableMove(players.HUMAN)) {
          currentPlayer = players.HUMAN;
        } else {
          end = true;
          gameMsg = 'You can no longer play';
          gameMsgColor = INFO_COLOR;
        }
      }
    }
    // Ai cannot plays anymore because there are no available moves
    else {
      end = true;
      gameMsg = 'The AI can no longer play';
      gameMsgColor = INFO_COLOR;
    }
  }
}

function checkWinner() {
  let winner = null;
  let piecePlayerCount = [0, 0];

  for (let p of board.getAllPieces()) {
    if (p.player === players.HUMAN) piecePlayerCount[0]++;
    if (p.player === players.AI) piecePlayerCount[1]++;
  }

  if (piecePlayerCount[0] === 0) winner = players.AI;
  if (piecePlayerCount[1] === 0) winner = players.HUMAN;

  if (winner) {
    gameMsg =
      winner === players.HUMAN ? 'Congratulation !' : 'AI is too strong for you...';
    gameMsgColor = winner === players.HUMAN ? 'green' : 'firebrick';
  }
  return winner;
}
