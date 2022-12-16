import ToolbarButtonOptions from "./ToolbarButtonOptions"
import Editor from "./Editor"

class ToolbarButton {

    editor: null | Editor = null

    input = 'button'
    group = 0

    action = ''
    newFormat = ''

    type = '' // block|list|style|buffer|custom
    tag = '' // As inserted in the dom. e.g. H1, CUSTOM
    label = ''  // Generally used as the title of the button but could also be displayed
    icon = '' //  icon The icon to use

    //click: undefined | Function // The callback invoked when the button is clicked, undefined for buffer buttons
    options: undefined | ToolbarButtonOptions // Optional methods

    constructor(type: string, tag: string, label: string, icon: string, options: undefined | ToolbarButtonOptions) {
        this.type = type
        this.tag = tag
        this.label = label
        this.icon = icon
        // Optional parameters
        if (click) this.click = click
        if (options) this.options = { ...options }
    }

    // Methods are overridden or unused
    // click(editor: Editor) { }

    // setStyleProps() { }



}

export default ToolbarButton