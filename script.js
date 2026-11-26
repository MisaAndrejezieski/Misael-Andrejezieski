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
      filterChips.forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");

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

  if (btnCopySummary && summaryText) {
    btnCopySummary.addEventListener("click", async () => {
      const text = summaryText.innerText.trim();
      const originalLabel = btnCopySummary.innerText;

      try {
        await navigator.clipboard.writeText(text);
        btnCopySummary.innerText = "Copiado!";
      } catch {
        const helper = document.createElement("textarea");
        helper.value = text;
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
        btnCopySummary.innerText = "Copiado!";
      }

      setTimeout(() => {
        btnCopySummary.innerText = originalLabel;
      }, 2000);
    });
  }

  // 4. Gerador de Mensagem Personalizada para Recrutadores
  const companyInput = document.getElementById("company-input");
  const pitchOutput = document.getElementById("pitch-output");
  const btnCopyPitch = document.getElementById("btn-copy-pitch");
  const portfolioUrl = "https://misaandrejezieski.github.io/Misa/";

  function buildPitch() {
    if (!companyInput || !pitchOutput) return;

    const company = companyInput.value.trim();
    const destination = company ? `na ${company}` : "na empresa";

    pitchOutput.value =
      `Olá! Sou Misael Andrejezieski, Operador de Máquinas com mais de 20 anos de experiência na indústria alimentícia (linhas de lácteos, envase Tetra Pak, Serac e Hamba, conhecimentos em elétrica e eletrônica, higienização CIP e certificação NR-12 pelo SENAI e Gov). Atuo no turno noturno (21h40 às 05h00) como backup técnico e referência da equipe, conduzindo DSQs, mediando atritos internos e organizando a estratégia do turno para entregar as metas da gestão. Sou formado em Análise e Desenvolvimento de Sistemas (UniCesumar), com domínio do Pacote Office (Excel, Word e PowerPoint) e conhecimentos em Power BI, Python, Java, HTML, CSS e JavaScript. Deixo meu currículo à disposição para oportunidades ${destination}: ${portfolioUrl}`;
  }

  if (companyInput && pitchOutput) {
    buildPitch();
    companyInput.addEventListener("input", buildPitch);
  }

  if (btnCopyPitch && pitchOutput) {
    btnCopyPitch.addEventListener("click", async () => {
      const originalLabel = btnCopyPitch.innerText;

      try {
        await navigator.clipboard.writeText(pitchOutput.value);
        btnCopyPitch.innerText = "Copiado!";
      } catch {
        pitchOutput.select();
        document.execCommand("copy");
        btnCopyPitch.innerText = "Copiado!";
      }

      setTimeout(() => {
        btnCopyPitch.innerText = originalLabel;
      }, 2000);
    });
  }
});