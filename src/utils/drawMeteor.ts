export class Meteor {
  x: number;
  y: number;
  size: number;
  type: string; // Добавляем параметр типа

  constructor(x: number, y: number, size: number, type: string = 'normal') {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type; // Устанавливаем тип (по умолчанию 'normal')
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Проверяем тип и выбираем градиент в зависимости от типа
    let gradient;
    if (this.type === 'dodgable') {
      // Если тип 'dodgable', используем красный градиент
      gradient = ctx.createRadialGradient(this.x, this.y, this.size * 0.1, this.x, this.y, this.size * 0.5);
      gradient.addColorStop(0, '#ff4e50'); // яркий красный
      gradient.addColorStop(1, '#d34f4f'); // тёмный красный
    } else {
      // Иначе, обычный цвет для метеорита
      gradient = ctx.createRadialGradient(this.x, this.y, this.size * 0.1, this.x, this.y, this.size * 0.5);
      gradient.addColorStop(0, '#b0b2c0'); // светлый цвет
      gradient.addColorStop(1, '#80838f'); // более тёмный цвет
    }

    ctx.fillStyle = gradient;

    // Рисуем основной круг метеорита
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Рисуем «кратеры»
    ctx.fillStyle = this.type === 'dodgable' ? '#7a2525' : '#343648'; // Если "dodgable", используем темно-коричневый для кратеров
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
