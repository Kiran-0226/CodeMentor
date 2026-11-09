import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
	const analyzeSelection = vscode.commands.registerCommand(
		'codementor.analyzeSelection',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				void vscode.window.showInformationMessage('Open a file and select some code to analyze.');
				return;
			}

			const code = editor.document.getText(editor.selection);
			if (!code.trim()) {
				void vscode.window.showInformationMessage('Select code first, then run CodeMentor.');
				return;
			}

			const mode = vscode.workspace.getConfiguration('codementor').get<string>('analysisMode', 'both');
			void vscode.window.showInformationMessage(
				`CodeMentor is ready to ${mode === 'both' ? 'explain and improve' : mode} your selection. Gemini integration is the next step.`
			);
		}
	);

	context.subscriptions.push(analyzeSelection);
}

export function deactivate(): void {}
