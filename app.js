const sourceText = document.querySelector("#sourceText");
const resultText = document.querySelector("#resultText");
const inputStats = document.querySelector("#inputStats");
const outputStats = document.querySelector("#outputStats");
const statusMessage = document.querySelector("#statusMessage");
const copyButton = document.querySelector("#copyButton");
const downloadButton = document.querySelector("#downloadButton");
const useResultButton = document.querySelector("#useResultButton");
let hasResult = false;

function getStats(text) {
  const trimmed = text.trim();
  const lines = text.length === 0 ? 0 : text.split(/\r\n?|\n/).length;
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/u).length;
  const format = new Intl.NumberFormat("ru-RU");
  return `${format.format(text.length)} символов · ${format.format(words)} слов · ${format.format(lines)} строк`;
}

function updateStats() {
  inputStats.textContent = getStats(sourceText.value);
  outputStats.textContent = getStats(resultText.value);
}

function setResultAvailable(available) {
  hasResult = available;
  copyButton.disabled = !available;
  downloadButton.disabled = !available;
  useResultButton.disabled = !available;
}

function processText() {
  const options = {
    trimLines: document.querySelector("#trimLines").checked,
    collapseSpaces: document.querySelector("#collapseSpaces").checked,
    removeEmpty: document.querySelector("#removeEmpty").checked,
    removeDuplicates: document.querySelector("#removeDuplicates").checked,
    sortLines: document.querySelector("#sortLines").checked,
    caseMode: document.querySelector("#caseMode").value,
  };

  let lines = sourceText.value.split(/\r\n?|\n/);
  if (options.trimLines) lines = lines.map((line) => line.trim());
  if (options.collapseSpaces) lines = lines.map((line) => line.replace(/[ \t]+/g, " "));
  if (options.removeEmpty) lines = lines.filter((line) => line.length > 0);
  if (options.removeDuplicates) lines = [...new Set(lines)];
  if (options.sortLines) lines.sort((left, right) => left.localeCompare(right, "ru", { sensitivity: "base", numeric: true }));

  let output = lines.join("\n");
  if (options.caseMode === "lower") output = output.toLocaleLowerCase("ru-RU");
  if (options.caseMode === "upper") output = output.toLocaleUpperCase("ru-RU");
  if (options.caseMode === "title") {
    output = output.toLocaleLowerCase("ru-RU").replace(/(^|[\s([{])(\p{L})/gu, (match, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("ru-RU")}`);
  }

  resultText.value = output;
  updateStats();
  setResultAvailable(true);
  statusMessage.textContent = "Готово. Исходный текст не покидал ваше устройство.";
}

function clearResult() {
  resultText.value = "";
  setResultAvailable(false);
  updateStats();
  statusMessage.textContent = "";
}

sourceText.addEventListener("input", () => {
  clearResult();
  inputStats.textContent = getStats(sourceText.value);
});

document.querySelector("#processButton").addEventListener("click", processText);

document.querySelector("#sampleButton").addEventListener("click", () => {
  sourceText.value = "  Пример   строки  \n\nПовторить\nПример   строки  \nещё один пункт";
  clearResult();
  inputStats.textContent = getStats(sourceText.value);
  statusMessage.textContent = "";
  sourceText.focus();
});

document.querySelector("#openFileButton").addEventListener("click", () => document.querySelector("#fileInput").click());
document.querySelector("#fileInput").addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  sourceText.value = await file.text();
  clearResult();
  inputStats.textContent = getStats(sourceText.value);
  statusMessage.textContent = `Открыт файл: ${file.name}`;
  event.target.value = "";
});

copyButton.addEventListener("click", async () => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(resultText.value);
    } else {
      resultText.focus();
      resultText.select();
      if (!document.execCommand("copy")) throw new Error("Clipboard copy failed");
    }
    statusMessage.textContent = "Результат скопирован.";
  } catch {
    statusMessage.textContent = "Не удалось скопировать. Выделите текст и скопируйте вручную.";
  }
});

downloadButton.addEventListener("click", () => {
  const blob = new Blob([resultText.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "text-tidy.txt";
  link.click();
  URL.revokeObjectURL(url);
  statusMessage.textContent = "Файл text-tidy.txt скачан.";
});

useResultButton.addEventListener("click", () => {
  if (!hasResult) return;
  sourceText.value = resultText.value;
  clearResult();
  inputStats.textContent = getStats(sourceText.value);
  sourceText.focus();
});

updateStats();