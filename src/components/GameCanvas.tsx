import React, { useEffect, useRef, useState } from 'react';
import { GameObject, Projectile } from '../types/Game.ts';
import { Airplane } from '../utils/drawAirplane.ts'
import { Meteor } from '../utils/drawMeteor.ts'
import {
  AIRPLANE_SIZE,
  OBSTACLE_SIZE,
  GAME_SPEED,
  OBSTACLE_SPAWN_INTERVAL,
  DODGE_OBSTACLE_SPAWN_INTERVAL,
  PROJECTILE_SPEED,
  PROJECTILE_SIZE,
  MAX_OBSTACLES,
  generateObstaclePattern,
  generateDodgeableObstacle,
} from '../utils/isTooCloseToObstacles.ts';

interface GameCanvasProps {
  airplane: GameObject;
  obstacles: GameObject[];
  projectiles: Projectile[];
  gameOver: boolean;
  setAirplane: React.Dispatch<React.SetStateAction<GameObject>>;
  setObstacles: React.Dispatch<React.SetStateAction<GameObject[]>>;
  setProjectiles: React.Dispatch<React.SetStateAction<Projectile[]>>;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  airplane,
  obstacles,
  projectiles,
  gameOver,
  setAirplane,
  setObstacles,
  setProjectiles,
  setScore,
  setGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastDodgeableTime, setLastDodgeableTime] = useState(0);

  useEffect(() => {
    if (gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let lastObstacleTime = 0;

    const obstaclesToRemove = new Set<number>();

    const updateProjectiles = () => {
      const projectilesToRemove = new Set<number>();

      projectiles.forEach((projectile, pIndex) => {
        projectile.y -= projectile.speed;

        if (projectile.y < 0) {
          projectilesToRemove.add(pIndex);
          return;
        }
        
        obstacles.forEach((obstacle, oIndex) => {
          const dx = projectile.x - obstacle.x;
          const dy = projectile.y - obstacle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < (PROJECTILE_SIZE + OBSTACLE_SIZE / 2)) {
            projectilesToRemove.add(pIndex);
            if (obstacle.type === 'meteor') {
              obstaclesToRemove.add(oIndex);
              setScore(prev => prev + 20);
            }
          }
        });

        if (!projectilesToRemove.has(pIndex)) {
          ctx.fillStyle = '#00ff00';
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, PROJECTILE_SIZE, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      setProjectiles(prev => prev.filter((_, index) => !projectilesToRemove.has(index)));
    };

    const updateObstacles = () => {
      obstacles.forEach((obstacle, index) => {
        if (obstaclesToRemove.has(index)) return;
        
        obstacle.y += GAME_SPEED;
        
        if (obstacle.y > canvas.height + OBSTACLE_SIZE) {
          obstaclesToRemove.add(index);
          return;
        }
        
        const dx = airplane.x - obstacle.x;
        const dy = airplane.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (AIRPLANE_SIZE + OBSTACLE_SIZE) / 2) {
          setGameOver(true);
          return;
        }
        
        if (obstacle.type === 'dodgable') {
          const meteor = new Meteor(obstacle.x, obstacle.y, OBSTACLE_SIZE, 'dodgable');
          meteor.draw(ctx);
        } else {
          const meteor = new Meteor(obstacle.x, obstacle.y, OBSTACLE_SIZE);
          meteor.draw(ctx);
        }
      });
      
      setObstacles(prev => prev.filter((_, index) => !obstaclesToRemove.has(index)));
    };

    const spawnObstacles = (timestamp: number) => {
      if (timestamp - lastObstacleTime > OBSTACLE_SPAWN_INTERVAL && obstacles.length < MAX_OBSTACLES) {
        const newPattern = generateObstaclePattern(canvas, obstacles);
        if (newPattern) {
          setObstacles(prev => [...prev, ...newPattern]);
          lastObstacleTime = timestamp;
          setScore(prev => prev + 10);
        }
      }
    };

    const spawnDodgeableObstacle = (timestamp: number) => {
      if (timestamp - lastDodgeableTime > DODGE_OBSTACLE_SPAWN_INTERVAL && obstacles.length < MAX_OBSTACLES) {
        const newDodgeable = generateDodgeableObstacle(canvas, obstacles);
        if (newDodgeable) {
          setObstacles(prev => [...prev, newDodgeable]);
          setLastDodgeableTime(timestamp);
        }
      }
    };

    const gameLoop = (timestamp: number) => {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const plane = new Airplane(airplane.x, airplane.y, AIRPLANE_SIZE);
      plane.draw(ctx);
      
      updateProjectiles();
      updateObstacles();
      spawnObstacles(timestamp);
      spawnDodgeableObstacle(timestamp);
      
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [airplane, obstacles, projectiles, gameOver, setObstacles, setProjectiles, setScore, setGameOver, lastDodgeableTime]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    setAirplane(prev => ({
      ...prev,
      x: Math.max(AIRPLANE_SIZE, Math.min(canvas.width - AIRPLANE_SIZE, x)),
    }));
  };

  const handleClick = () => {
    if (gameOver) return;
    
    setProjectiles(prev => [
      ...prev,
      {
        x: airplane.x,
        y: airplane.y - AIRPLANE_SIZE,
        speed: PROJECTILE_SPEED,
      },
    ]);
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      className="w-full h-full"
    />
  );
};
