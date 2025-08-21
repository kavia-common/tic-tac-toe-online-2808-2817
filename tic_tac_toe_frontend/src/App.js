import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

// Utilities
const PRIMARY = '#1976D2';
const SECONDARY = '#FFC107';
const ACCENT = '#FF5252';

const defaultScores = { X: 0, O: 0, draws: 0 };

// Game helpers
const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6] // diagonals
];

function calculateWinner(squares) {
  for (const [a, b, c] of winningLines) {
    if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c]) {
      return { player: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

function getAvailableMoves(squares) {
  return squares.map((v, i) => (v ? null : i)).filter((v) => v !== null);
}

// Simple AI: tries to win, then block, else take center, a corner, or a side
function findBestMove(squares, aiPlayer) {
  const opponent = aiPlayer === 'X' ? 'O' : 'X';

  // 1. Try to win
  for (const move of getAvailableMoves(squares)) {
    const copy = squares.slice();
    copy[move] = aiPlayer;
    if (calculateWinner(copy)?.player === aiPlayer) return move;
  }
  // 2. Block opponent
  for (const move of getAvailableMoves(squares)) {
    const copy = squares.slice();
    copy[move] = opponent;
    if (calculateWinner(copy)?.player === opponent) return move;
  }
  // 3. Take center
  if (!squares[4]) return 4;
  // 4. Take a corner
  const corners = [0, 2, 6, 8].filter((i) => !squares[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // 5. Take a side
  const sides = [1, 3, 5, 7].filter((i) => !squares[i]);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];
  return null;
}

// UI Components
function Header({ theme, onToggleTheme }) {
  return (
    <div className="navbar">
      <div className="brand">
        <span className="brand-logo" aria-hidden>❌⭕</span>
        <span className="brand-text">Tic Tac Toe</span>
      </div>
      <div className="actions">
        <button
          className="btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </div>
  );
}

function ModeToggle({ mode, setMode, disabled }) {
  return (
    <div className="mode-toggle" role="radiogroup" aria-label="Game mode">
      <button
        className={`btn ${mode === 'pvp' ? 'btn-active' : ''}`}
        onClick={() => setMode('pvp')}
        disabled={disabled}
        role="radio"
        aria-checked={mode === 'pvp'}
      >
        Player vs Player
      </button>
      <button
        className={`btn ${mode === 'ai' ? 'btn-active secondary' : 'secondary'}`}
        onClick={() => setMode('ai')}
        disabled={disabled}
        role="radio"
        aria-checked={mode === 'ai'}
      >
        Player vs AI
      </button>
    </div>
  );
}

function ScorePanel({ scores, currentPlayer, mode }) {
  return (
    <div className="score-panel" aria-live="polite">
      <div className="score">
        <span className="badge x">X</span>
        <span className="score-value">{scores.X}</span>
      </div>
      <div className="status">
        <div className="subtitle">Turn</div>
        <div className="turn-indicator">
          <span className={`chip ${currentPlayer === 'X' ? 'active' : ''}`}>X</span>
          <span className="divider">/</span>
          <span className={`chip ${currentPlayer === 'O' ? 'active' : ''}`}>O</span>
        </div>
        <div className="mode-label" title="Current mode">
          {mode === 'ai' ? 'vs AI' : 'vs Player'}
        </div>
      </div>
      <div className="score">
        <span className="badge o">O</span>
        <span className="score-value">{scores.O}</span>
      </div>
    </div>
  );
}

function Board({ squares, onClick, winningLine }) {
  return (
    <div
      className="board"
      role="grid"
      aria-label="Tic Tac Toe board"
      aria-describedby="board-help"
    >
      {squares.map((value, idx) => {
        const isWinning = winningLine?.includes(idx);
        return (
          <button
            key={idx}
            className={`cell ${isWinning ? 'win' : ''}`}
            onClick={() => onClick(idx)}
            role="gridcell"
            aria-label={`Cell ${idx + 1}${value ? `, ${value}` : ', empty'}`}
            disabled={!!value || !!winningLine}
          >
            {value === 'X' && <span className="mark x">X</span>}
            {value === 'O' && <span className="mark o">O</span>}
          </button>
        );
      })}
      <p id="board-help" className="sr-only">
        3 by 3 grid. Click an empty cell to place your mark.
      </p>
    </div>
  );
}

function FooterControls({ onReset, onNewRound, canNewRound, resultLabel }) {
  return (
    <div className="controls">
      <button className="btn danger" onClick={onReset} aria-label="Reset scores and board">
        Reset All
      </button>
      <div className="result" aria-live="polite">
        {resultLabel}
      </div>
      <button
        className="btn success"
        onClick={onNewRound}
        disabled={!canNewRound}
        aria-label="Start a new round"
      >
        New Round
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Root application for Tic Tac Toe game UI and logic. */
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState('ai'); // 'ai' or 'pvp'
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState(() => {
    const raw = localStorage.getItem('ttt_scores');
    return raw ? JSON.parse(raw) : defaultScores;
  });

  const winnerInfo = useMemo(() => calculateWinner(squares), [squares]);
  const isDraw = !winnerInfo && squares.every(Boolean);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ttt_scores', JSON.stringify(scores));
  }, [scores]);

  // Handle AI move when it's O's turn and mode is AI and no winner
  useEffect(() => {
    if (mode !== 'ai' || winnerInfo || isDraw) return;
    const current = xIsNext ? 'X' : 'O';
    if (current === 'O') {
      const timer = setTimeout(() => {
        const move = findBestMove(squares, 'O');
        if (move !== null && squares[move] == null) {
          handleMove(move);
        }
      }, 450); // small delay for UX
      return () => clearTimeout(timer);
    }
  }, [mode, xIsNext, squares, winnerInfo, isDraw]);

  function handleMove(index) {
    if (squares[index] || winnerInfo) return;
    const next = squares.slice();
    next[index] = xIsNext ? 'X' : 'O';
    setSquares(next);
    setXIsNext((v) => !v);
  }

  function applyRoundResult() {
    if (winnerInfo) {
      setScores((s) => ({ ...s, [winnerInfo.player]: s[winnerInfo.player] + 1 }));
    } else if (isDraw) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
    }
  }

  useEffect(() => {
    if (winnerInfo || isDraw) {
      applyRoundResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winnerInfo?.player, isDraw]);

  const winningLine = winnerInfo?.line || null;
  const currentPlayer = xIsNext ? 'X' : 'O';

  const resultLabel = winnerInfo
    ? `Winner: ${winnerInfo.player}!`
    : isDraw
    ? 'Draw!'
    : `Playing...`;

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  // PUBLIC_INTERFACE
  const resetAll = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setScores(defaultScores);
    localStorage.removeItem('ttt_scores');
  };

  // PUBLIC_INTERFACE
  const newRound = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };

  const canNewRound = !!winnerInfo || isDraw;

  return (
    <div className="App">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <main className="container">
        <ModeToggle mode={mode} setMode={setMode} disabled={squares.some(Boolean) && !canNewRound} />
        <ScorePanel scores={scores} currentPlayer={currentPlayer} mode={mode} />
        <Board squares={squares} onClick={handleMove} winningLine={winningLine} />
        <FooterControls
          onReset={resetAll}
          onNewRound={newRound}
          canNewRound={canNewRound}
          resultLabel={resultLabel}
        />
        <div className="draws">
          Draws: <strong>{scores.draws}</strong>
        </div>
      </main>
    </div>
  );
}

export default App;
