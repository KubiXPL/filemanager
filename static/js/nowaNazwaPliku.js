function nowaNazwaPliku() {
  if (choice !== "") return;
  choice = "plik";
  console.log("nowy plik");
  document.getElementById("nowaNazwaPliku").style.display = "flex";
}

function hideNazwaPliku() {
  choice = "";
  console.log("hide form");
  document.getElementById("nowaNazwaPliku").style.display = "none";
}
