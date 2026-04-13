export type Piece = 'K' | 'N' | 'R' | 'k' | 'n' | 'r' | null;
export type Board = Piece[];
export type Color = 'w' | 'b';

export const INITIAL_BOARD: Board = ['K', 'N', 'R', null, null, 'r', 'n', 'k'];

export function getColor(piece: Piece): Color | null {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

export function getPseudoLegalMoves(board: Board, color: Color): {from: number, to: number}[] {
  const moves: {from: number, to: number}[] = [];
  for (let i = 0; i < 8; i++) {
    const piece = board[i];
    if (getColor(piece) === color) {
      const type = piece!.toLowerCase();
      if (type === 'k') {
        if (i > 0 && getColor(board[i-1]) !== color) moves.push({from: i, to: i-1});
        if (i < 7 && getColor(board[i+1]) !== color) moves.push({from: i, to: i+1});
      } else if (type === 'n') {
        if (i > 1 && getColor(board[i-2]) !== color) moves.push({from: i, to: i-2});
        if (i < 6 && getColor(board[i+2]) !== color) moves.push({from: i, to: i+2});
      } else if (type === 'r') {
        for (let j = i - 1; j >= 0; j--) {
          if (getColor(board[j]) === color) break;
          moves.push({from: i, to: j});
          if (board[j] !== null) break;
        }
        for (let j = i + 1; j < 8; j++) {
          if (getColor(board[j]) === color) break;
          moves.push({from: i, to: j});
          if (board[j] !== null) break;
        }
      }
    }
  }
  return moves;
}

export function isSquareAttacked(board: Board, index: number, attackerColor: Color): boolean {
  const enemyMoves = getPseudoLegalMoves(board, attackerColor);
  return enemyMoves.some(m => m.to === index);
}

export function isKingInCheck(board: Board, color: Color): boolean {
  const kingPiece = color === 'w' ? 'K' : 'k';
  const kingIndex = board.indexOf(kingPiece);
  if (kingIndex === -1) return false;
  const attackerColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, kingIndex, attackerColor);
}

export function getLegalMoves(board: Board, color: Color): {from: number, to: number}[] {
  const pseudoMoves = getPseudoLegalMoves(board, color);
  return pseudoMoves.filter(move => {
    const newBoard = [...board];
    newBoard[move.to] = newBoard[move.from];
    newBoard[move.from] = null;
    return !isKingInCheck(newBoard, color);
  });
}

export function evaluateBoard(board: Board): number {
  let score = 0;
  for (let i = 0; i < 8; i++) {
    const piece = board[i];
    if (piece) {
      const value = piece.toLowerCase() === 'k' ? 10000 : piece.toLowerCase() === 'r' ? 50 : piece.toLowerCase() === 'n' ? 30 : 0;
      score += getColor(piece) === 'w' ? value : -value;
    }
  }
  return score;
}

export function minimax(board: Board, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
  const color = isMaximizing ? 'w' : 'b';
  const legalMoves = getLegalMoves(board, color);
  
  if (depth === 0 || legalMoves.length === 0) {
    if (legalMoves.length === 0) {
      if (isKingInCheck(board, color)) {
        return isMaximizing ? -100000 + depth : 100000 - depth;
      }
      return 0; // Stalemate
    }
    return evaluateBoard(board);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const newBoard = [...board];
      newBoard[move.to] = newBoard[move.from];
      newBoard[move.from] = null;
      const ev = minimax(newBoard, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const newBoard = [...board];
      newBoard[move.to] = newBoard[move.from];
      newBoard[move.from] = null;
      const ev = minimax(newBoard, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(board: Board, color: Color): {from: number, to: number} | null {
  const legalMoves = getLegalMoves(board, color);
  if (legalMoves.length === 0) return null;

  let bestMove = legalMoves[0];
  let bestValue = color === 'w' ? -Infinity : Infinity;

  const shuffledMoves = [...legalMoves].sort(() => Math.random() - 0.5);

  for (const move of shuffledMoves) {
    const newBoard = [...board];
    newBoard[move.to] = newBoard[move.from];
    newBoard[move.from] = null;
    
    const moveValue = minimax(newBoard, 7, -Infinity, Infinity, color === 'b');
    
    if (color === 'w') {
      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    } else {
      if (moveValue < bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    }
  }
  return bestMove;
}

export function checkGameStatus(board: Board, turn: Color, history: string[]): string {
  const legalMoves = getLegalMoves(board, turn);
  if (legalMoves.length === 0) {
    if (isKingInCheck(board, turn)) {
      return turn === 'w' ? 'black_won' : 'white_won';
    } else {
      return 'draw_stalemate';
    }
  }

  const pieces = board.filter(p => p !== null);
  if (pieces.length === 2 && pieces.includes('K') && pieces.includes('k')) {
    return 'draw_material';
  }

  const boardStr = board.map(p => p || '-').join('');
  const count = history.filter(h => h === boardStr).length;
  if (count >= 3) {
    return 'draw_repetition';
  }

  return 'playing';
}
