# AI Image Atlas

项目级 GitHub Pages 站点，用于快速查看 AI 图片案例与对应提示词。

素材来源：[wukongnotnull/image-inspirer](https://github.com/wukongnotnull/image-inspirer)，上游项目使用 Apache License 2.0。

## 素材

图片和提示词资源已经保存到本仓库：

```text
resources/image-inspirer/
├── LICENSE
├── UPSTREAM_COMMIT
└── db/
    ├── UI与界面/
    │   ├── prompt.md
    │   └── images/
    └── ...
```

构建时会从 `resources/image-inspirer/db` 读取原始 `prompt.md` 和图片，并生成网页需要的 `public/gallery-data.json` 与 `public/gallery-images/`。

## 本地运行

```bash
npm install
npm run dev
```

## 部署

仓库使用 `gh-pages` 分支作为项目级 GitHub Pages 发布源：

```text
https://<用户名>.github.io/<仓库名>/
```

部署流程：

```bash
npm run build
git push origin main
# 将 dist/ 内容提交并推送到 gh-pages 分支
```
