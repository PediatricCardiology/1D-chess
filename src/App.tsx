/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Board, Color, INITIAL_BOARD, getLegalMoves, getBestMove, checkGameStatus, getColor, isKingInCheck } from './gameLogic';

const PieceIcon = ({ type }: { type: string }) => {
  const isWhite = type === type.toUpperCase();
  const char = type.toLowerCase() === 'k' ? '♚' : type.toLowerCase() === 'n' ? '♞' : '♜';
  
  return (
    <span 
      className={`text-5xl md:text-6xl select-none flex items-center justify-center w-full h-full ${isWhite ? 'text-slate-100' : 'text-slate-900'}`}
      style={{
        WebkitTextStroke: isWhite ? '2px #0f172a' : '2px #cbd5e1',
      }}
    >
      {char}
    </span>
  );
};

export default function App() {
  const [board, setBoard] = useState<Board>(INITIAL_BOARD);
  const [turn, setTurn] = useState<Color>('w');
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([INITIAL_BOARD.map(p => p || '-').join('')]);
  const [status, setStatus] = useState<string>('playing');
  const [legalMoves, setLegalMoves] = useState<{from: number, to: number}[]>([]);

  useEffect(() => {
    if (status !== 'playing') return;

    if (turn === 'b') {
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board, 'b');
        if (bestMove) {
          makeMove(bestMove.from, bestMove.to);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setLegalMoves(getLegalMoves(board, 'w'));
    }
  }, [turn, board, status]);

  const makeMove = (from: number, to: number) => {
    const newBoard = [...board];
    newBoard[to] = newBoard[from];
    newBoard[from] = null;
    
    const newHistory = [...history, newBoard.map(p => p || '-').join('')];
    const nextTurn = turn === 'w' ? 'b' : 'w';
    
    setBoard(newBoard);
    setHistory(newHistory);
    setTurn(nextTurn);
    setSelectedSquare(null);
    
    const newStatus = checkGameStatus(newBoard, nextTurn, newHistory);
    setStatus(newStatus);
  };

  const handleSquareClick = (index: number) => {
    if (status !== 'playing' || turn !== 'w') return;

    if (selectedSquare === null) {
      if (getColor(board[index]) === 'w') {
        setSelectedSquare(index);
      }
    } else {
      if (selectedSquare === index) {
        setSelectedSquare(null);
      } else if (getColor(board[index]) === 'w') {
        setSelectedSquare(index);
      } else {
        const move = legalMoves.find(m => m.from === selectedSquare && m.to === index);
        if (move) {
          makeMove(move.from, move.to);
        } else {
          setSelectedSquare(null);
        }
      }
    }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setTurn('w');
    setSelectedSquare(null);
    setHistory([INITIAL_BOARD.map(p => p || '-').join('')]);
    setStatus('playing');
    setLegalMoves(getLegalMoves(INITIAL_BOARD, 'w'));
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'white_won': return 'White wins by checkmate!';
      case 'black_won': return 'Black wins by checkmate!';
      case 'draw_stalemate': return 'Draw by stalemate!';
      case 'draw_repetition': return 'Draw by 3-fold repetition!';
      case 'draw_material': return 'Draw by insufficient material!';
      default: return isKingInCheck(board, turn) ? 'Check!' : '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-mono flex flex-col items-center">
      <div className="w-full bg-slate-950 py-6 text-center shadow-md mb-8">
        <h1 className="text-4xl font-bold text-emerald-400 mb-2">1D-Chess</h1>
      </div>

      <div className="max-w-4xl w-full px-4">
        <div className="flex justify-center mb-4">
          <div className="flex border-4 border-slate-950 shadow-lg">
            {board.map((piece, index) => {
              const isLight = index % 2 === 0;
              const isSelected = selectedSquare === index;
              const isValidMove = selectedSquare !== null && legalMoves.some(m => m.from === selectedSquare && m.to === index);
              
              return (
                <div 
                  key={index}
                  onClick={() => handleSquareClick(index)}
                  className={`
                    w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center cursor-pointer relative
                    ${isLight ? 'bg-slate-300' : 'bg-slate-500'}
                    ${isSelected ? 'ring-inset ring-4 ring-emerald-400' : ''}
                  `}
                >
                  {piece && <PieceIcon type={piece} />}
                  {isValidMove && (
                    <div className="absolute w-4 h-4 rounded-full bg-black/30" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <button 
            onClick={resetGame}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded shadow transition-colors"
          >
            Restart Game
          </button>
        </div>

        <div className="text-center mb-6 h-8">
          <p className="text-xl font-bold text-white">{getStatusMessage()}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg shadow-md text-slate-300 mb-8">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">1D-Chess</h2>
          <p className="mb-8">
            1d-chess is a new variant where you can play the beautiful game without all those unneccessary and complicated extra dimensions. Play as white against the AI. You might initally find it more difficult than expected, but assming optimal play, is there a forced win for white?
          </p>

          <h3 className="text-xl font-bold text-emerald-400 mb-2">Rules</h3>
          <p className="mb-4 text-slate-400">There are three pieces in 1d-chess:</p>
          
          <div className="space-y-4 mb-6">
            <div>
              <span className="font-bold text-emerald-400">King:</span><br/>
              <span className="text-sky-400">Can move one square in any direction.</span>
            </div>
            <div>
              <span className="font-bold text-emerald-400">Knight:</span><br/>
              <span className="text-sky-400">Can move 2 squares forward or backward. (jumping over any pieces in the way)</span>
            </div>
            <div>
              <span className="font-bold text-emerald-400">Rook:</span><br/>
              <span className="text-sky-400">Can move in a straight line in any direction.</span>
            </div>
          </div>

          <p className="mb-4 text-slate-400">
            Win by checkmating the enemy king. This occurs when the enemy king is in check (under attack by one of your pieces) and there are no legal moves for the opponent to get their king out of check.
          </p>

          <p className="mb-2 text-slate-400">Careful! A draw can occur if:</p>
          <ul className="list-disc pl-6 mb-6 text-slate-400 space-y-1">
            <li>A player is <span className="text-rose-400">not</span> in check and there are no legal moves for them to play <span className="text-purple-400">(Stalemate)</span></li>
            <li>The same board position is repeated 3 times in a game. <span className="text-purple-400">(3 Fold Repetition)</span></li>
            <li>There are only kings left on the board, thus it is impossible to checkmate the opponent <span className="text-purple-400">(Insufficient Material)</span></li>
          </ul>

          <h3 className="text-xl font-bold text-emerald-400 mb-2">Credits</h3>
          <p className="text-slate-400">
            This chess variant was first described by <span className="text-pink-400">Martin Gardner</span> in the Mathematical Games column of the July 1980 issue of <span className="italic">Scientific American</span><br/>
            See <a href="#" className="text-sky-400 hover:underline">The column on JSTOR</a>
          </p>
        </div>
      </div>
    </div>
  );
}
