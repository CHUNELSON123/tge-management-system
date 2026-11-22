export class AppService {
  getHealth() {
    return {
      status: "ok",
      service: "TGE API",
    };
  }
}
