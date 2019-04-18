export class Vec3 {
  constructor(public x: number, public y: number, public z: number) {}

  public dot(other: Vec3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  public add(other: Vec3): Vec3 {
    return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  public minus(other: Vec3): Vec3 {
    return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  public times(multiplier: number): Vec3 {
    return new Vec3(
      this.x * multiplier,
      this.y * multiplier,
      this.z * multiplier,
    );
  }

  public normalize(to: number = 1): Vec3 {
    return this.times(1 / this.length());
  }

  public lengthSquared(): number {
    return Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2);
  }

  public length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  public copy(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }
}
