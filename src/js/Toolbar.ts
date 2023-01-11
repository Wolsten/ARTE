import Editor from './Editor'
import ToolbarButton, { ToolbarButtonType } from './ToolbarButton'
import * as Helpers from './helpers'
import * as Icons from './Icons'
import Block from './plugins/Block'
import Style from './plugins/Style'
import Colour from './plugins/Colour'
import BufferButton from './plugins/BufferButton'
import Clipboard from './plugins/Clipboard'
import Shortcut from './Shortcut'
import Mentions from './plugins/Mentions'
import Settings from './plugins/Settings'
import CustomAction from './plugins/CustomAction'
import CustomLink from './plugins/CustomLink'
import CustomImage from './plugins/CustomImage'
import CustomComment from './plugins/CustomComment'


export default class Toolbar {

    defaults: string[][] = [
        ['BLOCK.H1', 'BLOCK.H2', 'BLOCK.H3', 'BLOCK.P', 'BLOCK.BLOCKQUOTE'],
        ['BLOCK.OL', 'BLOCK.UL'],
        ['STYLE.B', 'STYLE.I', 'STYLE.U', 'COLOUR.FOREGROUND', 'COLOUR.BACKGROUND', 'STYLE.CLEAR'],
        ['BUFFER.10'],
        ['CLIPBOARD.CUT', 'CLIPBOARD.COPY', 'CLIPBOARD.PASTE'],
        ['MENTIONS', 'CUSTOM-BLOCK.LINK', 'CUSTOM-BLOCK.IMAGE', 'CUSTOM-BLOCK.COMMENT', 'CUSTOM-BLOCK.ACTION'],
        ['SETTINGS']
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
                const name = parts.length == 2 ? parts[1] : ''

                let button: null | ToolbarButton = null
                let button2: null | ToolbarButton = null

                switch (type.toUpperCase()) {
                    case 'BLOCK':
                        button = new Block(editor, name, index)
                        break
                    case 'STYLE':
                        button = new Style(editor, name, index)
                        break
                    case 'COLOUR':
                        button = new Colour(editor, name, index)
                        break
                    case 'BUFFER':
                        button = new BufferButton(editor, 'UNDO', index)
                        button2 = new BufferButton(editor, 'REDO', index)
                        const size: number = name ? parseInt(name) : 0
                        editor.initBuffer(button, button2, size)
                        break
                    case 'CLIPBOARD':
                        button = new Clipboard(editor, name, index)
                        break
                    case 'MENTIONS':
                        button = new Mentions(editor, index)
                        break
                    case 'SETTINGS':
                        button = new Settings(editor, index)
                        break

                    case 'CUSTOM-BLOCK':
                        switch (name) {
                            case 'ACTION':
                                button = new CustomAction(editor, index)
                                break
                            case 'LINK':
                                button = new CustomLink(editor, index)
                                break
                            case 'IMAGE':
                                button = new CustomImage(editor, index)
                                break
                            case 'COMMENT':
                                button = new CustomComment(editor, index)
                                break
                        }
                }

                if (!button) {
                    console.error('Found missing button type ' + entry)
                    return
                }

                this.buttons.push(button)
                Helpers.registerTag(button.type, button.tag)
                if (button2) {
                    this.buttons.push(button2)
                    Helpers.registerTag(button2.type, button2.tag)
                }
            })
        })

        this.domNode.innerHTML = this.template()
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
            const buttonElement = this.domNode!.querySelector(`#${button.tag}`)
            if (!buttonElement) {
                console.error('Missing button element for button', button.tag)
                return
            }
            button.element = <HTMLInputElement>buttonElement

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
            button.element.addEventListener('click', (event: Event) => {

                if (!button.click) {
                    return
                }

                // Get latest range as debouncing means may not have the latest value when typing
                this.editor.updateRange()

                // Ignore if a modal is active
                if (this.editor.modal?.active) {
                    return
                }

                // Handle clicks for detached buttons (e.g. undo, redo) 
                // and when have a range
                if (button.type === ToolbarButtonType.DETACHED || this.editor.range) {
                    button.click()
                }

                // Prevent default action to ignore
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
        while (target.nodeType === Node.TEXT_NODE || target.nodeName !== 'BODY') {
            if (target == this.domNode) {
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
        if (!this.editor.range?.base) {
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
        if (button.type !== ToolbarButtonType.DETACHED) {
            if (!this.editor.range || this.editor.range.custom) {
                handled = true
                if (button.element) {
                    console.log('Setting state for button', button.tag)
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


    setStateForButtonType(type: ToolbarButtonType): void {
        this.buttons.forEach(button => {
            if (button.type === type) {
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





    /**
     * Return HTML for the toolbar
     */
    template(): string {
        let buttonsHtml = ''
        let groups: string[] = []
        // console.log('buttons.length',buttons.length)
        this.buttons.forEach((button, index) => {
            const { type, tag, label, icon } = button
            buttonsHtml +=
                `<button id="${tag}" type="button" class="btn btn-light ${type}" title="${label}">
                    ${icon} <span class="mobile">${label}</span>
                </button>`
            const nextGroup = index == this.buttons.length - 1 ? '' : this.buttons[index + 1].group
            // Found end of a group?
            if (button.group != nextGroup) {
                // console.log('found new group at button',button.tag)
                const title = `${button.group} buttons`
                groups.push(`<div class="editor-toolbar-group block" role="group" title="${title}">${buttonsHtml}</div>`)
                buttonsHtml = ''
            }
        })
        const groupsHTML = groups.join('<span class="editor-toolbar-group-separator"></span>')
        return `<span class="menu-icon mobile" title="Click to toggle toolbar menu">${Icons.menu} Menu</span><section>${groupsHTML}</section></details>`
    }


}
