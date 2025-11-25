document.addEventListener("DOMContentLoaded", () => {
  const introEl = document.getElementById("intro") as HTMLElement | null;
  const startButton = document.getElementById("start-ar") as HTMLButtonElement | null;
  const sceneEl = document.querySelector("a-scene") as HTMLElement | null;
  const debugEl = document.getElementById("debug-panel") as HTMLElement | null;
  const permissionHelpEl = document.getElementById("permission-help") as HTMLElement | null;
  const permBackBtn = document.getElementById("perm-back") as HTMLButtonElement | null;
  const targetGuideEl = document.getElementById("target-guide") as HTMLElement | null;
  const targetEntity = document.querySelector("[mindar-image-target]") as HTMLElement | null;
  const artSceneObject = document.getElementById("artSceneObject") as HTMLElement | null;
  const debugCube = document.getElementById("debugCube") as HTMLElement | null;
  const exitBtn = document.getElementById("exit-btn") as HTMLButtonElement | null;

  const logDebug = (msg: string): void => {
    console.log("[DEBUG]", msg);
    if (debugEl) {
      debugEl.textContent = "[DEBUG] " + msg;
    }
  };

  const showPermissionHelp = (): void => {
    if (permissionHelpEl) {
      permissionHelpEl.style.display = "flex";
    }
    if (sceneEl) {
      sceneEl.style.display = "none";
    }
    if (exitBtn) {
      exitBtn.style.display = "none";
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

  // Target events: show/hide model and debug cube
  if (targetEntity) {
    targetEntity.addEventListener("targetFound", () => {
      logDebug("TARGET FOUND – tracking active.");
      hideTargetGuide();
      if (artSceneObject) {
        artSceneObject.setAttribute("visible", "true");
      }
      if (debugCube) {
        debugCube.setAttribute("visible", "true");
      }
    });

    targetEntity.addEventListener("targetLost", () => {
      logDebug("Target lost – searching again…");
      showTargetGuide();
      if (artSceneObject) {
        artSceneObject.setAttribute("visible", "false");
      }
      if (debugCube) {
        debugCube.setAttribute("visible", "false");
      }
    });
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
      showTargetGuide();
      logDebug(
        "AR scene shown. MindAR will auto-start. Point your camera at the postcard / QR."
      );
    });
  } else {
    console.error("Missing start button, intro, or scene element.");
    logDebug("ERROR: Missing start button, intro, or scene element.");
  }
});