export class Airplane {
  x: number;
  y: number;
  size: number;

  constructor(x: number, y: number, size: number) {
    this.x = x;
    this.y = y;
    this.size = size;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Хвост
    ctx.fillStyle = '#3c5ea9';
    ctx.fillRect(
      -this.size * 0.03,
      -this.size * 0.65,
      this.size * 0.06,
      this.size * 0.15
    );

    // Основной корпус
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.5);
    ctx.lineTo(-this.size * 0.5, this.size * 0.3);
    ctx.lineTo(0, this.size * 0.2);
    ctx.lineTo(this.size * 0.5, this.size * 0.3);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, -this.size * 0.5, 0, this.size * 0.3);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#d4d4d4');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Линии сгиба
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.5);
    ctx.lineTo(-this.size * 0.1, this.size * 0.15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.5);
    ctx.lineTo(this.size * 0.1, this.size * 0.15);
    ctx.stroke();

    ctx.restore();
  }
}
