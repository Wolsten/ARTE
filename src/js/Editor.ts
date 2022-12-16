import * as Templates from './templates'
import * as Helpers from './helpers'
import Modal from './Modal.js'
import ToolbarButton from './ToolbarButton'
import EditRange from './EditRange'
import Buffer from './plugins/Buffer'

class Editor {

    // -----------------------------------------------------------------------------
    // @section Initialisation
    // -----------------------------------------------------------------------------

    id: string = ''
    range: null | EditRange = null
    editorNode: HTMLElement
    toolbar: ToolbarButton[]
    shortcuts = []
    disabled: boolean = false
    options = []

    buffer: null | Buffer = null
    updateBuffer: false | Function = false

    /**
     * 
     * @param {HTMLElement} target The dom node to populate with the toolbar and editor
     * @param {string} content The initial HTML content for the editor
     * @param {object[]} toolbar 2-d array of buttons
     * @param {object} options Options, such as the buffer size for undo/redo operations
     */
    constructor(target, content = '', toolbar: ToolbarButton[][], options) {
        // Initialise options
        this.options = this.initOptions(options)
        // Initialise the toolbar
        this.toolbar = this.initToolbarArray(toolbar)
        // Initialise the toolbar and empty editor
        target.innerHTML = Templates.editor(this.toolbar, this.options)
        this.id = Helpers.generateUid()
        // Grab dom elements
        this.toolbarNode = target.querySelector('.editor-toolbar')
        this.mainNode = target.querySelector('.editor-main')
        this.editorNode = target.querySelector('.editor-body')
        this.menuIcon = this.toolbarNode.querySelector('.menu-icon')
        this.menuItems = this.toolbarNode.querySelector('section')
        this.sidebarNode = null
        // Check for debugging
        this.debugTarget = false
        if (this.options.debug) {
            const div = document.createElement('div')
            div.classList.add('editor-debug')
            this.debugTarget = Helpers.insertAfter(div, this.mainNode)
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
        // Define an empty modal so can check if any active
        this.modal = new Modal()
        // Initialise the editor content and buffering
        setTimeout(() => this.initEditor(content), 100)
    }

    /**
     * Initialise the optional editor parameters
     * @param {object} options 
     * @returns 
     */
    initOptions(options) {
        const headingNumbers = true
        const bufferSize = 10
        const MAX_BUFFER_SIZE = 10
        const debug = false
        const defaultContent = ''
        const explorer = true
        if (options) {
            options.headingNumbers = options.headingNumbers == undefined ? headingNumbers : options.headingNumbers
            options.bufferSize = options.bufferSize == undefined ? bufferSize : Math.max(parseInt(options.bufferSize), MAX_BUFFER_SIZE)
            options.debug = options.debug == undefined ? debug : options.debug
            options.defaultContent = options.defaultContent == undefined ? '' : options.defaultContent
            options.explorer = options.explorer == undefined ? explorer : options.explorer
        } else {
            options = {
                headingNumbers,
                bufferSize,
                debug,
                defaultContent,
                explorer
            }
        }
        return options
    }

    /**
     * Initialise the editor content, either with the current content passed in or 
     * optionally using the 
     * @param {string} content The content passed into the editor when created
     */
    async initEditor(content = '') {
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
        this.range = false
        // Initialise buttons (some of which require the editor content to have been loaded)
        this.initialiseButtons()
        // Optional sidebar
        if (this.options.explorer && this.toolbar.find(btn => btn.sidebar !== undefined)) {
            this.showSidebar()
        }
        // Try to ensure that the referenced content is scrolled to a visible area in the middle of the editor. 
        // This is an attempt to normalise behaviour across browsers. For example, on Safari the default
        // behaviour  scrolls the linked element off the top of the editor out of sight.
        window.onhashchange = event => {
            // event.preventDefault()
            // console.log('URL changed',window.location.hash)
            const element = document.getElementById(window.location.hash.substring(1))
            if (element != null) {
                //console.log('scrolled into view')
                element.scrollIntoView({ block: 'center', behaviour: 'smooth' })
            }
        }
        setTimeout(() => this.buffer(), 100)
    }


    initToolbarArray(groups: ToolbarButton[][]): ToolbarButton[] {
        let toolbar: ToolbarButton[] = []
        groups.forEach((group, groupIndex) => {
            group.forEach(button => {
                button.group = groupIndex
                Helpers.registerTag(button.type, button.tag)
                toolbar.push(button)
            })
        })
        return toolbar
    }

    /**
     * Set the disabled and active states for a button. If not provided
     * just check if we have a range and it isn't a custom element
     * @param {object} button 
     */
    setState(button) {
        let handled = false
        // If not a detached button all buttons are disabled and 
        // inactive if there is no range or the range is in a custom element
        if (button.type !== 'detached') {
            if (this.range === undefined ||
                this.range === false ||
                this.range.custom) {
                handled = true
                button.element.disabled = true
                button.element.classList.remove('active')
            }
        }
        if (handled == false) {
            if ("setState" in button) {
                button.setState(this, button)
            }
        }
    }

    /**
     * Set the state for a button type (or all buttons if blank)
     * @param {string} type Type of button
     */
    setStateForButtonType(type = '') {
        this.toolbar.forEach(button => {
            if (type == '' || button.type == type) {
                this.setState(button)
                return
            }
        })
    }

    /**
     * Initialise the toolbar buttons
     */
    initialiseButtons() {

        // Initialise buffer callback to false - reset if UNDO button found 
        // and a buffer length set
        // Do any custom setup required
        this.toolbar.forEach(button => {
            // Add dom element to the button
            button.element = this.toolbarNode.querySelector(`#${button.tag}`)
            // Special handling for undo (init of other buttons done after content loaded)
            if (button.tag === 'UNDO' && this.options.bufferSize > 0) {
                this.updateBuffer = button.update
                button.init(this, button)
            }
            // Init formatting for buttons other than undo and redo
            if ("init" in button &&
                button.tag !== 'UNDO' && button.tag !== 'REDO') {
                button.init(this, button)
            }
            // Set initial button state
            this.setState(button)
            // Some button have shortcuts in which case save for use in the keydown
            // event handler
            if ("shortcut" in button) {
                const shortcut = button.shortcut[0]
                const trigger = button.shortcut[1]
                this.shortcuts.push({
                    shortcut: button.shortcut[0],
                    trigger: button.shortcut[1],
                    button: button
                })
            }
            // All buttons have a click method
            this.buttonClicked = false
            button.element.addEventListener('click', event => {
                if (this.buttonClicked) {
                    return
                }
                this.buttonClicked = true
                // Get latest range as debouncing means may not have the latest value when typing
                this.updateRange()
                // Ignore if a modal is active
                if (this.modal.active()) {
                    return
                }
                // Handle clicks for detached buttons (e.g. undo, redo) 
                // and when have a range
                if (button.type === 'detached' || this.range !== false) {
                    button.click(this, button)
                }
                // Other prevent default action to ignore
                event.preventDefault()
                this.buttonClicked = false
            })
        })
    }

    // -----------------------------------------------------------------------------
    // @section Responsiveness
    // -----------------------------------------------------------------------------

    /**
     * Handle mobile menu clicks (invoked from listenForMouseUpEvents)
     */
    handleMenuClick() {
        this.menuItems.classList.toggle('show')
        if (this.menuItems.classList.contains('show')) {
            if (this.range !== false) {
                this.range = Helpers.restoreSelectedRange(this.range)
                this.setToolbarStates()
            }
        }
    }

    // -----------------------------------------------------------------------------
    // @section Sidebar
    // -----------------------------------------------------------------------------

    /**
     * Insert the sidebar in the dom
     */
    showSidebar() {
        if (this.mainNode.querySelector('.editor-sidebar') != null) {
            this.updateSidebar()
            return
        }
        let tabList = []
        this.toolbar.forEach(button => {
            if (button.sidebar) {
                //console.log('Opening sidebar for button ', button.tag)
                tabList.push(button.sidebar(this))
            }
        })
        // Populate the sidebar
        this.sidebarNode = document.createElement('DIV')
        this.sidebarNode.classList.add('editor-sidebar')
        this.sidebarNode.classList.add('dont-break-out')
        this.sidebarNode.innerHTML = Templates.sidebarContent(tabList)
        // Tab menu clicks
        const tabMenu = this.sidebarNode.querySelector('.tab-menu')
        const tabMenuItems = tabMenu.querySelectorAll('a')
        tabMenuItems.forEach(
            item => item.addEventListener('click', event => this.handleTabMenuClicks(event, tabMenuItems))
        )
        this.sidebarNode.querySelector('button.close').addEventListener('click', () => this.hideSidebar())
        // Append to the editor
        this.mainNode.appendChild(this.sidebarNode)
    }

    hideSidebar() {
        this.sidebarNode.remove()
        this.options.explorer = false
    }

    /**
     * Update the content of the sidebar
     */
    updateSidebar() {
        if (this.mainNode.querySelector('.editor-sidebar') == null) {
            return
        }
        // Get latest content
        let tabList = []
        this.toolbar.forEach(button => {
            if (button.sidebar) {
                tabList.push(button.sidebar(this))
            }
        })
        // Populate latest content if we have any
        tabList.forEach((item, index) => {
            const content = this.sidebarNode.querySelector(`[data-tab-id="tab-${index}"]`)
            if (item.content == '') {
                item.content = `You have no ${item.label} in your document.`
            }
            content.innerHTML = item.content
        })
    }

    /**
     * Handle clicking on a tab menu item (the current target)
     * @param {Event} event 
     * @param {HTMLElement[]} tabMenuItems 
     */
    handleTabMenuClicks(event, tabMenuItems) {
        event.preventDefault()
        event.stopPropagation()
        // Find the clicked tab, i.e. the element with the data-tab-target attribute
        const tab = event.currentTarget
        const tabTarget = tab.dataset.tabTarget
        while (tabTarget == null) {
            tab = tab.parentNode
            tabTarget = tab.dataset.tabTarget
        }
        // Remove existing active and show classes
        tabMenuItems.forEach(item => item.classList.remove('active'))
        this.sidebarNode.querySelectorAll('.tab-item').forEach(item => item.classList.remove('show'))
        // Add new classes
        tab.classList.add('active')
        const tabItemTarget = this.sidebarNode.querySelector(`[data-tab-id="${tabTarget}"]`)
        tabItemTarget.classList.add('show')
    }

    // -----------------------------------------------------------------------------
    // @section Mouse up events
    // -----------------------------------------------------------------------------

    /**
     * Listen for mouseup events on the document
     */
    listenForMouseUpEvents() {
        document.addEventListener('mouseup', event => {
            // Get the active element in the document
            const active = document.activeElement
            const target = event.target
            // console.log( 'mouseup on', event.target )
            // console.log( 'active element', document.activeElement )
            // Clicked a modal button?
            if (this.modal.active()) {
                return
                // Clicked in the editor (but not a custom element which returns a
                // different active element)
            } else if (active == this.editorNode) {
                this.handleMouseUp()
                // Clicked menu icon?
            } else if (target == this.menuIcon) {
                this.handleMenuClick()
                // Clicked in toolbar?
            } else if (this.nodeInToolbar(target)) {
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
        this.range = false
        this.toolbar.forEach(button => {
            this.setState(button)
        })
    }

    /**
     * Check if the node is within the editor section of the dom tree
     * @param {HTMLElement} node 
     * @returns {boolean} true if the node is in the editor
     */
    nodeInEditor(node) {
        while (node.nodeType == 3 || node.tagName != 'BODY' || node.contentEditable != false) {
            if (node == this.editorNode) {
                return true
            }
            if (node.parentNode == null) {
                return false
            }
            node = node.parentNode
        }
        return false
    }

    /**
     * Check if the node is within the toolbar section of the dom tree
     * @param {HTMLElement} node 
     * @returns {boolean} true if the node is in the toolbar
     */
    nodeInToolbar(node) {
        while (node.nodeType == 3 || node.tagName != 'BODY') {
            if (node == this.toolbarNode) {
                return true
            }
            if (node.parentNode == null) {
                return false
            }
            node = node.parentNode
        }
        return false
    }

    /**
     * Set the states of all toolbar buttons
     */
    setToolbarStates() {
        if (this.range === false) {
            this.toolbar.forEach(button => {
                button.element.classList.remove('active')
            })
            return
        }
        this.toolbar.forEach(button => {
            this.setState(button)
        })
    }

    /**
     * Handle the mouse up event in order to potentially insert a paragraph in
     * an empty editor, highlight a custom node if selected
     */
    handleMouseUp() {
        // if ( this.options.debug ){
        //     console.log('Handle mouse up')
        //     console.log('handleMouseUp range=',this.range)
        // }
        this.updateRange()
        if (this.range !== false) {
            // If enter cursor in an empty editor then make this a paragraph
            // rather than raw text
            if (this.editorNode.innerText == '') {
                //console.log('handleMouseUp: Inserting paragraph in empty editor')
                this.insertParagraph()
            }
            // Unselect custom blocks and highlight this one if custom 
            this.highlightCustomNode(this.range.custom)
        }
        this.setToolbarStates()
    }

    /**
     * Insert empty paragraph
     */
    insertParagraph() {
        let p = document.createElement('P')
        // Create a placeholder to ensure set cursor works
        p.innerText = '\n'
        p = this.editorNode.appendChild(p)
        Helpers.setCursor(p, 0)
        this.updateRange()
        this.setToolbarStates()
        this.buffer()
    }


    // -----------------------------------------------------------------------------
    // @section Keydown events
    // -----------------------------------------------------------------------------

    /**
     * List for keydown events on the editor node
     */
    listenForKeydownEvents() {
        this.lastKey = ''
        this.editorNode.addEventListener('keydown', event => {
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
                this.shortcuts.forEach(item => {
                    if (this.lastKey === item.shortcut && event.key === item.trigger) {
                        // Prevent default so key not echo'd to the screen
                        event.preventDefault()
                        // Stop propagation to prevent other event handlers responding
                        event.stopPropagation()
                        // Trigger the dialogue with the then current range
                        item.button.click(this, item.button)
                        handled = true
                    }
                })
            }
            // Undo/redo events
            if (!handled && this.bufferUpdate !== false) {
                if ((event.ctrlKey || event.metaKey) && event.key == 'z') {
                    event.preventDefault()
                    // Redo
                    let button
                    if (event.shiftKey) {
                        button = this.toolbar.find(b => b.tag == 'REDO')
                        // Undo
                    } else {
                        button = this.toolbar.find(b => b.tag == 'UNDO')
                    }
                    button.element.click()
                    handled = true
                }
            }
            this.lastKey = event.key
        })
    }

    /**
     * Handle enter key pressed in editor node
     */
    handleEnter() {
        // Get latest range as debouncing means may not have the latest value when typing
        this.updateRange()
        if (this.range === false) {
            return
        }
        const endLineSelected = this.range.endContainer.textContent.trim().length == this.range.endOffset
        let handled = false
        // console.log(`handling enter with customs`, this.range.customs)
        if (this.range.custom || endLineSelected) {
            const emptyTag = this.range.blockParent.innerHTML == '<br>'
            const listTag = this.range.blockParent.tagName == 'LI'
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
                this.setStateForButtonType('block')
            }, 10)
            // Check for handling enter within a parent block element that has a custom node at the end
            // @todo Multiple custom nodes?
        }
        // If any of the immediate child of the block parent are not editable - then move these 
        // back to the original block parent since otherwise they will be transferred to the 
        // next block on Enter
        const p = this.range.blockParent
        p.childNodes.forEach(child => {
            if (child.contentEditable == 'false') {
                setTimeout(() => {
                    p.appendChild(child)
                }, 10)
            }
        })
        if (this.range.custom) {
            this.highlightCustomNode(false)
        }
        return handled
    }

    /**
     * Handle delete key
     * @param {string} key
     * @returns {boolean} true if need to prevent default action
     */
    handleDelete(key) {
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
                    const previous = this.range.blockParent.previousElementSibling
                    previous.childNodes.forEach(child => {
                        // console.log('Found custom block')
                        // Found block, move back to the previous element after a delay
                        // to overcome the default behaviour which is to delete the block
                        if (child.contentEditable == "false") {
                            setTimeout(() => {
                                previous.appendChild(child)
                            }, 1)

                        }
                    })
                    // Forward delete in a none-editable block?
                } else if (key == 'Delete' && this.range.endContainer.textContent.trim().length == this.range.endOffset) {
                    const next = this.range.endContainer.nextElementSibling
                    if (next && next.getAttribute("contenteditable") == 'false') {
                        feedback.show()
                        return true
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
        this.editorNode.addEventListener('keyup', event => {
            const ignore = ['Shift', 'Meta', 'Ctrl']
            // console.log('handle key up event',event)
            if (ignore.includes(event.key) == false && this.modal.active() == false) {
                this.handleKeyup(event.key, this)
            }
        })
    }

    /**
     * Handle keyup events (after being debounced)
     * @param  {...any} args Handle keyup events
     */
    handleKeyupDelayed(...args) {
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
        this.toolbar.forEach(button => {
            if ('addEventHandlers' in button) {
                button.addEventHandlers(this)
            }
        })
    }

    // -----------------------------------------------------------------------------
    // @section Testing
    // -----------------------------------------------------------------------------

    testModals(type) {

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
            this.editorNode.addEventListener('click', () => {
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
    download() {
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
    save() {
        let filename = document.querySelector('form.save #filename').value.trim().toLowerCase()
        if (filename == '') {
            document.querySelector('form.save .feedback').innerHTML = "You must provide a filename. Click <strong>Cancel</strong> or press the <strong>Escape</strong> key to close this dialogue without saving."
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
     * @param {HTMLElement} input 
     * @returns 
     */
    handleFileUpload(input) {
        const file = input.files[0]
        if (!file) {
            return
        }
        const ext = file.name.slice(-4).toLowerCase()
        if (ext != 'arte') {
            return
        }
        this.filename = file.name.slice(0, -5)
        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target.result
            this.initEditor(content)
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
        let input = document.getElementById('arte-upload')
        if (input == null) {
            input = document.createElement('input')
            input.id = 'arte-upload'
            input.type = 'file'
            input.style.display = 'none'
            input.accept = '.arte'
            //console.log('input', input.outerHTML)
            input.addEventListener('change', () => this.handleFileUpload(input), false)
            document.body.appendChild(input)
        }
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
                    label: 'Yes', callback: () => {
                        this.editorNode.innerHTML = ''
                        this.filename = 'arte-download'
                        this.modal.hide()
                        setTimeout(() => this.buffer(), 100)
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
     * @param {boolean} pretty Whether to pretty print
     * @returns {string} The cleaned html data
     */
    getCleanData(pretty = false) {
        let node = this.editorNode.cloneNode(true)
        // Get list of buttons with clean methods
        const cleanButtons = this.toolbar.filter(button => button.clean != undefined)
        Helpers.cleanForSaving(node, cleanButtons)
        return pretty ? Helpers.prettyPrint(node) : node.innerHTML
    }

    /**
     * UPdate the editor node with the supplied content
     * @param {string} content 
     */
    updateEditor(content) {
        this.editorNode.innerHTML = content
    }

    /**
     * Get the new range in the editor node and when debugging display this
     */
    updateRange() {
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
        this.range = Helpers.getRange(this.editorNode)
        if (this.options.debug) {
            Templates.debugRange(this.debugTarget, this.range)
        }
        // const timestamp2 = new Date()
        // console.log(`START: ${timestamp1.getTime()}\nENDED: ${timestamp2.getTime()}`)
    }

    /**
     * Remove "custom-selected" class from all custom elements and then add to 
     * any child of the parentNode if it is a custom.
     * @param {HTMLElement|false} node Either a custom node or false
     */
    highlightCustomNode(node) {
        //console.log('node',node)
        const customs = this.editorNode.querySelectorAll('[contenteditable=false]')
        customs.forEach(custom => {
            custom.classList.remove('custom-selected')
        })
        if (node) {
            node.classList.add('custom-selected')
        }
    }

    buffer() {
        if (this.updateBuffer !== false) {
            // console.log('Updating buffer')
            this.updateBuffer(this)
        }
        // Update the sidebar if we have one
        this.updateSidebar(false)
    }


} // End of class definition

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export default Editor
