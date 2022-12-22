import * as Icons from './icons.ts'
import * as Helpers from './helpers.js'

const BUTTON_ORDER = ['cancel', 'delete', 'confirm']

class Modal {

    // Static variable to save the modal instance
    static self

    type = 'overlay'
    panel: null | HTMLElement = null       // The HTMLElement representing the modal panel
    container: null | HTMLElement = null   // The HTMLElement representing the innerHTML of the modal
    title = ''
    html = ''
    severity = ''
    buttons = false
    escape = false


    constructor(options: null | object = null) {

        // Override defaults with any options supplied
        if (options) {
            for (let option in options) {
                Object.assign(this, option)
            }
        }

        // Require this so can handle the modal instance from a named event handler
        Modal.self = this
    }


    selectAll(query: string): NodeList {
        if (!this.panel) {
            console.error('Modal element is missing')
            return new NodeList()
        }
        return this.panel.querySelectorAll(query)
    }

    selectOne(query: string): null | Node {
        if (!this.panel) {
            console.error('Modal element is missing')
            return null
        }
        return this.panel.querySelector(query)
    }

    getInputValue(query: string): string {
        if (!this.panel) {
            console.error('Modal element is missing')
            return ''
        }
        const input = this.panel.querySelector(query)
        if (input) {
            return (<HTMLInputElement>input).value.trim()
        }
        return ''
    }


    /**
     * Set the position for the input dialogue based on current range
     * @param {Range} range - The current editor selection
     * @param {HTMLElement} editorNode - The editor node
     */
    setPosition(range, editorNode) {
        this.container = this.panel.querySelector('.modal-panel-container')
        let pos
        // If this is not a text node then get the first text node
        // Can happen at the start of a line when backspace to the start
        if (range.startContainer.nodeType !== 3) {
            if (range.startContainer.childNodes.length > 0) {
                let node = range.startContainer.childNodes[0]
                pos = node.getBoundingClientRect()
            } else {
                pos = { x: editorNode.offsetLeft, y: editorNode.offsetTop }
            }
            // Text node
        } else {
            pos = range.getBoundingClientRect()
            //console.log('text node const ',pos)
        }
        // Ensure does not go off-screen
        if ((pos.x + this.container.offsetWidth) > window.innerWidth) {
            pos.x = window.innerWidth - this.container.offsetWidth - 20;
        }
        if ((pos.y + this.container.offsetHeight) > window.innerHeight) {
            pos.y = window.innerHeight - this.container.offsetHeight - 40;
        }
        this.container.style.top = `${pos.y}px`
        this.container.style.left = `${pos.x}px`
    }

    /**
     * Generate the innerHTML for the modal panel
     * @returns {string}
     */
    template() {
        let styles = []
        if (this.backgroundColour != undefined) {
            styles.push(`background-color:${this.backgroundColour}`)
        }
        if (this.borderRadius != undefined) {
            styles.push(`border-radius:${this.borderRadius}`)
        }
        const style = styles.length == 0 ? '' : `style="${styles.join(';')}"`
        let html = `<div class="modal-panel-container" ${style}>`
        let icon = ''
        switch (this.severity) {
            case 'info':
                icon = Icons.info
                break
            case 'warning':
                icon = Icons.warning
                break
            case 'danger':
                icon = Icons.danger
                break
        }
        // Title
        if (this.title || icon) {
            const withText = this.title ? 'with-text' : ''
            html += `
                <header class="modal-panel-header">
                    <h3 class="modal-panel-title ${withText}">${icon}${this.title}</h3>
                </header>`
        }

        html += `<div class="modal-panel-body">${this.html}</div>`

        // Buttons - need inserting in body at the end of any form 
        // or just appending in their own form if no form exists yet
        if (this.buttons) {
            let buttonHTML = ''
            let buttonCount = 0
            BUTTON_ORDER.forEach(type => {
                if (this.buttons[type]) {
                    buttonCount++
                    const bType = type == 'confirm' ? 'submit' : 'button'
                    buttonHTML += `<button type="${bType}" class="${type}">${this.buttons[type].label}</button>`
                }
            })
            const centred = buttonCount == 1 ? 'centred' : ''
            const buttonsHTML = `<div class="modal-panel-buttons ${centred}">${buttonHTML}</div>`
            if (html.includes('</form')) {
                html = html.replace('</form>', buttonsHTML + '</form>')
            } else {
                html += `<form>${buttonsHTML}</form>`
            }
        }
        // Close modal-panel-container div
        html += `</div>`
        return html
    }

    /**
     * Hide current panel by removing transition class "show" and then removing from
     * the dom.
     */
    hide() {
        // Check whether the panel still exists and warn the developer if not
        // since this means they are calling this method too mane times
        // The console message is removed in the bundled javascript so the 
        // this call will fail gracefully.
        if (this.panel == null) {
            console.warn('Attempt to hide panel that is already hidden')
            return
        }
        this.panel.classList.remove('show')
        // Remove the event listener so don't keep responding to Escape key
        document.body.removeEventListener('keydown', this.handleKeydown)
        setTimeout(() => {
            if (this.panel != null) {
                this.panel.remove()
                this.panel = null
            }
        }, 500)
    }

    /**
     * Return true if a modal panel is already displayed
     * @returns {boolean}
     */
    active() {
        if (document.querySelector(`.modal-panel`)) {
            return true
        }
        return false
    }

    /**
     * Run the escape callback if supplied, otherwise just hide immediately
     */
    escapeOrHide() {
        // Invoke cancel callback if available
        if (this.escape instanceof Function) {
            this.escape()
        } else {
            this.hide()
        }
    }

    /**
     * Handle keydown events on the document body
     * @param {Event} event 
     */
    handleKeydown(event) {
        if (event.key == 'Escape') {
            event.stopPropagation()
            Modal.self.escapeOrHide()
        }
    }

    /**
     * Add event listeners to the optional buttons/form with classes: 'cancel|delete|confirm'
     * Also optionally check for Escape key to close the modal
     */
    addEventListeners() {
        // Button callbacks
        if (this.buttons) {
            BUTTON_ORDER.forEach(type => {
                //console.warn({type})
                if (this.buttons[type]) {
                    // For confirm submit the form to support html5 validation of 'required' attribute
                    const button = this.buttons[type]
                    const element = this.panel.querySelector(`button.${type}`)
                    if (element) {
                        let method = 'click'
                        let object = element
                        if (type == 'confirm') {
                            method = 'submit'
                            object = this.panel.querySelector(`form`)
                        }
                        object.addEventListener(method, event => {
                            event.preventDefault()
                            event.stopPropagation()
                            if (button.callback) {
                                button.callback()
                            } else {
                                this.hide()
                            }
                        })
                    }
                }
            })
        }
        // Support escape key and background clicks?
        if (this.escape) {
            // Watch for escape key being pressed
            // Cannot use an arrow function as otherwise multiple event listeners
            // would be added. Using a named listener like this just replaces
            // the existing event handler
            document.body.addEventListener('keydown', this.handleKeydown)
            // Listen for background clicks
            this.panel.addEventListener('click', event => {
                if (event.target == this.panel) {
                    event.stopPropagation()
                    this.escapeOrHide()
                }
            })
        }
    }

    show() {
        // Create the modal
        this.panel = document.createElement('DIV')
        this.panel.id = Helpers.generateUid()
        this.panel.classList.add('modal-panel')
        this.panel.classList.add(`modal-panel-${this.type}`)
        // Flag whether can select the modal panel to close the modal
        // (as well as use the escape key)
        this.panel.classList.add(this.escape ? 'escape' : 'no-escape')
        this.panel.innerHTML = this.template()
        // Add modal to the document
        document.querySelector('body').appendChild(this.panel)
        // Add event listeners
        this.addEventListeners()
        // Add the show class
        setTimeout(() => {
            this.panel.classList.add('show')
            this.panel.scrollIntoView()
        }, 10)
    }

}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export default Modal
