document.addEventListener("DOMContentLoaded", () => {
  // 1. Botão de Imprimir / Salvar como PDF
  const btnPrint = document.getElementById("btn-print");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }

  // 2. Filtro de Competências
  const filterButtons = document.querySelectorAll(".filter-btn");
  const skillCards = document.querySelectorAll(".skill-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const category = button.getAttribute("data-filter");

      skillCards.forEach((card) => {
        const cardCategory = card.getAttribute("data-category");
        if (category === "all" || cardCategory === category) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });

  // 3. Copiar Texto de Competências para Gupy / LinkedIn
  const btnCopySummary = document.getElementById("btn-copy-summary");
  const summaryText = document.getElementById("summary-text");

  if (btnCopySummary && summaryText) {
    btnCopySummary.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(summaryText.innerText.trim());
        const originalLabel = btnCopySummary.innerText;
        btnCopySummary.innerText = "Copiado!";
        setTimeout(() => {
          btnCopySummary.innerText = originalLabel;
        }, 2000);
      } catch (err) {
        alert("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
      }
    });
  }

  // 4. Gerador Dinâmico de Mensagem para Recrutadores
  const companyInput = document.getElementById("company-input");
  const pitchOutput = document.getElementById("pitch-output");
  const btnCopyPitch = document.getElementById("btn-copy-pitch");

  function updatePitchMessage() {
    const companyName = companyInput.value.trim();
    const target = companyName ? `na ${companyName}` : "na empresa";

    pitchOutput.value =
      `Olá! Sou Misael Andrejezieski, Operador de Máquinas com mais de 20 anos de experiência na indústria alimentícia (linhas de lácteos, envase Tetra Pak, Serac, Hamba e pasteurizadores), processos CIP e certificação NR-12 (SENAI e Gov). Atuo no turno noturno (21h40 às 05h00) também como backup técnico da área. Gostaria de deixar meu currículo online à disposição para oportunidades ${target}: https://misaandrejezieski.github.io/Misa/`;
  }

  if (companyInput && pitchOutput) {
    updatePitchMessage();
    companyInput.addEventListener("input", updatePitchMessage);
  }

  if (btnCopyPitch && pitchOutput) {
    btnCopyPitch.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pitchOutput.value);
        const originalText = btnCopyPitch.innerText;
        btnCopyPitch.innerText = "Copiado!";
        setTimeout(() => {
          btnCopyPitch.innerText = originalText;
        }, 2000);
      } catch (err) {
        pitchOutput.select();
        document.execCommand("copy");
      }
    });
  }
});