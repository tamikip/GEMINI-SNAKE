export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export interface Point {
  x: number;
  y: number;
}

export type Snake = Point[];

export interface GameState {
  snake: Snake;
  food: Point;
  direction: Direction;
  status: GameStatus;
  score: number;
  highScore: number;
  speed: number;
}