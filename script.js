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
        if (copyStatus) copyStatus.textContent = "Resumo de competências copiado para a área de transferência.";
      } catch {
        btnCopySummary.innerText = "Selecione e copie";
        if (copyStatus) copyStatus.textContent = "Não foi possível copiar automaticamente.";
      }

      setTimeout(() => {
        btnCopySummary.innerText = originalLabel;
      }, 2000);
    });
  }

  // 4. Mini-Jogo "Rota da Madrugada" (HTML5 Canvas)
  const canvas = document.getElementById("game-canvas");
  const btnToggle = document.getElementById("btn-game-toggle");
  const scoreEl = document.getElementById("game-score");
  const bestEl = document.getElementById("game-best");

  if (canvas && btnToggle && scoreEl && bestEl) {
    const ctx = canvas.getContext("2d");
    const keys = Object.create(null);

    let bestScore = 0;
    try {
      bestScore = Math.max(0, Number(localStorage.getItem("rota_madrugada_best") || 0));
    } catch {
      bestScore = 0;
    }

    function formatScore(val) {
      return String(val).padStart(3, "0");
    }

    bestEl.textContent = formatScore(bestScore);

    const player = {
      x: 84,
      y: canvas.height / 2 - 17,
      size: 34,
      speed: 6.2
    };

    let obstacles = [];
    let bonuses = [];
    let score = 0;
    let running = false;
    let gameOver = false;
    let obsTimer = 0;
    let bonusTimer = 0;
    let lastTime = performance.now();

    function addPoints(pts) {
      score += pts;
      scoreEl.textContent = formatScore(score);
      if (score > bestScore) {
        bestScore = score;
        bestEl.textContent = formatScore(bestScore);
        try {
          localStorage.setItem("rota_madrugada_best", String(bestScore));
        } catch {
          // Ignora erro de armazenamento privado
        }
      }
    }

    function resetGame(startNow = true) {
      player.y = canvas.height / 2 - player.size / 2;
      obstacles = [];
      bonuses = [];
      score = 0;
      scoreEl.textContent = "000";
      gameOver = false;
      obsTimer = 0;
      bonusTimer = 0;
      lastTime = performance.now();
      running = startNow;
      btnToggle.textContent = running ? "Reiniciar" : "Iniciar Jogo";
    }

    function rectsOverlap(a, b) {
      return (
        a.x < b.x + b.w &&
        a.x + player.size > b.x &&
        a.y < b.y + b.h &&
        a.y + player.size > b.y
      );
    }

    function drawRoundedRect(x, y, w, h, r) {
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Trilhas horizontais sutis
      ctx.save();
      ctx.setLineDash([14, 14]);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
      ctx.lineWidth = 2;
      [canvas.height * 0.25, canvas.height * 0.5, canvas.height * 0.75].forEach((lineY) => {
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(canvas.width, lineY);
        ctx.stroke();
      });
      ctx.restore();

      // Jogador (ciano)
      ctx.save();
      ctx.shadowColor = "rgba(34, 211, 238, 0.45)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#22d3ee";
      drawRoundedRect(player.x, player.y, player.size, player.size, 8);
      ctx.restore();

      // Obstáculos (vermelho)
      ctx.fillStyle = "#f87171";
      obstacles.forEach((o) => {
        drawRoundedRect(o.x, o.y, o.w, o.h, 6);
      });

      // Bônus (esmeralda)
      ctx.save();
      ctx.shadowColor = "rgba(52, 211, 153, 0.4)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#34d399";
      bonuses.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      if (!running && !gameOver) {
        ctx.fillStyle = "rgba(6, 10, 20, 0.68)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "700 21px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Clique em 'Iniciar Jogo' para começar", canvas.width / 2, canvas.height / 2);
      }

      if (gameOver) {
        ctx.fillStyle = "rgba(6, 10, 20, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f87171";
        ctx.font = "700 23px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Parada na linha!", canvas.width / 2, canvas.height / 2 - 14);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "500 15px Inter, sans-serif";
        ctx.fillText(
          `Pontuação final: ${score} — clique em "Reiniciar" ou pressione Espaço`,
          canvas.width / 2,
          canvas.height / 2 + 18
        );
      }
    }

    function update(dt) {
      if (!running || gameOver) return;

      if (keys["ArrowUp"] || keys["KeyW"]) player.y -= player.speed;
      if (keys["ArrowDown"] || keys["KeyS"]) player.y += player.speed;

      const margin = 14;
      player.y = Math.max(margin, Math.min(canvas.height - player.size - margin, player.y));

      const baseSpeed = 4.8 + Math.min(score * 0.1, 5.8);

      obsTimer += dt;
      const obsInterval = Math.max(540, 1140 - score * 16);
      if (obsTimer >= obsInterval) {
        obsTimer = 0;
        const h = 38 + Math.random() * 54;
        const y = margin + Math.random() * (canvas.height - margin * 2 - h);
        obstacles.push({ x: canvas.width + 14, y, w: 28, h });
      }

      bonusTimer += dt;
      if (bonusTimer >= 1650) {
        bonusTimer = 0;
        const y = margin + 12 + Math.random() * (canvas.height - margin * 2 - 24);
        bonuses.push({ x: canvas.width + 14, y, w: 22, h: 22 });
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= baseSpeed;
        if (rectsOverlap(player, o)) {
          gameOver = true;
          running = false;
          btnToggle.textContent = "Reiniciar";
          break;
        }
        if (o.x + o.w < 0) {
          obstacles.splice(i, 1);
          addPoints(1);
        }
      }

      for (let i = bonuses.length - 1; i >= 0; i--) {
        const b = bonuses[i];
        b.x -= baseSpeed * 0.92;
        if (rectsOverlap(player, b)) {
          bonuses.splice(i, 1);
          addPoints(3);
        } else if (b.x + b.w < 0) {
          bonuses.splice(i, 1);
        }
      }
    }

    function loop(now) {
      const dt = Math.min(50, now - lastTime);
      lastTime = now;
      update(dt);
      drawScene();
      requestAnimationFrame(loop);
    }

    btnToggle.addEventListener("click", () => {
      resetGame(true);
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

    function movePlayerByPointer(clientY) {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.height) return;
      const relY = clientY - rect.top;
      const scaleY = canvas.height / rect.height;
      player.y = relY * scaleY - player.size / 2;
    }

    canvas.addEventListener("touchmove", (e) => {
      if (!running || !e.touches.length) return;
      e.preventDefault();
      movePlayerByPointer(e.touches[0].clientY);
    }, { passive: false });

    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse" && e.buttons === 1) {
        movePlayerByPointer(e.clientY);
      }
    });

    drawScene();
    requestAnimationFrame(loop);
  }
});