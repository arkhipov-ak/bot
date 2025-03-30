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

const AIRPLANE_SIZE = 30;
const OBSTACLE_SIZE = 50;
const GAME_SPEED = 5;
const OBSTACLE_SPAWN_INTERVAL = 1500;
const PROJECTILE_SPEED = 7;
const PROJECTILE_SIZE = 5;
const TILT_SENSITIVITY = 1;
const KEYBOARD_SPEED = 5;
const MAX_OBSTACLES = 10;

// Increase minimum distance to prevent overlapping
const MIN_DISTANCE_BETWEEN_OBSTACLES = OBSTACLE_SIZE * 3;
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

  const isTooCloseToObstacles = (x: number, y: number, existingObstacles: GameObject[]) => {
    return existingObstacles.some(obstacle => {
      const dx = obstacle.x - x;
      const dy = obstacle.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Check if the new obstacle would overlap with any existing obstacle
      return distance < MIN_DISTANCE_BETWEEN_OBSTACLES;
    });
  };

  const generateSafePosition = (canvas: HTMLCanvasElement, existingObstacles: GameObject[]) => {
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

  const generateObstaclePattern = (existingObstacles: GameObject[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

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

          // Try to add satellites around the main obstacle
          for (let i = 0; i < clusterSize; i++) {
            const angle = (Math.PI * 2 * i) / clusterSize;
            const radius = OBSTACLE_SIZE * 2.5; // Increased radius for better spacing
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
      
      // Create sets to track which projectiles and obstacles to remove
      const projectilesToRemove = new Set<number>();
      const obstaclesToRemove = new Set<number>();

      // Draw and update projectiles
      projectiles.forEach((projectile, pIndex) => {
        projectile.y -= projectile.speed;
        
        // Remove projectiles that are off screen
        if (projectile.y < 0) {
          projectilesToRemove.add(pIndex);
          return;
        }
        
        // Check for collisions with obstacles
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
        
        // Draw projectile if it hasn't been marked for removal
        if (!projectilesToRemove.has(pIndex)) {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, PROJECTILE_SIZE, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Update and draw obstacles
      obstacles.forEach((obstacle, index) => {
        if (obstaclesToRemove.has(index)) return;
        
        obstacle.y += GAME_SPEED;
        
        // Remove obstacles that are off screen
        if (obstacle.y > canvas.height + OBSTACLE_SIZE) {
          obstaclesToRemove.add(index);
          return;
        }
        
        // Check for collision with airplane
        const dx = airplane.x - obstacle.x;
        const dy = airplane.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (AIRPLANE_SIZE + OBSTACLE_SIZE) / 2) {
          setGameOver(true);
          return;
        }
        
        // Draw obstacle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, OBSTACLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Remove marked projectiles and obstacles
      setProjectiles(prev => prev.filter((_, index) => !projectilesToRemove.has(index)));
      setObstacles(prev => prev.filter((_, index) => !obstaclesToRemove.has(index)));
      
      // Spawn new obstacles
      if (timestamp - lastObstacleTime > OBSTACLE_SPAWN_INTERVAL && obstacles.length < MAX_OBSTACLES) {
        const newPattern = generateObstaclePattern(obstacles);
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
  }, [airplane, obstacles, projectiles, gameOver]);
  
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
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className="w-full h-full"
      />
      
      <div className="absolute top-16 left-[50%] text-white text-4xl font-bold translate-x-[-50%]">
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