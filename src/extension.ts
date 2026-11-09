import * as vscode from 'vscode';
import { analyzeCode } from './gemini';
import { showAnalysis } from './analysisPanel';

const API_KEY_SECRET = 'codementor.geminiApiKey';
const MAX_CODE_LENGTH = 30_000;

export function activate(context: vscode.ExtensionContext): void {
	const analyzeStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	analyzeStatus.text = '$(sparkle) CodeMentor';
	analyzeStatus.tooltip = 'Explain and improve selected code (Ctrl+Alt+M)';
	analyzeStatus.command = 'codementor.analyzeSelection';
	context.subscriptions.push(analyzeStatus);

	const updateAnalyzeStatus = (editor: vscode.TextEditor | undefined): void => {
		if (editor && !editor.selection.isEmpty) analyzeStatus.show();
		else analyzeStatus.hide();
	};
	updateAnalyzeStatus(vscode.window.activeTextEditor);
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(updateAnalyzeStatus),
		vscode.window.onDidChangeTextEditorSelection(event => updateAnalyzeStatus(event.textEditor))
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codementor.setGeminiApiKey', async () => {
			const key = await vscode.window.showInputBox({
				prompt: 'Enter your Google AI Studio Gemini API key',
				placeHolder: 'AIza…',
				password: true,
				ignoreFocusOut: true,
				validateInput: value => value.trim() ? undefined : 'Enter an API key.'
			});
			if (key === undefined) return;
			await context.secrets.store(API_KEY_SECRET, key.trim());
			void vscode.window.showInformationMessage('Gemini API key saved securely in VS Code.');
		}),
		vscode.commands.registerCommand('codementor.clearGeminiApiKey', async () => {
			await context.secrets.delete(API_KEY_SECRET);
			void vscode.window.showInformationMessage('Gemini API key removed from VS Code.');
		}),
		vscode.commands.registerCommand('codementor.analyzeSelection', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				void vscode.window.showWarningMessage('Open a file and select code to analyze.');
				return;
			}

			const selection = editor.selection;
			const code = editor.document.getText(selection);
			if (!code.trim()) {
				void vscode.window.showWarningMessage('Select code first, then run CodeMentor.');
				return;
			}
			if (code.length > MAX_CODE_LENGTH) {
				void vscode.window.showWarningMessage(`The selection is too large. Select no more than ${MAX_CODE_LENGTH.toLocaleString()} characters.`);
				return;
			}

			let apiKey = await context.secrets.get(API_KEY_SECRET);
			if (!apiKey) {
				const action = 'Set API Key';
				const choice = await vscode.window.showWarningMessage('Add a Gemini API key to analyze code.', action);
				if (choice !== action) return;
				await vscode.commands.executeCommand('codementor.setGeminiApiKey');
				apiKey = await context.secrets.get(API_KEY_SECRET);
				if (!apiKey) return;
			}

			const mode = vscode.workspace.getConfiguration('codementor').get<'both' | 'explain' | 'improve'>('analysisMode', 'both');
			const model = vscode.workspace.getConfiguration('codementor').get<string>('geminiModel', 'gemini-3.8-flash');
			const language = editor.document.languageId;
			const uri = editor.document.uri;
			const originalVersion = editor.document.version;
			const originalSelection = selection;

			try {
				const result = await vscode.window.withProgress(
					{ location: vscode.ProgressLocation.Notification, title: 'CodeMentor is analyzing your selection…', cancellable: false },
					progress => analyzeCode({
						apiKey: apiKey!,
						model,
						mode,
						language,
						code,
						onRetry: attempt => progress.report({ message: `Temporary Gemini delay. Retrying (${attempt}/3)…` })
					})
				);
				showAnalysis(context, result, {
					mode,
					apply: async replacement => {
						const document = await vscode.workspace.openTextDocument(uri);
						if (document.version !== originalVersion || document.getText(originalSelection) !== code) {
							void vscode.window.showWarningMessage('The source changed after analysis. Run CodeMentor again before applying this suggestion.');
							return false;
						}
						const targetEditor = vscode.window.visibleTextEditors.find(item => item.document.uri.toString() === uri.toString());
						if (!targetEditor) {
							void vscode.window.showWarningMessage('Reopen the source file before applying the suggestion.');
							return false;
						}
						const applied = await targetEditor.edit(edit => edit.replace(originalSelection, replacement));
						if (applied) void vscode.window.showInformationMessage('CodeMentor suggestion applied.');
						return applied;
					}
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
				void vscode.window.showErrorMessage(`CodeMentor: ${message}`);
			}
		})
	);
}

export function deactivate(): void {}
