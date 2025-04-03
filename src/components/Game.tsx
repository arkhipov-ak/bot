// Game.tsx
import React, { useEffect, useState } from 'react';
import { GameObject, Projectile } from '../types/Game.ts';
import { GameCanvas } from './GameCanvas';
import { AIRPLANE_SIZE } from '../utils/isTooCloseToObstacles.ts';

const Game: React.FC = () => {
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

  const checkMobile = () => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  };

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const requestOrientationPermission = async () => {
    if (!isMobile) {
      setHasOrientationPermission(false);
      return;
    }

    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      // @ts-ignore:
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        // @ts-ignore
        const permission = await DeviceOrientationEvent.requestPermission();
        setHasOrientationPermission(permission === 'granted');
      } catch (err) {
        console.error('Ошибка запроса разрешения ориентации:', err);
        setHasOrientationPermission(false);
      }
    } else {
      setHasOrientationPermission(true);
    }
  };

  // Обработка ориентации для мобильных устройств
  useEffect(() => {
    if (!isMobile || !hasOrientationPermission || gameOver) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null) return;

      const tilt = event.gamma;
      setAirplane(prev => ({
        ...prev,
        x: Math.max(
          AIRPLANE_SIZE,
          Math.min(window.innerWidth - AIRPLANE_SIZE, prev.x + tilt)
        ),
      }));
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () =>
      window.removeEventListener('deviceorientation', handleOrientation);
  }, [isMobile, hasOrientationPermission, gameOver]);

  // Обработка клавиатуры для ПК
  useEffect(() => {
    if (isMobile || gameOver) return;

    const handleKeyboard = (e: KeyboardEvent) => {
      setAirplane(prev => {
        let newX = prev.x;

        switch (e.key) {
          case 'ArrowLeft':
          case 'a':
            newX = Math.max(AIRPLANE_SIZE, prev.x - 5);
            break;
          case 'ArrowRight':
          case 'd':
            newX = Math.min(window.innerWidth - AIRPLANE_SIZE, prev.x + 5);
            break;
          case ' ':
            setProjectiles((prev: any) => [
              ...prev,
              {
                x: prev?.x,
                y: prev?.y - AIRPLANE_SIZE,
                speed: 7,
              },
            ]);
            break;
        }

        return { ...prev, x: newX };
      });
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isMobile, gameOver]);

  // Запрос разрешения ориентации при инициализации для мобильных
  useEffect(() => {
    if (isMobile) {
      requestOrientationPermission();
    }
  }, [isMobile]);

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

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      <GameCanvas
        airplane={airplane}
        obstacles={obstacles}
        projectiles={projectiles}
        gameOver={gameOver}
        setAirplane={setAirplane}
        setObstacles={setObstacles}
        setProjectiles={setProjectiles}
        setScore={setScore}
        setGameOver={setGameOver}
      />

      <div className="absolute top-16 left-[50%] text-white text-4xl font-bold -translate-x-1/2">
        {score}
      </div>

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Игра окончена!</h2>
            <p className="text-xl mb-4">Счёт: {score}</p>
            <button
              onClick={handleRestart}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Начать заново
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
