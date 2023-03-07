function nowyFolder() {
  if (choice !== "") return;
  choice = "folder";
  console.log("nowy folder");
  document.getElementById("folderForm").style.display = "flex";
}

function hideFolder() {
  choice = "";
  console.log("hide form");
  document.getElementById("folderForm").style.display = "none";
}
