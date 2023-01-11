import Editor from "./Editor"
import SidebarButton from "./SidebarButton"
import * as Helpers from './helpers'


export enum ToolbarButtonType {
    BLOCK,
    LIST,
    STYLE,
    CUSTOM,
    DETACHED,
}


interface ToolbarButton {

    // Mandatory properties
    editor: Editor
    type: ToolbarButtonType
    tag: string             // As inserted in the dom. e.g. H1, CUSTOM
    label: string           // Generally used as the title of the button but could also be displayed
    icon: string            //  The icon to use
    group: number           // The group index
    element: HTMLInputElement    // The dom element which the button is attached to
    disabled: boolean

    // Optional properties
    shortcut?: string[] | null

    // Mandatory methods
    click(): void

    // Optional methods that may need to be invoked from Editor
    init?(): void
    sidebar?(): SidebarButton | false
    addEventHandlers?(): void
    clean?(element: Element): Element
    setState?(): void
}


class ToolbarButton {

    disabled = false

    constructor(editor: Editor, type: ToolbarButtonType, tag: string, label: string, icon: string, group: number) {
        this.editor = editor
        this.type = type
        this.tag = tag
        this.label = label
        this.icon = icon
        this.group = group
    }

    // -----------------------------------------------------------------------------
    // @section Protected methods
    // -----------------------------------------------------------------------------


    /**
     * Whether to enable or disable an inline styling or colours button
     */
    protected enableOrDisable(): void {
        this.disabled = false
        if (this.editor.range) {
            if (this.editor.range.collapsed ||
                this.editor.range.rootNode == this.editor.editorNode ||
                Helpers.isList(this.editor.range.rootNode)) {
                this.disabled = true
            }
        }
        if (this.disabled) {
            this.element?.setAttribute('disabled', 'disabled')
        } else {
            this.element?.removeAttribute('disabled')
        }
    }

    protected isActive() {
        return this.element.classList.contains('active')
    }
}


export default ToolbarButton