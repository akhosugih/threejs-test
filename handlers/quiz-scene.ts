import {
  Scene,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Raycaster,
  Vector2,
  CanvasTexture,
  SRGBColorSpace
} from "three";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { IScene } from "@interfaces/IScene";
import { HandlerEnum } from "@enums/handler-enum";
import { EngineHandler } from "@handlers/engine";
import { MascotHandler } from "./mascot";
import { LandingPageHandler } from "./landing-page";

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
};

export class QuizHandler implements IScene {

  private container = new Group();

  private backButton!: Mesh;
  private questionBoard!: Mesh;
  private nextButton!: Mesh;

  private creditBoard!: Mesh;
  private creditLinkMesh!: Mesh;

  private questionTextMesh!: Mesh;

  private optionButtons: Mesh[] = [];
  private optionMaterials: MeshBasicMaterial[] = [];

  private font: any;
  private isActive = false;

  private boardTargetY = 0.6;
  private boardStartY = 5;
  private boardSliding = false;

  private creditStartY = -6;
  private creditTargetY = -2.8;
  private creditSliding = false;

  private message = "Tekan berikutnya untuk memulai";

  private typingIndex = 0;
  private typingTimer = 0;
  private typingSpeed = 40;
  private typingActive = false;

  private answered = false;

  private exiting = false;
  private exitSpeed = 6;

  private questions: Question = {
    question: "apakah ini pertanyaan?",
    options: ["ya", "tidak"],
    correctAnswer: 1
  };

  constructor(
    private readonly scene: Scene,
    private readonly engine: EngineHandler,
    private readonly mascot: MascotHandler,
    private readonly landingPage: LandingPageHandler
  ) {
    this.loadFont();
  }

  init(): void {}

  setScene? = (): HandlerEnum => HandlerEnum.QUIZ;

  enterScene?(): void {

    this.isActive = true;
    this.exiting = false;

    this.container.clear();
    this.container.position.set(0, 0, -3);

    this.scene.add(this.container);

    this.createLayout();

    this.boardSliding = true;
    this.questionBoard.position.y = this.boardStartY;

    this.creditSliding = true;
    this.creditBoard.position.y = this.creditStartY;

    this.typingIndex = 0;
    this.typingTimer = 0;
    this.typingActive = false;
  }

  exitScene?(): void {

    if (!this.isActive) return;

    this.exiting = true;
    this.mascot.exitScene?.();
  }

  isFinished(): boolean {
    return !this.isActive;
  }

  updateScene(delta: number): void {

    if (!this.isActive) return;

    if (this.exiting) {

      const speed = this.exitSpeed * delta;

      this.questionBoard.position.y += speed;

      if (this.nextButton)
        this.nextButton.position.y -= speed;

      this.optionButtons.forEach(o => {
        o.position.y -= speed;
      });

      this.creditBoard.position.y -= speed;

      if (this.questionBoard.position.y >= this.boardStartY) {

        this.container.remove(this.questionBoard);
        this.container.remove(this.nextButton);
        this.container.remove(this.backButton);
        this.container.remove(this.creditBoard);

        this.optionButtons.forEach(o => this.container.remove(o));

        if (this.questionTextMesh)
          this.questionBoard.remove(this.questionTextMesh);

        this.optionButtons = [];
        this.optionMaterials = [];

        this.destroy?.();

        this.isActive = false;
        this.exiting = false;

        this.landingPage.enterScene?.();
      }

      return;
    }

    if (this.boardSliding) {

      const speed = 6 * delta;

      if (this.questionBoard.position.y > this.boardTargetY)
        this.questionBoard.position.y -= speed;

      if (this.questionBoard.position.y <= this.boardTargetY) {
        this.questionBoard.position.y = this.boardTargetY;
        this.boardSliding = false;
        this.startTyping();
      }
    }

    if (this.creditSliding) {

      const speed = 6 * delta;

      if (this.creditBoard.position.y < this.creditTargetY)
        this.creditBoard.position.y += speed;

      if (this.creditBoard.position.y >= this.creditTargetY) {
        this.creditBoard.position.y = this.creditTargetY;
        this.creditSliding = false;
      }
    }

    if (this.typingActive) {

      this.typingTimer += delta * 1000;

      if (this.typingTimer >= this.typingSpeed) {

        this.typingTimer = 0;
        this.typingIndex++;

        const visible = this.message.substring(0, this.typingIndex);

        if (this.questionTextMesh)
          this.questionBoard.remove(this.questionTextMesh);

        this.questionTextMesh = this.createText(visible, 0.22, 0, 0);

        this.questionBoard.add(this.questionTextMesh);

        if (this.typingIndex >= this.message.length) {
          this.typingActive = false;
          this.nextButton.visible = true;
          this.addNextText();
        }
      }
    }
  }

  onClick?(raycaster: Raycaster, _?: Vector2): void {

    if (!this.isActive) return;

    const intersects = raycaster.intersectObjects([
      this.backButton,
      this.nextButton,
      this.creditLinkMesh,
      ...this.optionButtons
    ]);

    if (intersects.length === 0) return;

    const clicked = intersects[0].object as Mesh;

    if (clicked === this.backButton) {
      this.exitScene?.();
      return;
    }

    if (clicked === this.nextButton) {
      this.handleNext();
      return;
    }

    if (clicked === this.creditLinkMesh) {
      window.open("https://www.patreon.com/quaternius", "_blank");
      return;
    }

    const optionIndex = this.optionButtons.indexOf(clicked);

    if (optionIndex !== -1)
      this.handleOption(optionIndex);
  }

  destroy?(): void {
    this.scene.remove(this.container);
    this.container.clear();
  }

  private createLayout() {

    const distance = this.engine.camera.position.z - this.container.position.z;
    const view = this.engine.getViewSize(distance);

    const padding = 0.5;

    const closeSize = 0.8;

    const closeX = view.width / 2 - closeSize / 2 - padding;
    const closeY = view.height / 2 - closeSize / 2 - padding;

    this.backButton = this.createCloseButton(closeSize, closeX, closeY);

    this.questionBoard = this.createRoundedPanel(6, 3, 0, this.boardStartY, "#ffffff");

    this.nextButton = this.createRoundedPanel(
      2.6,
      0.9,
      0,
      -view.height / 2 + 2.3,
      "#27ae60"
    );

    this.nextButton.visible = false;

    this.creditStartY = -view.height / 2 - 1.2;
    this.creditTargetY = -view.height / 2 + 0.6;

    this.creditBoard = this.createRoundedPanel(
      5,
      0.9,
      0,
      this.creditStartY,
      "#ffffff"
    );

    const prefix = this.createText("Model created by", 0.18, -1.2, 0);
    const author = this.createText("Tomas Laulhe", 0.18, 1.1, 0);

    (author.material as MeshBasicMaterial).color.set(0x2980b9);

    this.creditLinkMesh = author;

    this.creditBoard.add(prefix);
    this.creditBoard.add(author);

    this.container.add(this.backButton);
    this.container.add(this.questionBoard);
    this.container.add(this.nextButton);
    this.container.add(this.creditBoard);
  }

  private createRoundedPanel(width: number, height: number, x: number, y: number, color: string) {

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext("2d")!;

    const r = 40;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;

    const geo = new PlaneGeometry(width, height);

    const mat = new MeshBasicMaterial({
      map: texture,
      transparent: true
    });

    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    mesh.renderOrder = 10;

    return mesh;
  }

  private createCloseButton(size: number, x: number, y: number) {

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext("2d")!;

    const r = 24;
    const w = 128;
    const h = 128;

    ctx.fillStyle = "#e53935";

    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(40, 40);
    ctx.lineTo(88, 88);
    ctx.moveTo(88, 40);
    ctx.lineTo(40, 88);
    ctx.stroke();

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;

    const geo = new PlaneGeometry(size, size);

    const mat = new MeshBasicMaterial({
      map: texture,
      transparent: true
    });

    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    mesh.renderOrder = 10;

    return mesh;
  }

  private startTyping() {
    this.typingActive = true;
  }

  private addNextText() {

    const txt = this.createText("Berikutnya", 0.2, 0, 0);
    txt.position.z = 0.05;

    this.nextButton.add(txt);
  }

  private handleNext() {

    if (this.questionTextMesh)
      this.questionBoard.remove(this.questionTextMesh);

    this.nextButton.visible = false;

    this.renderQuestion();
    this.renderOptions();

    this.container.remove(this.nextButton);
  }

  private renderQuestion() {

    this.questionTextMesh = this.createText(
      this.questions.question,
      0.22,
      0,
      0
    );

    this.questionBoard.add(this.questionTextMesh);
  }

  private renderOptions() {

    const startY = this.boardTargetY - 2.2;

    this.optionButtons = [];
    this.optionMaterials = [];
    this.answered = false;

    this.questions.options.forEach((opt, i) => {

      const geo = new PlaneGeometry(3.2, 0.8);
      const mat = new MeshBasicMaterial({ color: 0x3498db });

      const btn = new Mesh(geo, mat);

      btn.position.set(0, startY - i * 1.1, 0);
      btn.renderOrder = 10;

      const txt = this.createText(opt, 0.2, 0, 0);
      txt.position.z = 0.05;

      btn.add(txt);

      this.container.add(btn);

      this.optionButtons.push(btn);
      this.optionMaterials.push(mat);
    });
  }

  private handleOption(index: number) {

    if (this.answered) return;

    this.answered = true;

    const selected = index + 1;

    if (selected === this.questions.correctAnswer) {

      this.optionMaterials[index].color.set(0x27ae60);
      this.mascot.correct();

    } else {

      this.optionMaterials[index].color.set(0xe74c3c);
      this.mascot.incorrect();
    }
  }

  private loadFont() {

    const loader = new FontLoader();

    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        this.font = font;
      }
    );
  }

  private createText(text: string, size: number, x: number, y: number) {

    const geo = new TextGeometry(text, {
      font: this.font,
      size,
      depth: 0.02
    });

    geo.center();

    const mat = new MeshBasicMaterial({ color: 0x000000 });

    const mesh = new Mesh(geo, mat);

    mesh.position.set(x, y, 0.05);
    mesh.renderOrder = 11;

    return mesh;
  }
}