import { HandlerEnum } from "@enums/handler-enum";
import { BackgroundHandler } from "@handlers/background";
import { EngineHandler } from "@handlers/engine";
import { LandingPageHandler } from "@handlers/landing-page";
import { MascotHandler } from "@handlers/mascot";
import { QuizHandler } from "@handlers/quiz-scene";
import { AppContainer } from "./container";

export function bootstrap() {
  const container = new AppContainer();

  const root = document.getElementById("app")!;

  const engine = new EngineHandler(
    root,
    () => window.innerWidth,
    () => window.innerHeight
  );

  container.register(HandlerEnum.ENGINE, engine);

  const background = new BackgroundHandler(engine.scene, engine.camera);
  container.register(HandlerEnum.GAME_BACKGROUND, background);

  const mascot = new MascotHandler(engine.scene);
  container.register(HandlerEnum.MASCOT, mascot);

  const landing = new LandingPageHandler(engine.scene, engine.camera);
  container.register(HandlerEnum.LANDING_PAGE, landing);

  const quiz = new QuizHandler(engine.scene, engine, mascot, landing);
  container.register(HandlerEnum.QUIZ, quiz);

  return container;
}