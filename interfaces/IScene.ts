import { HandlerEnum } from "@enums/handler-enum";
import { Raycaster, Vector2 } from "three";

export interface IScene {
    init() : void;
    interact?(): void;
    enterScene?(): void;
    exitScene?(): void;
    setScene?() : HandlerEnum;
    updateScene(delta: number): void;
    onClick?(raycaster: Raycaster, mouse?: Vector2): void;
    destroy?(): void;
}