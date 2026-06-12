const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const publicBase = "https://kf007kf.github.io/-/";
const outputDir = path.join(root, "outputs");
const outputFile = path.join(outputDir, "NTRGAME-ReviewFork-Blog.html");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function safeInlineScript(source) {
  return source.replace(/<\/script>/gi, "<\\/script>");
}

function rewritePublicPaths(source) {
  return source
    .replace(/"\.\/assets\//g, `"${publicBase}assets/`)
    .replace(/"\.\/reference\//g, `"${publicBase}reference/`)
    .replace(/"\.\/reviews\//g, `"${publicBase}reviews/`)
    .replace(/"\.\.\/assets\//g, `"${publicBase}assets/`)
    .replace(/"\.\.\/reference\//g, `"${publicBase}reference/`)
    .replace(/"\.\.\/reviews\//g, `"${publicBase}reviews/`)
    .replace(/url\(\.\.\/assets\//g, `url(${publicBase}assets/`)
    .replace(/url\(\.\/assets\//g, `url(${publicBase}assets/`);
}

let html = read("index.html");
const css = rewritePublicPaths(read("styles/main.css"));
const data = rewritePublicPaths(read("data/site-data.js"));
const config = read("config/firebase-config.js");
const app = read("scripts/app.js");

html = rewritePublicPaths(html)
  .replace('<link rel="stylesheet" href="./styles/main.css" />', `<style>\n${css}\n</style>`)
  .replace('<script src="./data/site-data.js"></script>', `<script>\n${safeInlineScript(data)}\n</script>`)
  .replace('<script src="./config/firebase-config.js"></script>', `<script>\n${safeInlineScript(config)}\n</script>`)
  .replace('<script src="./scripts/app.js" defer></script>', `<script>\n${safeInlineScript(app)}\n</script>`);

html = html.replace(
  "<!doctype html>",
  `<!doctype html>\n<!-- Single-file export generated ${new Date().toISOString()}. Images and detail-page links use ${publicBase} -->`
);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, html.replace(/[ \t]+$/gm, ""), "utf8");
console.log(outputFile);
