export function drawMeteor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  
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
