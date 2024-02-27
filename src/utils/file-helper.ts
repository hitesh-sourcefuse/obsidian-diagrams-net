export function getXmlPath(path: string) {
    return (path + '.xml')
}

export const getBase64Buffer = (data: string) => {
    return atob(data.replace('data:image/svg+xml;base64,', '')).toString()
}