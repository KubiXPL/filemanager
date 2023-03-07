const express = require("express");
const app = express();
const PORT = 3000;
const hbs = require("express-handlebars");
const path = require("path");
const formidable = require("formidable");
const fs = require("fs");
const { dirname } = require("path");

const cookieparser = require("cookie-parser");
app.use(cookieparser());

const nocache = require("nocache");
app.use(nocache());

// ustalamy katalog views
app.set("views", path.join(__dirname, "views"));

app.engine(
  "hbs",
  hbs({
    extname: ".hbs",
    defaultLayout: "main.hbs",
    partialsDir: "views/partials",
    // Ta funkcja wyodrębnia nazwę folderu ze ścieżki.
    helpers: {
      nazwaFolderu: function (sciezka) {
        if (sciezka) {
          return sciezka.substring(sciezka.lastIndexOf("/") + 1);
        } else {
          return "home";
        }
      },

      editor: function (name) {
        // Otwarcie właściwego edytora na podstawie typu pliku. Robi to poprzez sprawdzenie rozszerzenia pliku i zwrócenie odpowiedniego edytora. Jeśli rozszerzenie pliku nie zostanie rozpoznane, zwraca edytor tekstowy.

        if (name) {
          const extension = name.substring(name.lastIndexOf(".") + 1);
          switch (extension.toLowerCase()) {
            case "jpg":
            case "jpeg":
            case "png":
            case "bmp":
            case "gif":
              return "imageeditor";
            default:
              return "texteditor";
          }
        }
      },
    },
  })
);

app.set("view engine", "hbs");

// Parsowania body do obiektu json.

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.static("static"));
app.use(express.static("upload"));

// Funkcja przyjmuje nazwę katalogu i przeszukuje go rekurencyjnie, dodając każdy znaleziony plik do tablicy files i każdy znaleziony folder do tablicy folders.

let object_z_plikami = {
  files: [],
  folders: [],
};

const users = [];

app.get("/register", (req, res) => {
  res.render("register.hbs");
});

// Zasady rejstracji:
// Ten kod sprawdza, czy użytkownik istnieje już w bazie danych
// Jeśli użytkownik już istnieje, zostanie poinformowany, że jego nazwa użytkownika jest już zajęta
// Jeśli użytkownik nie istnieje, użytkownik jest informowany, że hasło nie pasuje względem wpisanego wyżej hasła
// Jeśli wszystko jest w porządku, użytkownik zostanie przekierowany na stronę logowania

app.post("/register", (req, res) => {
  const user = users.find((user) => user.username === req.body.username);

  if (user) {
    res.render("error.hbs", { message: "Użytkownik istnieje" });
  } else if (req.body.password !== req.body.confirmPassword) {
    res.render("error.hbs", { message: "Hasła nie są takie same" });
  } else {
    users.push({ username: req.body.username, password: req.body.password });
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login.hbs");
});

//Zasady logowania:
// Ten kod sprawdza, czy użytkownik istnieje w bazie danych.
// Jeśli użytkownik istnieje, sprawdzane jest jego hasło.
// Jeśli hasło jest poprawne, ustawiany jest plik cookie i użytkownik zostaje przekierowany na stronę główną.
// Jeśli hasło jest nieprawidłowe, użytkownik zostaje przekierowany na stronę błędu.

app.post("/login", (req, res) => {
  const user = users.find((user) => user.username === req.body.username);
  if (user && user.password === req.body.password) {
    res.cookie("login", user.username, {
      httpOnly: true,
      maxAge: 45 * 100000,
    });
    res.redirect("/");
  } else {
    res.render("error.hbs", { message: "Błędne dane logowania" });
  }
});

// Sprawdza, czy użytkownik jest zalogowany. Jeśli nie jest zalogowany, przekierowuje go na stronę logowania.
app.get("/*", (req, res, next) => {
  if (users.some((user) => user.username === req.cookies.login)) {
    next();
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("login");
  res.redirect("/login");
});

// Funkcja przyjmuje nazwę katalogu i przeszukuje go rekurencyjnie, dodając każdy znaleziony plik do tablicy files i każdy znaleziony folder do tablicy folders.
app.get("/", (req, res) => {
  object_z_plikami = {
    files: [],
    folders: [],
    username: req.cookies.login,
  };

  // jeżeli przesyłamy ścieżkę przeszukujemy tą ścieżkę, jeżeli nie to wracamy do home
  let FilePath = "";
  if (req.query.nazwa) {
    FilePath = path.join(__dirname, "upload", req.query.nazwa);
  } else {
    FilePath = path.join(__dirname, "upload");
  }

  //Odczytywanie ścieżki wybranej przez użytkownika
  fs.readdir(FilePath, (err, files) => {
    if (err) throw err;

    //Przejrzenie wszystkich plików
    for (let i = 0; i < files.length; i++) {
      // Odczytanie właściwości poszczególnych plików
      const stats = fs.lstatSync(path.join(FilePath, files[i]));
      let temp_obj = {
        name: files[i],
        img: "",
      };
      //Sprawdzenie czy dany plik jest katalogiem
      //folder
      if (stats.isDirectory() === true) {
        temp_obj.img = "folder.png";

        object_z_plikami.folders.push(temp_obj);
        //plik
      } else {
        temp_obj.img = getImageForExtension(files[i]);

        object_z_plikami.files.push(temp_obj);
      }
    }

    //Przypisanie ścieżki do obiektu
    object_z_plikami.sciezka = req.query.nazwa;

    //Ułożenie ścieżki gdzie jesteśmy w menadżerze
    if (req.query.nazwa) {
      let PathArray = [];

      for (let j = 0; j < req.query.nazwa.length; j++) {
        if (req.query.nazwa[j] === "/") {
          PathArray.push(req.query.nazwa.substring(0, j));
        }
      }

      PathArray.shift();

      PathArray.push(req.query.nazwa.substring(0, req.query.nazwa.length));

      object_z_plikami.drozka = PathArray;
    }

    res.render("filemanager.hbs", object_z_plikami);
  });
});

//Funkcja ta usuwa plik lub folder z serwera
app.get("/delete", function (req, res) {
  const filePath = path.join(
    __dirname,
    "upload",
    req.query.sciezka,
    req.query.nazwa
  );

  // jeżeli plik istnieje - usunięcie go
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
  }
  res.redirect("/?nazwa=" + req.query.sciezka);
});

//Funkcja odpowiada za upload plików na serwer i zapisuje je w odpowiednim folderze
app.post("/handleUpload", function (req, res) {
  let form = formidable({});
  form.keepExtensions = true; // zapis z rozszerzeniem pliku
  form.multiples = true; // zapis wielu plików na raz
  form.uploadDir = __dirname + "/upload/"; // folder do zapisu zdjęcia
  form.on("field", function (field, value) {
    form.uploadDir = path.join(__dirname, "upload" + value);
    form.on("fileBegin", function (name, file) {
      file.path = form.uploadDir + "/" + file.name;
    });
  });
  form.parse(req, function (err, fields, files) {
    res.redirect("/?nazwa=" + fields.sciezka);
  });
});

//Funkcja odpowiada za tworzenie nowego folderu
app.post("/nowy_folder", function (req, res) {
  const filePath = path.join(
    __dirname,
    "upload",
    req.body.sciezka,
    req.body.nazwa
  );
  //Sprawdza czy folder o podanej nazwie już istnieje, jeśli nie to tworzy nowy folder
  if (!fs.existsSync(filePath)) {
    fs.mkdir(filePath, (err) => {
      if (err) throw err;
      console.log("jest");
    });
  }
  //Przekierowuje na stronę nazwa= ścieżka folderu
  res.redirect("/?nazwa=" + req.body.sciezka);
});

//Funkcja odpowiada za tworzenie nowego pliku
app.post("/nowy_plik", function (req, res) {
  const filePath = path.join(
    __dirname,
    "upload",
    req.body.sciezka,
    req.body.nazwa
  );
  // Rozdzilenie nazwy po kropce
  const split = req.body.nazwa.split(".");
  // Zapisanie rozszerzenia
  const extension = split.pop();

  // sprawdzenie czy plik już istnieje
  if (!fs.existsSync(path.join(__dirname, "test_files", "test." + extension))) {
    fs.writeFile(filePath, "", (err) => {
      if (err) throw err;
      console.log("plik nadpisany");
    });
  } else {
    fs.copyFile(
      path.join(__dirname, "test_files", "test." + extension),
      filePath,
      (err) => {
        if (err) throw err;
        console.log("plik skopiowany");
      }
    );
  }

  res.redirect("/?nazwa=" + req.body.sciezka);
});

//tworzenie nowego folderu
app.post("/nowaNazwaFolderu", function (req, res) {
  const directory = req.body.sciezka.substring(
    0,
    req.body.sciezka.lastIndexOf("/") + 1
  );
  const newName = path.join(__dirname, "upload", directory, req.body.nazwa);
  //zabezepiecznie przed tworzeniem nowego folderu z tą samą nazwą
  if (!fs.existsSync(newName)) {
    fs.rename(
      path.join(__dirname, "upload", req.body.sciezka),
      newName,
      (err) => {
        if (err) throw err;
        res.redirect("/?nazwa=" + directory + req.body.nazwa);
      }
    );
  }
  //folder istnieje - przekierowanie do obecnej ścieżki
  else {
    console.log("taki folder już istnieje");
    res.redirect("/?nazwa=" + req.body.sciezka);
  }
});

//przejście do texteditora jeżeli mamy plik który jest tekstem
app.get("/texteditor", function (req, res) {
  const PathToFile = path.join(__dirname, "upload", req.query.nazwa);
  if (!fs.existsSync(PathToFile)) {
    res.redirect("/");
    return;
  }
  fs.readFile(PathToFile, { encoding: "UTF-8" }, function (err, data) {
    if (err) throw err;
    const context = {
      data: data,
      sciezka: path.join(req.query.nazwa),
    };
    res.render("texteditor.hbs", context);
  });
});

//Zmiana nazwy pliku
app.post("/nowaNazwaPliku", function (req, res) {
  //Rozdzielenia nazwy od tego po kropce
  const directory = req.body.sciezka.substring(
    0,
    req.body.sciezka.lastIndexOf("/") + 1
  );
  console.log(directory);
  // Stworzenie nowej nazwy, sprawdzenie czy już istnieje
  const newName = path.join(__dirname, "upload", directory, req.body.nazwa);
  if (!fs.existsSync(newName)) {
    if (fs.existsSync(path.join(__dirname, "upload", req.body.sciezka))) {
      fs.rename(
        path.join(__dirname, "upload", req.body.sciezka),
        newName,
        (err) => {
          if (err) throw err;
          res.redirect("/texteditor?nazwa=" + directory + req.body.nazwa);
        }
      );
    }
  }
  //plik istnieje zostanie na sciezce
  else {
    console.log("taki plik już istnieje");
    res.redirect("/texteditor?nazwa=" + req.body.sciezka);
  }
});

//przekierowanie do imageeditora
app.get("/imageeditor", function (req, res) {
  const context = {
    sciezka: req.query.nazwa,
    //wygenerowanie filtrów
    filters: ["grayscale(100%)", "invert(100%)", "sepia(100%)", "none(100%)"],
  };
  res.render("imageeditor.hbs", context);
});

//ikonki dla poszczególnych plików
function getImageForExtension(fileName) {
  const extension = path.extname(fileName).slice(1).toLowerCase();
  switch (extension.toLowerCase()) {
    case "jpg":
    case "png":
    case "txt":
      return extension + ".png";
    default:
      return "else.png";
  }
}

app.listen(PORT, () => {
  console.log("start serwera na porcie " + PORT);
});
