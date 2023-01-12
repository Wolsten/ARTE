/**
 * Generic class from which to manage a custom block / toolbar button
 * 
 * File format (optional due date):
 * 
 * <ARTE-CUSTOM
 *      id="id" 
 *      data-a="" 
 *      data-b="" 
 *      data-c="">
 * </ARTE-CUSTOM>
 * 
 * 
 * Editor format (some may be optional):
 * 
 * <ARTE-CUSTOM
 *      id="id" 
 *      data-a="" 
 *      data-b="" 
 *      data-c=""
 *      contenteditable="false" >
 * 
 *    <button type="button" title="Click to edit">
 *      Edit
 *    </button>
 * 
 * </ARTE-CUSTOM>
 * 
 * 
 * Optional sidebar format:
 * 
 * <article class="arte-custom">
 *      <a href="#id">todo</a>
 *      <p>Custom Data</p>
 * </article>`
 */


import * as Helpers from '../helpers'
import ToolbarButton, { ToolbarButtonType } from '../ToolbarButton'
import { Modal } from '../Modal'
import SidebarButton from '../SidebarButton'
import Editor from '../Editor'
import EditRange from '../EditRange'


interface CustomBlock extends ToolbarButton {

    show(): void
    form(): string
    save(): void
    clean(element: Element): Element
    template(): string

    // Optional
    sidebar?(): SidebarButton
}



class CustomBlock extends ToolbarButton {

    protected drawer: null | Modal = null         // The modal container for the edit dialogue
    protected node: null | HTMLElement = null         // The actively edited node
    protected editFlag = false


    constructor(editor: Editor, tag: string, label: string, icon: string, group: number) {
        super(editor, ToolbarButtonType.CUSTOM, tag, label, icon, group)
    }


    /**
     * On first load of editor, convert the minimal custom HTML into the full
     * editable version
     */
    init(): void {
        const customs = this.editor.editorNode?.querySelectorAll(this.tag)
        if (customs) {
            customs.forEach((custom: Element) => {
                this.node = custom
                this.format()
            })
        }
    }


    /**
     * Mandatory button click function
     */
    click() {
        // Ignore if a modal is active
        if (Modal.active()) {
            return
        }
        const custom = this.editor?.range?.blockParent?.querySelector(this.tag)
        if (custom) {
            this.edit(custom)
        } else {
            this.editFlag = false
            this.show()
        }
    }


    /**
     * Set the disabled and active states of a button
     */
    setState() {
        this.setCustomBlockState()
    }


    /**
     * Add event handlers to all custom node edit buttons in a custom block
     */
    addEventHandlers(): void {
        const buttons = this.editor.editorNode?.querySelectorAll(this.tag + ' button')
        if (buttons) {
            buttons.forEach(button => button.addEventListener('click', event => {
                event.preventDefault()
                event.stopPropagation()
                if (!button.parentNode) {
                    console.error(`Could not find ${this.label} node`)
                } else {
                    this.edit(<Element>button.parentNode)
                }
            }))
        }
    }


    /**
     * Template for method to reformat/clean the custom element as it should be saved in a file or database
     * returns HTMLElement as cleaned. Usually this will mean simply removing the inner HTML
     * and relying on the data attribute values
     */
    clean(element: Element): Element {
        element.removeAttribute('contenteditable')
        element.innerHTML = ''
        return element
    }



    // -----------------------------------------------------------------------------
    // @section Protected methods
    // -----------------------------------------------------------------------------


    protected tidyUp() {
        this.drawer?.hide()
        this.format()
        if (this.node) {
            EditRange.setCursorInNode(this.node, 0)
        }
        this.editor.updateBuffer()
    }


    /**
     * Mandatory format method which may be overridden
     */
    protected format(): void {
        if (!this.node) {
            console.error(`Cannot find the ${this.label} to format`)
            return
        }
        const element = this.node
        // Generate new id if required
        if (!element.id) {
            element.id = Helpers.generateUid()
        }
        element.setAttribute('contenteditable', 'false')
        element.innerHTML = this.template()
        // Add event listener to edit button if it exists
        element.querySelector('button')?.addEventListener('click', event => {
            event.preventDefault()
            event.stopPropagation()
            this.edit(element)
        })
        // Add set state listener
        element.addEventListener('click', () => {
            this.setState()
        })
    }


    protected setCustomBlockState(): void {
        if (!this.element) {
            console.error('Trying to set button state when button element not set')
            return
        }
        //console.warn('custom setState edt.range',edt.range)
        this.disabled = false
        if (!this.editor.range ||
            this.editor.range.rootNode == this.editor.editorNode ||
            Helpers.isBlock(this.editor.range.rootNode) == false) {
            this.disabled = true
        }

        if (this.disabled) {
            this.element.setAttribute('disabled', 'disabled')
            this.element.classList.remove('active')
        } else {
            this.element.removeAttribute('disabled')
            this.element.classList.add('active')

            // // If we have a range containing a custom element then make the button active
            // const custom = this.editor.range?.blockParent?.querySelector(this.tag)
            // if (custom) {
            //     this.element.classList.add('active')
            // } else {
            //     this.element.classList.remove('active')
            // }
        }
    }

    // protected handleCancel(): void {
    //     if (this.drawer?.dirty) {
    //         this.confirm = Helpers.modalRequestCancel(this.handleConfirmCancel)
    //     } else {
    //         this.drawer?.hide()
    //     }
    // }

    protected handleDelete(): void {
        this.node?.remove()
        if (this.editor.range) this.editor.range = null
        this.setState()
        this.editor.updateBuffer()
    }

    /**
     * Get the attribute specified for the current node OR the specified element if provided
     */
    protected getAttribute(attribute: string, element?: null | Element): string {
        if (element !== undefined) {
            if (!element) {
                console.error(`Cannot get attribute for missing element`)
                return ''
            }
        } else if (!this.node) {
            console.error(`Cannot get attribute for missing custom node ${this.label}`)
            return ''
        } else {
            element = this.node
        }
        // Prefix custom attributes with 'data-' 
        if (attribute != 'contenteditable') attribute = 'data-' + attribute
        const value = element.getAttribute(attribute)
        if (value) return value.trim()
        return ''
    }


    /**
     * Set the attribute specified for the current node OR the specified element if provided
     */
    protected setAttribute(attribute: string, value: string, element?: null | Element): boolean {
        if (element !== undefined) {
            if (!element) {
                console.error(`Cannot set attribute for missing element`)
                return false
            }
        } else if (!this.node) {
            console.error(`Cannot set attribute for missing custom node ${this.label}`)
            return false
        } else {
            element = this.node
        }
        // Prefix custom attributes with 'data-' 
        if (attribute != 'contenteditable') attribute = 'data-' + attribute
        element.setAttribute(attribute, value.trim())
        return true
    }


    protected setAttributes(attributes: string[], modal: Modal) {
        attributes.forEach((attribute: string) => {
            this.setAttribute(attribute, modal.getInputValue('#' + attribute))
        })
    }


    /**
     * Insert a new custom element in the editor at the end of the current 
     * range's startContainer
     */
    protected append(): void {
        this.editFlag = false
        if (this.editor?.range?.startContainer?.parentNode) {
            this.node = <HTMLElement>this.editor.range.startContainer.parentNode.appendChild(<Node>this.node)
        }
    }


    /**
     * Replace selection with a new custom element
     */
    protected replace(): void {
        this.editFlag = false
        this.editor.range?.replaceSelectionWithNode(<HTMLElement>this.node)
    }


    // -----------------------------------------------------------------------------
    // @section Private methods
    // -----------------------------------------------------------------------------

    /**
     * Edit an existing comment node by extracting the data from the node and displaying
     * the edit form. Sets the comment node to be edited
     */
    private edit(element: HTMLElement): void {
        // If we already have an active panel - ignore edit clicks
        if (Modal.active()) {
            return
        }
        this.node = element
        this.editFlag = true
        this.show()
    }

    // private handleConfirmCancel(): void {
    //     this.confirm?.hide()
    //     this.drawer?.hide()
    // }

    // private handleConfirmDelete(): void {
    //     this.confirm?.hide()
    //     this.drawer?.hide()
    //     this.deleteItem()
    // }

    // /**
    //  * Delete the custom element in the dom
    //  */
    // private deleteItem(): void {
    //     this.node?.remove()
    //     // Update state
    //     this.editor.range = null
    //     this.setState()
    //     this.editor.updateBuffer()
    // }


}


export default CustomBlock