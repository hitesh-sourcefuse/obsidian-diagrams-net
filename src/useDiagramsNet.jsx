import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom'
import {SettingStorage} from "./settings";

const bgColor = "white"
/**
 * - Based on: https://github.com/jgraph/drawio-integration
 * - https://desk.draw.io/support/solutions/articles/16000042544
 *
 * - DiagramEditor.js is outright clone, with modifications after initial commit:
 * - The save function needs modification.
 */
export const blankDiagram =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSI5MXB4IiBoZWlnaHQ9IjYxcHgiIHZpZXdCb3g9Ii0wLjUgLTAuNSA5MSA2MSIgY29udGVudD0iJmx0O214ZmlsZSBldGFnPSZxdW90O255VDJrWi1zUFJUTzlwV2c0LU9XJnF1b3Q7IGFnZW50PSZxdW90OzUuMCAoTWFjaW50b3NoKSZxdW90OyBtb2RpZmllZD0mcXVvdDsyMDIwLTA2LTAzVDE1OjEwOjA1LjM0OFomcXVvdDsgaG9zdD0mcXVvdDt3d3cuZHJhdy5pbyZxdW90OyB2ZXJzaW9uPSZxdW90OzEzLjEuMTQmcXVvdDsmZ3Q7Jmx0O2RpYWdyYW0gaWQ9JnF1b3Q7clV1eHZtYW1kTloxenJMWE9sXzYmcXVvdDsgbmFtZT0mcXVvdDtQYWdlLTEmcXVvdDsmZ3Q7bFpOTGM0SXdFTWMvRFVkbUFyR1ZIcTFhKzVqV1RwMk9NOTRpV1VNNmdUQWhLdlRURjJURFk3ellFN3UvN0NQNzMrRFJlVnF1RE11VGQ4MUJlU0hocFVjWFhoZ0dFYVgxcHlGVlM2YlJ0QVhDU0k1QlBkaklYMEJJa0I0bGgySVVhTFZXVnVaakdPc3NnOWlPR0ROR244ZGhCNjNHWFhNbTRBcHNZcWF1NlZaeW03UTB1aU05ZndZcEV0YzVJSGlTTWhlTW9FZ1kxK2NCb2t1UHpvM1d0clhTY2c2cUVjL3A4aEY4TGlZaC9mS3pIWWxGT0Z2dWhQVGJZay8vU2VsR01KRFpXMHQvRjJEVys1OUcwcEFvdHEvWGVzbGNTQ1lNUzl1U3JtMTIzRS9zeXlrbzEyL2JWM3JRZWx2Ti9IN0c3cHFGclp5dVJoOHpEazArOGVpalVLd28wTzUwYXB3YnI0NGpuc0JZS0FlTHcvWXIwQ2xZVTlVaGVFcmRWdkJaUnVpZSt4MC9JRW9HNjcxSHh2QlZpYTV3cjF4dDRNRE9IV2pwVUwvMlMvamc1NkhMUHc9PSZsdDsvZGlhZ3JhbSZndDsmbHQ7L214ZmlsZSZndDsiPjxkZWZzLz48Zz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iOTAiIGhlaWdodD0iNjAiIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0iIzAwMDAwMCIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxnIGZpbGw9IiMwMDAwMDAiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTJweCI+PHRleHQgeD0iNDQuNSIgeT0iMzQuNSI+RGlhZ3JhbTwvdGV4dD48L2c+PC9nPjwvc3ZnPg==";

function IFrame(props) {
    const {url, frameId, frameRef} = props
    return <iframe
        src={url}
        id={frameId}
        title={frameId}
        ref={frameRef}
        // onLoad={function(){ console.log(frameRef.current); debugger }}
        // sandbox="allow-scripts allow-same-origin"
        style={{
            position: 'fixed',
            width: '100%',
            height: '100%',
            left: '0',
            top: '0',
            border: 'none',
            zIndex: 10,
            backgroundColor: bgColor,
        }}
    />
}

const buildURL = () => {
    const domain = SettingStorage.getSetting('domain')
    const ui = '&ui=' + SettingStorage.getSetting('diagramTheme')
    const libraries = '&libraries=1' +
        '&browser=0' +
        '&picker=0' +
        '&plugins=1' +
        '&p=sql'
    const dark = '&dark=' + SettingStorage.getSetting('colorSchema');

    return domain + '?embed=1&proto=json&spin=1' + ui + libraries + dark
}

export const DiagramsNetFrame = (props) => {
    const {xmlFileData, onSaveCallback, onStopEditing} = props;
    const frameRef = useRef(null);
    const url = useMemo(buildURL, [xmlFileData]);
    const frameId = useMemo(() => `id-${Math.random()}`, [xmlFileData]);
    const messageEventHandler = useCallback((eventData) => {
        console.log("window events json", eventData)
        switch (eventData.event) {
            case "init": {
                return frameRef.current.contentWindow.postMessage(JSON.stringify({
                    action: 'load',
                    noSaveBtn: 0,
                    autosave: 1,
                    saveAndExit: 0,
                    noExitBtn: 0,
                    modified: 'unsavedChanges',
                    xml: xmlFileData,
                    title: "Untitled",
                }), '*');
            }
            case "autosave":
            case "save":
                return onSaveCallback(eventData.xml);
            case "export":
                return onSaveCallback(eventData.xml, {format: eventData.format, data: eventData.data});
            case "exit":
                return onStopEditing();

        }
    }, [xmlFileData, frameRef]);

    useEffect(() => {
        const windowEventHandler = (evt) => {
            if (frameRef.current !== null && evt.source === frameRef.current.contentWindow && evt.data.length > 0) {
                try {
                    messageEventHandler(JSON.parse(evt.data))
                } catch (e) {
                    console.error("Error during getting data from IFrame", evt, e);
                }
            }
        };
        window.addEventListener('message', windowEventHandler)
        return () => {
            window.removeEventListener("message", windowEventHandler)
        }
    }, [frameRef]);

    return <IFrame
        url={url}
        frameId={frameId}
        frameRef={frameRef}
    />
}