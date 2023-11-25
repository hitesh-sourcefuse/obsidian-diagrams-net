import type DiagramsNet from "./main";
import {App, PluginSettingTab, Setting} from "obsidian";

export type Settings = {
	// If true, the newly created diagram will have filename in format of
	// ${activeFileName}-${timestamp}.
	nameWithFileNameAndTimestamp: boolean;
	domain: string;
	folder: string;
	systemTheme: 'obsidian' | 'moonstone';
	colorSchema: '0' | '1' | 'auto'; // 0 light, 1 dark
	diagramTheme: string;
};

export const DEFAULT_SETTINGS: Settings = {
	nameWithFileNameAndTimestamp: false,
	domain: 'https://embed.diagrams.net/',
	folder: 'Diagrams',
	systemTheme: 'moonstone',
	colorSchema: 'auto',
	diagramTheme: 'kennedy',
};

export class SettingStorage {
	private static settings: Settings = {...DEFAULT_SETTINGS};

	static setSetting<K extends keyof Settings, V extends Settings[K]>(
		name: K,
		value: V
	): void {
		SettingStorage.settings[name] = value;
	}

	static getSetting<K extends keyof Settings>(name: K): Settings[K] {
		return SettingStorage.settings[name];
	}

	static populateSetting(partialSettings: Partial<Settings>): void {
		SettingStorage.settings = {...SettingStorage.settings, ...partialSettings};
	}
}

export class DiagramsNetSettingsTab extends PluginSettingTab {
	plugin: DiagramsNet;

	constructor(app: App, plugin: DiagramsNet) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Set the domain form which Draw.io will shown')
			.setDesc(
				'If value provide then it will use that embed domain as default'
			)
			.addText((toggle) =>
				toggle
					.setPlaceholder(SettingStorage.getSetting('domain'))
					.setValue(SettingStorage.getSetting('domain'))
					.onChange(async (value) => {
						// todo add validation
						SettingStorage.setSetting('domain', value);
						this.plugin.settings.domain = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Diagram folder",)
			.setDesc("Default location for new drawings. If empty, drawings will be created in the Vault root.")
			.addText((text) =>
				text
					.setPlaceholder(SettingStorage.getSetting('folder'))
					.setValue(SettingStorage.getSetting('folder'))
					.onChange(async (value) => {
						SettingStorage.setSetting('folder', value);
						this.plugin.settings.folder = value;
						text.setValue(this.plugin.settings.folder);
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Name with file name and timestamp')
			.setDesc(
				'If true, newly created embedded diagrams will have name in ' +
				'format of ${activeFileName}-${timestamp}.'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(SettingStorage.getSetting('nameWithFileNameAndTimestamp'))
					.onChange(async (value) => {
						SettingStorage.setSetting('nameWithFileNameAndTimestamp', value)
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Diagram theme")
			.setDesc("theme which need to use")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						"kennedy": "Kennedy",
						"min": "Min",
						"atlas": "Atlas",
						"dark": "Dark",
						"sketch": "Sketch",
						"simple": "Simple",
					})
					.setValue(SettingStorage.getSetting('diagramTheme'))
					.onChange(async (value) => {
						this.plugin.settings.diagramTheme = value;
						SettingStorage.setSetting('diagramTheme', this.plugin.settings.diagramTheme)
						await this.plugin.saveSettings();
					}),
			);
		// todo check if setting is set to the 'Sketch, Minimal and Simple editor' then it should be visible
		new Setting(containerEl)
			.setName('Dark theme')
			.setDesc('Theme color schema')
			.addDropdown((dropdown) =>
				dropdown
					.setValue(SettingStorage.getSetting('colorSchema'))
					.addOptions({
						"0": "Dark",
						"1": "Light",
						"auto": "Auto",
					})
					.onChange(async (value) => {
						this.plugin.settings.colorSchema = (value as Settings['colorSchema']);
						SettingStorage.setSetting('colorSchema', this.plugin.settings.colorSchema);
						await this.plugin.saveSettings();
					})
			);

	}
}
