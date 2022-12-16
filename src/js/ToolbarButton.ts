import ToolbarButtonOptions from "./ToolbarButtonOptions"

class ToolbarButton {

    input = 'button'
    element = null // Populated by editor
    group = 0

    type: string // block|list|style|buffer|custom
    tag: string // As inserted in the dom. e.g. H1, CUSTOM
    label: string //  Generally used as the title of the button but could also be displayed
    icon: string //  icon The icon to use
    click: undefined | Function // The callback invoked when the button is clicked, undefined for buffer buttons
    options: undefined | ToolbarButtonOptions // Optional methods

    constructor(type: string, tag: string, label: string, icon: string, click: undefined | Function, options: undefined | ToolbarButtonOptions) {
        this.type = type
        this.tag = tag
        this.label = label
        this.icon = icon
        // Optional parameters
        if (click) this.click = click
        if (options) this.options = { ...options }
    }
}

export default ToolbarButton