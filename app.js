(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toast = $("#toast");
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    $$(".modal.is-open").forEach(closeModal);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const firstInput = $("input", modal);
    if (firstInput) setTimeout(() => firstInput.focus(), 60);
  }

  function closeModal(modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (!$(".modal.is-open")) document.body.style.overflow = "";
  }

  $$("[data-open]").forEach(button => {
    button.addEventListener("click", () => openModal(button.dataset.open));
  });

  $$(".close-btn").forEach(button => {
    button.addEventListener("click", () => closeModal(button.closest(".modal")));
  });

  $$(".modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const modal = $(".modal.is-open");
      if (modal) closeModal(modal);
    }
  });

  // Pestañas reutilizables dentro de cada ventana.
  $$(".tabs").forEach(tabBar => {
    const modal = tabBar.closest(".modal");
    $$(".tab", tabBar).forEach(tab => {
      tab.addEventListener("click", () => {
        $$(".tab", tabBar).forEach(item => {
          item.classList.toggle("active", item === tab);
          item.setAttribute("aria-selected", item === tab ? "true" : "false");
        });
        $$(".tab-panel", modal).forEach(panel => {
          panel.hidden = panel.id !== `form-${tab.dataset.tab}`;
        });
      });
    });
  });

  function readNumber(form, name) {
    const input = form.elements.namedItem(name);
    if (!input || input.value.trim() === "") return NaN;
    return Number(input.value);
  }

  function validateGrades(form) {
    const inputs = $$('input[type="number"]', form);
    for (const input of inputs) {
      if (input.value.trim() === "") {
        input.focus();
        showToast("Completa todos los campos antes de calcular.");
        return false;
      }
      const value = Number(input.value);
      const max = input.max === "" ? 5 : Number(input.max);
      const min = input.min === "" ? 0 : Number(input.min);
      if (!Number.isFinite(value) || value < min || value > max) {
        input.focus();
        showToast(`Ingresa un valor entre ${min} y ${max}.`);
        return false;
      }
    }
    return true;
  }

  function showResult(id, value, label = "Resultado") {
    const box = document.getElementById(id);
    const strong = $("strong", box);
    $("span", box).textContent = label;
    strong.textContent = value.toFixed(2).replace(".", ",");
    box.classList.remove("is-low", "is-mid", "is-high");
    if (value < 3) box.classList.add("is-low");
    else if (value < 4) box.classList.add("is-mid");
    else box.classList.add("is-high");
  }

  function resetResult(form) {
    const result = $(".result-box", form);
    if (result) {
      $("strong", result).textContent = "—";
      result.classList.remove("is-low", "is-mid", "is-high");
    }
    form.querySelectorAll("input").forEach(input => input.setCustomValidity(""));
  }

  // Corte 1 y 2: 55 % parcial + 45 % otras evaluaciones.
  $("#form-corte12").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateGrades(form)) return;
    const result = readNumber(form, "parcial12") * 0.55 + readNumber(form, "otras12") * 0.45;
    showResult("result-corte12", result, "Tu nota del corte");
  });

  // Corte 3: 65 % parcial + 35 % otras evaluaciones.
  $("#form-corte3").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateGrades(form)) return;
    const result = readNumber(form, "parcial3") * 0.65 + readNumber(form, "otras3") * 0.35;
    showResult("result-corte3", result, "Tu nota del corte");
  });

  // Definitiva de semestre: porcentajes oficiales, conservados sin cambios.
  $("#form-definitiva").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateGrades(form)) return;
    const result =
      readNumber(form, "oepc") * 0.135 +
      readNumber(form, "eppc") * 0.165 +
      readNumber(form, "oesc") * 0.135 +
      readNumber(form, "epsc") * 0.165 +
      readNumber(form, "oetc") * 0.14 +
      readNumber(form, "eptc") * 0.26;
    showResult("result-definitiva", result, "Tu definitiva estimada");
  });

  // Inglés: definitiva por cortes.
  $("#form-ingles-def").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateGrades(form)) return;
    const result =
      readNumber(form, "cone") * 0.3 +
      readNumber(form, "ctwo") * 0.3 +
      readNumber(form, "cthree") * 0.4;
    showResult("result-ingles-def", result, "Tu definitiva de inglés");
  });

  // Inglés: ponderación oficial del corte.
  $("#form-ingles-corte").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validateGrades(form)) return;
    const result =
      readNumber(form, "reading") * 0.1 +
      readNumber(form, "written") * 0.1 +
      readNumber(form, "oral") * 0.25 +
      readNumber(form, "parcial") * 0.55;
    showResult("result-ingles-corte", result, "Tu nota del corte");
  });

  // Otros promedios: cuatro notas con porcentajes que deben sumar 100.
  const averagesForm = $("#form-promedios");
  const sumNote = $("#weight-sum");
  function updateWeightSum() {
    const sum = ["prom1", "prom2", "prom3", "prom4"]
      .reduce((total, name) => total + (averagesForm.elements[name].value.trim() === "" ? 0 : Number(averagesForm.elements[name].value)), 0);
    sumNote.textContent = `Porcentajes ingresados: ${sum.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`;
    sumNote.style.color = Math.abs(sum - 100) < 0.001 ? "#16845b" : "#778996";
  }
  ["prom1", "prom2", "prom3", "prom4"].forEach(name => {
    averagesForm.elements[name].addEventListener("input", updateWeightSum);
  });
  averagesForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!validateGrades(averagesForm)) return;
    const weights = ["prom1", "prom2", "prom3", "prom4"].map(name => readNumber(averagesForm, name));
    const sum = weights.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.001) {
      showToast(`Los porcentajes deben sumar 100 %. Actualmente suman ${sum.toLocaleString("es-CO")} %.`);
      sumNote.focus?.();
      return;
    }
    const result =
      readNumber(averagesForm, "nota1") * weights[0] / 100 +
      readNumber(averagesForm, "nota2") * weights[1] / 100 +
      readNumber(averagesForm, "nota3") * weights[2] / 100 +
      readNumber(averagesForm, "nota4") * weights[3] / 100;
    showResult("result-promedios", result, "Tu promedio");
  });

  $$(".calc-form").forEach(form => {
    form.addEventListener("reset", () => {
      setTimeout(() => {
        resetResult(form);
        if (form.id === "form-promedios") updateWeightSum();
      }, 0);
    });
  });
})();
