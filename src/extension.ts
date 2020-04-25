import * as vscode from "vscode";
const HTML5Outline = require("h5o");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


export class OutlineProvider
	implements vscode.TreeDataProvider<vscode.TreeItem> {

	constructor(private outline: any) { }

	getTreeItem({ heading, sections, startingNode }: any): vscode.TreeItem {
		let label = startingNode?.getAttribute('aria-label');
		// labelledBy  = startingNode?.getAttribute('aria-labelledBy');
		return new OutlineNode(
			heading?.textContent
			|| label
			|| 'Untitled Section',
			sections?.length > 0
				? vscode.TreeItemCollapsibleState.Expanded
				: vscode.TreeItemCollapsibleState.None,
			startingNode.tagName.concat(label ? ' (aria label)' : ''),
		);	}

	getChildren(element?: any): Thenable<[]> {
		return element && Promise.resolve(element.sections) || Promise.resolve(this.outline);
	}
}
class OutlineNode extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		private tagName: string,
	) {
		super(label, collapsibleState);
	}
	get description(): string {
		return this.tagName;
	}
}


export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand(
		"outliner.outline",
		async () => {
			const currentEditor = vscode.window.activeTextEditor;
			if (currentEditor?.document?.languageId === 'html') {
				const dom = new JSDOM(currentEditor.document.getText());
				const outline = HTML5Outline(dom.window.document.body);
				vscode.window.createTreeView('documentOutline', {
					treeDataProvider: new OutlineProvider(outline.sections)
				});
			}
		}
	);

	context.subscriptions.push(disposable);


}

export function deactivate() { }