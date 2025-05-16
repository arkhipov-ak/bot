export class Meteor {
  x: number;
  y: number;
  size: number;
  type: string;

  constructor(x: number, y: number, size: number, type: string = 'normal') {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    let gradient;
    if (this.type === 'dodgable') {
      gradient = ctx.createRadialGradient(this.x, this.y, this.size * 0.1, this.x, this.y, this.size * 0.5);
      gradient.addColorStop(0, '#ff4e50');
      gradient.addColorStop(1, '#d34f4f');
    } else {
      gradient = ctx.createRadialGradient(this.x, this.y, this.size * 0.1, this.x, this.y, this.size * 0.5);
      gradient.addColorStop(0, '#b0b2c0');
      gradient.addColorStop(1, '#80838f');
    }

    ctx.fillStyle = gradient;

    // Рисуем основную форму метеорита - круг
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // кратеры на поверхности метеорита
    ctx.fillStyle = this.type === 'dodgable' ? '#7a2525' : '#343648'; // темно-коричневый для "dodgable", темно-серый для обычных
    
    ctx.beginPath();
    ctx.arc(this.x - this.size * 0.2, this.y - this.size * 0.1, this.size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(this.x + this.size * 0.1, this.y - this.size * 0.2, this.size * 0.07, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(this.x + this.size * 0.15, this.y + this.size * 0.05, this.size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}
