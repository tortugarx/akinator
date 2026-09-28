class CrazyGamesBridge {
  constructor() {
    this.ready = false;
    this.muted = false;
    this.wantsGameplay = false;
  }

  isCrazyGamesHost() {
    const hostname = globalThis.location?.hostname || "";
    const referrer = globalThis.document?.referrer || "";
    return /(^|\.)crazygames\./i.test(hostname)
      || /(^|\.)game-cdn\./i.test(hostname)
      || /crazygames\./i.test(referrer);
  }

  async loadSdk() {
    if (globalThis.window?.CrazyGames?.SDK || !this.isCrazyGamesHost()) return;

    await new Promise((resolve) => {
      const existing = document.querySelector("script[data-crazygames-sdk]");
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", resolve, { once: true });
        setTimeout(resolve, 5000);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.crazygames.com/crazygames-sdk-v3.js";
      script.async = true;
      script.dataset.crazygamesSdk = "true";
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", resolve, { once: true });
      document.head.append(script);
      setTimeout(resolve, 5000);
    });
  }

  async init() {
    try {
      await this.loadSdk();
      if (!window.CrazyGames?.SDK) return;
      await window.CrazyGames.SDK.init();
      this.ready = true;
      window.CrazyGames.SDK.game.loadingStart();
      this.muted = Boolean(window.CrazyGames.SDK.game.settings?.muteAudio);
      window.CrazyGames.SDK.game.addSettingsChangeListener?.((settings) => {
        this.muted = Boolean(settings.muteAudio);
        window.dispatchEvent(new CustomEvent("platformmute", { detail: this.muted }));
      });
    } catch (error) {
      console.info("CrazyGames SDK is unavailable in this environment.", error);
    }
  }

  loadingDone() {
    if (!this.ready) return;
    window.CrazyGames.SDK.game.loadingStop();
    if (this.wantsGameplay) window.CrazyGames.SDK.game.gameplayStart();
  }

  gameplayStart() {
    this.wantsGameplay = true;
    if (this.ready) window.CrazyGames.SDK.game.gameplayStart();
  }

  gameplayStop() {
    this.wantsGameplay = false;
    if (this.ready) window.CrazyGames.SDK.game.gameplayStop();
  }
  happyTime() { if (this.ready) window.CrazyGames.SDK.game.happytime(); }

  locale() {
    if (!this.ready) return navigator.language || "en";
    return window.CrazyGames.SDK.user.systemInfo?.locale || navigator.language || "en";
  }

  externalLinksAllowed() {
    return !this.isCrazyGamesHost();
  }
}

export const platform = new CrazyGamesBridge();
