import Editor from './Editor'
import ToolbarButton from './ToolbarButton'
import * as Helpers from './helpers'
import Block from './plugins/Block'
import Style from './plugins/Style'
import Buffer from './plugins/Buffer'
import BufferButton from './plugins/BufferButton'
import Shortcut from './Shortcut'
import { editorToolbar } from './templates'
import Actions from './plugins/actions-OLD'


export default class Toolbar {

    defaults: string[][] = [
        ['BLOCK.H1', 'BLOCK.H2', 'BLOCK.H3', 'BLOCK.P', 'BLOCK.BQ'],
        ['BLOCK.OL', 'BLOCK.UL'],
        ['STYLE.B', 'STYLE.I', 'STYLE.U', 'STYLE.FOREGROUND', 'STYLE.BACKGROUND', 'STYLE.CLEAR'],
        ['BUFFER.UNDO', 'BUFFER.REDO'],
        ['CUT', 'COPY', 'PASTE'],
        ['Mentions', 'Links', 'Images', 'CUSTOM.COMMENT', 'CUSTOM.ACTIONS'],
        ['Settings']
    ]
    buttons: ToolbarButton[] = []
    editor: Editor
    domNode: null | HTMLElement
    menuItems!: null | HTMLElement
    menuIcon!: null | HTMLElement

    constructor(editor: Editor, target: HTMLElement, userGroups: string[][]) {

        this.editor = editor
        this.domNode = target.querySelector('.editor-toolbar')
        if (!this.domNode) {
            console.error('Could not find toolbar dom node')
            return
        }

        if (userGroups.length === 0) {
            userGroups = this.defaults
        }

        userGroups.forEach((group, index) => {

            group.forEach(entry => {

                const parts = entry.split('.')
                const type = parts[0]
                const name = parts[1]

                let button: null | ToolbarButton = null

                switch (type.toUpperCase()) {
                    case 'BLOCK':
                        button = new Block(editor, name, index)
                        break
                    case 'STYLE':
                        button = new Style(editor, name, index)
                        break
                    case 'BUFFER':
                        if (editor.options.bufferSize > 0 && !editor.buffer) {
                            editor.buffer = new Buffer(editor)
                        }
                        button = new BufferButton(editor, name, index)
                        break
                    case 'CUSTOM':
                        if (name === 'ACTION') {
                            button = new Actions(editor, index)
                        }
                        break

                }

                if (button) {
                    this.buttons.push(button)
                    Helpers.registerTag(button.type, button.tag)
                }
            })
        })

        this.domNode.innerHTML = editorToolbar(this)
        this.menuIcon = this.domNode.querySelector('.menu-icon')
        this.menuItems = this.domNode.querySelector('section')

        if (!this.menuIcon || !this.menuItems) {
            console.error('Could not find toolbar ,menu icon or menu items')
            return
        }
    }


    /**
     * Initialise the toolbar buttons
     */
    initialise(): void {

        // Initialise buffer callback to false - reset if UNDO button found 
        // and a buffer length set
        // Do any custom setup required
        this.buttons.forEach(button => {

            // Add dom element to the button
            button.element = this.editor.toolbarNode!.querySelector(`#${button.tag}`)
            if (button.element === null) {
                console.error('Missing button element for button', button.tag)
                return
            }

            if (button.init) {
                button.init()
            }

            // Set initial button state
            if (button.setState) button.setState()

            // Some button have shortcuts in which case save for use in the keydown event handler
            if (button.shortcut) {
                this.editor.shortcuts.push(new Shortcut(button))
            }

            // Add click
            button.element.addEventListener('click', event => {
                if (!button.click) {
                    return
                }

                // Get latest range as debouncing means may not have the latest value when typing
                this.editor.updateRange()

                // Ignore if a modal is active
                if (this.editor.modal.active()) {
                    return
                }

                // Handle clicks for detached buttons (e.g. undo, redo) 
                // and when have a range
                if (button.type === 'detached' || this.editor.range) {
                    button.click()
                }

                // Other prevent default action to ignore
                event.preventDefault()
            })
        })
    }


    /**
      * Check if the node is within the toolbar section of the dom
      * Return true if the node is in the toolbar
      */
    contains(node: null | EventTarget): boolean {
        if (!node) return false
        let target = <Node>node
        while (target.nodeType === 3 || target.nodeName !== 'BODY') {
            if (node == this.domNode) {
                return true
            }
            if (!target.parentNode) {
                return false
            }
            target = target.parentNode
        }
        return false
    }


    /**
     * Set the states of all toolbar buttons
     */
    setStates(): void {
        if (!this.editor.range) {
            this.buttons.forEach(button => {
                if (button.element) button.element.classList.remove('active')
            })
            return
        }
        this.buttons.forEach(button => {
            this.setState(button)
        })
    }

    reset() {
        this.buttons.forEach(button => {
            this.setState(button)
        })
    }


    /**
     * Set the disabled and active states for a button. If not provided
     * just check if we have a range and it isn't a custom element
     */
    setState(button: ToolbarButton) {
        let handled = false
        // If not a detached button all buttons are disabled and 
        // inactive if there is no range or the range is in a custom element
        if (button.type !== 'detached') {
            if (!this.editor.range || this.editor.range.custom) {
                handled = true
                if (button.element) {
                    // @todo Check this works correctly
                    button.element.setAttribute('disabled', 'disabled')
                    button.element.classList.remove('active')
                }
            }
        }
        if (handled == false) {
            if (button.setState) {
                button.setState()
            }
        }
    }


    setStateForButtonType(type = ''): void {
        this.buttons.forEach(button => {
            if (type == '' || button.type == type) {
                this.setState(button)
                return
            }
        })
    }


    handleMenuClick(): void {
        if (!this.menuItems) return
        this.menuItems.classList.toggle('show')
        if (this.menuItems.classList.contains('show')) {
            if (!this.editor.range) {
                this.editor.range = Helpers.restoreSelectedRange(this.editor.range)
                this.setStates()
            }
        }
    }


}
