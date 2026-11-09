# CodeMentor

CodeMentor is a VS Code extension that explains selected code and suggests a better option using Google Gemini.

## Features

- Explain code, suggest an improvement, or do both.
- Review results in a VS Code panel beside the editor.
- Copy suggested code or choose **Replace selection** to apply it.
- Save your Gemini API key in VS Code SecretStorage.
- Analyze only the selected code; CodeMentor does not read or upload the rest of your file.

## Requirements

- VS Code 1.85 or later
- Node.js 22 or later for development and packaging
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Install and use

1. Install dependencies: `npm install`.
2. Open this folder in VS Code and press `F5` to launch the Extension Development Host.
3. In the new window, run **CodeMentor: Set Gemini API Key** from the Command Palette and enter your key.
4. Select code, right-click, and choose **CodeMentor: Explain and Improve Selection**. You can also run that command from the Command Palette.
5. Review the explanation and suggestion. Choose **Replace selection** only when you want to apply it.

The first request sends the selected text and its language identifier to Google’s Gemini API. The API key is sent to Google for authentication and is stored locally using VS Code SecretStorage. Do not select secrets or code you are not allowed to send to an external AI service.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `codementor.analysisMode` | `both` | `both`, `explain`, or `improve` |
| `codementor.geminiModel` | `gemini-3.8-flash` | Gemini model ID used for analysis |

Use **CodeMentor: Clear Gemini API Key** to remove the saved key. If a model is retired or unavailable to your account, change `codementor.geminiModel` in VS Code Settings.

## Build and package

```sh
npm run compile
npm run package
```

The package command creates a `.vsix` file. Install it in VS Code with **Extensions: Install from VSIX...** or `code --install-extension codementor-0.0.1.vsix`.

## GitHub and Marketplace

The project has a local Git repository. Create an empty GitHub repository named `CodeMentor` and connect it with:

```sh
git remote add origin https://github.com/YOUR_USERNAME/CodeMentor.git
git push -u origin main
```

Publishing to the Visual Studio Marketplace requires a registered Marketplace publisher and an access token. The VSIX can be installed locally without publishing.

## License

MIT
