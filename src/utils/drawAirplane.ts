export function drawAirplane(
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

