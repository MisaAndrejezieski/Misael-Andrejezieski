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
});