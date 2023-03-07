let choice = "";

function nowyPlik() {
  if (choice !== "") return;
  console.log("nowy plik");
  choice = "file";
  document.getElementById("plikForm").style.display = "flex";
}

function hidePlik() {
  choice = "";
  console.log("hide plik");
  document.getElementById("plikForm").style.display = "none";
}
