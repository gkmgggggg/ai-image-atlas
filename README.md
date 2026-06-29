# AI Image Atlas

项目级 GitHub Pages 站点，用于快速查看 AI 图片案例与对应提示词。

素材来源：[wukongnotnull/image-inspirer](https://github.com/wukongnotnull/image-inspirer)，上游项目使用 Apache License 2.0。

## 本地运行

```bash
npm install
npm run dev
```

构建脚本会优先读取相邻目录 `../image-inspirer`，如果不存在，会自动浅克隆上游仓库到 `.cache/image-inspirer`。

## 部署

推送到 GitHub 后，仓库的 Actions 会自动构建并部署到项目级 GitHub Pages：

```text
https://<用户名>.github.io/<仓库名>/
```

如需手动启用 Pages：

```bash
gh api repos/<用户名>/<仓库名>/pages -X POST -f build_type=workflow
```
