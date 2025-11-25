document.addEventListener("DOMContentLoaded", () => {
  const introEl = document.getElementById("intro") as HTMLElement | null;
  const startButton = document.getElementById("start-ar") as HTMLButtonElement | null;
  const sceneEl = document.querySelector("a-scene") as HTMLElement | null;
  const debugEl = document.getElementById("debug-panel") as HTMLElement | null;
  const permissionHelpEl = document.getElementById("permission-help") as HTMLElement | null;
  const permBackBtn = document.getElementById("perm-back") as HTMLButtonElement | null;
  const targetGuideEl = document.getElementById("target-guide") as HTMLElement | null;
  const targetEntity = document.querySelector("[mindar-image-target]") as HTMLElement | null;
  const exitBtn = document.getElementById("exit-btn") as HTMLButtonElement | null;

  const logDebug = (msg: string): void => {
    console.log("[DEBUG]", msg);
    if (debugEl) {
      debugEl.textContent = "[DEBUG] " + msg;
    }
  };

  // Initial debug state
  logDebug("Waiting for Start AR…");

  // Check camera permission status
  let cachedPermissionState: "granted" | "denied" | "prompt" | "unknown" = "unknown";
  if ((navigator as any).permissions && (navigator as any).permissions.query) {
    try {
      (navigator as any).permissions
        .query({ name: "camera" as any })
        .then((result: any) => {
          cachedPermissionState = result.state as "granted" | "denied" | "prompt";
          logDebug(
            "Camera permission state: " +
              result.state +
              ". Waiting for Start AR…"
          );
        })
        .catch(() => {
          // ignore
        });
    } catch (e) {
      // ignore
    }
  }

  const showPermissionHelp = (): void => {
    if (permissionHelpEl) {
      permissionHelpEl.style.display = "flex";
    }
    if (sceneEl) {
      sceneEl.style.display = "none";
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

  if (permBackBtn && introEl) {
    permBackBtn.addEventListener("click", () => {
      hidePermissionHelp();
      hideTargetGuide();
      introEl.style.display = "flex";
      logDebug("Returned to start screen. Waiting for Start AR…");
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener("click", () => {
      location.reload();
    });
  }

  if (startButton && introEl && sceneEl) {
    startButton.addEventListener("click", async () => {
      introEl.style.display = "none";
      logDebug("Start AR clicked. Checking camera permission…");

      // If permission denied, show help
      if (cachedPermissionState === "denied") {
        logDebug("Camera permission is DENIED. Showing help interface.");
        showPermissionHelp();
        return;
      }

      // Show AR scene and let MindAR request camera
      showTargetGuide();
      sceneEl.style.display = "block";
      if (exitBtn) {
        exitBtn.style.display = "block";
      }

      const arSystem = (sceneEl as any)?.systems?.["mindar-image-system"];
      if (arSystem && typeof arSystem.start === "function") {
        try {
          logDebug(
            "Starting AR. The browser may now show the official camera permission prompt."
          );
          await arSystem.start();
          logDebug(
            "AR started. Searching for target… Point your camera at the postcard / QR."
          );

          // Target debug
          if (targetEntity) {
            targetEntity.addEventListener("targetFound", () => {
              logDebug("TARGET FOUND – tracking active.");
              hideTargetGuide();
            });
            targetEntity.addEventListener("targetLost", () => {
              logDebug("Target lost – searching again…");
              showTargetGuide();
            });
          }
        } catch (e) {
          console.error("Error starting MindAR:", e);
          logDebug(
            "Error starting AR. Camera permission likely denied or unavailable."
          );
          showPermissionHelp();
          hideTargetGuide();
        }
      } else {
        console.error("mindar-image-system not found on scene.");
        logDebug("ERROR: mindar-image-system not found on scene.");
      }
    });
  } else {
    console.error("Missing start button, intro, or scene element.");
    logDebug("ERROR: Missing start button, intro, or scene element.");
  }
});