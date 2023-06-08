const express = require('express');
const favicon = require('express-favicon');
const path = require('path');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const app = express();
const port = process.env.PORT || 3000

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public/logo.jpg')));

app.set("json spaces",2)

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get("/*.*", async function(req, res) {
  if (!req.url
    .split("?")[0]
    .split(".")[0]
    .slice(1).length
  ) return res.redirect("/");
  if (req.url.includes("favicon")) return res.end();
  
  let url = req.query["url"];
  let type = req.query["type"];

  try {
    let contenttype;
    let filter;
    let quality;

    if (type === "audio") {
      contenttype = "audio/mp3";
      filter = "audioonly";
      quality = req.query["quality"] || "highestaudio";
    } else {
      contenttype = req.query["contenttype"] || "video/mp4";
      filter = req.query["filter"] || "audioandvideo";
      quality = req.query["quality"] || "highestvideo";
    }

    if (contenttype) res.setHeader("content-type", contenttype);
    let stream = await require("ytdl-core")(
      req.url
        .split("?")[0]
        .split(".")[0]
        .slice(1),
      { quality, filter }
    ).on("error", error => {
      console.error(error);
      res.json({ url: url, error: 'Tenemos un error '+ error });
      return;
    }).on("info", info => {
      if (!contenttype)
        res.setHeader("content-type", info.formats[0].mimeType);
      stream.pipe(res);
    });
  } catch (error) {
    console.log(error);
    res.json({ url: url, error: "Tenemos un error:" + error });
    return false;
  }
  return;
});

app.get("/", (req, res) => {
  if (req.query && req.query.url) {
    try {
      require("ytdl-core").getVideoID(req.query.url);
    } catch (error) {
      return res.status(404).render(path.join(__dirname, 'views', '404.ejs'), {pageTitle: 'Error en la Url'});
    }

    let type = req.query["type"];
    let contenttype;
    let filter;
    let quality;

    if (type === "audio") {
      contenttype = "audio/mp3";
      filter = "audioonly";
      quality = req.query["quality"] || "highestaudio";
    } else {
      contenttype = req.query["contenttype"] || "video/mp4";
      filter = req.query["filter"] || "audioandvideo";
      quality = req.query["quality"] || "highestvideo";
    }

    return res.redirect(
      `/${require("ytdl-core").getVideoID(req.query.url)}.${contenttype.split("/")[1]}?type=${type}&filter=${filter}&quality=${quality}&contenttype=${contenttype}`
    );
  } else {
    res.render('index', { pageTitle: 'YTDL - DarkBox' });
  }
});

app.use((req, res, next) => {
  res.status(404).render(path.join(__dirname, 'views', '404.ejs'), {pageTitle: 'Pagina no encontrada'});
});

app.listen(port, () => {
  console.log(`Servidor activo en el puerto: ${port}`);
});
