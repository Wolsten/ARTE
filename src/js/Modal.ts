import * as Icons from './icons'
import * as Helpers from './helpers'
import EditRange from './EditRange'


export enum ModalType {
    Drawer = 'drawer',
    Overlay = 'overlay',
    Positioned = 'positioned',
    FullScreen = 'full-screen'
}


export enum ModalSeverity {
    Info,
    Warning,
    Danger
}

export enum ModalButtonAction {
    Cancel = 'cancel',
    Delete = 'delete',
    Confirm = 'confirm',
    Custom = 'custom'
}

export type ModalOptionsType = {
    type?: ModalType
    severity?: ModalSeverity
    escapeToCancel?: boolean
    backgroundColour?: string
    borderRadius?: string
    showOnNew?: boolean
    focusId?: string
    confirmIfDirty?: boolean
}


export class ModalButton {

    action: ModalButtonAction
    label: string
    callback?: Function
    deleteObject?: string      // If present and not blank then this is the category of thing to delete

    constructor(action: ModalButtonAction, label: string, callback?: Function, deleteObject?: string) {
        this.action = action
        this.label = label
        if (callback) this.callback = callback
        if (deleteObject) this.deleteObject = deleteObject
    }
}




export class Modal {

    static self: null | Modal     // The original modal instance
    static confirm: null | Modal  // A confirm action modal

    defaultButton: ModalButton = {
        action: ModalButtonAction.Cancel,
        label: 'Cancel'
    }

    // Mandatory props
    title: string
    html: string
    buttons: ModalButton[] = []

    // active = false

    // Options
    options: ModalOptionsType = {
        type: ModalType.Drawer,
        severity: ModalSeverity.Info,
        escapeToCancel: false,
        backgroundColour: '',
        borderRadius: '',
        showOnNew: true,
        focusId: '',
        confirmIfDirty: true,
    }

    // Private props
    private dirty = false                   // Track changes to any form in the html provided
    private modalElement!: HTMLElement      // The HTMLElement representing the modal panel



    constructor(title: string, html: string, buttons: ModalButton[], options?: ModalOptionsType) {
        this.title = title
        this.html = html
        this.buttons = buttons
        // Override defaults with any options supplied
        if (options) {
            this.options = { ...this.options, ...options }
        }
        // Save the instance as a static property
        if (!Modal.self) {
            Modal.self = this
        } else if (!Modal.confirm) {
            Modal.confirm = this
        }
        // Show immediately?
        if (this.options.showOnNew) {
            this.show()
            // Focus on a particular field
            if (this.options.focusId) {
                const input = this.getInputElement('#' + this.options.focusId)
                if (input) {
                    input.focus()
                    if (input.type == 'text') {
                        input.setSelectionRange(input.value.length, input.value.length)
                    }
                }
            }
        }

        // console.log('Modal.self', Modal.self)
        // console.log('Modal.confirm', Modal.confirm)
    }


    /**
     * Create the modal panel, show and scroll into view
     */
    show(): void {
        // Create the modal placeholder 
        this.modalElement = this.panel()
        // Add modal to the document
        document.body.appendChild(this.modalElement)
        // Add event listeners
        this.addEventListeners()
        // Flag that is active
        // this.active = true
        // Add the show class and scroll into view
        setTimeout(() => {
            this.modalElement.classList.add('show')
            this.modalElement.scrollIntoView()
        }, 10)
    }


    static active(): boolean {
        const modal = document.querySelector('.modal-panel')
        return modal ? true : false
    }


    icon(): string {
        switch (this.options.severity) {
            case ModalSeverity.Info:
                return Icons.info
            case ModalSeverity.Warning:
                return Icons.warning
            case ModalSeverity.Danger:
                return Icons.danger
        }
        return ''
    }


    styles(): string {
        const styles = []
        if (this.options.backgroundColour != '') {
            styles.push(`background-color:${this.options.backgroundColour}`)
        }
        if (this.options.borderRadius != '') {
            styles.push(`border-radius:${this.options.borderRadius}`)
        }
        return styles.length == 0 ? '' : `style="${styles.join(';')}"`
    }


    panel(): HTMLElement {
        const p = document.createElement('DIV')
        p.id = Helpers.generateUid()
        p.classList.add('modal-panel')
        p.classList.add(`modal-panel-${this.options.type}`)
        p.classList.add(this.options.escapeToCancel ? 'escape' : 'no-escape')
        p.innerHTML = this.template()
        return p
    }


    template(): string {
        const style = this.styles()
        const icon = this.icon()
        const withTextClass = this.title ? 'with-text' : ''
        const centredClass = this.buttons.length === 1 ? 'centred' : ''
        let titleHTML = ''
        if (this.title) titleHTML =
            `<header class="modal-panel-header">
             <h3 class="modal-panel-title ${withTextClass}">${icon}${this.title}</h3>
             </header>`
        let buttonsHTML = ''
        this.buttons.forEach((button: ModalButton) => {
            // For confirm "submit" the form to support html5 validation of 'required' attribute
            const type = button.action == ModalButtonAction.Confirm ? 'submit' : 'button'
            buttonsHTML += `<button type="${type}" class="${button.action}">${button.label}</button>`
        })
        if (buttonsHTML != '') buttonsHTML = `<div class="modal-panel-buttons ${centredClass}">${buttonsHTML}</div>`
        return `<form class="modal-panel-container ${style}>
                    ${titleHTML}
                    <div class="modal-panel-body">
                        ${this.html}
                    </div>
                    ${buttonsHTML}
                </form>`
    }

    getElement(query: string): null | HTMLElement {
        if (!this.modalElement) {
            console.error('Modal element is missing')
            return null
        }
        const element = this.modalElement.querySelector(query)
        if (element) return <HTMLElement>element
        return null
    }

    getElements(query: string): null | NodeListOf<Element> {
        if (!this.modalElement) {
            console.error('Modal element is missing')
            return null
        }
        const elements = this.modalElement.querySelectorAll(query)
        if (elements) return elements
        return null
    }


    getInputElement(query: string): null | HTMLInputElement {
        if (!this.modalElement) {
            console.error('Modal element is missing')
            return null
        }
        const element = this.modalElement.querySelector(query)
        if (element) return <HTMLInputElement>element
        return null
    }


    getInputValue(query: string): string {
        const input = this.getInputElement(query)
        if (!input) return ''
        return input.value.trim()
    }


    /**
     * Set the position for the input dialogue based on current range
     */
    setPosition(range: EditRange, editorNode: HTMLElement) {
        if (!range.base) {
            console.error('No range selected')
            return
        }
        const container = this.modalElement.querySelector('.modal-panel-container')
        if (!container) {
            console.error('Could not find modal panel container')
            return
        }
        let pos
        // If this is not a text node then get the first text node
        // Can happen at the start of a line when backspace to the start
        let node = <Node>range.startContainer
        if (node.nodeType !== Node.TEXT_NODE) {
            if (node.childNodes.length > 0) {
                node = node.childNodes[0]
                pos = (<Element>node).getBoundingClientRect()
            } else {
                pos = { x: editorNode.offsetLeft, y: editorNode.offsetTop }
            }
            // Text node
        } else {
            pos = range.base.getBoundingClientRect()
            //console.log('text node const ',pos)
        }
        // Ensure does not go off-screen
        const box = <HTMLElement>container
        if ((pos.x + box.offsetWidth) > window.innerWidth) {
            pos.x = window.innerWidth - box.offsetWidth - 20;
        }
        if ((pos.y + box.offsetHeight) > window.innerHeight) {
            pos.y = window.innerHeight - box.offsetHeight - 40;
        }
        box.style.top = `${pos.y}px`
        box.style.left = `${pos.x}px`
    }


    /**
     * Hide current panel by removing transition class "show" and then removing from
     * the dom but first check for any data changes
     */
    hide(): void {
        if (this.options.confirmIfDirty && this.dirty) {
            this.requestCancel()
            return
        }
        // Check whether the panel still exists and warn the developer if not
        // since this means they are calling this method too many times
        // The console message is removed in the bundled javascript so the 
        // this call will fail gracefully.
        if (!this.modalElement) {
            // console.warn('Attempt to hide panel that is already hidden')
            return
        }
        this.modalElement.classList.remove('show')
        // // Remove the event listener so don't keep responding to Escape key
        // console.log('Removing event listener for keydown')
        // document.body.removeEventListener('keydown', this.handleKeydown)
        setTimeout(() => {
            if (this.modalElement) {
                // console.log('Removing modal element')

                // this.active = false
                if (this === Modal.self) {
                    // console.log('Removing own element')
                    Modal.self.modalElement.remove()
                    Modal.self = null
                }
                if (this === Modal.confirm) {
                    // console.log('Removing confirm element')
                    Modal.confirm.modalElement.remove()
                    Modal.confirm = null
                }

                // Remove the event listener so don't keep responding to Escape key
                if (!Modal.active()) document.body.removeEventListener('keydown', this.handleKeydown)
            }
        }, 500)

    }

    requestCancel() {
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'No - keep editing', this.rejectCancel),
            new ModalButton(ModalButtonAction.Confirm, 'Yes - lose changes', this.confirmCancel)
        ]
        const options: ModalOptionsType = {
            type: ModalType.Overlay,
            severity: ModalSeverity.Warning
        }
        Modal.confirm = new Modal('Cancel changes?', 'Do you really want to lose your changes?', buttons, options)
    }

    confirmCancel() {
        Modal.confirm?.hide()
        Modal.self?.hide()
    }

    rejectCancel() {
        Modal.confirm?.hide()
    }


    /**
     * Handle keydown events on the document body
     * Cancel confirms first in preference to original modals
     */
    handleKeydown(event: KeyboardEvent): void {
        if (event.key == 'Escape') {
            event.stopPropagation()
            if (Modal.confirm) {
                Modal.confirm.hide()
            } else if (Modal.self) {
                Modal.self.hide()
            }
        }
    }

    /**
     * Add event listeners to the optional buttons/form with classes: 'cancel|delete|confirm'
     * Also optionally check for Escape key to close the modal
     */
    addEventListeners() {
        // Add event listeners to buttons
        if (this.buttons.length == 0) return
        const form = this.modalElement.querySelector(`form`)
        if (!form) {
            console.error(`Modal form is missing`)
            return
        }
        this.buttons.forEach((button: ModalButton) => {
            let element = this.modalElement.querySelector(`button.${button.action}`)
            if (!element) {
                console.error(`button.${button.action} is missing`)
                return
            }
            let method = 'click'
            if (button.action == ModalButtonAction.Confirm) {
                method = 'submit'
                element = form
            }
            element.addEventListener(method, (event: Event) => {
                event.preventDefault()
                event.stopPropagation()
                if (button.callback) {
                    if (button.action == ModalButtonAction.Delete) {
                        const thing = button.deleteObject || 'object'
                        Modal.confirm = new ModalDelete(thing, button.callback)
                    } else {
                        if (button.action == ModalButtonAction.Confirm) {
                            // If confirming a confirm then close BOTH modals
                            if (this == Modal.confirm) {
                                Modal.confirm.dirty = false
                                Modal.confirm.hide()
                            }
                            if (Modal.self) {
                                Modal.self.dirty = false
                                Modal.self.hide()
                            }
                        }
                        button.callback()
                    }
                } else {
                    this.hide()
                }
            })
        })
        // Support escape key and background clicks?
        if (this.options.escapeToCancel) {
            // Watch for escape key being pressed
            // Cannot use an arrow function as otherwise multiple event listeners
            // would be added. Using a named listener like this just replaces
            // the existing event handler
            document.body.addEventListener('keydown', this.handleKeydown)
            // Listen for background clicks
            this.modalElement.addEventListener('click', event => {
                if (event.target == this.modalElement) {
                    event.stopPropagation()
                    this.hide()
                }
            })
        }
        // Look for changes in the main form to set the dirty flag
        const inputs = form.querySelectorAll('input, textarea, select')
        if (inputs) {
            inputs.forEach((input: Element) => {
                input.addEventListener('change', () => this.dirty = true)
            })
        }
    }

}


export class ModalWarning extends Modal {

    constructor(title: string, html: string) {
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'Close'),
        ]
        const options = {
            type: ModalType.Overlay,
            escapeToCancel: true,
            severity: ModalSeverity.Warning
        }
        super(title, html, buttons, options)
    }
}


export class ModalDelete extends Modal {

    constructor(thing: string, callback: Function) {
        const buttons = [
            new ModalButton(ModalButtonAction.Cancel, 'No - keep editing'),
            new ModalButton(ModalButtonAction.Confirm, 'Yes - delete', callback),
        ]
        const options = {
            type: ModalType.Overlay,
            escapeToCancel: true,
            severity: ModalSeverity.Danger
        }
        super(`Delete ${thing}?`, `Are you sure you want to delete this ${thing}?`, buttons, options)
    }
}