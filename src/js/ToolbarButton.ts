import Editor from "./Editor"


export default class ToolbarButton {

    editor: Editor
    type = '' // block|list|style|buffer|custom
    tag = '' // As inserted in the dom. e.g. H1, CUSTOM
    label = ''  // Generally used as the title of the button but could also be displayed
    icon = '' //  icon The icon to use

    element: null | HTMLElement = null
    input = 'button'
    group = 0
    action = ''
    newFormat = ''

    constructor(editor: Editor, type: string, tag: string, label: string, icon: string) {
        this.editor = editor
        this.type = type
        this.tag = tag
        this.label = label
        this.icon = icon
    }

}