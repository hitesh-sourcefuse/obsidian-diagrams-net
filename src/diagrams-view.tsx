import * as React from 'react';
import * as ReactDOM from "react-dom";
import {FileView, WorkspaceLeaf, Workspace, View, Vault, TFile} from 'obsidian';
import {DIAGRAM_VIEW_TYPE} from './constants';
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

  protected async loadLayout() {
    const close = () => this.leaf.detach();
    // const storeFileData = async (xml: string) => {
    //   if (this.diagramExists) {
    //     const xmlFile = this.vault.getAbstractFileByPath(this.xmlPath);
    //     if (!(xmlFile instanceof TFile)) return;
    //     return await this.vault.modify(xmlFile, xml);
    //   }
    //   return await this.vault.create(this.xmlPath, xml);
    // };
    // const storeSvgData = async (svgData: string) => {
    //   const svgBuffer = Buffer.from(
    //     svgData.replace("data:image/svg+xml;base64,", ""),
    //     "base64"
    //   );
    //   if (this.diagramExists) {
    //     const svgFile = this.vault.getAbstractFileByPath(this.svgPath);
    //     if (!(svgFile instanceof TFile)) return;
    //     return await this.vault.modifyBinary(svgFile, svgBuffer);
    //   }
    //
    //   return await this.vault.createBinary(this.svgPath, svgBuffer);
    // };
    // const saveData = async (msg: any) => {
    //   await storeFileData(msg.svgMsg.xml);
    //   await storeSvgData(msg.svgMsg.data);
    // };
    //
    // const refreshMarkdownViews = async () => {
    //   //! Haven't found a way to refresh the hostView.
    // };
    // const insertDiagram = () => {
    //   // @ts-ignore: Type not documented.
    //   const cursor = this.hostView.editor.getCursor();
    //   // @ts-ignore: Type not documented.
    //   this.hostView.editor.replaceRange(`![[${this.svgPath}]]`, cursor);
    // };

    // const handleSave = async (msg: any) => {
    //   await saveData(msg);
    //   if (this.diagramExists) {
    //     await  refreshMarkdownViews();
    //   } else {
    //     await insertDiagram();
    //   }
    //   // close();
    // };

    const handleSave = (xml: ArrayBuffer, exports?: {format:string, data: string}) => {
      if (exports?.format === "svg"){
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

    if (this.drawFile) {
      this.xmlData = await this.vault.cachedRead(this.drawFile)
    }

    ReactDOM.render(
      <DiagramsNetFrame
        xmlFileData={this.xmlData}
        onSaveCallback={handleSave}
        onStopEditing={close}
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
