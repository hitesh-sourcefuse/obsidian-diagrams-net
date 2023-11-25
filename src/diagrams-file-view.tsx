import DiagramsView from "./diagrams-view";
import {TFile} from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
// import {getCurrentWindow} from "@electron/remote";
// import {SettingStorage} from "./settings";

export default class DiagramsFileView extends DiagramsView {
	baseContainerId= 'drawIoDiagramFrame';
	async saveEvent(){

	}
	async onOpen() {
		// will do nothing
	}

	async onLoadFile(file: TFile) {
		// getCurrentWindow().webContents.session.webRequest.onHeadersReceived(
		// 	{urls: [`${SettingStorage.getSetting('domain')}*`]},
		// 	(details, callback) => {
		// 		callback({
		// 			responseHeaders: {
		// 				'Access-Control-Allow-Origin': ['*'],
		// 				...details.responseHeaders,
		// 			},
		// 		});
		// 	});
		this.xmlPath = file.path;
		this.svgPath = file.path;
		this.diagramExists = true;
		return this.loadLayout()
	}

	createBase(){
		const container = this.containerEl.children[1];
		ReactDOM.render(<div id={this.baseContainerId}/>, container, ()=>{});
	}
}

