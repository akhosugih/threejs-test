import {
  Scene,
  Camera,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  Raycaster,
  Vector2
} from "three";
import { IScene } from "@interfaces/IScene";

export class BackgroundHandler implements IScene {

  private stars: Points | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly camera: Camera
  ) {}

  init(): void {
    const starCount = 5000;
    const geometry = new BufferGeometry();
    const positions: number[] = [];

    for (let i = 0; i < starCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        -Math.random() * 500
      );
    }

    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(positions, 3)
    );

    this.stars = new Points(
      geometry,
      new PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        sizeAttenuation: true
      })
    );

    this.scene.add(this.stars);
  }

  updateScene(_: number): void {
    if (!this.stars) return;

    const positions = this.stars.geometry.attributes.position;
    const array = positions.array as Float32Array;

    for (let i = 0; i < array.length; i += 3) {
      array[i + 2] += 0.8;

      if (array[i + 2] > this.camera.position.z) {
        array[i + 2] = -200;
      }
    }

    positions.needsUpdate = true;
  }

  onClick?(_: Raycaster, __?: Vector2): void {}

  destroy?(): void {
    if (!this.stars) return;

    this.scene.remove(this.stars);
    this.stars.geometry.dispose();
    (this.stars.material as PointsMaterial).dispose();
    this.stars = null;
  }
}