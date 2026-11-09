import * as vscode from 'vscode';
import { analyzeCode, LearningLevel } from './gemini';
import { showAnalysis } from './analysisPanel';
import { getLanguageProfile } from './languages/registry';

const API_KEY_SECRET = 'codementor.geminiApiKey';
const MAX_CODE_LENGTH = 30_000;

export function activate(context: vscode.ExtensionContext): void {
	const output = vscode.window.createOutputChannel('CodeMentor');
	const analyzeStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	context.subscriptions.push(output, analyzeStatus);
	let liveTimer: ReturnType<typeof setTimeout> | undefined;
	let liveRequestRunning = false;
	let pendingLiveEditor: vscode.TextEditor | undefined;

	const liveEnabled = (): boolean => vscode.workspace.getConfiguration('codementor').get<boolean>('liveAnalysis', false);
	const updateAnalyzeStatus = (editor: vscode.TextEditor | undefined): void => {
		analyzeStatus.tooltip = liveEnabled()
			? 'Explain and improve selected code. Live analysis is enabled (Ctrl+Alt+M).'
			: 'Explain and improve selected code (Ctrl+Alt+M). Enable live analysis in CodeMentor settings.';
		if (editor && !editor.selection.isEmpty) analyzeStatus.show();
		else analyzeStatus.hide();
	};
	updateAnalyzeStatus(vscode.window.activeTextEditor);
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(updateAnalyzeStatus),
		vscode.window.onDidChangeTextEditorSelection(event => updateAnalyzeStatus(event.textEditor)),
		vscode.workspace.onDidChangeTextDocument(event => {
			if (!liveEnabled()) return;
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.uri.toString() !== event.document.uri.toString() || editor.selection.isEmpty) return;
			if (liveTimer) clearTimeout(liveTimer);
			liveTimer = setTimeout(() => {
				if (liveRequestRunning) {
					pendingLiveEditor = editor;
					return;
				}
				void processLive(editor);
			}, 1400);
		})
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
		vscode.commands.registerCommand('codementor.toggleLiveAnalysis', async () => {
			const config = vscode.workspace.getConfiguration('codementor');
			const enabled = !config.get<boolean>('liveAnalysis', false);
			const target = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
			await config.update('liveAnalysis', enabled, target);
			updateAnalyzeStatus(vscode.window.activeTextEditor);
			void vscode.window.showInformationMessage(enabled
				? 'Live analysis enabled. Selected code is sent to Gemini 1.4 seconds after edits.'
				: 'Live analysis disabled.');
		}),
		vscode.commands.registerCommand('codementor.setLearningLevel', async () => {
			const options: Array<{ label: string; description: string; value: LearningLevel }> = [
				{ label: 'Beginner', description: 'Plain language and explained terms', value: 'beginner' },
				{ label: 'Intermediate', description: 'Technical detail with key concepts explained', value: 'intermediate' },
				{ label: 'Advanced', description: 'Concise analysis of trade-offs and edge cases', value: 'advanced' }
			];
			const selected = await vscode.window.showQuickPick(options, { placeHolder: 'Choose CodeMentor explanation level' });
			if (!selected) return;
			const target = vscode.workspace.workspaceFolders?.length ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
			await vscode.workspace.getConfiguration('codementor').update('learningLevel', selected.value, target);
			void vscode.window.showInformationMessage(`CodeMentor learning level set to ${selected.label}.`);
		}),
		vscode.commands.registerCommand('codementor.analyzeSelection', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				void vscode.window.showWarningMessage('Open a file and select code to analyze.');
				return;
			}
			await analyzeSelection(context, editor, false, output);
		})
	);

	async function processLive(editor: vscode.TextEditor): Promise<void> {
		liveRequestRunning = true;
		let next: vscode.TextEditor | undefined = editor;
		while (next) {
			pendingLiveEditor = undefined;
			await analyzeSelection(context, next, true, output);
			next = pendingLiveEditor;
		}
		liveRequestRunning = false;
	}
}

async function analyzeSelection(context: vscode.ExtensionContext, editor: vscode.TextEditor, live: boolean, output: vscode.OutputChannel): Promise<void> {
	const selection = editor.selection;
	const code = editor.document.getText(selection);
	if (!code.trim()) {
		if (!live) void vscode.window.showWarningMessage('Select code first, then run CodeMentor.');
		return;
	}
	if (code.length > MAX_CODE_LENGTH) {
		if (!live) void vscode.window.showWarningMessage(`The selection is too large. Select no more than ${MAX_CODE_LENGTH.toLocaleString()} characters.`);
		return;
	}

	let apiKey = await context.secrets.get(API_KEY_SECRET);
	if (!apiKey) {
		if (live) return;
		const action = 'Set API Key';
		const choice = await vscode.window.showWarningMessage('Add a Gemini API key to analyze code.', action);
		if (choice !== action) return;
		await vscode.commands.executeCommand('codementor.setGeminiApiKey');
		apiKey = await context.secrets.get(API_KEY_SECRET);
		if (!apiKey) return;
	}

	const settings = vscode.workspace.getConfiguration('codementor');
	const mode = settings.get<'both' | 'explain' | 'improve'>('analysisMode', 'both');
	const learningLevel = settings.get<LearningLevel>('learningLevel', 'beginner');
	const model = settings.get<string>('geminiModel', 'gemini-3.5-flash');
	const fallbackModel = settings.get<string>('fallbackGeminiModel', 'gemini-3.6-flash');
	const languageId = editor.document.languageId;
	const language = getLanguageProfile(languageId).name;
	const uri = editor.document.uri;
	const originalVersion = editor.document.version;
	const originalSelection = selection;
	const stillCurrent = (): boolean => !live || (
		vscode.window.activeTextEditor?.document.uri.toString() === uri.toString()
		&& editor.document.version === originalVersion
		&& editor.document.getText(editor.selection) === code
	);

	try {
		const run = (progress?: vscode.Progress<{ message?: string }>) => analyzeCode({
			apiKey: apiKey!, model, fallbackModel, mode, learningLevel, language: languageId, code,
			onRetry: attempt => progress?.report({ message: `Temporary Gemini delay. Retrying (${attempt}/3)…` }),
			onFallback: fallback => progress?.report({ message: `Primary model is unavailable. Trying ${fallback}…` })
		});
		const result = live
			? await run()
			: await vscode.window.withProgress(
				{ location: vscode.ProgressLocation.Notification, title: 'CodeMentor is analyzing your selection…', cancellable: false },
				run
			);
		if (!stillCurrent()) return;
		showAnalysis(context, result, {
			mode, language, selectedCharacterCount: code.length,
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
		if (live) output.appendLine(`Live analysis failed: ${message}`);
		else void vscode.window.showErrorMessage(`CodeMentor: ${message}`);
	}
}

export function deactivate(): void {}
