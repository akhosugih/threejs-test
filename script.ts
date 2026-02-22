import { Raycaster, Vector2 } from "three";
import { bootstrap } from "@bootstrap/bootstrap";
import { HandlerEnum } from "@enums/handler-enum";
import { EngineHandler } from "@handlers/engine";
import { BackgroundHandler } from "@handlers/background";
import { MascotHandler } from "@handlers/mascot";
import { LandingPageHandler } from "@handlers/landing-page";
import { QuizHandler } from "@handlers/quiz-scene";

const container = bootstrap();

const engine = container.resolve<EngineHandler>(HandlerEnum.ENGINE);
const background = container.resolve<BackgroundHandler>(HandlerEnum.GAME_BACKGROUND);
const mascot = container.resolve<MascotHandler>(HandlerEnum.MASCOT);
const landing = container.resolve<LandingPageHandler>(HandlerEnum.LANDING_PAGE);
const quiz = container.resolve<QuizHandler>(HandlerEnum.QUIZ);

background.init();
landing.init();
mascot.init?.();

let current: HandlerEnum = HandlerEnum.LANDING_PAGE;

landing.setOnStart(() => {
  mascot.enterScene?.();
});

const mouse = new Vector2();
const raycaster = new Raycaster();

window.addEventListener("click", (event) => {

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, engine.camera);

  if (current === HandlerEnum.QUIZ) {
    quiz.onClick?.(raycaster);
  } else {
    landing.onClick?.(raycaster);
  }

  mascot.onClick?.(raycaster);
});

function animate() {
  requestAnimationFrame(animate);

  const delta = engine.clock.getDelta();

  background.updateScene(delta);
  mascot.updateScene(delta);

  switch (current) {

    case HandlerEnum.LANDING_PAGE:

      landing.updateScene(delta);

      if (landing.isFinished()) {
        landing.exitScene?.();
        quiz.enterScene?.();
        current = HandlerEnum.QUIZ;
      }

      break;

    case HandlerEnum.QUIZ:

      quiz.updateScene(delta);

      if (quiz.isFinished()) {
        quiz.exitScene?.();
        landing.enterScene?.();
        current = HandlerEnum.LANDING_PAGE;
      }

      break;
  }

  engine.render();
}

animate();