textarea = document.querySelector("textarea");
lineNumbers = document.querySelector(".lineNumbers");

textarea.addEventListener("keyup", (event) => {
  updateLines();
});

textarea.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.value =
      textarea.value.substring(0, start) + "\t" + textarea.value.substring(end);

    event.preventDefault();
  }
});
function updateLines() {
  const lines = document.querySelector(".lineNumbers");
  const linesCount = textarea.value.split("\n").length;
  const linesHTML = Array(linesCount).fill("<span></span>").join("");
  lines.innerHTML = linesHTML;
}

updateLines();
