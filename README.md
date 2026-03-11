# PDF2JSON Online

[中文](README.md) | [English](README.en.md)

无服务器 PDF 转 JSON 工具附带简单 HTTP POST API

立刻使用 https://pdf2json-online.vercel.app

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jerryshell/pdf2json-online)

## 使用

### 本地开发

```bash
bun install
bun run dev
```

### API

```bash
curl -X POST -F "file=@your.pdf" http://localhost:3000/api/convert
```
