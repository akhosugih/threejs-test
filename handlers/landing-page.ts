import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector2,
  Raycaster,
  SphereGeometry,
  TextureLoader,
  SRGBColorSpace
} from "three";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { IScene } from "@interfaces/IScene";
import { HandlerEnum } from "@enums/handler-enum";
import logo from '@images/logo.png'

export class LandingPageHandler implements IScene {

  private globe?: Mesh;
  private startButton = new Group();

  private hideLanding = false;
  private finished = false;
  private moveButton = false;

  private onStartCallback?: () => void;

  constructor(
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera
  ) {}

  setOnStart(callback: () => void) {
    this.onStartCallback = callback;
  }

  init(): void {
    this.createStartButton();
    this.loadGlobe();
    setTimeout(() => (this.moveButton = true), 1000);
  }

  enterScene?(): void {
    this.reset();
  }

  exitScene?(): void {}

  updateScene(_: number): void {
    if (this.globe) this.globe.rotation.y += 0.03;

    if (this.moveButton) this.animateStartButton();
    if (this.hideLanding) {
      this.animateHideLanding();
    }
  }

  onClick?(raycaster: Raycaster, mouse?: Vector2): void {
    if (this.hideLanding || this.finished) return;

    const intersects = raycaster.intersectObject(this.startButton, true);
  console.log("landing click test", intersects.length);

    if (intersects.length > 0) {
      this.hideLanding = true;
      this.onStartCallback?.();
    }
  }

  destroy?(): void {
    if (this.globe) {
      this.scene.remove(this.globe);
      this.globe.geometry.dispose();
      (this.globe.material as MeshStandardMaterial).dispose();
      this.globe = undefined;
    }

    this.scene.remove(this.startButton);
  }

  interact?(): void {}

  setScene? = () : HandlerEnum => HandlerEnum.LANDING_PAGE;

  isFinished(): boolean {
    return this.finished;
  }

  private reset() {
    this.hideLanding = false;
    this.finished = false;
    this.moveButton = false;

    if (this.globe) {
      this.globe.visible = true;
      this.globe.position.y = 1;
    }

    this.startButton.visible = true;
    this.startButton.position.y = -3;

    setTimeout(() => {
      this.moveButton = true;
    }, 300);
  }

  private loadGlobe() {
    const sphere = new SphereGeometry(0.6, 64, 64);

    const logoImg = new Image();
    logoImg.src = logo;

    logoImg.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 1024;

      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#A8A9AD";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const logoSize = 400;

      ctx.drawImage(
        logoImg,
        canvas.width / 2 - logoSize / 2,
        canvas.height / 2 - logoSize / 2,
        logoSize,
        logoSize
      );

      const texture = new TextureLoader().load(canvas.toDataURL());
      texture.colorSpace = SRGBColorSpace;

      this.globe = new Mesh(
        sphere,
        new MeshStandardMaterial({
          map: texture,
          roughness: 0.4,
          metalness: 0.1
        })
      );

      this.globe.position.y = 1;
      this.scene.add(this.globe);
    };
  }

  private createStartButton() {
    const buttonBox = new Mesh(
      new BoxGeometry(1.5, 0.4, 0.2),
      new MeshStandardMaterial({
        color: 0x1e90ff,
        transparent: true,
        opacity: 0.5
      })
    );

    const fontLoader = new FontLoader();

    fontLoader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeo = new TextGeometry("MULAI", {
          font,
          size: 0.18,
          depth: 0.05
        });

        textGeo.center();

        const textMesh = new Mesh(
          textGeo,
          new MeshStandardMaterial({ color: 0xffffff })
        );

        textMesh.position.z = 0.11;
        this.startButton.add(textMesh);
      }
    );

    this.startButton.add(buttonBox);
    this.startButton.position.y = -3;
    this.scene.add(this.startButton);
  }

  private animateStartButton() {

    if (this.hideLanding) return;

    const targetY = -0.2;

    if (this.startButton.position.y < targetY) {
      this.startButton.position.y +=
        (targetY - this.startButton.position.y) * 0.08;
    }
  }

  private animateHideLanding() {

    const speed = 0.2;

    if (this.globe) {
      this.globe.position.y += speed;
    }

    this.startButton.position.y -= speed;

    if (this.startButton.position.y < -6) {

      if (this.globe) {
        this.globe.visible = false;
      }

      this.startButton.visible = false;

      this.finished = true;
      this.hideLanding = false;
    }
  }
}