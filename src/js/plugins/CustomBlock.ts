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
import ToolbarButton from '../ToolbarButton'
import { Modal } from '../Modal'
import SidebarButton from '../SidebarButton'
import Editor from '../Editor'


interface CustomBlock extends ToolbarButton {

    show(editFlag: boolean): void
    form(): string
    save(): void
    clean(element: Element): Element
    template(): string

    // Optional
    sidebar?(): SidebarButton
}



class CustomBlock extends ToolbarButton {

    protected drawer: null | Modal = null         // The modal container for the edit dialogue
    protected node: null | Element = null         // The actively edited node
    protected dirty: boolean = false              // Flag whether input data changed
    private confirm: null | Modal = null          // The modal container for the modal confirm dialogue


    constructor(editor: Editor, tag: string, label: string, icon: string, group: number) {
        super(editor, 'custom', tag, label, icon, group)
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
                this.format(this.template)
            })
        }
    }


    /**
     * Mandatory button click function
     */
    click() {
        // Ignore if a modal is active
        if (this?.drawer?.active) {
            return
        }
        const custom = this.editor?.range?.blockParent?.querySelector(this.tag)
        if (custom) {
            this.edit(custom)
        } else {
            this.show(false)
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


    /**
     * Example template for optional sidebar for displaying custom html in the sidebar
     */
    // sidebar(): SidebarButton {
    //     const customElements = this.editor.editorNode?.querySelectorAll(this.tag)
    //     let content = ''
    //     if (customElements) {
    //         customElements.forEach(customElement => {
    //             const customAttribute = this.getAttribute('data-custom-attribute',customElement)
    //             content += `
    //                 <article>
    //                     <a href="#${customElement.id}" title="Click to view custom element in context">
    //                         <!@-- example custom content-->
    //                         ${customAttribute}
    //                     </a>
    //                 </article>`
    //         })
    //     }
    //     return new SidebarButton(this.icon, 'comments', content)
    // }





    /**
     * Example template for mandatory show method
     */
    // show(editFlag: boolean) {
    //     // @todo
    //     // Define buttons, if need others extend the interface as required
    //     let buttons: EditButtons = {
    //         cancel: { label: 'Cancel', callback: this.handleCancel },
    //         confirm: { label: 'Save', callback: this.save },
    //     }
    //     let title = 'Add custom element'
    //     if (editFlag) {
    //         title = 'Edit custom element'
    //         buttons.delete = { label: 'Delete', callback: this.handleDelete }
    //     } else {
    //         this.node = document.createElement(this.tag)
    //         this.node.id = Helpers.generateUid()
    //         this.node.setAttribute('contenteditable', 'false')
    //         // @todo
    //         // initialise any custom attributes
    //         // e.g. this.node.setAttribute('data-custom', '')
    //     }
    //     // Create and display the modal panel
    //     this.drawer = new Modal({
    //         type: 'drawer',
    //         title,
    //         html: this.form(),
    //         buttons
    //     })
    //     this.drawer.show()
    //     // @todo
    //     // Optionally initialise confirmation module and dirty data detection
    //     this.dirty = false
    //     const customInput = this.drawer.selectOne('form textarea#custom')
    //     if (!this.drawer.panel || !customInput) {
    //         console.error('Could not find custom input data element')
    //         return
    //     }
    //     const input = <HTMLInputElement>customInput
    //     input.addEventListener('change', () => this.dirty = true)
    //     // @todo
    //     // Optional custom button handling
    //     const customButton = this.drawer.selectOne('form button#customButton')
    //     if (customButton != null) {
    //         customButton.addEventListener('click', this.handleCustomButton)
    //     }
    //     // @todo
    //     // Optionally set initial focus
    //     input.focus()
    //     input.setSelectionRange(input.value.length, input.value.length)
    // }


    /**
     * Example template for mandatory form method
     */
    // form(): string {
    //     if (!this.node) {
    //         console.error('Error: custom node is missing')
    //         return 'Error: custom node is missing'
    //     }
    //     // @todo get custom attributes, for example:
    //     const customAttribute = this.getAttribute('data-customAttribute')
    //     // @todo Process the custom attributes for display, for example
    //     const formattedCustomAttribute = '...' + customAttribute
    //     // @todo Create optional custom buttons
    //     const customButtonText = `<button type="button" id="custom-button">Custom</button>`
    //     return `
    //             <form class="comment">
    //                 <div class="form-input">
    //                     <textarea id="custom" class="form-control" placeholder="Enter your custom data" required>${formattedCustomAttribute}</textarea>
    //                 </div>
    //                 ${customButtonText}
    //             </form>`
    // }


    /**
     * Example template for a custom button handling method
     */
    // handleCustomButton(event: Event): void {
    //     if (!this.node || !event.target) {
    //         console.error('Trying to handle a missing custom button')
    //         return
    //     }
    //     // @todo modify attributes, content and/or button label
    // }


    /**
     * Example template for saving a new or edited custom element
     */
    // save(): void {
    //     // console.log('Save changes')
    //     if (!this.node || !this?.drawer?.panel) {
    //         console.error('Could not find custom element to save')
    //         return
    //     }
    //     if (this.drawer.panel) {
    //         // @todo get data from the form
    //         const data = this.drawer.panel.querySelector('form #data')
    //         if (!data) {
    //             console.error('Could not find custom data in the form')
    //             return
    //         }
    //         this.node.setAttribute('data-data', (<HTMLInputElement>data).value.trim())
    //         // @optional handle timestamps
    //         const timestamp = new Date()
    //         const localString = timestamp.toLocaleString().slice(0, -3)
    //         // console.log('local timestamp', localString)
    //         if (this.getAttribute('data-created') == '') {
    //             this.setAttribute('data-created', localString)
    //             this.insert()
    //         }
    //         this.node.setAttribute('data-updated', localString)
    //     }
    //     this.drawer.hide()
    //     // Format this.node and add event handler
    //     this.format(this.node, 'custom title')
    //     // Update state
    //     this.editor.range = Helpers.setCursor(this.node, 0)
    //     this.setState()
    //     this.editor?.buffer?.update()
    // }


    /**
     * Example template for a template defining how custom element content is displayed
     * Passed into the format method as a callback
     */
    // template(custom: Element): string {
    //     const attribute = this.getAttribute('data-attribute',custom)
    //     return `
    //         <button type="button" title="Edit this ${this.label}">
    //             <label class="attribute-class">Attribute</label>
    //             <span class="attribute-value">${attribute}</span>
    //         </button>`
    // }




    // -----------------------------------------------------------------------------
    // @section Protected methods
    // -----------------------------------------------------------------------------


    /**
     * Mandatory format method which may be overridden
     */
    protected format(template: Function): void {
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
        element.innerHTML = template(element)
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
            // If we have a range containing a custom element then make the button active
            const custom = this.editor.range?.blockParent?.querySelector(this.tag)
            if (custom != null) {
                this.element.classList.add('active')
            } else {
                this.element.classList.remove('active')
            }
        }
    }

    protected handleCancel(): void {
        if (this.dirty) {
            this.confirm = Helpers.modalRequestCancel(this.handleConfirmCancel)
        } else {
            this.drawer?.hide()
        }
    }

    protected handleDelete(): void {
        this.confirm = Helpers.modalRequestDelete(this.label, this.handleConfirmDelete)
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
    protected insert(): void {
        if (this.editor?.range?.startContainer.parentNode) {
            this.node = this.editor.range.startContainer.parentNode.appendChild(<Element>this.node)
        }
    }



    // -----------------------------------------------------------------------------
    // @section Private methods
    // -----------------------------------------------------------------------------

    /**
     * Edit an existing comment node by extracting the data from the node and displaying
     * the edit form. Sets the comment node to be edited
     */
    private edit(element: Element): void {
        // If we already have an active panel - ignore edit clicks
        if (this.drawer && this.drawer.active()) {
            return
        }
        this.node = element
        this.show(true)
    }

    private handleConfirmCancel(): void {
        this.confirm?.hide()
        this.drawer?.hide()
    }

    private handleConfirmDelete(): void {
        this.confirm?.hide()
        this.drawer?.hide()
        this.deleteItem()
    }

    /**
     * Delete the custom element in the dom
     */
    private deleteItem(): void {
        this.node?.remove()
        // Update state
        this.editor.range = null
        this.setState()
        this.editor.buffer?.update()
    }


}


export default CustomBlock