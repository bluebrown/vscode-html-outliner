import * as vscode from "vscode";
const HTML5Outline = require("h5o");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


interface OutlineNode {
	startingNode: Element
	heading?: Element
	sections?: OutlineNode[]
}

class OutlineTreeItem extends vscode.TreeItem {
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

export class OutlineProvider
	implements vscode.TreeDataProvider<OutlineNode> {

	constructor(private outline: OutlineNode[]) {}
	
	getTreeItem({ heading, sections, startingNode }: OutlineNode): vscode.TreeItem {
		let label = startingNode?.getAttribute('aria-label');
		// labelledBy  = startingNode?.getAttribute('aria-labelledBy');
		return new OutlineTreeItem(
			heading?.textContent
			|| label
			|| 'Untitled Section',
			(sections?.length ?? 0) > 0
				? vscode.TreeItemCollapsibleState.Expanded
				: vscode.TreeItemCollapsibleState.None,
			startingNode.tagName.concat(label ? ' (aria label)' : ''),
		);
	}

	getChildren(element?: OutlineNode): Thenable<OutlineNode[]> {
		return element && Promise.resolve(element.sections ?? [])
			|| Promise.resolve(this.outline);
	}
}

export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand(
		"outliner.outline",
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.languageId !== 'html') {return;};
			const dom = new JSDOM(editor.document.getText());
			const outline = HTML5Outline(dom.window.document.body);
			let outlineProvider = new OutlineProvider(outline.sections);
				vscode.window.createTreeView('documentOutline', {
					treeDataProvider: outlineProvider
				});
		}
	));

	vscode.commands.executeCommand("outliner.outline");

	vscode.window.onDidChangeActiveTextEditor(() => {
		vscode.commands.executeCommand("outliner.outline");
	});

	vscode.workspace.onDidSaveTextDocument(() => {
		vscode.commands.executeCommand("outliner.outline");
	});

	
	vscode.workspace.onDidChangeTextDocument(() => {
		vscode.commands.executeCommand("outliner.outline");
	});

}

export function deactivate() { }