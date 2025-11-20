import { Direction, Point } from './types';

export const GRID_SIZE = 20; // 20x20 grid
export const INITIAL_SPEED = 150; // ms per tick
export const MIN_SPEED = 60; // Fastest speed
export const SPEED_DECREMENT = 2; // ms reduction per food eaten

export const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

export const INITIAL_DIRECTION = Direction.UP;

export const KEY_MAP: Record<string, Direction> = {
  ArrowUp: Direction.UP,
  w: Direction.UP,
  W: Direction.UP,
  ArrowDown: Direction.DOWN,
  s: Direction.DOWN,
  S: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
  a: Direction.LEFT,
  A: Direction.LEFT,
  ArrowRight: Direction.RIGHT,
  d: Direction.RIGHT,
  D: Direction.RIGHT,
};