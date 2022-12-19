import Editor from "./Editor"
import SidebarButton from "./SidebarButton"


interface ToolbarButton {

    // Mandatory properties
    editor: Editor
    type: string     // block|list|style|buffer|custom
    tag: string      // As inserted in the dom. e.g. H1, CUSTOM
    label: string    // Generally used as the title of the button but could also be displayed
    icon: string     //  The icon to use
    group: number     // The group index
    element: null | HTMLElement // The dom element which the button is attached to
    disabled: boolean

    // Optional properties
    shortcut?: []

    // Mandatory methods
    click(): void

    // Optional methods
    init?(): void
    sidebar?(): SidebarButton
    addEventHandlers?(): void
    clean?(element: HTMLElement): HTMLElement
    setState?(): void
}


class ToolbarButton {

    constructor(editor: Editor, type: string, tag: string, label: string, icon: string, group: number) {
        this.editor = editor
        this.type = type
        this.tag = tag
        this.label = label
        this.icon = icon
        this.group = group
        this.disabled = false
    }
}


export default ToolbarButton