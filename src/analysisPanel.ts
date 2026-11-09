import * as vscode from 'vscode';
import { randomBytes } from 'crypto';
import { AnalysisMode, AnalysisResult } from './gemini';

interface PanelOptions {
	mode: AnalysisMode;
	language: string;
	selectedCharacterCount: number;
	apply: (replacement: string) => Promise<boolean>;
}

interface CurrentAnalysis {
	result: AnalysisResult;
	options: PanelOptions;
}

let currentPanel: vscode.WebviewPanel | undefined;
let currentAnalysis: CurrentAnalysis | undefined;
let currentPanelReady = false;

export function showAnalysis(context: vscode.ExtensionContext, result: AnalysisResult, options: PanelOptions): void {
	currentAnalysis = { result, options };
	const panel = currentPanel ?? createPanel(context);
	panel.reveal(vscode.ViewColumn.Beside, true);
	if (currentPanelReady) void postCurrentAnalysis(panel);
}

function createPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
	const panel = vscode.window.createWebviewPanel(
		'codementor.analysis',
		'CodeMentor Analysis',
		vscode.ViewColumn.Beside,
		{ enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] }
	);
	currentPanel = panel;
	currentPanelReady = false;
	const listener = panel.webview.onDidReceiveMessage(async message => {
		const analysis = currentAnalysis;
		if (!analysis || !message || typeof message !== 'object') return;
		if (message.type === 'ready') {
			currentPanelReady = true;
			void postCurrentAnalysis(panel);
		} else if (message.type === 'copyExplanation') {
			await vscode.env.clipboard.writeText(analysis.result.explanation);
			void vscode.window.showInformationMessage('Explanation copied to clipboard.');
		} else if (message.type === 'copy' && message.code === analysis.result.improvedCode && analysis.result.improvedCode) {
			await vscode.env.clipboard.writeText(analysis.result.improvedCode);
			void vscode.window.showInformationMessage('Suggested code copied to clipboard.');
		} else if (message.type === 'apply' && message.code === analysis.result.improvedCode && analysis.result.improvedCode) {
			if (await analysis.options.apply(analysis.result.improvedCode)) {
				await panel.webview.postMessage({ type: 'applied' });
			}
		}
	});
	panel.onDidDispose(() => {
		listener.dispose();
		if (currentPanel === panel) {
			currentPanel = undefined;
			currentAnalysis = undefined;
			currentPanelReady = false;
		}
	});
	const nonce = createNonce();
	panel.webview.html = getHtml(nonce, context.extension.packageJSON.displayName as string);
	return panel;
}

async function postCurrentAnalysis(panel: vscode.WebviewPanel): Promise<void> {
	if (!currentAnalysis || currentPanel !== panel) return;
	const { result, options } = currentAnalysis;
	await panel.webview.postMessage({
		type: 'analysis',
		result,
		language: options.language,
		selectedCharacterCount: options.selectedCharacterCount,
		canApply: options.mode !== 'explain' && Boolean(result.improvedCode)
	});
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
    .flowchart { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 8px 0; }
    .flow-node { max-width: 90%; min-width: 140px; padding: 9px 14px; text-align: center; border: 1px solid var(--vscode-button-border, var(--vscode-panel-border)); border-radius: 6px; background: var(--vscode-editor-background); overflow-wrap: anywhere; }
    .flow-label { font-weight: 600; }
    .flow-data { margin-top: 5px; color: var(--vscode-descriptionForeground); font-size: .92em; }
    .flow-node.start, .flow-node.end { border-radius: 999px; background: var(--vscode-textCodeBlock-background); }
    .flow-node.decision { border-style: dashed; }
    .flow-arrow { height: 28px; line-height: 24px; color: var(--vscode-descriptionForeground); font-size: 1.25rem; }
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
  <p id="sourceInfo" class="subtle"></p>
  <section id="explanationSection" class="panel">
    <h2>What this code does</h2>
    <div id="explanation" class="text" role="article"></div>
    <div class="actions"><button id="copyExplanationButton" class="secondary">Copy explanation</button></div>
  </section>
  <section id="complexitySection" class="panel">
    <h2>Estimated complexity</h2>
    <p><strong>Time:</strong> <span id="timeComplexity" class="text"></span></p>
    <p><strong>Space:</strong> <span id="spaceComplexity" class="text"></span></p>
  </section>
  <section id="flowchartSection" class="panel">
    <h2>Code flow and data states</h2>
    <p class="subtle">AI-generated from the selected code; this is an explanation, not a live runtime trace.</p>
    <div id="flowchart" class="flowchart" role="group" aria-label="Code execution flowchart"></div>
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
    document.getElementById('copyExplanationButton').onclick = () => vscode.postMessage({ type: 'copyExplanation' });
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.type === 'applied') {
        document.getElementById('improvementSection').hidden = true;
        document.getElementById('sourceInfo').textContent += ' · Better option applied';
        suggestion = '';
        return;
      }
      if (message.type !== 'analysis') return;
      const result = message.result;
      document.getElementById('sourceInfo').textContent = 'Analyzed ' + message.selectedCharacterCount + ' characters (' + message.language + ')';
      document.getElementById('explanation').textContent = result.explanation;
      document.getElementById('timeComplexity').textContent = result.timeComplexity;
      document.getElementById('spaceComplexity').textContent = result.spaceComplexity;
      const chart = document.getElementById('flowchart');
      chart.replaceChildren();
      (Array.isArray(result.flowchart) ? result.flowchart : []).slice(0, 12).forEach((step, index, steps) => {
        const label = step && typeof step.label === 'string' ? step.label : '';
        const data = step && typeof step.data === 'string' ? step.data : '';
        const node = document.createElement('div');
        node.className = 'flow-node ' + (index === 0 ? 'start' : index === steps.length - 1 ? 'end' : /^condition\\s*:/i.test(label) ? 'decision' : 'process');
        node.dataset.label = label;
        node.dataset.data = data;
        const labelElement = document.createElement('div');
        labelElement.className = 'flow-label';
        labelElement.textContent = label;
        const dataElement = document.createElement('div');
        dataElement.className = 'flow-data';
        dataElement.textContent = data;
        node.append(labelElement, dataElement);
        chart.appendChild(node);
        if (index < steps.length - 1) {
          const arrow = document.createElement('div');
          arrow.className = 'flow-arrow';
          arrow.textContent = '↓';
          chart.appendChild(arrow);
        }
      });
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
