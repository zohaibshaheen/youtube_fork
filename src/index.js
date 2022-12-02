const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const page = "https://v0ddf.sse.codesandbox.io/";
const getSubtitles = require("youtube-captions-scraper").getSubtitles;
const tester = {};
const cors = require("cors");
const youtubedl = require("youtube-dl-exec");
const ytdl = require("ytdl-core");
function getInfo(url) {
  console.log(url);
  return youtubedl(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true
    // addHeader: ["referer:youtube.com", "user-agent:googlebot"]
  });
}
app.use(
  cors({
    origin: function (origin, callback) {
      return callback(null, true);
    }
  })
);
app.use(express.static("public"));
function validate(thing, notURL) {
  var title = thing
    .split("?")
    .join("？")
    .split(":")
    .join(";")
    .split("/")
    .join("／")
    .split("*")
    .join("＊")
    .split("\\")
    .join("＼")
    .split("|")
    .join("｜")
    .split(`"`)
    .join("'")
    .split(`<`)
    .join("＜")
    .split(`>`)
    .join(">");

  return notURL ? title : new URLSearchParams({ title }).toString();
}

app.get("/info", async (req, res) => {
  console.log("info");
  getInfo(req.query.url)
    .then((info) => {
      res.json(info);
    })
    .catch((e) => {
      console.log(e);
      res.redirect(page);
    });
});
app.get("/captions", async (req, res) => {
  console.log("captions");
  var info = await getInfo(req.query.url);
  if (!info) return res.end();
  getSubtitles({
    videoID: info.id, // youtube video id
    lang: "en" // default: `en`
  })
    .then((captions) => {
      res.json(captions);
    })
    .catch((e) => {
      res.end(e.message);
    });
});

app.get("/view", async (req, res) => {
  console.log("view video");
  var { url, quality } = req.query;
  var a = JSON.stringify(req.query);
  console.log(url, quality, tester[a]);
  if (tester[a]) return res.redirect(tester[a]);
  youtubedl(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    "no-playlist": true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"]
  })
    .then((data) => {
      var formats = data.formats.filter(
        (format) =>
          format.vcodec !== "none" &&
          format.acodec !== "none" &&
          format.ext === "mp4"
      );
      console.log(Object.keys(data), formats);
      var video =
        quality === "lowest" ? formats[0] : formats[formats.length - 1];
      var b = false;
      if (b && video.url.startsWith("https://rr4")) {
        var abccc = validate(data.title)
          .split("+")
          .join(" ")
          .replace("title=", "");
        console.log(abccc);
        res.statusCode = 206;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${abccc}.mp4"`
        );
        var range = req.headers.range
          ?.replace("bytes=", "")
          ?.split("-")
          ?.map((a) => parseFloat(a))
          .map((a) => (isNaN(a) ? 0 : a));
        if (isNaN(range[1])) range[1] = range[0] + 694200;
        // if (!range) range = [0, 4206924];
        console.log(range, "range");
        ytdl(url, { range: { start: range[0], end: range[1] } }).pipe(res);
        res.setHeader("content-length", 6942020);
        res.setHeader(
          "content-range",
          `bytes ${range[0]}-${range[1]}/${6942020 - range[1]}`
        );
      } else {
        tester[a] = video.url + "&" + validate(data.title);
        res.redirect(tester[a]);
      }
    })
    .catch((e) => {
      console.log("error getting info", e);
      tester[a] = page;
      res.redirect(404, page);
    });
});

server.listen(8080, () => {
  console.log("listening on *:" + 8080);
});
console.log("bum bum bum bum");
