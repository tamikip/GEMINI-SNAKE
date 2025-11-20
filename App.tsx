import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './components/Board';
import {
  Direction,
  GameStatus,
  Point,
  Snake,
} from './types';
import {
  GRID_SIZE,
  INITIAL_SPEED,
  MIN_SPEED,
  SPEED_DECREMENT,
  INITIAL_SNAKE,
  INITIAL_DIRECTION,
  KEY_MAP,
} from './constants';

// --- Helpers ---

const getRandomPosition = (snake: Snake): Point => {
  let newPos: Point;
  while (true) {
    newPos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // Ensure food doesn't spawn on the snake
    const onSnake = snake.some((seg) => seg.x === newPos.x && seg.y === newPos.y);
    if (!onSnake) break;
  }
  return newPos;
};

const isOppositeDirection = (dir1: Direction, dir2: Direction) => {
  if (dir1 === Direction.UP && dir2 === Direction.DOWN) return true;
  if (dir1 === Direction.DOWN && dir2 === Direction.UP) return true;
  if (dir1 === Direction.LEFT && dir2 === Direction.RIGHT) return true;
  if (dir1 === Direction.RIGHT && dir2 === Direction.LEFT) return true;
  return false;
};

// --- Components ---

const DPadButton: React.FC<{ 
  direction: Direction; 
  onClick: (d: Direction) => void; 
  icon: string;
  className?: string;
}> = ({ direction, onClick, icon, className }) => (
  <button
    className={`w-16 h-16 bg-zinc-800/80 backdrop-blur-sm rounded-2xl border border-zinc-700 shadow-lg active:bg-emerald-600 active:border-emerald-500 active:scale-95 transition-all flex items-center justify-center text-2xl select-none touch-manipulation ${className}`}
    onPointerDown={(e) => {
      e.preventDefault();
      onClick(direction);
    }}
  >
    {icon}
  </button>
);

// --- Main App ---

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Snake>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // Mutable refs for game loop to avoid stale closures
  const snakeRef = useRef(snake);
  const directionRef = useRef(direction); // Current moving direction
  const lastProcessedDirectionRef = useRef(direction); // Direction processed in last tick
  const speedRef = useRef(speed);
  const gameLoopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync refs with state
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Load High Score
  useEffect(() => {
    const stored = localStorage.getItem('neon-snake-highscore');
    if (stored) setHighScore(parseInt(stored, 10));
    // Initial random food
    setFood(getRandomPosition(INITIAL_SNAKE));
  }, []);

  // Update High Score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('neon-snake-highscore', score.toString());
    }
  }, [score, highScore]);

  // --- Game Logic ---

  const gameOver = useCallback(() => {
    setStatus(GameStatus.GAME_OVER);
    if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
  }, []);

  const moveSnake = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    const currentHead = snakeRef.current[0];
    const currentDir = directionRef.current;
    lastProcessedDirectionRef.current = currentDir;

    const newHead = { ...currentHead };

    // Calculate new head position
    switch (currentDir) {
      case Direction.UP: newHead.y -= 1; break;
      case Direction.DOWN: newHead.y += 1; break;
      case Direction.LEFT: newHead.x -= 1; break;
      case Direction.RIGHT: newHead.x += 1; break;
    }

    // Wall Collision
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      gameOver();
      return;
    }

    // Self Collision
    // We don't check the very last tail segment if we are moving (it will move away),
    // but for simplicity and safety (and since we might eat), checking all except tail if not eating is tricky.
    // Simple check: does newHead exist in current body?
    // If we are eating, tail doesn't move, so full collision check.
    // If we are NOT eating, tail moves, so technically we can move into the tail's current spot.
    // However, standard snake usually disallows 180 turns which handles the neck, and tail chasing is rare edge case.
    // Let's do strict check:
    if (snakeRef.current.some((seg, index) => {
      // If we are about to pop the tail, ignore the last segment?
      // Only if not eating.
      // Let's just simplify: if newHead hits ANY part of existing snake, die.
      // This makes it slightly harder (can't chase immediate tail) but safer implementation.
      if (index === snakeRef.current.length - 1) return false; // loosen up for tail
      return seg.x === newHead.x && seg.y === newHead.y;
    })) {
      gameOver();
      return;
    }

    const isEating = newHead.x === food.x && newHead.y === food.y;
    
    let newSnake = [newHead, ...snakeRef.current];
    
    if (isEating) {
      // Don't pop tail
      setScore(s => s + 10);
      setSpeed(s => Math.max(MIN_SPEED, s - SPEED_DECREMENT));
      setFood(getRandomPosition(newSnake));
    } else {
      newSnake.pop(); // Remove tail
    }

    setSnake(newSnake);

    // Schedule next tick
    gameLoopTimeoutRef.current = setTimeout(moveSnake, speedRef.current);
  }, [food, status, gameOver]);

  // Start/Stop Loop
  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      gameLoopTimeoutRef.current = setTimeout(moveSnake, speed);
    } else {
      if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
    }
    return () => {
      if (gameLoopTimeoutRef.current) clearTimeout(gameLoopTimeoutRef.current);
    };
  }, [status, moveSnake]); // Dependencies managed carefully

  // --- Controls ---

  const handleDirection = useCallback((newDir: Direction) => {
    // Prevent 180 turns based on the LAST PROCESSED direction (sim time), 
    // not the current user input (which might be buffered).
    if (!isOppositeDirection(newDir, lastProcessedDirectionRef.current)) {
      setDirection(newDir);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mappedDir = KEY_MAP[e.key];
      if (mappedDir) {
        handleDirection(mappedDir);
        // Auto-start if idle
        if (status === GameStatus.IDLE) setStatus(GameStatus.PLAYING);
      }
      if (e.code === 'Space') {
        e.preventDefault(); // Stop scroll
        if (status === GameStatus.PLAYING) setStatus(GameStatus.PAUSED);
        else if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
        else if (status === GameStatus.GAME_OVER || status === GameStatus.IDLE) startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, handleDirection]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setFood(getRandomPosition(INITIAL_SNAKE));
    setStatus(GameStatus.PLAYING);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-mono text-white relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),rgba(9,9,11,0))] pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-[500px] flex justify-between items-end mb-6 z-10">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
            NEON SNAKE
          </h1>
          <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{status === GameStatus.PLAYING ? 'Playing' : status}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-zinc-400 text-xs uppercase tracking-wider">Score</div>
          <div className="text-3xl font-bold text-white leading-none">{score}</div>
          <div className="text-zinc-500 text-xs mt-1">HI: {highScore}</div>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="relative z-10 w-full max-w-[500px]">
        <Board snake={snake} food={food} gameOver={status === GameStatus.GAME_OVER} />

        {/* Overlays */}
        {status === GameStatus.IDLE && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
            <button
              onClick={startGame}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all transform hover:scale-105"
            >
              START GAME
            </button>
          </div>
        )}
        
        {status === GameStatus.PAUSED && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
             <div className="text-2xl font-bold text-white animate-pulse">PAUSED</div>
          </div>
        )}

        {status === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/30 backdrop-blur-md rounded-lg border border-red-500/30">
            <h2 className="text-3xl font-bold text-red-400 mb-2 drop-shadow-lg">GAME OVER</h2>
            <div className="text-zinc-300 mb-6">Final Score: {score}</div>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors shadow-lg"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 z-10 w-full max-w-[500px]">
        {/* Desktop Instructions */}
        <div className="hidden md:flex justify-center gap-8 text-zinc-500 text-sm">
          <span>Use ARROWS or WASD to move</span>
          <span>SPACE to Pause/Resume</span>
        </div>

        {/* Mobile D-Pad */}
        <div className="md:hidden grid grid-cols-3 gap-3 mx-auto max-w-[240px]">
          <div />
          <DPadButton direction={Direction.UP} onClick={handleDirection} icon="▲" />
          <div />
          <DPadButton direction={Direction.LEFT} onClick={handleDirection} icon="◀" />
          <DPadButton direction={Direction.DOWN} onClick={handleDirection} icon="▼" />
          <DPadButton direction={Direction.RIGHT} onClick={handleDirection} icon="▶" />
        </div>
      </div>
    </div>
  );
}