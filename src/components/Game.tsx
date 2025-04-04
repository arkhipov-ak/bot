import React, { useEffect, useState } from 'react';
import { GameObject, Projectile } from '../types/Game.ts';
import { GameCanvas } from './GameCanvas';
import { AIRPLANE_SIZE } from '../utils/isTooCloseToObstacles.ts';

const Game: React.FC = () => {
  // Состояние для хранения текущего счета
  const [score, setScore] = useState(0);
  // Состояние для отслеживания статуса игры (окончена или нет)
  const [gameOver, setGameOver] = useState(false);
  // Состояние для проверки разрешения на доступ к данным об ориентации устройства
  const [hasOrientationPermission, setHasOrientationPermission] = useState(false);
  // Состояние для определения, является ли устройство мобильным
  const [isMobile, setIsMobile] = useState(false);
  // Состояние для хранения данных об игровом самолете
  const [airplane, setAirplane] = useState<GameObject>({
    type: '',
    x: window.innerWidth / 2,
    y: window.innerHeight - 100,
    width: AIRPLANE_SIZE,
    height: AIRPLANE_SIZE
  });
  // Состояние для хранения списка препятствий
  const [obstacles, setObstacles] = useState<GameObject[]>([]);
  // Состояние для хранения списка снарядов
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  // Функция для проверки, является ли устройство мобильным
  const checkMobile = () => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  };

  useEffect(() => {
    checkMobile();
  }, []);

  // Функция для запроса разрешения на доступ к данным об ориентации устройства
  const requestOrientationPermission = async () => {
    if (!isMobile) {
      setHasOrientationPermission(true);
      return;
    }

    if (typeof DeviceOrientationEvent !== 'undefined') {
      try {
        // @ts-ignore
        const permission = await DeviceOrientationEvent?.requestPermission();
        setHasOrientationPermission(permission === 'granted');
      } catch (err) {
        console.error('Ошибка запроса разрешения ориентации:', err);
        setHasOrientationPermission(false);
      }
    } else {
      setHasOrientationPermission(true);
    }
  };

  useEffect(() => {
    if (isMobile) {
      // Запрашиваем разрешение на доступ к данным об ориентации при инициализации для мобильных устройств
      requestOrientationPermission();
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !hasOrientationPermission || gameOver) return;

    // Функция для обработки изменений ориентации устройства
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

    // Добавляем слушатель события изменения ориентации
    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      // Убираем слушатель при размонтировании компонента
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isMobile, hasOrientationPermission, gameOver]);

  // Функция для перезапуска игры
  const handleRestart = () => {
    setGameOver(false);
    setScore(0);
    setObstacles([]);
    setProjectiles([]);
    setAirplane({
      type: '',
      x: window.innerWidth / 2,
      y: window.innerHeight - 100,
      width: AIRPLANE_SIZE,
      height: AIRPLANE_SIZE
    });
    if (isMobile) {
      // Запрашиваем разрешение на доступ к данным об ориентации при перезапуске игры на мобильных устройствах
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
