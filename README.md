# 夜海寄信：生日祝福互动网站

这是一个手机优先的静态生日祝福网站，使用原生 HTML、CSS 和 JavaScript 构建，可直接部署到 GitHub Pages。

## 本地预览

在仓库根目录运行任意静态服务器，例如：

```powershell
py -m http.server 4173
```

然后访问 `http://localhost:4173/`。不要直接用 `file://` 打开，静态服务器更接近 GitHub Pages 的运行方式。

## 替换内容

- 祝福、称呼、署名、彩蛋和主题色：编辑 `content.js`。
- 页面结构和语义：编辑 `index.html`。
- 颜色、排版、响应式和动画：编辑 `styles.css`。
- 交互状态和音乐控制：编辑 `app.js`。

## 添加音乐

将有明确授权的 MP3 放到 `assets/audio/birthday.mp3`，建议 128–192 kbps、2–5 分钟、2–5 MB，并把 `content.js` 中的 `audio.enabled` 改为 `true`。音乐只会在用户点击开始按钮后尝试播放。

## GitHub Pages

仓库包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 后，GitHub Actions 会将仓库根目录部署到 Pages。首次使用时，在仓库 Settings → Pages 中将 Source 设置为 GitHub Actions。
