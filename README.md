# CodeMentor

CodeMentor is a VS Code extension that explains selected code and suggests a better option using Google Gemini.

## Features

- Explain code, suggest an improvement, or do both.
- Use language-aware analysis profiles for JavaScript/TypeScript, Python, Java, C#, C/C++, Go, Rust, PHP, Ruby, Kotlin, and Swift. Other languages use a cautious generic profile.
- Review results in a VS Code panel beside the editor.
- Copy suggested code or choose **Replace selection** to apply it.
- Review a static data-flow diagram with AI-described data states at each step, and copy the explanation.
- Choose beginner, intermediate, or advanced explanations.
- Save your Gemini API key in VS Code SecretStorage.
- Analyze only the selected code; CodeMentor does not read or upload the rest of your file.
- Optionally re-analyze selected code automatically after edits, with a short debounce.

## Requirements

- VS Code 1.85 or later
- Node.js 22 or later for development and packaging
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Install and use

1. Install dependencies: `npm install`.
2. Open this folder in VS Code and press `F5` to launch the Extension Development Host.
3. In the new window, run **CodeMentor: Set Gemini API Key** from the Command Palette and enter your key.
4. Select code and use the **CodeMentor** status bar action, press `Ctrl+Alt+M` (`Cmd+Option+M` on macOS), right-click and choose **CodeMentor: Explain and Improve Selection**, or run it from the Command Palette.
5. Review the explanation and suggestion. Choose **Replace selection** only when you want to apply it.
6. To enable automatic analysis after edits, run **CodeMentor: Toggle Live Analysis**. It is off by default; when enabled, only the selected code is sent to Gemini after you pause typing.
7. Run **CodeMentor: Set Learning Level** to tailor explanations to your experience.

The first request sends the selected text and its language identifier to Google’s Gemini API. The API key is sent to Google for authentication and is stored locally using VS Code SecretStorage. Do not select secrets or code you are not allowed to send to an external AI service.

The flowchart and complexity values are Gemini estimates based on the selected code; CodeMentor does not execute code or produce a measured runtime trace.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `codementor.analysisMode` | `both` | `both`, `explain`, or `improve` |
| `codementor.geminiModel` | `gemini-3.5-flash` | Gemini model ID used for analysis |
| `codementor.fallbackGeminiModel` | `gemini-3.6-flash` | Model tried after repeated temporary server errors; set to an empty string to disable |
| `codementor.liveAnalysis` | `false` | Automatically analyze selected code after edits; toggle with the CodeMentor command |
| `codementor.learningLevel` | `beginner` | Explanation depth: `beginner`, `intermediate`, or `advanced` |

Use **CodeMentor: Clear Gemini API Key** to remove the saved key. If a model is retired or unavailable to your account, change `codementor.geminiModel` or `codementor.fallbackGeminiModel` in VS Code Settings.

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
