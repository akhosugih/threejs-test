import { AnimationMixer, LoopOnce, Raycaster } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Scene, Object3D, AnimationAction, Vector2 } from "three";
import { IScene } from "@interfaces/IScene";
import mascotModel from "@asset-models/RobotExpressive.glb";

type MascotState = "entering" | "rotating" | "idle" | "busy" | "exiting";

export class MascotHandler implements IScene {

  private loader = new GLTFLoader();

  private mixer: AnimationMixer | null = null;
  private mascot: Object3D | null = null;

  private actions: Record<string, AnimationAction> = {};
  private activeAction: AnimationAction | null = null;

  private state: MascotState = "idle";

  private spawnX = -6;
  private finalX = -2;
  private yPos = -1;

  private walkRotation = -Math.PI / 2;
  private frontRotation = 0.8;
  private exitRotation = Math.PI / 2;

  private lastInteractionTime = 0;
  private interactionCount = 0;

  constructor(private readonly scene: Scene) {}

  init(): void {}

  enterScene?(): void {
    this.load();
  }

  exitScene?(): void {
    this.triggerExit();
  }

  interact?(): void {
    const now = performance.now();

    if (now - this.lastInteractionTime > 3000) {
      this.interactionCount = 0;
    }

    this.lastInteractionTime = now;
    this.interactionCount++;

    if (this.state !== "idle") return;

    this.interactionCount > 5
      ? this.playOnce("Punch")
      : this.playOnce("Wave");
  }

  updateScene(delta: number): void {
    if (this.mixer) this.mixer.update(delta);
    
    if (!this.mascot) return;

    if (this.state === "entering") {
      const speed = 2.5 * delta;

      if (this.mascot.position.x < this.finalX) {
        this.mascot.position.x += speed;
      }

      if (this.mascot.position.x >= this.finalX) {
        this.mascot.position.x = this.finalX;
        this.state = "rotating";
      }
    }

    if (this.state === "rotating") {
      const rotateSpeed = 3 * delta;

      if (this.mascot.rotation.y < this.frontRotation) {
        this.mascot.rotation.y += rotateSpeed;
      }

      if (this.mascot.rotation.y >= this.frontRotation) {
        this.mascot.rotation.y = this.frontRotation;
        this.state = "busy";
        this.playOnce("Wave");
      }
    }

    if (this.state === "exiting") {
      const speed = 2.5 * delta;

      if (this.mascot.position.x > this.spawnX) {
        this.mascot.position.x -= speed;
      }

      if (this.mascot.position.x <= this.spawnX) {
        this.cleanup();
      }
    }
  }

  onClick?(raycaster: Raycaster, mouse?: Vector2): void {
    if (!this.mascot) return;

    const intersects = raycaster.intersectObject(this.mascot, true);
    if (intersects.length > 0) {
      this.interact?.();
    }
  }

  destroy?(): void {
    this.cleanup();
  }

  correct() {

    if (this.state !== "idle") return;

    const anim = Math.random() < 0.5 ? "ThumbsUp" : "Yes";

    this.playOnce(anim);
  }
  
  incorrect() {

    if (this.state !== "idle") return;

    this.playOnce("No");
  }

  private load() {
    this.loader.load("/models/RobotExpressive.glb", (gltf) => {

      this.mascot = gltf.scene;

      this.mascot.scale.set(0.3, 0.3, 0.3);
      this.mascot.position.set(this.spawnX, this.yPos, 0);
      this.mascot.rotation.y = this.walkRotation;

      this.scene.add(this.mascot);

      this.mixer = new AnimationMixer(this.mascot);

      gltf.animations.forEach((clip) => {
        this.actions[clip.name] = this.mixer!.clipAction(clip);
      });

      this.state = "entering";
      this.play("Walking");
    });
  }

  private triggerExit() {
    if (!this.mascot || this.state === "exiting") return;

    this.state = "exiting";
    this.play("Walking");
    this.mascot.rotation.y = this.exitRotation;
  }

  private play(name: string) {
    const action = this.actions[name];
    if (!action) return;

    if (this.activeAction) {
      this.activeAction.fadeOut(0.3);
    }

    action.reset().fadeIn(0.3).play();
    this.activeAction = action;
  }

  private playOnce(name: string) {
    const action = this.actions[name];
    if (!action) return;

    this.state = "busy";

    if (this.activeAction) {
      this.activeAction.fadeOut(0.2);
    }

    action.reset();
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.fadeIn(0.2).play();

    this.activeAction = action;

    const mixer = action.getMixer();

    const onFinish = () => {
      mixer.removeEventListener("finished", onFinish);
      this.state = "idle";
      this.play("Idle");
    };

    mixer.addEventListener("finished", onFinish);
  }

  private cleanup() {
    if (!this.mascot) return;

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mascot);
    }

    this.scene.remove(this.mascot);

    this.mascot.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });

    this.mascot = null;
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.state = "idle";
  }
}