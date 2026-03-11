# PDF2JSON Online

[中文](README.md) | [English](README.en.md)

Serverless PDF to JSON tool w/ easy HTTP POST API

Use now https://pdf2json-online.vercel.app

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jerryshell/pdf2json-online)

## Usage

### Local Development

```bash
bun install
bun run dev
```

### API

```bash
curl -X POST -F "file=@your.pdf" http://localhost:3000/api/convert
```
