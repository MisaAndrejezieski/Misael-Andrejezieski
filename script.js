document.addEventListener("DOMContentLoaded", () => {
  // 1. Imprimir / Salvar como PDF
  const btnPrint = document.getElementById("btn-print");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }

  // 2. Filtro de Competências
  const filterChips = document.querySelectorAll(".filter-chip");
  const skillCards = document.querySelectorAll("#competencias .bento-card");

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-pressed", "false");
      });

      chip.classList.add("active");
      chip.setAttribute("aria-pressed", "true");

      const selectedCategory = chip.getAttribute("data-filter");

      skillCards.forEach((card) => {
        const cardCategory = card.getAttribute("data-category");
        const shouldShow = selectedCategory === "all" || cardCategory === selectedCategory;
        card.classList.toggle("hidden", !shouldShow);
      });
    });
  });

  // 3. Copiar Resumo de Competências
  const btnCopySummary = document.getElementById("btn-copy-summary");
  const summaryText = document.getElementById("summary-text");
  const copyStatus = document.getElementById("copy-status");

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    document.body.removeChild(helper);
  }

  if (btnCopySummary && summaryText) {
    btnCopySummary.addEventListener("click", async () => {
      const text = summaryText.innerText.trim();
      const originalLabel = btnCopySummary.innerText;

      try {
        await copyToClipboard(text);
        btnCopySummary.innerText = "Copiado!";
        if (copyStatus) {
          copyStatus.textContent = "Resumo de competências copiado para a área de transferência.";
        }
      } catch {
        btnCopySummary.innerText = "Selecione e copie";
        if (copyStatus) {
          copyStatus.textContent = "Não foi possível copiar automaticamente.";
        }
      }

      setTimeout(() => {
        btnCopySummary.innerText = originalLabel;
      }, 2000);
    });
  }

  // 4. Simulador de Linha: Fluxo de Envase & Estabilidade
  const canvas = document.getElementById("game-canvas");
  const btnToggle = document.getElementById("btn-game-toggle");
  const scoreEl = document.getElementById("game-score");
  const bestEl = document.getElementById("game-best");
  const stabilityEl = document.getElementById("game-stability");

  if (canvas && btnToggle && scoreEl && bestEl && stabilityEl) {
    const ctx = canvas.getContext("2d");
    const keys = Object.create(null);

    let viewWidth = 900;
    let viewHeight = 320;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewWidth = rect.width;
      viewHeight = rect.height;
      canvas.width = Math.round(viewWidth * dpr);
      canvas.height = Math.round(viewHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const minY = 36;
      const maxY = Math.max(minY, viewHeight - 36 - head.h);
      head.y = Math.max(minY, Math.min(maxY, head.y));
    }

    let bestScore = 0;
    try {
      bestScore = Math.max(0, Number(localStorage.getItem("fluxo_envase_best") || 0));
    } catch {
      bestScore = 0;
    }

    function formatScore(val) {
      return String(val).padStart(3, "0");
    }

    bestEl.textContent = formatScore(bestScore);

    const head = {
      x: 72,
      y: 140,
      w: 36,
      h: 38,
      speed: 6.4
    };

    let items = [];
    let score = 0;
    let stability = 100;
    let running = false;
    let gameOver = false;
    let spawnTimer = 0;
    let beltOffset = 0;
    let lastTime = 0;
    let rafId = null;

    resizeCanvas();
    head.y = viewHeight / 2 - head.h / 2;

    function updateStability(delta) {
      stability = Math.max(0, Math.min(100, stability + delta));
      stabilityEl.textContent = `${Math.round(stability)}%`;
      if (stability <= 0) {
        gameOver = true;
        running = false;
        btnToggle.textContent = "Reiniciar Turno";
      }
    }

    function addScore(pts) {
      score += pts;
      scoreEl.textContent = formatScore(score);
      if (score > bestScore) {
        bestScore = score;
        bestEl.textContent = formatScore(bestScore);
        try {
          localStorage.setItem("fluxo_envase_best", String(bestScore));
        } catch {
          // Ignora bloqueio de armazenamento
        }
      }
    }

    function stopLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function startLoop() {
      if (rafId === null) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    }

    function resetGame(startNow = true) {
      resizeCanvas();
      head.y = viewHeight / 2 - head.h / 2;
      items = [];
      score = 0;
      stability = 100;
      scoreEl.textContent = "000";
      stabilityEl.textContent = "100%";
      gameOver = false;
      spawnTimer = 0;
      running = startNow;
      btnToggle.textContent = running ? "Reiniciar Turno" : "Iniciar Turno";
      drawScene();
      if (running) {
        startLoop();
      } else {
        stopLoop();
      }
    }

    function overlaps(a, b) {
      return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
      );
    }

    function drawRoundedBox(x, y, w, h, r) {
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        return;
      }
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
      ctx.fill();
    }

    function drawScene() {
      ctx.clearRect(0, 0, viewWidth, viewHeight);

      const trackTop = 30;
      const trackHeight = Math.max(80, viewHeight - 60);
      ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
      ctx.fillRect(0, trackTop, viewWidth, trackHeight);

      ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, trackTop);
      ctx.lineTo(viewWidth, trackTop);
      ctx.moveTo(0, trackTop + trackHeight);
      ctx.lineTo(viewWidth, trackTop + trackHeight);
      ctx.stroke();

      ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
      ctx.lineWidth = 1;
      const step = 48;
      for (let x = -beltOffset; x < viewWidth; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, trackTop);
        ctx.lineTo(x, trackTop + trackHeight);
        ctx.stroke();
      }

      // Cabeçote operacional (ciano)
      ctx.save();
      ctx.shadowColor = "rgba(34, 211, 238, 0.45)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#22d3ee";
      drawRoundedBox(head.x, head.y, head.w, head.h, 8);
      ctx.restore();

      // Lotes conformes (esmeralda) e falhas (vermelho)
      items.forEach((item) => {
        if (item.type === "lot") {
          ctx.save();
          ctx.shadowColor = "rgba(52, 211, 153, 0.35)";
          ctx.shadowBlur = 10;
          ctx.fillStyle = "#34d399";
          drawRoundedBox(item.x, item.y, item.w, item.h, 7);
          ctx.restore();
        } else {
          ctx.fillStyle = "#f87171";
          drawRoundedBox(item.x, item.y, item.w, item.h, 6);
        }
      });

      if (!running && !gameOver) {
        ctx.fillStyle = "rgba(6, 10, 20, 0.72)";
        ctx.fillRect(0, 0, viewWidth, viewHeight);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "700 19px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Clique em 'Iniciar Turno' para operar a linha", viewWidth / 2, viewHeight / 2);
      }

      if (gameOver) {
        ctx.fillStyle = "rgba(6, 10, 20, 0.82)";
        ctx.fillRect(0, 0, viewWidth, viewHeight);
        ctx.fillStyle = "#f87171";
        ctx.font = "700 21px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Estabilidade da linha zerada!", viewWidth / 2, viewHeight / 2 - 12);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "500 14px Inter, sans-serif";
        ctx.fillText(
          `Meta alcançada: ${score} — clique em "Reiniciar Turno" ou pressione Espaço`,
          viewWidth / 2,
          viewHeight / 2 + 18
        );
      }
    }

    function update(dt) {
      if (!running || gameOver) return;

      const frameFactor = dt / 16.67;
      if (keys["ArrowUp"] || keys["KeyW"]) head.y -= head.speed * frameFactor;
      if (keys["ArrowDown"] || keys["KeyS"]) head.y += head.speed * frameFactor;

      const minY = 38;
      const maxY = Math.max(minY, viewHeight - 38 - head.h);
      head.y = Math.max(minY, Math.min(maxY, head.y));

      const speed = 4.6 + Math.min(score * 0.06, 5.2);
      beltOffset = (beltOffset + speed * frameFactor) % 48;

      spawnTimer += dt;
      const interval = Math.max(580, 1120 - score * 10);
      if (spawnTimer >= interval) {
        spawnTimer = 0;
        const isLot = Math.random() < 0.62;
        const size = isLot ? 26 : 32;
        const y = minY + Math.random() * Math.max(1, maxY - minY);
        items.push({
          type: isLot ? "lot" : "fault",
          x: viewWidth + 16,
          y,
          w: size,
          h: size
        });
      }

      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.x -= speed * frameFactor;

        if (overlaps(head, item)) {
          items.splice(i, 1);
          if (item.type === "lot") {
            addScore(2);
            updateStability(4);
          } else {
            updateStability(-25);
          }
          continue;
        }

        if (item.x + item.w < 0) {
          items.splice(i, 1);
          if (item.type === "lot") {
            updateStability(-10);
          }
        }
      }
    }

    function loop(now) {
      const dt = Math.min(50, Math.max(0, now - lastTime));
      lastTime = now;
      update(dt);
      drawScene();

      if (running) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    }

    btnToggle.addEventListener("click", () => {
      resetGame(true);
    });

    window.addEventListener("resize", () => {
      resizeCanvas();
      drawScene();
    });

    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "KeyW", "KeyS"].includes(e.code)) {
        if (running) e.preventDefault();
        keys[e.code] = true;
      } else if (gameOver && (e.code === "Space" || e.code === "KeyR")) {
        const activeTag = document.activeElement ? document.activeElement.tagName : "";
        if (activeTag !== "BUTTON" && activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
          e.preventDefault();
          resetGame(true);
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      keys[e.code] = false;
    });

    function moveByPointer(clientY) {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.height) return;
      const relY = clientY - rect.top;
      const minY = 38;
      const maxY = Math.max(minY, viewHeight - 38 - head.h);
      head.y = Math.max(minY, Math.min(maxY, relY - head.h / 2));
    }

    canvas.addEventListener("touchmove", (e) => {
      if (!running || !e.touches.length) return;
      e.preventDefault();
      moveByPointer(e.touches[0].clientY);
    }, { passive: false });

    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse" && e.buttons === 1) {
        moveByPointer(e.clientY);
      }
    });

    drawScene();
  }
});