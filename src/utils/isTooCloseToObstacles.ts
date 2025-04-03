import type { GameObject } from '../types/Game.ts'

export const AIRPLANE_SIZE = 30;
export const OBSTACLE_SIZE = 50;
export const GAME_SPEED = 5;
export const OBSTACLE_SPAWN_INTERVAL = 1500;
export const PROJECTILE_SPEED = 7;
export const PROJECTILE_SIZE = 5;
export const TILT_SENSITIVITY = 1;
export const KEYBOARD_SPEED = 5;
export const MAX_OBSTACLES = 10;
export const MIN_DISTANCE_BETWEEN_OBSTACLES = OBSTACLE_SIZE * 3;
export const PATTERN_TYPES = ['single', 'cluster', 'diagonal', 'random'] as const;

export const isTooCloseToObstacles = (
  x: number,
  y: number,
  existingObstacles: GameObject[]
) => {
  return existingObstacles.some(obstacle => {
    const dx = obstacle.x - x;
    const dy = obstacle.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < MIN_DISTANCE_BETWEEN_OBSTACLES;
  });
};

export const generateSafePosition = (
  canvas: HTMLCanvasElement,
  existingObstacles: GameObject[]
) => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const x = OBSTACLE_SIZE + Math.random() * (canvas.width - OBSTACLE_SIZE * 2);
    const y = -OBSTACLE_SIZE - Math.random() * OBSTACLE_SIZE * 2;
    
    if (!isTooCloseToObstacles(x, y, existingObstacles)) {
      return { x, y };
    }
    attempts++;
  }
  return null;
};

export const generateObstaclePattern = (canvas: HTMLCanvasElement, existingObstacles: GameObject[]) => {
  const patternType = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
  const newObstacles: GameObject[] = [];

  switch (patternType) {
    case 'single': {
      const position = generateSafePosition(canvas, existingObstacles);
      if (position) {
        newObstacles.push({
          x: position.x,
          y: position.y,
          width: OBSTACLE_SIZE,
          height: OBSTACLE_SIZE,
        });
      }
      break;
    }

    case 'cluster': {
      const position = generateSafePosition(canvas, existingObstacles);
      if (position) {
        const clusterSize = 2;
        newObstacles.push({
          x: position.x,
          y: position.y,
          width: OBSTACLE_SIZE,
          height: OBSTACLE_SIZE,
        });

        for (let i = 0; i < clusterSize; i++) {
          const angle = (Math.PI * 2 * i) / clusterSize;
          const radius = OBSTACLE_SIZE * 2.5;
          const satelliteX = position.x + Math.cos(angle) * radius;
          const satelliteY = position.y + Math.sin(angle) * radius;

          if (
            satelliteX > OBSTACLE_SIZE &&
            satelliteX < canvas.width - OBSTACLE_SIZE &&
            !isTooCloseToObstacles(satelliteX, satelliteY, [...existingObstacles, ...newObstacles])
          ) {
            newObstacles.push({
              x: satelliteX,
              y: satelliteY,
              width: OBSTACLE_SIZE,
              height: OBSTACLE_SIZE,
            });
          }
        }
      }
      break;
    }

    case 'diagonal': {
      const position = generateSafePosition(canvas, existingObstacles);
      if (position) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        newObstacles.push({
          x: position.x,
          y: position.y,
          width: OBSTACLE_SIZE,
          height: OBSTACLE_SIZE,
        });

        for (let i = 1; i < 3; i++) {
          const nextX = position.x + (direction * i * OBSTACLE_SIZE * 2.5);
          const nextY = position.y + (i * OBSTACLE_SIZE * 2.5);

          if (
            nextX > OBSTACLE_SIZE &&
            nextX < canvas.width - OBSTACLE_SIZE &&
            !isTooCloseToObstacles(nextX, nextY, [...existingObstacles, ...newObstacles])
          ) {
            newObstacles.push({
              x: nextX,
              y: nextY,
              width: OBSTACLE_SIZE,
              height: OBSTACLE_SIZE,
            });
          }
        }
      }
      break;
    }

    case 'random': {
      const position = generateSafePosition(canvas, existingObstacles);
      if (position) {
        newObstacles.push({
          x: position.x,
          y: position.y,
          width: OBSTACLE_SIZE,
          height: OBSTACLE_SIZE,
        });
      }
      break;
    }
  }

  return newObstacles.length > 0 ? newObstacles : null;
};
