export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  markedForDeletion: boolean;
}

export interface Obstacle extends GameObject {
  type: 'ROCK' | 'CONE' | 'PERSON';
}

export interface Collectible extends GameObject {
  type: 'DIAMOND';
}

export interface Particle extends GameObject {
  vx: number;
  vy: number;
  color: string;
  life: number;
}