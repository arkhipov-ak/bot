// GameCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { GameObject, Projectile } from '../types/Game.ts';
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
	setGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let lastObstacleTime = 0;
    
    function drawAirplane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  // Перенос начала координат в точку, где будет центр самолёта
  ctx.translate(x, y);

  //
  // 1. "Хвост" самолёта (небольшой синий элемент сверху)
  //
  ctx.fillStyle = '#3c5ea9'; // цвет можно подкорректировать
  // Небольшой прямоугольник в верхней части
  ctx.fillRect(
    -size * 0.03,  // смещение по X
    -size * 0.65,  // смещение по Y (чуть выше основного корпуса)
    size * 0.06,   // ширина
    size * 0.15    // высота
  );

  //
  // 2. Основной корпус самолёта
  //
  ctx.beginPath();
  // Точка вершины (верхняя)
  ctx.moveTo(0, -size * 0.5);
  // Левая "кромка"
  ctx.lineTo(-size * 0.5, size * 0.3);
  // Центральная точка нижней части
  ctx.lineTo(0, size * 0.2);
  // Правая "кромка"
  ctx.lineTo(size * 0.5, size * 0.3);
  ctx.closePath();

  // Создаём градиент для более "объёмного" вида
  const gradient = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.3);
  gradient.addColorStop(0, '#ffffff'); // светлый участок сверху
  gradient.addColorStop(1, '#d4d4d4'); // чуть темнее снизу
  ctx.fillStyle = gradient;
  ctx.fill();

  //
  // 3. Линии сгиба/детализации
  //
  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 2;

  // Левая линия сгиба
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(-size * 0.1, size * 0.15);
  ctx.stroke();

  // Правая линия сгиба
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(size * 0.1, size * 0.15);
  ctx.stroke();

  ctx.restore();
}
    
    const gameLoop = (timestamp: number) => {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем самолет
      // ctx.fillStyle = '#FFFFFF';
      
      
      // ctx.save();
      // ctx.translate(airplane.x, airplane.y);
      // ctx.beginPath();
      // ctx.moveTo(-AIRPLANE_SIZE / 2, AIRPLANE_SIZE / 2);
      // ctx.lineTo(0, -AIRPLANE_SIZE / 2);
      // ctx.lineTo(AIRPLANE_SIZE / 2, AIRPLANE_SIZE / 2);
      // ctx.closePath();
      // ctx.fill();
      // ctx.restore();
      
      drawAirplane(ctx, airplane.x, airplane.y, AIRPLANE_SIZE)
      
      // Множества для удаления снарядов и препятствий
      const projectilesToRemove = new Set<number>();
      const obstaclesToRemove = new Set<number>();

      // Обновление и отрисовка снарядов
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
            obstaclesToRemove.add(oIndex);
            setScore(prev => prev + 20);
          }
        });
        
        if (!projectilesToRemove.has(pIndex)) {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, PROJECTILE_SIZE, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Обновление и отрисовка препятствий
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
        
        function drawMeteor(
          ctx: CanvasRenderingContext2D,
          x: number,
          y: number,
          size: number
        ) {
          ctx.save();
          
          // Создаем радиальный градиент для основного тела метеорита
          const gradient = ctx.createRadialGradient(x, y, size * 0.1, x, y, size * 0.5);
          gradient.addColorStop(0, '#b0b2c0');
          gradient.addColorStop(1, '#80838f');
          ctx.fillStyle = gradient;
          
          // Рисуем основной круг метеорита
          ctx.beginPath();
          ctx.arc(x, y, size / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Рисуем «кратеры»
          ctx.fillStyle = '#343648';
          ctx.beginPath();
          ctx.arc(x - size * 0.2, y - size * 0.1, size * 0.1, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(x + size * 0.1, y - size * 0.2, size * 0.07, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(x + size * 0.15, y + size * 0.05, size * 0.05, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
        
        drawMeteor(ctx, obstacle.x, obstacle.y, OBSTACLE_SIZE )

      });
      
      // Удаление отмеченных снарядов и препятствий
      setProjectiles(prev => prev.filter((_, index) => !projectilesToRemove.has(index)));
      setObstacles(prev => prev.filter((_, index) => !obstaclesToRemove.has(index)));
      
      // Создание новых препятствий
      if (timestamp - lastObstacleTime > OBSTACLE_SPAWN_INTERVAL && obstacles.length < MAX_OBSTACLES) {
        const newPattern = generateObstaclePattern(canvas, obstacles);
        if (newPattern) {
          setObstacles(prev => [...prev, ...newPattern]);
          lastObstacleTime = timestamp;
          setScore(prev => prev + 10);
        }
      }
      
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [airplane, obstacles, projectiles, gameOver, setObstacles, setProjectiles, setScore, setGameOver]);

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
