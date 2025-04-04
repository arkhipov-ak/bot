import React, { useEffect, useRef } from 'react';
import { GameObject, Projectile } from '../types/Game.ts';
import { drawAirplane } from '../utils/drawAirplane.ts';
import { drawMeteor } from '../utils/drawMeteor.ts';
import {
  AIRPLANE_SIZE,
  OBSTACLE_SIZE,
  GAME_SPEED,
  OBSTACLE_SPAWN_INTERVAL,
  PROJECTILE_SPEED,
  PROJECTILE_SIZE,
  MAX_OBSTACLES,
  generateObstaclePattern,
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

  useEffect(() => {
    // Если игра закончена, прекращаем анимацию
    if (gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let lastObstacleTime = 0;

    // Функция для обновления и отрисовки снарядов
    const updateProjectiles = () => {
      const projectilesToRemove = new Set<number>();

      projectiles.forEach((projectile, pIndex) => {
        // Обновляем позицию снаряда, двигая его вверх
        projectile.y -= projectile.speed;

        // Если снаряд ушёл за нижнюю — удаляем его
        if (projectile.y < 0) {
          projectilesToRemove.add(pIndex);
          return;
        }
        
        // Проверка столкновений с препятствиями
        obstacles.forEach((obstacle, oIndex) => {
          const dx = projectile.x - obstacle.x;
          const dy = projectile.y - obstacle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Если расстояние меньше суммы радиусов — фиксируем столкновение
          if (distance < (PROJECTILE_SIZE + OBSTACLE_SIZE / 2)) {
            projectilesToRemove.add(pIndex);
            // Отмечаем препятствие для удаления и начисляем очки
            obstaclesToRemove.add(oIndex);
            setScore(prev => prev + 20);
          }
        });

        // Если снаряд не попал в препятствие, отрисовываем его
        if (!projectilesToRemove.has(pIndex)) {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, PROJECTILE_SIZE, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Обновляем состояние снарядов: удаляем те, что помечены
      setProjectiles(prev => prev.filter((_, index) => !projectilesToRemove.has(index)));
    };

    const obstaclesToRemove = new Set<number>();

    // Функция для обновления и отрисовки препятствий
    const updateObstacles = () => {
      obstacles.forEach((obstacle, index) => {
        // Если препятствие уже отмечено для удаления, пропускаем
        if (obstaclesToRemove.has(index)) return;
        
        // Двигаем препятствие вниз
        obstacle.y += GAME_SPEED;
        
        // Если препятствие вышло за нижнюю границу, отмечаем для удаления
        if (obstacle.y > canvas.height + OBSTACLE_SIZE) {
          obstaclesToRemove.add(index);
          return;
        }
        
        // Проверка столкновения с самолётом
        const dx = airplane.x - obstacle.x;
        const dy = airplane.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (AIRPLANE_SIZE + OBSTACLE_SIZE) / 2) {
          // Если столкновение произошло — игра окончена
          setGameOver(true);
          return;
        }
        
        // Отрисовка препятствия (метеорита)
        drawMeteor(ctx, obstacle.x, obstacle.y, OBSTACLE_SIZE);
      });
      
      // Обновляем состояние препятствий: удаляем отмеченные
      setObstacles(prev => prev.filter((_, index) => !obstaclesToRemove.has(index)));
    };

    // Функция для создания новых препятствий, если прошло достаточно времени
    const spawnObstacles = (timestamp: number) => {
      if (timestamp - lastObstacleTime > OBSTACLE_SPAWN_INTERVAL && obstacles.length < MAX_OBSTACLES) {
        const newPattern = generateObstaclePattern(canvas, obstacles);
        if (newPattern) {
          // Добавляем новые препятствия и начисляем очки
          setObstacles(prev => [...prev, ...newPattern]);
          lastObstacleTime = timestamp;
          setScore(prev => prev + 10);
        }
      }
    };

    const gameLoop = (timestamp: number) => {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawAirplane(ctx, airplane.x, airplane.y, AIRPLANE_SIZE);
      
      // Обновляем снаряды и препятствия
      updateProjectiles();
      updateObstacles();

      // Проверяем, нужно ли заспавнить новые препятствия
      spawnObstacles(timestamp);
      
      // Запрашиваем следующий кадр анимации
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    // Запуск игрового цикла
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [airplane, obstacles, projectiles, gameOver, setObstacles, setProjectiles, setScore, setGameOver]);

  // Обработчик перемещения указателя для управления положением самолёта
  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Обновляем положение самолёта с ограничением по границам канвы
    setAirplane(prev => ({
      ...prev,
      x: Math.max(AIRPLANE_SIZE, Math.min(canvas.width - AIRPLANE_SIZE, x)),
    }));
  };

  // Обработчик клика для стрельбы снарядами
  const handleClick = () => {
    if (gameOver) return;
    
    // Добавляем новый снаряд, стартующий из текущей позиции самолёта
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
