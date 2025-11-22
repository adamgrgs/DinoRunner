import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameState, 
  GameObject, 
  Obstacle, 
  Collectible, 
  Particle 
} from '../types';
import { 
  GRAVITY, JUMP_FORCE, GROUND_HEIGHT, GAME_SPEED_START, 
  SPAWN_RATE_OBSTACLE, SPAWN_RATE_DIAMOND, SPAWN_RATE_PERSON,
  PLAYER_WIDTH, PLAYER_HEIGHT, DINO_WIDTH, DINO_HEIGHT,
  COLOR_SKY, COLOR_GRASS, COLOR_GROUND,
  DINO_DURATION, PERSON_WIDTH, PERSON_HEIGHT
} from '../constants';
import { audioService } from '../services/audioService';

interface GameRunnerProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setDinoMode: (isDino: boolean) => void;
  onGameOver: () => void;
}

const GameRunner: React.FC<GameRunnerProps> = ({ 
  gameState, 
  setGameState, 
  setScore, 
  setDinoMode,
  onGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const speedRef = useRef<number>(GAME_SPEED_START);
  
  // Game State Refs (Mutable for performance in loop)
  const playerRef = useRef({
    x: 50,
    y: 0, // Calculated dynamically
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    isGrounded: true,
    isDino: false,
    dinoTimer: 0,
    markedForDeletion: false
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const diamondsRef = useRef<Collectible[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Helpers to draw emojis centered
  const drawEmoji = (ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number, size: number) => {
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x + size / 2, y + size / 2);
  };

  // Helper to draw emoji flipped horizontally
  const drawEmojiFlipped = (ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number, size: number) => {
    ctx.save();
    // Move to center of the object
    ctx.translate(x + size / 2, y + size / 2);
    // Scale x by -1 to flip horizontally
    ctx.scale(-1, 1);
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Draw at 0,0 relative to the translation
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        width: 4,
        height: 4,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color,
        life: 1.0,
        markedForDeletion: false
      });
    }
  };

  const resetGame = useCallback((canvas: HTMLCanvasElement) => {
    playerRef.current = {
      x: 50,
      y: canvas.height - GROUND_HEIGHT - PLAYER_HEIGHT,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      isGrounded: true,
      isDino: false,
      dinoTimer: 0,
      markedForDeletion: false
    };
    obstaclesRef.current = [];
    diamondsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    speedRef.current = GAME_SPEED_START;
    frameCountRef.current = 0;
    setScore(0);
    setDinoMode(false);
  }, [setScore, setDinoMode]);

  const update = useCallback((canvas: HTMLCanvasElement) => {
    if (gameState !== GameState.PLAYING) return;

    const player = playerRef.current;
    
    // 1. Player Physics
    player.vy += GRAVITY;
    player.y += player.vy;

    // Ground Collision
    const groundY = canvas.height - GROUND_HEIGHT - player.height;
    if (player.y >= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.isGrounded = true;
    } else {
      player.isGrounded = false;
    }

    // Dino Mode Timer
    if (player.isDino) {
      player.dinoTimer--;
      if (player.dinoTimer <= 0) {
        player.isDino = false;
        player.width = PLAYER_WIDTH;
        player.height = PLAYER_HEIGHT;
        setDinoMode(false);
        // Reset position slightly to avoid clipping into ground if heights differ
        player.y = canvas.height - GROUND_HEIGHT - PLAYER_HEIGHT;
      }
    }

    // 2. Spawning
    frameCountRef.current++;
    speedRef.current += 0.001; // Slowly increase speed

    // Effective movement speed (Dino gets a boost)
    const effectiveSpeed = speedRef.current + (player.isDino ? 3 : 0);

    // Spawn Obstacles (Rocks/Cones)
    if (frameCountRef.current % Math.floor(SPAWN_RATE_OBSTACLE / (effectiveSpeed / 5)) === 0) {
      const type = Math.random() > 0.5 ? 'ROCK' : 'CONE';
      obstaclesRef.current.push({
        x: canvas.width,
        y: canvas.height - GROUND_HEIGHT - 40,
        width: 40,
        height: 40,
        type,
        markedForDeletion: false
      });
    }

    // Spawn People
    if (frameCountRef.current % Math.floor(SPAWN_RATE_PERSON / (effectiveSpeed / 5)) === 0) {
        obstaclesRef.current.push({
            x: canvas.width,
            y: canvas.height - GROUND_HEIGHT - PERSON_HEIGHT,
            width: PERSON_WIDTH,
            height: PERSON_HEIGHT,
            type: 'PERSON',
            markedForDeletion: false
        });
    }

    // Spawn Diamonds
    if (frameCountRef.current % SPAWN_RATE_DIAMOND === 0) {
      // Sometimes spawn in air for jumping
      const isHigh = Math.random() > 0.5;
      diamondsRef.current.push({
        x: canvas.width,
        y: canvas.height - GROUND_HEIGHT - (isHigh ? 120 : 40),
        width: 40,
        height: 40,
        type: 'DIAMOND',
        markedForDeletion: false
      });
    }

    // 3. Move & Clean Objects
    const moveObject = (obj: GameObject) => {
      obj.x -= effectiveSpeed;
      if (obj.x + obj.width < 0) obj.markedForDeletion = true;
    };

    obstaclesRef.current.forEach(moveObject);
    diamondsRef.current.forEach(moveObject);

    // 4. Collision Detection
    // Simple AABB
    const checkCollision = (a: GameObject, b: GameObject) => {
      // Shrink hitbox slightly to be forgiving
      const padding = 10;
      return (
        a.x + padding < b.x + b.width - padding &&
        a.x + a.width - padding > b.x + padding &&
        a.y + padding < b.y + b.height - padding &&
        a.y + a.height - padding > b.y + padding
      );
    };

    // Obstacles & People
    obstaclesRef.current.forEach(obs => {
      if (checkCollision(player, obs)) {
        if (obs.type === 'PERSON') {
            if (player.isDino) {
                // EAT!
                obs.markedForDeletion = true;
                scoreRef.current += 50;
                setScore(scoreRef.current);
                spawnParticles(obs.x, obs.y, '#FF0000', 10);
                audioService.playEat();
            } else {
                // HONK / IGNORE
                // Bus hits person - they just "jump away" or disappear
                obs.markedForDeletion = true;
                audioService.playHonk();
                spawnParticles(obs.x, obs.y, '#FFFFFF', 5);
            }
        } else {
            // ROCKS / CONES
            if (player.isDino) {
              // Smash obstacle!
              obs.markedForDeletion = true;
              scoreRef.current += 5;
              setScore(scoreRef.current);
              spawnParticles(obs.x, obs.y, '#888', 10);
              audioService.playCrash();
            } else {
              // Bus hits obstacle
              // NEVER STOP: Just visual feedback and break the obstacle
              obs.markedForDeletion = true;
              audioService.playCrash(); 
              spawnParticles(obs.x, obs.y, '#FFA500', 8); // Sparks
              // Maybe a slight screen shake effect could be added here via state, but keeping it simple
            }
        }
      }
    });

    // Diamonds
    diamondsRef.current.forEach(dia => {
      if (checkCollision(player, dia)) {
        dia.markedForDeletion = true;
        scoreRef.current += 10;
        setScore(scoreRef.current);
        
        // Transform!
        if (!player.isDino) {
          player.isDino = true;
          player.width = DINO_WIDTH;
          player.height = DINO_HEIGHT;
          player.y -= (DINO_HEIGHT - PLAYER_HEIGHT); // Adjust pos up
          setDinoMode(true);
          audioService.playRoar();
        } else {
          audioService.playCollect();
        }
        
        player.dinoTimer = DINO_DURATION;
        spawnParticles(dia.x, dia.y, '#00FFFF', 15);
      }
    });

    // Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) p.markedForDeletion = true;
    });

    // Filtering
    obstaclesRef.current = obstaclesRef.current.filter(o => !o.markedForDeletion);
    diamondsRef.current = diamondsRef.current.filter(d => !d.markedForDeletion);
    particlesRef.current = particlesRef.current.filter(p => !p.markedForDeletion);

    // Score based on distance
    if (frameCountRef.current % 10 === 0) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }

  }, [gameState, setScore, setDinoMode, onGameOver]);

  const draw = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    // Clear
    ctx.fillStyle = COLOR_SKY;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = COLOR_GRASS;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 20);
    ctx.fillStyle = COLOR_GROUND;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT + 20, canvas.width, GROUND_HEIGHT - 20);

    // Clouds (Simple decoration)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const cloudOffset = (frameCountRef.current * 0.5) % canvas.width;
    ctx.beginPath();
    ctx.arc(100 - cloudOffset + (cloudOffset > 100 ? 0 : canvas.width), 80, 30, 0, Math.PI * 2);
    ctx.arc(140 - cloudOffset + (cloudOffset > 140 ? 0 : canvas.width), 80, 40, 0, Math.PI * 2);
    ctx.arc(180 - cloudOffset + (cloudOffset > 180 ? 0 : canvas.width), 80, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(500 - cloudOffset*0.8 + (cloudOffset*0.8 > 500 ? 0 : canvas.width), 120, 25, 0, Math.PI * 2);
    ctx.arc(540 - cloudOffset*0.8 + (cloudOffset*0.8 > 540 ? 0 : canvas.width), 110, 35, 0, Math.PI * 2);
    ctx.fill();

    // Game Objects
    const player = playerRef.current;

    // Draw Player
    if (player.isDino) {
      // Flashing effect if about to expire
      if (player.dinoTimer < 120 && Math.floor(player.dinoTimer / 10) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      
      // Dino is flipped to face right!
      drawEmojiFlipped(ctx, '🦖', player.x, player.y, player.width);
      ctx.globalAlpha = 1.0;
      
      // Dino Rage Effect (Fire/Power) around
      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width/1.2 + Math.sin(frameCountRef.current * 0.2) * 5, 0, Math.PI*2);
      ctx.stroke();
      
      // Speed lines
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(player.x - 20, player.y + 10);
      ctx.lineTo(player.x - 50, player.y + 10);
      ctx.moveTo(player.x - 20, player.y + 40);
      ctx.lineTo(player.x - 50, player.y + 40);
      ctx.stroke();

    } else {
      drawEmoji(ctx, '🚌', player.x, player.y, player.width);
    }

    // Draw Obstacles & People
    obstaclesRef.current.forEach(obs => {
      let emoji = '🪨';
      if (obs.type === 'CONE') emoji = '🚧';
      if (obs.type === 'PERSON') emoji = '🧍';
      
      drawEmoji(ctx, emoji, obs.x, obs.y, obs.width);
    });

    // Draw Diamonds
    diamondsRef.current.forEach(dia => {
      // Bobbing animation
      const bobY = Math.sin(frameCountRef.current * 0.1) * 5;
      drawEmoji(ctx, '💎', dia.x, dia.y + bobY, dia.width);
    });

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.globalAlpha = 1.0;
    });

  }, []);

  const handleAction = useCallback(() => {
    if (gameState === GameState.START || gameState === GameState.GAME_OVER) {
       // Logic handled by parent UI usually, but good to have fallback
       return;
    }
    if (gameState === GameState.PLAYING) {
      const player = playerRef.current;
      if (player.isGrounded) {
        player.vy = JUMP_FORCE;
        player.isGrounded = false;
        audioService.playJump();
      }
    }
  }, [gameState]);

  // Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handling
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // If resizing during play, reset player to ground to avoid falling forever
      if (playerRef.current.y > canvas.height - GROUND_HEIGHT) {
         playerRef.current.y = canvas.height - GROUND_HEIGHT - playerRef.current.height;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Game Loop
    const loop = () => {
      update(canvas);
      draw(canvas, ctx);
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update, draw]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleAction();
      }
    };
    
    // reset game logic when state changes to playing from something else
    if (gameState === GameState.PLAYING && frameCountRef.current === 0) {
       if (canvasRef.current) resetGame(canvasRef.current);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, gameState, resetGame]);

  return (
    <canvas 
      ref={canvasRef}
      className="block w-full h-full touch-none select-none cursor-pointer"
      onPointerDown={(e) => {
        // Prevent default touch actions like scroll
        e.preventDefault();
        handleAction();
      }}
    />
  );
};

export default GameRunner;