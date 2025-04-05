import type { GameObject } from '../types/Game.ts'

export const AIRPLANE_SIZE = 70;
export const OBSTACLE_SIZE = 50;
export const GAME_SPEED = 4;
export const OBSTACLE_SPAWN_INTERVAL = 1200;
export const DODGE_OBSTACLE_SPAWN_INTERVAL = 3000; // интервал для красных объектов
export const PROJECTILE_SPEED = 7;
export const PROJECTILE_SIZE = 5;
export const MAX_OBSTACLES = 8;
export const PATTERN_TYPES = ['single', 'cluster', 'diagonal', 'random'] as const;

/**
 * Проверка пересечения двух прямоугольников.
 * Координаты (x, y) считаются центром прямоугольника.
 */
export const isOverlappingRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  obstacle: GameObject
) => {
  const left1 = x - w / 2;
  const right1 = x + w / 2;
  const top1 = y - h / 2;
  const bottom1 = y + h / 2;

  const left2 = obstacle.x - obstacle.width / 2;
  const right2 = obstacle.x + obstacle.width / 2;
  const top2 = obstacle.y - obstacle.height / 2;
  const bottom2 = obstacle.y + obstacle.height / 2;

  return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2);
};

/**
 * Генерация безопасной позиции для нового объекта так, чтобы его прямоугольник не пересекался
 * с прямоугольниками уже существующих объектов.
 * Принимает размеры нового объекта (по умолчанию OBSTACLE_SIZE).
 */
export const generateSafePosition = (
  canvas: HTMLCanvasElement,
  existingObstacles: GameObject[],
  objectWidth: number = OBSTACLE_SIZE,
  objectHeight: number = OBSTACLE_SIZE
) => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const x = OBSTACLE_SIZE + Math.random() * (canvas.width - OBSTACLE_SIZE * 2);
    const y = -OBSTACLE_SIZE - Math.random() * OBSTACLE_SIZE * 2;
    
    const overlaps = existingObstacles.some(obstacle =>
      isOverlappingRect(x, y, objectWidth, objectHeight, obstacle)
    );
    
    if (!overlaps) {
      return { x, y };
    }
    attempts++;
  }
  return null;
};

/**
 * Генерация стандартных препятствий (метеоритов) с различными паттернами.
 */
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
          type: 'meteor',
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
          type: 'meteor',
        });

        for (let i = 0; i < clusterSize; i++) {
          const angle = (Math.PI * 2 * i) / clusterSize;
          const radius = OBSTACLE_SIZE * 2.5;
          const satelliteX = position.x + Math.cos(angle) * radius;
          const satelliteY = position.y + Math.sin(angle) * radius;

          if (
            satelliteX > OBSTACLE_SIZE &&
            satelliteX < canvas.width - OBSTACLE_SIZE &&
            !existingObstacles.concat(newObstacles).some(obstacle =>
              isOverlappingRect(satelliteX, satelliteY, OBSTACLE_SIZE, OBSTACLE_SIZE, obstacle)
            )
          ) {
            newObstacles.push({
              x: satelliteX,
              y: satelliteY,
              width: OBSTACLE_SIZE,
              height: OBSTACLE_SIZE,
              type: 'meteor',
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
          type: 'meteor',
        });

        for (let i = 1; i < 3; i++) {
          const nextX = position.x + (direction * i * OBSTACLE_SIZE * 2.5);
          const nextY = position.y + (i * OBSTACLE_SIZE * 2.5);

          if (
            nextX > OBSTACLE_SIZE &&
            nextX < canvas.width - OBSTACLE_SIZE &&
            !existingObstacles.concat(newObstacles).some(obstacle =>
              isOverlappingRect(nextX, nextY, OBSTACLE_SIZE, OBSTACLE_SIZE, obstacle)
            )
          ) {
            newObstacles.push({
              x: nextX,
              y: nextY,
              width: OBSTACLE_SIZE,
              height: OBSTACLE_SIZE,
              type: 'meteor',
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
          type: 'meteor',
        });
      }
      break;
    }
  }

  return newObstacles.length > 0 ? newObstacles : null;
};

export const generateDodgeableObstacle = (canvas: HTMLCanvasElement, existingObstacles: GameObject[]) => {
  const position = generateSafePosition(canvas, existingObstacles, OBSTACLE_SIZE, OBSTACLE_SIZE);
  if (position) {
    return {
      x: position.x,
      y: position.y,
      width: OBSTACLE_SIZE,
      height: OBSTACLE_SIZE,
      type: 'dodgable',
    };
  }
  return null;
};
