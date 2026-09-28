class CrazyGamesBridge {
  constructor() {
    this.ready = false;
    this.muted = false;
  }

  async init() {
    try {
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

  loadingDone() { if (this.ready) window.CrazyGames.SDK.game.loadingStop(); }
  gameplayStart() { if (this.ready) window.CrazyGames.SDK.game.gameplayStart(); }
  gameplayStop() { if (this.ready) window.CrazyGames.SDK.game.gameplayStop(); }
  happyTime() { if (this.ready) window.CrazyGames.SDK.game.happytime(); }

  locale() {
    if (!this.ready) return navigator.language || "en";
    return window.CrazyGames.SDK.user.systemInfo?.locale || navigator.language || "en";
  }
}

export const platform = new CrazyGamesBridge();
