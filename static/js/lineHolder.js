let textarea = document.querySelector("textarea");
let lineNumbers = document.querySelector(".lineNumbers");

function lineHolder() {
  lineNumbers.scrollTop = textarea.scrollTop;
}
