export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string
}

export interface Projectile {
  x: number;
  y: number;
  speed: number;
}
