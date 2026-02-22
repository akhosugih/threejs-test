export class AppContainer {
  private services = new Map<string, any>();

  register<T>(key: string, instance: T) {
    this.services.set(key, instance);
  }

  resolve<T>(key: string): T {
    return this.services.get(key);
  }
}