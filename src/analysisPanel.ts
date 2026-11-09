import * as vscode from 'vscode';
import { randomBytes } from 'crypto';
import { AnalysisMode, AnalysisResult } from './gemini';

interface PanelOptions {
	mode: AnalysisMode;
	apply: (replacement: string) => Promise<boolean>;
}

export function showAnalysis(context: vscode.ExtensionContext, result: AnalysisResult, options: PanelOptions): void {
	const panel = vscode.window.createWebviewPanel(
		'codementor.analysis',
		'CodeMentor Analysis',
		vscode.ViewColumn.Beside,
		{ enableScripts: true, retainContextWhenHidden: false, localResourceRoots: [] }
	);
	const nonce = createNonce();
	const listener = panel.webview.onDidReceiveMessage(async message => {
		if (!message || typeof message !== 'object') return;
		if (message.type === 'ready') {
			void panel.webview.postMessage({ type: 'analysis', result, canApply: options.mode !== 'explain' && Boolean(result.improvedCode) });
		} else if (message.type === 'copy' && message.code === result.improvedCode && result.improvedCode) {
			await vscode.env.clipboard.writeText(result.improvedCode);
			void vscode.window.showInformationMessage('Suggested code copied to clipboard.');
		} else if (message.type === 'apply' && message.code === result.improvedCode && result.improvedCode) {
			if (await options.apply(result.improvedCode)) panel.dispose();
		}
	});
	panel.onDidDispose(() => listener.dispose());
	panel.webview.html = getHtml(nonce, context.extension.packageJSON.displayName as string);
}

function getHtml(nonce: string, title: string): string {
	const csp = `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';`;
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} Analysis</title>
  <style nonce="${nonce}">
    body { padding: 0 20px 28px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); line-height: 1.55; }
    h1 { font-size: 1.45rem; margin: 18px 0 4px; }
    h2 { font-size: 1.05rem; margin: 22px 0 8px; }
    .subtle { color: var(--vscode-descriptionForeground); margin-top: 0; }
    .panel { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 14px; margin: 10px 0; }
    .text { white-space: pre-wrap; overflow-wrap: anywhere; }
    pre { white-space: pre; overflow: auto; padding: 14px; border-radius: 6px; background: var(--vscode-textCodeBlock-background); }
    code { font-family: var(--vscode-editor-font-family); font-size: var(--vscode-editor-font-size); }
    .actions { display: flex; gap: 8px; margin-top: 10px; }
    button { border: 0; border-radius: 4px; padding: 7px 12px; cursor: pointer; color: var(--vscode-button-foreground); background: var(--vscode-button-background); }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button.secondary { color: var(--vscode-button-secondaryForeground); background: var(--vscode-button-secondaryBackground); }
    button.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
    [hidden] { display: none !important; }
  </style>
</head>
<body>
  <h1>CodeMentor</h1>
  <p class="subtle">Gemini analysis of your selected code</p>
  <section id="explanationSection" class="panel">
    <h2>What this code does</h2>
    <div id="explanation" class="text" role="article"></div>
  </section>
  <section id="improvementSection" class="panel" hidden>
    <h2>Better option</h2>
    <div id="summary" class="text"></div>
    <pre><code id="improvedCode"></code></pre>
    <div class="actions">
      <button id="applyButton" hidden>Replace selection</button>
      <button id="copyButton" class="secondary">Copy suggestion</button>
    </div>
  </section>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let suggestion = '';
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type !== 'analysis') return;
      const result = message.result;
      document.getElementById('explanation').textContent = result.explanation;
      const improvement = document.getElementById('improvementSection');
      const hasImprovement = Boolean(result.improvedCode);
      improvement.hidden = !hasImprovement;
      if (hasImprovement) {
        document.getElementById('summary').textContent = result.improvementSummary || 'Suggested alternative';
        document.getElementById('improvedCode').textContent = result.improvedCode;
        suggestion = result.improvedCode;
        const apply = document.getElementById('applyButton');
        apply.hidden = !message.canApply;
        apply.onclick = () => vscode.postMessage({ type: 'apply', code: suggestion });
        document.getElementById('copyButton').onclick = () => vscode.postMessage({ type: 'copy', code: suggestion });
      }
    });
    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`;
}

function createNonce(): string {
	return randomBytes(16).toString('base64');
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}
