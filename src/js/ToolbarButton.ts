import Editor from "./Editor"


export default class ToolbarButton {

    editor: Editor
    type = '' // block|list|style|buffer|custom
    tag = '' // As inserted in the dom. e.g. H1, CUSTOM
    label = ''  // Generally used as the title of the button but could also be displayed
    icon = '' //  icon The icon to use

    element: null | HTMLElement = null
    group = 0
    click: null | Function = null

    input = 'button'
    action = ''
    newFormat = ''


    // Optional methods
    init: null | Function = null
    sidebar: null | Function = null
    setState: null | Function = null
    shortcut: null | ['', ''] = null

    constructor(editor: Editor, type: string, tag: string, label: string, icon: string) {
        this.editor = editor
        this.type = type
        this.tag = tag
        this.label = label
        this.icon = icon
    }

}