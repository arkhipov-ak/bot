import type { GameObject } from '../types/Game.ts'

export const AIRPLANE_SIZE = 70;
export const OBSTACLE_SIZE = 50;
export const GAME_SPEED = 4;
export const OBSTACLE_SPAWN_INTERVAL = 1200;
export const DODGE_OBSTACLE_SPAWN_INTERVAL = 3000;
export const PROJECTILE_SPEED = 7;
export const PROJECTILE_SIZE = 5;
export const MAX_OBSTACLES = 8;
export const PATTERN_TYPES = ['single', 'cluster', 'diagonal', 'random'] as const;

// пересечение обьектов
export const isOverlappingRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  obstacle: GameObject
) => {
  // границы первого обьекта
  const left1 = x - w / 2;
  const right1 = x + w / 2;
  const top1 = y - h / 2;
  const bottom1 = y + h / 2;

  // границы второго обьекта
  const left2 = obstacle.x - obstacle.width / 2;
  const right2 = obstacle.x + obstacle.width / 2;
  const top2 = obstacle.y - obstacle.height / 2;
  const bottom2 = obstacle.y + obstacle.height / 2;

  // не пересекаются, если:
  // правая сторона 1-го левее левой стороны 2-го
  // левая сторона 1-го правее правой стороны 2-го
  // нижняя сторона 1-го выше верхней стороны 2-го
  // верхняя сторона 1-го ниже нижней стороны 2-го
  return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2);
};


export const generateSafePosition = (
  canvas: HTMLCanvasElement,
  existingObstacles: GameObject[],
  objectWidth: number = OBSTACLE_SIZE,
  objectHeight: number = OBSTACLE_SIZE
) => {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Генерируем случайную позицию X в пределах canvas, с отступами от краев
    const x = OBSTACLE_SIZE + Math.random() * (canvas.width - OBSTACLE_SIZE * 2);
    // Генерируем случайную позицию Y выше верхней границы canvas (объект будет падать сверху)
    const y = -OBSTACLE_SIZE - Math.random() * OBSTACLE_SIZE * 2;
    
    // Проверяем, пересекается ли новая позиция с любым из существующих препятствий
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

// создание метеоритов
export const generateObstaclePattern = (canvas: HTMLCanvasElement, existingObstacles: GameObject[]) => {
  // Выбираем случайный тип паттерна из доступных
  const patternType = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
  const newObstacles: GameObject[] = [];

  switch (patternType) {
    // одиночное препятствие
    case 'single': {
      // Получаем безопасную позицию для нового препятствия
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

    // группа препятствий
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
          // распологаем пряпятсвия по кругу, относительного центра
          const angle = (Math.PI * 2 * i) / clusterSize;
          // Радиус размещения дополнительных препятствий от центрального
          const radius = OBSTACLE_SIZE * 2.5;
          // Вычисляем координаты на основе угла и радиуса
          const satelliteX = position.x + Math.cos(angle) * radius;
          const satelliteY = position.y + Math.sin(angle) * radius;

          // Проверяем, не выходит ли препятствие за пределы игрового поля
          // и не пересекается ли с другими препятствиями
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

    // Препятствия, расположенные по диагонали
    case 'diagonal': {
      // Получаем безопасную позицию для первого препятствия в диагонали
      const position = generateSafePosition(canvas, existingObstacles);
      if (position) {
        // Случайно выбираем направление диагонали (вправо или влево)
        const direction = Math.random() > 0.5 ? 1 : -1;
        newObstacles.push({
          x: position.x,
          y: position.y,
          width: OBSTACLE_SIZE,
          height: OBSTACLE_SIZE,
          type: 'meteor',
        });

        // Добавляем до 2 дополнительных препятствий по диагонали
        for (let i = 1; i < 3; i++) {
          // Вычисляем координаты следующего препятствия на диагонали
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

    // Случайное расположение
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
