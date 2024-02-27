import * as React from 'react';
import * as ReactDOM from "react-dom";
import {FileView, WorkspaceLeaf, Workspace, View, Vault, TFile} from 'obsidian';
import {DIAGRAM_VIEW_TYPE} from './constants';
import {getBase64Buffer} from "./utils/file-helper";
import {DiagramsNetFrame} from "./useDiagramsNet";


export type InitialFileInfo = {
    path: string,
    basename: string,
    svgPath: string,
    xmlPath: string,
    diagramExists: boolean
}

export default class DiagramsView extends FileView {
    filePath: string;
    fileName: string;
    svgPath: string;
    xmlPath: string;
    diagramExists: boolean;
    hostView: View;
    vault: Vault;
    workspace: Workspace;
    displayText: string;

    protected xmlData: null | string = null;
    protected drawFile: null | TFile = null;

    constructor(leaf: WorkspaceLeaf, hostView: View, initialFileInfo: InitialFileInfo) {
        super(leaf);
        this.vault = this.app.vault;
        this.workspace = this.app.workspace;
        this.hostView = hostView
    }

    getDisplayText(): string {
        return this.displayText ?? 'Diagram';
    }

    getViewType(): string {
        return DIAGRAM_VIEW_TYPE;
    }

    protected updateFileInfo(file: TFile) {
        this.filePath = file.path;
        this.fileName = file.basename;
        this.svgPath = file.path;
        this.xmlPath = file.path;
        this.diagramExists = !!file.path && !!file.basename;
        if (this.diagramExists) {
            this.drawFile = file;
        }
    }

    protected async saveEvent(msg: any) {
        const svgBuffer = getBase64Buffer(msg.svgMsg.data)
        if (this.diagramExists) {
            const svgFile = this.vault.getAbstractFileByPath(this.svgPath)
            const xmlFile = this.vault.getAbstractFileByPath(this.xmlPath)
            if (!(svgFile instanceof TFile && xmlFile instanceof TFile)) {
                return
            }
            await this.vault.modifyBinary(svgFile, svgBuffer)
            await this.vault.modify(xmlFile, msg.svgMsg.xml)
        } else {
            await this.vault.createBinary(this.svgPath, svgBuffer)
            await this.vault.create(this.xmlPath, msg.svgMsg.xml)
        }
    }

    protected async loadLayout() {
        const handleExit = () => {
            this.leaf.detach();
        }

        const handleSave = ({format, data, xml}: any) => {
            if (format === "svg"){
                // copy svg image on to the clipboard
                // const svgBuffer = getBase64Buffer(data)
            }

            if (this.diagramExists) {
                this.vault.modifyBinary(this.drawFile, xml)
            } else {
                // user needs to have a file first it will not be true
                // todo need to get the current path and create a random name file
                this.vault.createBinary(this.svgPath, xml)
            }
        }
        //
        // const insertDiagram = () => {
        //     // trying to inset created diagram svg/png into the other markdown
        //     // @ts-ignore: Type not documented.
        //     const cursor = this.hostView.editor.getCursor();
        //     // @ts-ignore: Type not documented.
        //     this.hostView.editor.replaceRange(`![[${this.svgPath}]]`, cursor);
        //
        // }

        if (this.drawFile) {
            this.xmlData = await this.vault.cachedRead(this.drawFile)
        }

        ReactDOM.render(
            <DiagramsNetFrame
                data={this.xmlData}
                onSaveCallback={handleSave}
                onStopEditing={handleExit}
            />,
            this.contentEl,
        );
    }


    onLoadFile(file: TFile): Promise<void> {
        this.updateFileInfo(file);
        return this.loadLayout();
    }

    async onOpen() {
        return super.onOpen()
    }

    async onClose() {
        ReactDOM.unmountComponentAtNode(this.contentEl);
    }
}
