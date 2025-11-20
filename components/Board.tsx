import React from 'react';
import { Point, Snake } from '../types';
import { GRID_SIZE } from '../constants';

interface BoardProps {
  snake: Snake;
  food: Point;
  gameOver: boolean;
}

export const Board: React.FC<BoardProps> = ({ snake, food, gameOver }) => {
  // Create a 1D array representing the grid to map over
  const gridCells = Array.from({ length: GRID_SIZE * GRID_SIZE });

  const getCellStyle = (index: number) => {
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);

    const isFood = food.x === x && food.y === y;
    // Check if this cell is part of the snake
    // We use findIndex to determine if it is head (index 0) or body
    const snakeIndex = snake.findIndex((segment) => segment.x === x && segment.y === y);
    const isHead = snakeIndex === 0;
    const isBody = snakeIndex > 0;

    if (isFood) {
      return 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.8)] rounded-full scale-75 animate-pulse transition-transform';
    }
    
    if (isHead) {
      return `bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] z-10 rounded-sm ${
        gameOver ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]' : ''
      }`;
    }
    
    if (isBody) {
      // Fade the tail slightly
      const opacity = Math.max(0.4, 1 - snakeIndex / (snake.length + 5));
      return `bg-emerald-600 shadow-[0_0_5px_rgba(5,150,105,0.5)] rounded-sm transition-all duration-200`;
    }
    
    // Empty cell style
    return 'bg-zinc-900/40 border-[0.5px] border-zinc-800/30';
  };

  return (
    <div 
      className="grid bg-zinc-950 p-1 border-2 border-zinc-800 rounded-lg shadow-2xl shadow-black"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        width: '100%',
        maxWidth: '500px',
        aspectRatio: '1/1',
      }}
    >
      {gridCells.map((_, index) => (
        <div
          key={index}
          className={`w-full h-full relative ${getCellStyle(index)}`}
        />
      ))}
    </div>
  );
};