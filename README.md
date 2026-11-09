# CodeMentor

A VS Code extension that helps you understand selected code and consider better alternatives, powered by Gemini.

## Current setup

- TypeScript-based VS Code extension scaffold
- Command: **CodeMentor: Explain and Improve Selection**
- Analysis mode setting: `both` (default), `explain`, or `improve`
- Gemini model setting is configurable; API integration is the next implementation step

## Run the extension

1. Install Node.js and npm.
2. Run `npm install` in this folder.
3. Open this folder in VS Code and press `F5`.
4. In the Extension Development Host, select code and run **CodeMentor: Explain and Improve Selection** from the Command Palette.

## GitHub setup

The local Git repository is initialized in this project. To connect it to GitHub, create an empty repository named `CodeMentor` in your GitHub account, then run:

```sh
git remote add origin https://github.com/YOUR_USERNAME/CodeMentor.git
git push -u origin main
```

Do not add a README or `.gitignore` on GitHub when creating it; those files are already present locally.

## Planned first features

1. Securely collect and store a Gemini API key through VS Code SecretStorage.
2. Send selected code and its language to Gemini.
3. Show an explanation and an improved alternative in a VS Code view.
4. Add packaging and Marketplace publishing after the core flow works.
