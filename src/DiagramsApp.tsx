import * as React from "react";
import useDiagramsNet from './useDiagramsNet';


export const DiagramsApp = (props: any) => {
    const {
        xmlData,
        handleExit,
        handleSaveAndExit,
    } = props


    const { startEditing } = useDiagramsNet(
        handleSaveAndExit,
        handleExit,
        () => "",
        () => xmlData)

    React.useEffect(() => {
        startEditing()
    }, [xmlData])

    return <div id="drawIoDiagramFrame" />
};
