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
    // Перемещаем начало координат в позицию самолета
    ctx.translate(this.x, this.y);

    // Рисуем хвост самолета
    ctx.fillStyle = '#3c5ea9'; // Синий цвет для хвоста
    ctx.fillRect(
      -this.size * 0.03,    // Отступ влево от центра
      -this.size * 0.65,    // Отступ вверх от центра
      this.size * 0.06,     // Ширина хвоста
      this.size * 0.15      // Высота хвоста
    );

    // Рисуем основной корпус самолета (форма бумажного самолетика)
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.5);               // нос самолета
    ctx.lineTo(-this.size * 0.5, this.size * 0.3); // Левый край
    ctx.lineTo(0, this.size * 0.2);                // Нижняя центральная точка
    ctx.lineTo(this.size * 0.5, this.size * 0.3);  // Правый край
    ctx.closePath();

    // Создаем градиент для заливки корпуса
    const gradient = ctx.createLinearGradient(0, -this.size * 0.5, 0, this.size * 0.3);
    gradient.addColorStop(0, '#ffffff'); // Белый цвет сверху
    gradient.addColorStop(1, '#d4d4d4'); // Светло-серый цвет снизу
    ctx.fillStyle = gradient;
    ctx.fill(); // Заполняем корпус градиентом

    // Настройка стиля для линий сгиба
    ctx.strokeStyle = '#a0a0a0'; // Серый цвет для линий
    ctx.lineWidth = 2;           // Толщина линий

    // Рисуем левую линию сгиба
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.5);      // Начинаем от носа самолета
    ctx.lineTo(-this.size * 0.1, this.size * 0.15); // Ведем к левой части корпуса
    ctx.stroke();                         // Рисуем линию

    // Рисуем правую линию сгиба
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 0.5);      // Начинаем от носа самолета
    ctx.lineTo(this.size * 0.1, this.size * 0.15);  // Ведем к правой части корпуса
    ctx.stroke();                         // Рисуем линию

    ctx.restore();
  }
}
