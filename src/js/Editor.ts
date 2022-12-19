import * as Templates from './templates'
import * as Helpers from './helpers'
import Modal from './Modal.js'
import EditRange from './EditRange'
import Buffer from './plugins/Buffer'
import Options from './options'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import Shortcut from './Shortcut'



class Editor {

    id: string = '' // @todo This may not be required
    filename = ''
    lastKey = ''

    range: null | EditRange = null
    editorNode: null | HTMLElement = null
    toolbarNode!: HTMLElement
    mainNode!: null | HTMLElement
    sidebarNode: null | HTMLElement = null
    debugNode: null | HTMLElement = null


    toolbar!: Toolbar
    sidebar!: null | Sidebar

    modal = new Modal()
    preview: null | Function = null
    update: null | Function = null
    handleKeyup: null | Function = null

    shortcuts: Shortcut[] = []
    disabled: boolean = false
    options: Options
    buffer: null | Buffer = null

    constructor(target: HTMLElement, content = '', toolbarItems: string[][], options: string) {

        // Generate a unique id for this editor instance
        // @todo This may not be required
        this.id = Helpers.generateUid()

        // Initialise options
        this.options = new Options(options)

        // Add editor html to the dom and get the main nodes
        target.innerHTML = Templates.editor(this.options)
        this.mainNode = target.querySelector('.editor-main')
        this.editorNode = target.querySelector('.editor-body')

        // Create a toolbar (adding to the dom)
        this.toolbar = new Toolbar(this, target, toolbarItems)

        // Add debugging panel?
        if (this.options.debug) {
            const div = document.createElement('div')
            div.classList.add('editor-debug')
            this.debugNode = Helpers.insertAfter(div, this.mainNode)
        }

        // *** TEST THE MODALS ***
        // Uncomment the next two lines for development testing
        // this.testModals('positioned')  // options are 'overlay', 'positioned', 'drawer' and 'full-screen'
        // return

        // Set up event handling
        this.listenForMouseUpEvents()
        this.listenForKeydownEvents()
        this.listenForKeyupEvents()

        // Public methods to support saving and updating the editor content
        this.preview = () => this.getCleanData(true)
        this.update = this.updateEditor

        // Reset currently edited filename
        this.filename = 'arte-download'

        // Initialise the editor content and buffering
        setTimeout(() => this.initEditor(content), 100)
    }


    /**
     * Initialise the editor content, either with the current content passed in or 
     * optionally using the 
     * @param {string} content The content passed into the editor when created
     */
    async initEditor(content = '') {

        if (this.editorNode === null) return

        // Request default content?
        if (content == '' && this.options.defaultContent != '') {
            const response = await fetch(this.options.defaultContent)
            if (response.status == 200) {
                content = await response.text()
            }
        }

        // Add the content to the editor node
        this.editorNode.innerHTML = content

        // Reset range
        this.range = null

        // Initialise buttons (some of which require the editor content to have been loaded)
        this.toolbar.initialise()

        // Optional sidebar
        if (this.options.explorer && this.toolbar!.buttons.find(btn => btn.sidebar !== undefined)) {
            this.sidebar = new Sidebar(this)
        }

        // Try to ensure that the referenced content is scrolled to a visible area in the middle of the editor. 
        // This is an attempt to normalise behaviour across browsers. For example, on Safari the default
        // behaviour scrolls the linked element off the top of the editor out of sight.
        window.onhashchange = () => {
            // event.preventDefault()
            // console.log('URL changed',window.location.hash)
            const element = document.getElementById(window.location.hash.substring(1))
            if (element != null) {
                //console.log('scrolled into view')
                element.scrollIntoView(<ScrollIntoViewOptions>{ block: 'center', behaviour: 'smooth' })
            }
        }
        setTimeout(() => this.updateBuffer(), 100)
    }



    // -----------------------------------------------------------------------------
    // @section Mouse up events
    // -----------------------------------------------------------------------------

    /**
     * Listen for mouseup events on the document
     */
    listenForMouseUpEvents() {
        document.addEventListener('mouseup', event => {
            // console.log( 'mouseup on', event.target )
            // console.log( 'active element', document.activeElement )
            // Clicked a modal button?
            if (this.modal.active()) {
                return
                // Clicked in the editor (but not a custom element which returns a
                // different active element)
            } else if (document.activeElement == this.editorNode) {
                this.handleMouseUp()
                // Clicked menu icon?
            } else if (event.target == this.toolbar.menuIcon) {
                this.toolbar.handleMenuClick()
                // Clicked in toolbar - if so ignore
            } else if (this.toolbar.contains(event.target)) {
                return
                // Must have clicked outside the editor or clicked on
                // a custom element, in either case reset the range and button states
            } else {
                this.resetRange()
            }
        })
    }



    /**
     * Handle resetting of the range and the associated button states
     */
    resetRange() {
        this.range = null
        this.toolbar.reset()
    }



    /**
     * Check if the node is within the editor section of the dom tree
     * Return true if the node is in the editor
     */
    nodeInEditor(node: HTMLElement): boolean {
        while (node.nodeType == 3 || node.nodeName != 'BODY' || node.contentEditable === 'true') {
            if (node == this.editorNode) {
                return true
            }
            if (node.parentNode == null) {
                return false
            }
            node = <HTMLElement>node.parentNode
        }
        return false
    }



    /**
     * Handle the mouse up event in order to potentially insert a paragraph in
     * an empty editor, highlight a custom node if selected
     */
    handleMouseUp(): void {
        // if ( this.options.debug ){
        //     console.log('Handle mouse up')
        //     console.log('handleMouseUp range=',this.range)
        // }
        this.updateRange()

        if (!this.range) {
            // If enter cursor in an empty editor then make this a paragraph
            // rather than raw text
            if (this.editorNode && this.editorNode.innerText == '') {
                //console.log('handleMouseUp: Inserting paragraph in empty editor')
                this.insertParagraph()
            }
        }
        // Unselect custom blocks and highlight this one if custom 
        if (this.range) this.highlightCustomNode(this.range.custom)

        this.toolbar.setStates()
    }



    /**
     * Insert empty paragraph
     */
    insertParagraph(): void {
        let p = document.createElement('P')
        // Create a placeholder to ensure set cursor works
        p.innerText = '\n'
        p = this.editorNode!.appendChild(p)
        Helpers.setCursor(p, 0)
        this.updateRange()
        this.toolbar.setStates()
        this.updateBuffer()
    }



    // -----------------------------------------------------------------------------
    // @section Keydown events
    // -----------------------------------------------------------------------------

    /**
     * List for keydown events on the editor node
     */
    listenForKeydownEvents(): void {
        this.lastKey = ''
        this.editorNode!.addEventListener('keydown', event => {
            let handled = false
            // if ( this.options.debug ){
            //     console.warn('keydown event')
            //     console.log('alt key?',event.altKey)
            //     console.log('meta key?',event.metaKey)
            //     console.log('control key?',event.ctrlKey)
            //     console.log('key',event.key)
            // }
            // Check if a modal dialogue is shown - ignore key entry?
            if (this.modal.active()) {
                event.preventDefault()
                handled = true
            }
            // Override normal browser enter key action
            if (!handled && event.key == 'Enter') {
                if (this.handleEnter()) {
                    event.preventDefault()
                }
                handled = true
            }
            // Prevent deletion of customised blocks
            if (!handled && (event.key == 'Backspace' || event.key == 'Delete' ||
                (event.ctrlKey && event.key == 'd'))) {
                if (this.handleDelete(event.key)) {
                    event.preventDefault()
                }
                handled = true
            }
            // Check shortcuts
            if (!handled) {
                this.shortcuts.forEach((item: Shortcut) => {
                    if (this.lastKey === item.shortcut && event.key === item.trigger) {
                        // Prevent default so key not echo'd to the screen
                        event.preventDefault()
                        // Stop propagation to prevent other event handlers responding
                        event.stopPropagation()
                        // Trigger the dialogue with the then current range
                        if (item?.button?.click) item.button.click(this, item.button)
                        handled = true
                    }
                })
            }
            // Undo/redo events
            if (!handled && this?.buffer?.buffering) {
                if ((event.ctrlKey || event.metaKey) && event.key == 'z') {
                    event.preventDefault()
                    // Redo
                    let button
                    if (event.shiftKey) {
                        button = this.toolbar!.buttons.find(b => b.tag == 'REDO')
                        // Undo
                    } else {
                        button = this.toolbar!.buttons.find(b => b.tag == 'UNDO')
                    }
                    if (button?.click) button.click()
                }
            }
            this.lastKey = event.key
        })
    }

    /**
     * Handle enter key pressed in editor node. Return true if handled
     */
    handleEnter(): void | boolean {
        // Get latest range as debouncing means may not have the latest value when typing
        this.updateRange()
        if (this.range === null) {
            return
        }
        const length = this.range.endContainer.textContent ? this.range.endContainer.textContent.trim().length : -1
        const endLineSelected = length === this.range.endOffset
        let handled = false
        // console.log(`handling enter with customs`, this.range.customs)
        if (this.range?.custom || endLineSelected) {
            if (this.range.blockParent) {
                const emptyTag = this.range.blockParent.innerHTML === '<br>'
                const listTag = this.range.blockParent.tagName === 'LI'
                const tag = emptyTag || !listTag ? 'P' : this.range.blockParent.tagName
                let n = document.createElement(tag)
                n.innerText = '\n'
                n = Helpers.insertAfter(n, this.range.blockParent)
                Helpers.setCursor(n, 0)
                handled = true
                // Reset the range which must be done after a delay since this
                // method was triggered on keydown before added to dom
                setTimeout(() => {
                    this.updateRange()
                    this.toolbar.setStateForButtonType('block')
                }, 10)
                // Check for handling enter within a parent block element that has a custom node at the end
                // @todo Multiple custom nodes?
            }
        }
        // If any of the immediate child of the block parent are not editable - then move these 
        // back to the original block parent since otherwise they will be transferred to the 
        // next block on Enter
        const parent = this.range.blockParent
        if (parent) {
            parent.childNodes.forEach(child => {
                if ((<HTMLElement>child).contentEditable === 'false') {
                    setTimeout(() => {
                        parent.appendChild(child)
                    }, 10)
                }
            })
        }
        if (this.range.custom) {
            this.highlightCustomNode(false)
        }
        return handled
    }



    /**
     * Handle delete key. Return true if need to prevent default action
     */
    handleDelete(key: string): boolean {
        if (key == 'd') {
            key = 'Delete'
        }
        //this.updateRange()
        if (this.range) {
            const feedback = new Modal({
                type: 'overlay',
                severity: 'info',
                title: 'Information',
                html: `
                    <p>You are attempting to delete one or more active elements, such as comments or links.</p>
                    <p>To delete active elements you need to edit them individually and choose Delete.</p>
                    `,
                escape: true,
                buttons: { cancel: { label: 'Close' } }
            })
            // Single selection
            if (this.range.collapsed) {
                // Check for back spacing from a single selection point 
                if (key == 'Backspace' && this.range.startOffset == 0) {
                    // console.log('backspacing into custom block')
                    // Back spacing into a block containing one or more non-editable blocks?
                    const previous = this.range?.blockParent?.previousElementSibling
                    if (previous) {
                        previous.childNodes.forEach(child => {
                            // console.log('Found custom block')
                            // Found block, move back to the previous element after a delay
                            // to overcome the default behaviour which is to delete the block
                            if ((<HTMLElement>child).contentEditable === "false") {
                                setTimeout(() => {
                                    previous.appendChild(child)
                                }, 1)
                            }
                        })
                    }
                    // Forward delete in a none-editable block?
                } else if (key == 'Delete') {
                    const length = this.range.endContainer.textContent ? this.range.endContainer.textContent.trim().length : -1
                    if (length === this.range.endOffset) {
                        const next = (<HTMLElement>this.range.endContainer).nextElementSibling
                        if (next && next.getAttribute("contenteditable") === 'false') {
                            feedback.show()
                            return true
                        }
                    }
                }
                // Back spacing or deleting in a multiple selection
            } else {
                const selection = document.getSelection()
                if (Helpers.selectionContainsCustoms(this.editorNode, selection)) {
                    feedback.show()
                    return true
                }
            }
        }
        // Reset the range which must be done after a delay since this
        // method was triggered on keydown before added to dom
        // Must invoke with arrow function so that the instance context is retained
        setTimeout(() => this.updateRange(), 10)
        return false
    }


    // -----------------------------------------------------------------------------
    // @section Keyup events
    // -----------------------------------------------------------------------------


    /**
     * Listen for key up events on the editor node
     */
    listenForKeyupEvents() {
        // Set the handleKeyup method to be the debounced method handleKeyupDelayed
        this.handleKeyup = Helpers.debounce(this.handleKeyupDelayed, 500)
        this.editorNode!.addEventListener('keyup', event => {
            if (!this.handleKeyup) return
            const ignore = ['Shift', 'Meta', 'Ctrl']
            // console.log('handle key up event',event)
            if (ignore.includes(event.key) == false && this.modal.active() == false) {
                this.handleKeyup(event.key, this)
            }
        })
    }

    /**
     * Handle keyup events (after being debounced)
     */
    handleKeyupDelayed(...args: any) {
        // console.warn('handleKeyupDelayed')
        let key = args[0]
        //console.log('key',key)
        // Nav keys
        const navigation = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'End', 'Home']
        const editor = args[1]
        // Reset range and toolbar states if navigating within editor
        editor.updateRange()
        if (navigation.includes(key)) {
            editor.setToolbarStates()
        }
        // console.log('Explicitly updating buffer')
        editor.buffer()
    }

    // -----------------------------------------------------------------------------
    // @section Custom event handlers
    // -----------------------------------------------------------------------------

    /**
     * Active custom elements are likely to require their event handlers to be reset
     * after updates to the dom
     */
    updateEventHandlers() {
        this.toolbar.buttons.forEach(button => {
            if (button.addEventHandlers) {
                button.addEventHandlers()
            }
        })
    }


    // -----------------------------------------------------------------------------
    // @section Testing
    // -----------------------------------------------------------------------------

    testModals(type: string) {
        // Warning modal
        if (type == 'overlay') {
            const modal = new Modal({
                type: 'overlay',
                title: 'Example feedback modal',
                html: `
                    <p>This is an example of an overlay modal.</p>
                    <p>It can be dismissed by selecting the "escape" option and/or by adding a "cancel" button.</p>
                    <p>It also demonstrates the display of a graphic icon which is configured by setting the severity option.</p>`,
                severity: 'warning',
                escape: true,
                buttons: { cancel: { label: 'OK' } }
            })
            modal.show()

            // Edit modal with buttons and callbacks
        } else if (type == 'drawer') {
            const modal = new Modal({
                type: 'drawer',
                title: 'Example of an edit modal',
                html: `
                    <p>This modal type provides a placeholder for custom content, such as a form with values that can be edited.</p>
                    <p>It is typically used by specifying a number of standard buttons, such as "cancel", "delete" or "confirm".</p>
                    <p>Each button may have an associated callback function assigned. If none is assigned the default action is to close the modal.</p>`,
                buttons: {
                    cancel: { label: 'Cancel' },
                    delete: { label: 'Delete', callback: () => alert('delete') },
                    confirm: { label: 'Confirm', callback: () => alert('confirm') }
                }
            })
            modal.show()

            // Positioned modal
        } else if (type == 'positioned') {
            this.editorNode!.addEventListener('click', () => {
                this.updateRange()
                const modal = new Modal({
                    type: 'positioned',
                    escape: true,
                    backgroundColour: 'palegreen',
                    borderRadius: '10px',
                    html: `
                        <div style="width:400px;padding:1rem;">
                            <p>This is an example of a positional modal which is positioned with its top-left-hand corner adjacent to the mouse selection point.</p>
                            <p>The contents can be added as required.</p>
                            <p>Like all other modals it could be defined with standard buttons but typically would be used for in-place popups like "@mentions".</p>
                            <p>Optionally you can specify whether it can be dismissed with the Escape key as is required here since no "cancel" button is provided.</p>
                            <p>You can also set a background colour and border radius to override the defaults as done here.</p>
                        </div>`
                })
                modal.show()
                modal.setPosition(this.range, this.editorNode)
            })
        }
    }

    // -----------------------------------------------------------------------------
    // @section File handling
    // -----------------------------------------------------------------------------

    /**
     * Display modal dialogue requesting the filename to download as
     */
    download(): void {
        if (this.modal.active()) {
            return
        }
        this.modal = new Modal({
            type: 'drawer',
            title: 'Save file',
            html: Templates.save(this.filename),
            escape: true,
            buttons: {
                cancel: { label: 'Cancel', callback: () => this.modal.hide() },
                confirm: { label: 'Save', callback: () => this.save() }
            }
        })
        this.modal.show()
    }

    /**
     * Add a hidden download button to the dom with the encoded contents of the
     * editor, click it programmatically and then remove
     */
    save(): void {
        const fileInput = document.querySelector('form.save #filename')
        if (!fileInput) {
            console.error('Could not find file input')
            return
        }
        let filename = (<HTMLInputElement>fileInput).value.trim().toLowerCase()
        if (filename == '') {
            const feedback = document.querySelector('form.save .feedback')
            if (!feedback) {
                console.error('Could not find feedback placeholder')
                return
            }
            feedback.innerHTML = "You must provide a filename. Click <strong>Cancel</strong> or press the <strong>Escape</strong> key to close this dialogue without saving."
            return
        }
        filename += '.arte'
        let xml = this.getCleanData()
        const link = document.createElement('a')
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(xml))
        link.setAttribute('download', filename)
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        link.remove()
    }


    /**
     * Handle file upload from the upload button defined in the upload method
     */
    handleFileUpload(input: HTMLInputElement): void {
        const file = input.files ? input.files[0] : null
        if (!file) {
            return
        }
        const ext = file.name.slice(-4).toLowerCase()
        if (ext !== 'arte') {
            return
        }
        this.filename = file.name.slice(0, -5)
        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event?.target?.result
            if (!content) {
                console.error()
                return
            }
            this.initEditor(<string>content)
        }
        reader.readAsText(file)
        // Remove the input (avoids multiple event listeners amongst other things)
        input.remove()
    }

    /**
     * Add a hidden file input (if not already done so) and then click it
     * programmatically
     */
    upload() {
        let input: HTMLInputElement | null = <HTMLInputElement>document.getElementById('arte-upload')
        if (!input) {
            input = <HTMLInputElement>document.createElement('INPUT')
            if (!input) {
                console.error('Could not create file input')
                return
            }
        }
        input.id = 'arte-upload'
        input.type = 'file'
        input.style.display = 'none'
        input.accept = '.arte'
        //console.log('input', input.outerHTML)
        input.addEventListener('change', () => this.handleFileUpload(<HTMLInputElement>input), false)
        document.body.appendChild(input)
        input.click()
    }



    clear() {
        if (this.modal.active()) {
            return
        }
        this.modal = new Modal({
            type: 'overlay',
            severity: 'warning',
            title: 'Start new document?',
            html: '<p>Are you sure you want to clear the editor and start a new document? Any changes will be lost.</p>',
            escape: true,
            buttons: {
                cancel: { label: 'Cancel', callback: () => this.modal.hide() },
                confirm: {
                    label: 'Yes',
                    callback: () => {
                        if (this.editorNode) this.editorNode.innerHTML = ''
                        this.filename = 'arte-download'
                        this.modal.hide()
                        setTimeout(() => this.updateBuffer(), 100)
                    }
                }
            }
        })
        this.modal.show()
    }


    // -----------------------------------------------------------------------------
    // @section Other methods
    // -----------------------------------------------------------------------------

    /**
     * Clean the editor node contents
     * Returns the cleaned html data
     */
    getCleanData(pretty = false): string {
        let node = this.editorNode!.cloneNode(true)
        // Get list of buttons with clean methods
        const cleanButtons = this.toolbar.buttons.filter(button => button.clean)
        Helpers.cleanForSaving(<Element>node, cleanButtons)
        return pretty ? Helpers.prettyPrint(node) : (<HTMLElement>node).innerHTML
    }

    /**
     * UPdate the editor node with the supplied content
     * @param {string} content 
     */
    updateEditor(content: string): void {
        this.editorNode!.innerHTML = content
    }

    /**
     * Get the new range in the editor node and when debugging display this
     */
    updateRange(): void {
        if (this.modal.active()) {
            return
        }
        // const timestamp1 = new Date()
        // Check for empty editor - in which case insert a new paragraph
        // if ( this.editorNode.innerHTML.trim() == '' ){
        //     console.log('1. inserting paragraph in empty editor')
        //     this.insertParagraph()
        //     // Return as insertParagraph reinvokes this method
        //     return
        // }
        //console.log('modal active',this.modal.active())
        this.range = Helpers.getRange(<HTMLElement>this.editorNode)
        if (this.options.debug) {
            Templates.debugRange(this.debugNode, this.range)
        }
        // const timestamp2 = new Date()
        // console.log(`START: ${timestamp1.getTime()}\nENDED: ${timestamp2.getTime()}`)
    }

    /**
     * Remove "custom-selected" class from all custom elements and then add to 
     * any child of the parentNode if it is a custom.
     */
    highlightCustomNode(node: HTMLElement | boolean): void {
        //console.log('node',node)
        const customs = this.editorNode!.querySelectorAll('[contenteditable=false]')
        customs.forEach(custom => {
            custom.classList.remove('custom-selected')
        })
        if (node) {
            (<HTMLElement>node).classList.add('custom-selected')
        }
    }

    updateBuffer() {
        if (this.buffer?.update) {
            // console.log('Updating buffer')
            this.buffer.update()
        }
        this.sidebar?.update()
    }


} // End of class definition

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export default Editor
