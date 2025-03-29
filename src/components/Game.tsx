import React, { useEffect, useRef, useState } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Projectile {
  x: number;
  y: number;
  speed: number;
}

const AIRPLANE_SIZE = 30; // размер препятсивй
const OBSTACLE_SIZE = 30; // размер обьектов
const GAME_SPEED = 5; // скорость движения препятствий
const OBSTACLE_SPAWN_INTERVAL = 1500; // интервал между появлением новых препятствий
const PROJECTILE_SPEED = 7; // скорость снаряда
const PROJECTILE_SIZE = 5; // размер снаряда
const TILT_SENSITIVITY = 1; // чувствительность
const KEYBOARD_SPEED = 5;
const MAX_OBSTACLES = 10; // максимальное кол-во препятствий на экране

const MIN_DISTANCE_BETWEEN_OBSTACLES = OBSTACLE_SIZE * 2;
const PATTERN_TYPES = ['single', 'cluster', 'diagonal', 'random'] as const;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasOrientationPermission, setHasOrientationPermission] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [airplane, setAirplane] = useState<GameObject>({
    x: window.innerWidth / 2,
    y: window.innerHeight - 100,
    width: AIRPLANE_SIZE,
    height: AIRPLANE_SIZE,
  });
  const [obstacles, setObstacles] = useState<GameObject[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  // Проверка, находится ли самолет близко к препятствиям
  const isTooCloseToObstacles = (x: number, y: number, existingObstacles: GameObject[]) => {
    return existingObstacles.some(obstacle => {
      const dx = obstacle.x - x;
      const dy = obstacle.y - y;
      return Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE_BETWEEN_OBSTACLES;
    });
  };

  const generateObstaclePattern = (existingObstacles: GameObject[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const patternType = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
    const newObstacles: GameObject[] = [];

    const safeX = () => OBSTACLE_SIZE + Math.random() * (canvas.width - OBSTACLE_SIZE * 2);
    const safeY = () => -OBSTACLE_SIZE - Math.random() * OBSTACLE_SIZE * 2;

    switch (patternType) {
      case 'single': // одно препятствие в случайной позиции
        newObstacles.push({
          x: safeX(),
          y: safeY(),
          width: OBSTACLE_SIZE,
          height: OBSTACLE_SIZE,
        });
        break;

      case 'cluster': // препятствия вокруг центра
        const clusterCenter = { x: safeX(), y: safeY() };
        const clusterSize = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < clusterSize; i++) {
          const angle = (Math.PI * 2 * i) / clusterSize;
          const radius = OBSTACLE_SIZE * 1.5;
          const x = clusterCenter.x + Math.cos(angle) * radius;
          const y = clusterCenter.y + Math.sin(angle) * radius;
          
          if (x > OBSTACLE_SIZE && x < canvas.width - OBSTACLE_SIZE) {
            newObstacles.push({
              x,
              y,
              width: OBSTACLE_SIZE,
              height: OBSTACLE_SIZE,
            });
          }
        }
        break;

      case 'diagonal': // создается ряд препятствий
        const startX = safeX();
        const startY = safeY();
        const direction = Math.random() > 0.5 ? 1 : -1;
        
        for (let i = 0; i < 3; i++) {
          const x = startX + (direction * i * OBSTACLE_SIZE * 1.5);
          if (x > OBSTACLE_SIZE && x < canvas.width - OBSTACLE_SIZE) {
            newObstacles.push({
              x,
              y: startY + (i * OBSTACLE_SIZE * 1.5),
              width: OBSTACLE_SIZE,
              height: OBSTACLE_SIZE,
            });
          }
        }
        break;

      case 'random': //  создается одно препятствие, но не ближе к существующим
        const x = safeX();
        const y = safeY();
        if (!isTooCloseToObstacles(x, y, existingObstacles)) {
          newObstacles.push({
            x,
            y,
            width: OBSTACLE_SIZE,
            height: OBSTACLE_SIZE,
          });
        }
        break;
    }

    return newObstacles;
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const requestOrientationPermission = async () => {
    if (!isMobile) {
      setHasOrientationPermission(false);
      return;
    }

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        // @ts-ignore:
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        // @ts-ignore
        const permission = await DeviceOrientationEvent.requestPermission();
        setHasOrientationPermission(permission === 'granted');
      } catch (err) {
        console.error('Error requesting orientation permission:', err);
        setHasOrientationPermission(false);
      }
    } else {
      setHasOrientationPermission(true);
    }
  };
  
  useEffect(() => {
    if (!isMobile || !hasOrientationPermission || gameOver) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null) return;
      
      const tilt = event.gamma;
      setAirplane(prev => ({
        ...prev,
        x: Math.max(
          AIRPLANE_SIZE,
          Math.min(
            window.innerWidth - AIRPLANE_SIZE,
            prev.x + tilt * TILT_SENSITIVITY
          )
        ),
      }));
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isMobile, hasOrientationPermission, gameOver]);

  // Handle keyboard controls for desktop
  useEffect(() => {
    if (isMobile || gameOver) return;

    const handleKeyboard = (e: KeyboardEvent) => {
      setAirplane(prev => {
        let newX = prev.x;
        
        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
            newX = Math.max(AIRPLANE_SIZE, prev.x - KEYBOARD_SPEED);
            break;
          case 'ArrowRight':
          case 'd':
            newX = Math.min(window.innerWidth - AIRPLANE_SIZE, prev.x + KEYBOARD_SPEED);
            break;
          case ' ':
            setProjectiles(prev => [...prev, {
              x: airplane.x,
              y: airplane.y - AIRPLANE_SIZE,
              speed: PROJECTILE_SPEED,
            }]);
            break;
        }

        return { ...prev, x: newX };
      });
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isMobile, gameOver, airplane.x, airplane.y]);
  
  // Game
  useEffect(() => {
    if (gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let lastObstacleTime = 0;
    
    const gameLoop = (timestamp: number) => {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw airplane
      ctx.fillStyle = '#FFFFFF';
      ctx.save();
      ctx.translate(airplane.x, airplane.y);
      ctx.beginPath();
      ctx.moveTo(-AIRPLANE_SIZE/2, AIRPLANE_SIZE/2);
      ctx.lineTo(0, -AIRPLANE_SIZE/2);
      ctx.lineTo(AIRPLANE_SIZE/2, AIRPLANE_SIZE/2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      
      // Update and draw projectiles
      const updatedProjectiles = projectiles.filter(projectile => {
        projectile.y -= projectile.speed;
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, PROJECTILE_SIZE, 0, Math.PI * 2);
        ctx.fill();
        
        return projectile.y > 0;
      });
      
      // Update and draw obstacles
      const newObstacles = obstacles.filter(obstacle => {
        const isHit = updatedProjectiles.some(projectile => {
          const dx = projectile.x - obstacle.x;
          const dy = projectile.y - obstacle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < (PROJECTILE_SIZE + OBSTACLE_SIZE / 2);
        });
        
        if (isHit) {
          setScore(prev => prev + 20);
          return false;
        }
        
        obstacle.y += GAME_SPEED;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, OBSTACLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        const dx = airplane.x - obstacle.x;
        const dy = airplane.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (AIRPLANE_SIZE + OBSTACLE_SIZE) / 2) {
          setGameOver(true);
        }
        
        return obstacle.y < canvas.height + OBSTACLE_SIZE;
      });
      
      if (timestamp - lastObstacleTime > OBSTACLE_SPAWN_INTERVAL && newObstacles.length < MAX_OBSTACLES) {
        const newPattern = generateObstaclePattern(newObstacles);
        if (newPattern) {
          newObstacles.push(...newPattern);
          lastObstacleTime = timestamp;
          setScore(prev => prev + 10);
        }
      }
      
      setProjectiles(updatedProjectiles);
      setObstacles(newObstacles);
      
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [airplane, obstacles, projectiles, gameOver]);
  
  // Touch controls for mobile fallback
  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameOver || (isMobile && hasOrientationPermission)) return;
    
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
    if (gameOver || !isMobile) return;
    
    setProjectiles(prev => [...prev, {
      x: airplane.x,
      y: airplane.y - AIRPLANE_SIZE,
      speed: PROJECTILE_SPEED,
    }]);
  };
  
  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    setObstacles([]);
    setProjectiles([]);
    setAirplane({
      x: window.innerWidth / 2,
      y: window.innerHeight - 100,
      width: AIRPLANE_SIZE,
      height: AIRPLANE_SIZE,
    });
    if (isMobile) {
      requestOrientationPermission();
    }
  };

  useEffect(() => {
    if (isMobile) {
      requestOrientationPermission();
    }
  }, [isMobile]);
  
  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      {/* {!gameOver && ( */}
      {/*   <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-center px-4 py-2 bg-black bg-opacity-50 rounded"> */}
      {/*     {isMobile ? ( */}
      {/*       hasOrientationPermission ?  */}
      {/*         "Tilt device to move, tap to shoot" : */}
      {/*         "Touch and drag to move, tap to shoot" */}
      {/*     ) : ( */}
      {/*       "Use Arrow Keys or A/D to move, Spacebar to shoot" */}
      {/*     )} */}
      {/*   </div> */}
      {/* )} */}
      
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className="w-full h-full"
      />
      
      <div className="absolute top-10 left-4 text-white text-4xl font-bold">
        {score}
      </div>
      
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-4">Score: {score}</p>
            <button
              onClick={handleRestart}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
