import {
  AmbientLight,
  Clock,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from "three";

export class EngineHandler {

  public readonly scene: Scene;
  public readonly camera: PerspectiveCamera;
  public readonly renderer: WebGLRenderer;
  public readonly clock: Clock;

  constructor(
    private readonly container: HTMLElement,
    private readonly widthProvider: () => number,
    private readonly heightProvider: () => number
  ) {

    this.scene = new Scene();
    this.scene.background = new Color("#021631");

    this.scene.add(new AmbientLight(0xffffff, 0.6));

    const dir = new DirectionalLight(0xffffff, 1);
    dir.position.set(5, 5, 5);
    this.scene.add(dir);

    this.camera = new PerspectiveCamera(
      75,
      this.widthProvider() / this.heightProvider(),
      0.1,
      1000
    );

    this.camera.position.z = 3;
    this.scene.add(this.camera);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.widthProvider(), this.heightProvider());
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.container.appendChild(this.renderer.domElement);

    this.clock = new Clock();

    window.addEventListener("resize", this.onResize);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
  }

  getAspect(): number {
    return this.camera.aspect;
  }

  getViewSize(distance = this.camera.position.z) {

    const vFov = (this.camera.fov * Math.PI) / 180;

    const height = 2 * Math.tan(vFov / 2) * distance;
    const width = height * this.camera.aspect;

    return {
      width,
      height
    };
  }

  private onResize = (): void => {

    const width = this.widthProvider();
    const height = this.heightProvider();

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };
}