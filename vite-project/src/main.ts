// A-Frame is loaded globally via script tag in index.html
declare const AFRAME: any;

// Optional: keep the model's apparent (on-screen) size roughly constant by scaling with camera distance.
// Note: this breaks real-world scale (it is NOT physically correct AR), but it matches the requested behavior.
if (typeof AFRAME !== "undefined" && AFRAME.registerComponent) {
  AFRAME.registerComponent("scale-with-distance", {
    schema: {
      base: { type: "number", default: 1 }, // base uniform scale at referenceDistance
      referenceDistance: { type: "number", default: 0.35 }, // distance where base scale applies
      min: { type: "number", default: 0.1 },
      max: { type: "number", default: 50 },

      // Tuning helpers
      damp: { type: "number", default: 0.25 }, // 0 = no smoothing, 0.25 = smooth
      debug: { type: "boolean", default: false },
      logEveryMs: { type: "number", default: 500 }
    },

    init: function () {
      // Prefer the active camera from the scene; fallback to a [camera] entity.
      this.cameraEl = (this.el.sceneEl && this.el.sceneEl.camera && this.el.sceneEl.camera.el)
        ? this.el.sceneEl.camera.el
        : document.querySelector("[camera]");

      this._tmpA = new AFRAME.THREE.Vector3();
      this._tmpB = new AFRAME.THREE.Vector3();
      this._lastLog = 0;
    },

    tick: function () {
      if (!this.cameraEl) return;

      // World positions
      this.el.object3D.getWorldPosition(this._tmpA);
      this.cameraEl.object3D.getWorldPosition(this._tmpB);

      const d = this._tmpA.distanceTo(this._tmpB);
      if (!isFinite(d) || d <= 0) return;

      // Scale proportionally with distance to keep approximate on-screen size constant.
      let s = this.data.base * (d / this.data.referenceDistance);
      s = Math.max(this.data.min, Math.min(this.data.max, s));

      // Optional smoothing to avoid "pumping" while tracking jitters.
      const current = this.el.object3D.scale.x || 0;
      const alpha = Math.max(0, Math.min(1, this.data.damp));
      const smoothed = alpha <= 0 ? s : (current + (s - current) * alpha);

      this.el.object3D.scale.set(smoothed, smoothed, smoothed);

      // Optional debug logging
      if (this.data.debug) {
        const now = Date.now();
        if (now - this._lastLog >= this.data.logEveryMs) {
          this._lastLog = now;
          console.log(`[scale-with-distance] d=${d.toFixed(3)} targetS=${s.toFixed(3)} appliedS=${smoothed.toFixed(3)}`);
        }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const introEl = document.getElementById("intro") as HTMLElement | null;
  const startButton = document.getElementById("start-ar") as HTMLButtonElement | null;
  const sceneEl = document.querySelector("a-scene") as HTMLElement | null;
  const permissionHelpEl = document.getElementById("permission-help") as HTMLElement | null;
  const permBackBtn = document.getElementById("perm-back") as HTMLButtonElement | null;
  const targetGuideEl = document.getElementById("target-guide") as HTMLElement | null;
  const targetEntity = document.querySelector("[mindar-image-target]") as HTMLElement | null;

  const model1 = document.getElementById("paintModelEntity1") as HTMLElement | null;
  const model2 = document.getElementById("paintModelEntity2") as HTMLElement | null;
  const model3 = document.getElementById("paintModelEntity3") as HTMLElement | null;

  const modelNav = document.getElementById("model-nav") as HTMLElement | null;
  const prevModelBtn = document.getElementById("prev-model") as HTMLButtonElement | null;
  const nextModelBtn = document.getElementById("next-model") as HTMLButtonElement | null;

  const exitBtn = document.getElementById("exit-btn") as HTMLButtonElement | null;

  const hidePermissionHelp = (): void => {
    if (permissionHelpEl) {
      permissionHelpEl.style.display = "none";
    }
  };

  const showTargetGuide = (): void => {
    if (targetGuideEl) {
      targetGuideEl.style.display = "flex";
    }
  };

  const hideTargetGuide = (): void => {
    if (targetGuideEl) {
      targetGuideEl.style.display = "none";
    }
  };

  // Delay hiding when tracking is briefly lost
  let hideTimeout: number | null = null;

  // --- Model switching ---
  const models: (HTMLElement | null)[] = [model1, model2, model3];
  let currentModelIndex = 0;

  const setModelVisible = (index: number): void => {
    currentModelIndex = (index + models.length) % models.length;
    models.forEach((m, i) => {
      if (m) m.setAttribute("visible", i === currentModelIndex ? "true" : "false");
    });
  };

  const showAllModels = (): void => {
    // Ensure exactly the selected model is visible
    setModelVisible(currentModelIndex);
  };

  const hideAllModels = (): void => {
    models.forEach((m) => {
      if (m) m.setAttribute("visible", "false");
    });
  };

  // Button handlers
  const goPrevModel = (): void => setModelVisible(currentModelIndex - 1);
  const goNextModel = (): void => setModelVisible(currentModelIndex + 1);

  if (prevModelBtn) prevModelBtn.addEventListener("click", goPrevModel);
  if (nextModelBtn) nextModelBtn.addEventListener("click", goNextModel);

  // Target events: show/hide model and debug cube
  if (targetEntity) {
    targetEntity.addEventListener("targetFound", () => {
      hideTargetGuide();

      // Cancel any pending hide timeout
      if (hideTimeout !== null) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      if (modelNav) {
        modelNav.style.display = "flex";
      }
      showAllModels();
    });

    targetEntity.addEventListener("targetLost", () => {
      showTargetGuide();

      // Delay hiding to avoid flicker on brief tracking loss
      hideTimeout = window.setTimeout(() => {
        hideAllModels();
        if (modelNav) {
          modelNav.style.display = "none";
        }
      }, 800); // 0.8s di tolleranza
    });
  } else {
    console.error("WARNING: mindar-image-target entity not found in the scene.");
  }

  // Back from permission help
  if (permBackBtn && introEl) {
    permBackBtn.addEventListener("click", () => {
      hidePermissionHelp();
      hideTargetGuide();
      introEl.style.display = "flex";
      if (sceneEl) {
        sceneEl.style.display = "none";
      }
      if (exitBtn) {
        exitBtn.style.display = "none";
      }
      if (modelNav) {
        modelNav.style.display = "none";
      }
    });
  }

  // Exit button
  if (exitBtn) {
    exitBtn.addEventListener("click", () => {
      location.reload();
    });
  }

  // Start AR: show scene, let MindAR auto-start
  if (startButton && introEl && sceneEl) {
    startButton.addEventListener("click", () => {
      introEl.style.display = "none";
      sceneEl.style.display = "block";
      if (exitBtn) {
        exitBtn.style.display = "block";
      }
      if (modelNav) {
        modelNav.style.display = "flex";
      }
      setModelVisible(0);
      showTargetGuide();
      hideAllModels();

      // Force a window resize so A-Frame / MindAR recalculate the canvas
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    });
  } else {
    console.error("Missing start button, intro, or scene element.");
  }
});