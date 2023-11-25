import { addIcon, Notice, Plugin, TFile, Vault, Workspace, WorkspaceLeaf, MenuItem, MarkdownView, TAbstractFile, Menu, Editor } from 'obsidian';
// const { nativeTheme } = require('electron').remote;
// import {nativeTheme } from '@electron/remote'
import {DIAGRAM_EDIT_VIEW_TYPE, DIAGRAM_VIEW_TYPE, ICON} from './constants';
import DiagramsView from './diagrams-view';
import type { Settings } from './settings';

import {DEFAULT_SETTINGS, DiagramsNetSettingsTab, SettingStorage} from './settings'
import DiagramsFileView from "./diagrams-file-view";

export default class DiagramsNet extends Plugin {

	vault: Vault;
	workspace: Workspace;
	diagramsView: DiagramsView;
	settings: Settings;

	async onload() {

		this.vault = this.app.vault;
		this.workspace = this.app.workspace;
		await this.loadSettings();

		addIcon("diagram", ICON);

		this.registerView(
			DIAGRAM_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => (
				this.diagramsView = new DiagramsView(
					leaf, null, {
					path: this.activeLeafPath(this.workspace),
					basename: this.activeLeafName(this.workspace),
					svgPath: '',
					xmlPath: '',
					diagramExists: false,
				})
			)
		);

		this.addCommand({
			id: 'app:diagrams-net-new-diagram',
			name: 'New diagram',
			checkCallback: (checking: boolean) => {
				const leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						this.attemptNewDiagram()
					}
					return true;
				}
				return false;
			},
			hotkeys: []
		});

		this.registerEvent(this.app.workspace.on("file-menu", this.handleFileMenu, this));
		this.registerEvent(this.app.workspace.on("editor-menu", this.handleEditorMenu, this));
		// @ts-ignore
		this.registerEvent(this.app.vault.on('config-change', this.loadSettings, this));
		this.registerEvent(this.app.vault.on('rename', (file, oldname) => this.handleRenameFile(file, oldname)));
		this.registerEvent(this.app.vault.on('delete', (file) => this.handleDeleteFile(file)));

		this.addSettingTab(new DiagramsNetSettingsTab(this.app, this));
		this.registerView(DIAGRAM_EDIT_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
			return this.diagramsView = new DiagramsFileView(
				leaf, null,{
					path: this.activeLeafPath(this.workspace),
					basename: this.activeLeafName(this.workspace),
					svgPath: "",
					xmlPath: "",
					diagramExists: false,
				})
		});
		this.registerExtensions(["drawio"], DIAGRAM_EDIT_VIEW_TYPE);
	}

	isFileValidDiagram(file: TAbstractFile) {
		let itIs = false
		if (file instanceof TFile && file.extension === 'svg') {
			const xmlFile = this.app.vault.getAbstractFileByPath(this.getXmlPath(file.path));
			if (xmlFile && xmlFile instanceof TFile && xmlFile.extension === 'xml') {
				itIs = true
			}
		}
		return itIs
	}

	getXmlPath(path: string) {
		return (path + '.xml')
	}

	activeLeafPath(workspace: Workspace) {
		return workspace.activeLeaf?.view.getState().file;
	}

	activeLeafName(workspace: Workspace) {
		return workspace.activeLeaf?.getDisplayText();
	}

	async availablePath() {
		// @ts-ignore: Type not documented.
		const base = await this.vault.getAvailablePathForAttachments('Diagram', 'svg')
		return {
			svgPath: base,
			xmlPath: this.getXmlPath(base)
		}
	}

	async attemptNewDiagram() {
		const { svgPath, xmlPath } = await this.availablePath()
		const fileInfo = {
			path: this.activeLeafPath(this.workspace),
			basename: this.activeLeafName(this.workspace),
			diagramExists: false,
			svgPath,
			xmlPath
		};
		this.initView(fileInfo);
	}

	attemptEditDiagram(svgFile: TFile) {
		if (!this.isFileValidDiagram(svgFile)) {
			new Notice('Diagram is not valid. (Missing .xml data)');
		}
		else {
			const fileInfo = {
				path: this.activeLeafPath(this.workspace),
				basename: this.activeLeafName(this.workspace),
				svgPath: svgFile.path,
				xmlPath: this.getXmlPath(svgFile.path),
				diagramExists: true,
			};
			this.initView(fileInfo);
		}

	}

	async initView(fileInfo: any) {
		if (this.app.workspace.getLeavesOfType(DIAGRAM_VIEW_TYPE).length > 0) {
			return
		}
		const hostView = this.workspace.getActiveViewOfType(MarkdownView);

		const leaf = this.app.workspace.splitActiveLeaf('horizontal')
		// TODO: Replace splitActiveLeaf with getLeaf, when official version => 0.15.
		// const leaf = this.app.workspace.getLeaf(true, 'horizontal')

		const diagramView = new DiagramsView(leaf, hostView, fileInfo)
		leaf.open(diagramView)
	}

	handleDeleteFile(file: TAbstractFile) {
		if (this.isFileValidDiagram(file)) {
			const xmlFile = this.app.vault.getAbstractFileByPath(this.getXmlPath(file.path));
			this.vault.delete(xmlFile)
		}
	}

	handleRenameFile(file: TAbstractFile, oldname: string) {
		if (file instanceof TFile && file.extension === 'svg') {
			const xmlFile = this.app.vault.getAbstractFileByPath(this.getXmlPath(oldname));
			if (xmlFile && xmlFile instanceof TFile && xmlFile.extension === 'xml') {
				this.vault.rename(xmlFile, this.getXmlPath(file.path))
			}
		}
	}

	handleFileMenu(menu: Menu, file: TAbstractFile, source: string) {
		if (file instanceof TFile && file.extension === 'svg') {
			menu.addItem((item) => {
				item
					.setTitle("Edit diagram")
					.setIcon("diagram")
					.onClick(async () => {
						this.attemptEditDiagram(file);
					});
			});
		}
		if (source === "file-explorer-context-menu") {
			menu.addItem((item) => {
				item.setTitle(`Git: Stage`)
					.setIcon("plus-circle")
					.setSection("action")
					.onClick(() => {})
			})
		}
	}

	handleEditorMenu(menu: Menu, editor: Editor, view: MarkdownView) {
		menu.addItem((item: MenuItem) => {
			item
				.setTitle("Insert new diagram")
				.setIcon("diagram")
				.onClick(async () => {
					this.attemptNewDiagram();
				});
		});
	}

	async loadSettings() {
		// @ts-ignore
		const settings = {...await this.loadData(), systemTheme: this.vault.getConfig('theme')};
		this.settings = Object.assign({}, DEFAULT_SETTINGS, settings);
		SettingStorage.populateSetting(settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onunload() {
	}

}
