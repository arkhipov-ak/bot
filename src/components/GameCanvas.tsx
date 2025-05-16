import React, { useEffect, useRef, useState } from 'react';
import { GameObject, Projectile } from '../types/Game.ts';
import { Airplane } from '../utils/drawAirplane.ts';
import { Meteor } from '../utils/drawMeteor.ts';
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

// Интерфейс для пропсов компонента GameCanvas
interface GameCanvasProps {
  airplane: GameObject; // Самолет
  obstacles: GameObject[]; // Список препятствий
  projectiles: Projectile[]; // Список снарядов
  gameOver: boolean; // Флаг окончания игры
  setAirplane: React.Dispatch<React.SetStateAction<GameObject>>; // Функция обновления самолета
  setObstacles: React.Dispatch<React.SetStateAction<GameObject[]>>; // Функция обновления препятствий
  setProjectiles: React.Dispatch<React.SetStateAction<Projectile[]>>; // Функция обновления снарядов
  setScore: React.Dispatch<React.SetStateAction<number>>; // Функция обновления счета
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>; // Функция для установки флага окончания игры
}

// Компонент GameCanvas отрисовывает игровое поле и обновляет состояние игры
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
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ссылка на элемент canvas
  const [lastDodgeableTime, setLastDodgeableTime] = useState(0); // Время последнего уклоняемого препятствия

  // useEffect выполняется при изменении состояния игры
  useEffect(() => {
    if (gameOver) return; // Если игра окончена, прекращаем выполнение

    const canvas = canvasRef.current;
    if (!canvas) return; // Если canvas не найден, прекращаем выполнение

    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Если контекст не получен, прекращаем выполнение

    let animationFrameId: number;
    let lastObstacleTime = 0; // Время последнего появления препятствия

    const obstaclesToRemove = new Set<number>(); // Множество для хранения индексов удаляемых препятствий

    // Обновление состояния снарядов
    const updateProjectiles = () => {
      const projectilesToRemove = new Set<number>(); // Множество для удаления снарядов

      projectiles.forEach((projectile, pIndex) => {
        projectile.y -= projectile.speed; // Двигаем снаряд вверх

        if (projectile.y < 0) {
          projectilesToRemove.add(pIndex); // Убираем снаряд, если он вышел за экран
          return;
        }

        obstacles.forEach((obstacle, oIndex) => {
          const dx = projectile.x - obstacle.x;
          const dy = projectile.y - obstacle.y;
          const distance = Math.sqrt(dx * dx + dy * dy); // Расстояние между снарядом и препятствием

          if (distance < (PROJECTILE_SIZE + OBSTACLE_SIZE / 2)) {
            projectilesToRemove.add(pIndex); // Убираем снаряд, если он столкнулся с препятствием
            if (obstacle.type === 'meteor') {
              obstaclesToRemove.add(oIndex); // Убираем препятствие, если это метеор
              setScore(prev => prev + 20); // Увеличиваем счет
            }
          }
        });

        if (!projectilesToRemove.has(pIndex)) {
          ctx.fillStyle = '#00ff00'; // Цвет снаряда
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, PROJECTILE_SIZE, 0, Math.PI * 2);
          ctx.fill(); // Отрисовываем снаряд
        }
      });

      setProjectiles(prev => prev.filter((_, index) => !projectilesToRemove.has(index))); // Обновляем список снарядов
    };

    // Обновление состояния препятствий
    const updateObstacles = () => {
      obstacles.forEach((obstacle, index) => {
        if (obstaclesToRemove.has(index)) return; // Пропускаем уже удаленные препятствия

        obstacle.y += GAME_SPEED; // Двигаем препятствие вниз

        if (obstacle.y > canvas.height + OBSTACLE_SIZE) {
          obstaclesToRemove.add(index); // Убираем препятствие, если оно вышло за экран
          return;
        }

        const dx = airplane.x - obstacle.x;
        const dy = airplane.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy); // Расстояние между самолетом и препятствием

        if (distance < (AIRPLANE_SIZE + OBSTACLE_SIZE) / 2) {
          setGameOver(true); // Завершаем игру, если произошло столкновение
          return;
        }

        if (obstacle.type === 'dodgable') {
          const meteor = new Meteor(obstacle.x, obstacle.y, OBSTACLE_SIZE, 'dodgable');
          meteor.draw(ctx); // Отрисовываем уклоняемое препятствие
        } else {
          const meteor = new Meteor(obstacle.x, obstacle.y, OBSTACLE_SIZE);
          meteor.draw(ctx); // Отрисовываем обычное препятствие
        }
      });

      setObstacles(prev => prev.filter((_, index) => !obstaclesToRemove.has(index))); // Обновляем список препятствий
    };

    // Функция спауна новых препятствий
    const spawnObstacles = (timestamp: number) => {
      if (timestamp - lastObstacleTime > OBSTACLE_SPAWN_INTERVAL && obstacles.length < MAX_OBSTACLES) {
        const newPattern = generateObstaclePattern(canvas, obstacles);
        if (newPattern) {
          setObstacles(prev => [...prev, ...newPattern]); // Добавляем новые препятствия
          lastObstacleTime = timestamp; // Обновляем время последнего появления препятствия
          setScore(prev => prev + 10); // Увеличиваем счет
        }
      }
    };

    // Функция спауна уклоняемых препятствий
    const spawnDodgeableObstacle = (timestamp: number) => {
      if (timestamp - lastDodgeableTime > DODGE_OBSTACLE_SPAWN_INTERVAL && obstacles.length < MAX_OBSTACLES) {
        const newDodgeable = generateDodgeableObstacle(canvas, obstacles);
        if (newDodgeable) {
          setObstacles(prev => [...prev, newDodgeable]); // Добавляем уклоняемое препятствие
          setLastDodgeableTime(timestamp); // Обновляем время последнего уклоняемого препятствия
        }
      }
    };

    // Главный игровой цикл
    const gameLoop = (timestamp: number) => {
      if (!canvas || !ctx) return; // Если canvas или контекст не найдены, прекращаем выполнение

      ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем экран

      const plane = new Airplane(airplane.x, airplane.y, AIRPLANE_SIZE);
      plane.draw(ctx); // Отрисовываем самолет

      updateProjectiles(); // Обновляем состояние снарядов
      updateObstacles(); // Обновляем состояние препятствий
      spawnObstacles(timestamp); // Спауним новые препятствия
      spawnDodgeableObstacle(timestamp); // Спауним уклоняемые препятствия

      animationFrameId = requestAnimationFrame(gameLoop); // Запускаем следующий кадр
    };

    animationFrameId = requestAnimationFrame(gameLoop); // Запускаем первый кадр
    return () => cancelAnimationFrame(animationFrameId); // чистка после завершения игры
  }, [airplane, obstacles, projectiles, gameOver, setObstacles, setProjectiles, setScore, setGameOver, lastDodgeableTime]);

  // движение мыши
  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; // Получаем координаты мыши по оси X, относительного левого края элемента

    setAirplane(prev => ({
      ...prev,
      x: Math.max(AIRPLANE_SIZE, Math.min(canvas.width - AIRPLANE_SIZE, x)), // Ограничиваем перемещение самолета
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
