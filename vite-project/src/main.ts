document.addEventListener("DOMContentLoaded", () => {
  const introEl = document.getElementById("intro") as HTMLElement | null;
  const startButton = document.getElementById("start-ar") as HTMLButtonElement | null;
  const sceneEl = document.querySelector("a-scene") as HTMLElement | null;
  const debugEl = document.getElementById("debug-panel") as HTMLElement | null;
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

  const logDebug = (msg: string): void => {
    console.log("[DEBUG]", msg);
    if (debugEl) {
      debugEl.textContent = "[DEBUG] " + msg;
    }
  };

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

  // Initial debug state
  logDebug("Waiting for Start AR…");

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
    logDebug(`Model changed to ${currentModelIndex + 1} / ${models.length}`);
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
      logDebug("TARGET FOUND – tracking active.");
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
      logDebug("Target lost – searching again…");
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
    logDebug("WARNING: mindar-image-target entity not found in the scene.");
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
      logDebug("Returned to start screen. Waiting for Start AR…");
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
      logDebug(
        "AR scene shown. MindAR will auto-start. Point your camera at the postcard / QR."
      );

      // Force a window resize so A-Frame / MindAR recalculate the canvas
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
        logDebug("Forced window resize after showing AR scene.");
      }, 100);
    });
  } else {
    console.error("Missing start button, intro, or scene element.");
    logDebug("ERROR: Missing start button, intro, or scene element.");
  }
});