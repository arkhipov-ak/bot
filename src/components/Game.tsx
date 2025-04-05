import React, { useEffect, useState } from 'react';
import { GameObject, Projectile } from '../types/Game';
import { GameCanvas } from './GameCanvas';
import { AIRPLANE_SIZE } from '../utils/isTooCloseToObstacles';
import { TailSpin } from 'react-loader-spinner'; // Импортируем компонент лоадера

const Game: React.FC = () => {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasOrientationPermission, setHasOrientationPermission] = useState<boolean | null>(null); // Инициализируем как null
  const [isMobile, setIsMobile] = useState(false);
  const [airplane, setAirplane] = useState<GameObject>({
    type: '',
    x: window.innerWidth / 2,
    y: window.innerHeight - 100,
    width: AIRPLANE_SIZE,
    height: AIRPLANE_SIZE
  });
  const [obstacles, setObstacles] = useState<GameObject[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  const checkMobile = () => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  };
  
  useEffect(() => {
    if(!isMobile) {
      window.Telegram.WebApp.lockOrientation();
    }
  }, [isMobile])

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
    // if (isMobile) {
    //   requestOrientationPermission();
    // }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      {!hasOrientationPermission && isMobile ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <TailSpin color="#ffffff" height={80} width={80} />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default Game;
