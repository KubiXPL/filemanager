function nowaNazwaFolderu() {
  if (choice !== "") return;
  choice = "folder";
  console.log("nowy folder");
  document.getElementById("nazwaFolderu").style.display = "flex";
}

function hideNazwaFolderu() {
  choice = "";
  console.log("hide form");
  document.getElementById("nazwaFolderu").style.display = "none";
}
