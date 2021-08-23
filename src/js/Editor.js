import * as Templates from './templates.js'
import * as Helpers from './helpers.js'
import * as Buffer from './plugins/buffer.js'
import Modal from './Modal.js'

class Editor {

    // -----------------------------------------------------------------------------
    // @section Initialisation
    // -----------------------------------------------------------------------------

    /**
     * 
     * @param {HTMLElement} target The dom node to populate with the toolbar and editor
     * @param {string} content The initial HTML content for the editor
     * @param {object[]} toolbar 2-d array of buttons
     * @param {object} options Options, such as the buffer size for undo/redo operations
     */
    constructor( target, content='', toolbar, options ){
        // Initialise options
        this.options = this.initOptions(options)
        // Initialise the toolbar
        this.toolbar = this.initToolbar(toolbar)
        // Initialise the editor
        target.innerHTML = Templates.editor(this.toolbar, this.options)
        // Grab dom elements
        this.editorNode = target.querySelector('.editor-body')
        this.toolbarNode = target.querySelector('.editor-toolbar')
        // Check for debugging
        this.debugTarget = false
        if ( this.options.debug ){
            const div = document.createElement('div')
            this.debugTarget = Helpers.insertAfter( div, this.editorNode )
        }
        // *** TEST THE MODALS ***
        // Uncomment the next two lines for development testing
        // this.testModals('positioned')  // options are 'overlay', 'positioned', 'drawer' and 'full-screen'
        // return
        // Set up event handling
        this.listenForMouseUpEvents()
        this.listenForPasteEvents()
        this.listenForKeydownEvents()
        // Optional buffering setup
        if ( this.options.bufferSize > 0 ){
            this.bufferIndex = 0
            this.buffer = [this.editorNode.innerHTML]
            this.listenForKeyupEvents()
        }
        // Public methods to support saving and updating the editor content
        this.preview = this.getCleanData
        this.update = this.updateEditor
        // Observe changes in the editor
        const config = { attributes: false, childList: true, subtree: true }
        const observer = new MutationObserver(()=>this.handleMutation())
        observer.observe(this.editorNode,config)
        // Define an empty modal so can check if any active
        this.modal = new Modal()
        // Initialise the editor content
        this.initEditor(content)
    }

    /**
     * Add a hidden download button to the dom with the encoded contents of hte editor
     */
    download(){
        let xml = this.getCleanData()
        const link = document.createElement('a')
        const filename = 'arte-download.arte'
        link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(xml))
        link.setAttribute('download', filename)
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        link.remove()
    }

    /**
     * Handle file upload
     * @param {HTMLElement} input 
     * @returns 
     */
    handleFileUpload(input){
        const file = input.files[0]
        if (!file) {
            return
        }
        const reader = new FileReader()
        reader.onload = event => {
            const content = event.target.result
            console.warn(content)
            this.initEditor(content)
        }
        reader.readAsText(file)
        // Remove the input (avoids ,ultiple event listeners amongst other things)
        input.remove()
    }

    upload(){
        let input = document.getElementById('arte-upload')
        if ( input == null ){
            input = document.createElement('input')
            input.id = 'arte-upload'
            input.type = 'file'
            input.style.display = 'none'
            input.accept = '.arte'
            console.log('input', input.outerHTML)
            input.addEventListener('change', () => this.handleFileUpload(input),false)
            document.body.appendChild(input)
        }
        input.click()
    }

    /**
     * Handle mutations to the editor node as a result of dom insertions or removals
     * Keyboard entry is handled separately
     */
    handleMutation() {
        if ( this.bufferIgnoreMutation(this) === false ){
            if ( this.options.debug ){
                console.log('MUTATED')
            }
            this.bufferUpdate(this)
            this.updateEventHandlers()
        }
    }

    /**
     * Initialise the buffering vars and methods
     */
    initBuffering(){
        this.bufferIndex = -1
        this.buffer = []
        this.bufferIgnore = false
        this.bufferUpdate = Buffer.update
        this.bufferIgnoreMutation = Buffer.ignore
        // if ( this.options.debug ){
        //     console.log('detached',this.buffer)
        //     console.log('buffer index', this.bufferIndex)
        // }
    }

    /**
     * Initialise the optional editor parameters
     * @param {object} options 
     * @returns 
     */
    initOptions(options){   
        const headingNumbers = true
        const bufferSize = 10     
        const debug = false
        if ( options ){
            options.headingNumbers = options.headingNumbers == undefined ? headingNumbers : options.headingNumbers
            options.bufferSize = options.bufferSize == undefined ? bufferSize : Math.max(parseInt(options.bufferSize),bufferSize)
            options.debug = options.debug == undefined ? debug : options.debug
        } else {
            options = {
                headingNumbers,
                bufferSize,
                debug
            }
        }
        return options
    }

    /**
     * Initialise the editor content, either with the current content passed in or 
     * optionally using the 
     * @param {string} content The content passed into the editor when created
     */
    async initEditor(content=''){
        // Request default content?
        if ( content=='' && this.options.defaultContent && this.options.defaultContent != '' ){
            const response = await fetch(this.options.defaultContent)
            // console.log(response)
            if ( response.status == 200 ){
                content = await response.text()
                // console.log(content)
            }
        }
        // initialise buffering
        this.initBuffering()
        // Add the content to the editor node
        this.editorNode.innerHTML = content
        // Reset range
        this.range = false
        // Initialise buttons (some of which require the editor content to have been loaded)
        this.initialiseButtons()
    }

    /**
     * Initialiase the toolbar with the grouped buttons
     * @param {object[][]} groups 
     * @returns 
     */
    initToolbar(groups){
        let toolbar = []
        groups.forEach( (group,groupIndex) => {
            group.forEach( button => {
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
    setState( button ){
        let handled = false
        // If not a buffer button al buttons are disabled and 
        // inactive if there is no range or the range is in a custom element
        if ( button.type !== 'detached' ){
            if ( this.range === false || this.range.custom ){
                handled = true
                button.element.disabled = true
                button.element.classList.remove('active')
            }
        } 
        if ( handled == false ){
            if ( "setState" in button ){
                button.setState( this, button )
            }
        }
    }

    /**
     * Reset states of all buttons
     */
    setStates( type='' ){
        this.toolbar.forEach( button => {
            if ( type == '' || button.type == type){
                this.setState( button )
            }
        })
    }

    /**
     * Initialise the toolbar buttons
     */
    initialiseButtons(){
        // Empty array of shortcuts
        this.shortcuts = []
        // Do any custom setup required
        this.toolbar.forEach( button => {
            // Add dom element to the button
            button.element = this.toolbarNode.querySelector(`#${button.tag}`)
            // Init formatting etc?
            if ( "init" in button ){
                button.init( this, button )
            }
            // Set initial button state
            this.setState( button )
            // Some button have shortcuts in which case save for use in the keydown
            // event handler
            if ( "shortcut" in button ){
                const shortcut = button.shortcut[0]
                const trigger = button.shortcut[1]
                this.shortcuts.push({
                    shortcut: button.shortcut[0],
                    trigger: button.shortcut[1],
                    button: button
                })
            }
            // All buttons have a click method
            button.element.addEventListener('click', event => {
                // Ignore if a modal is active
                if ( this.modal.active() ){
                    return
                }
                // Prevent default action for all buttons when have no range 
                // and not the undo-redo buffer buttons
                if ( this.range === false && button.type !== 'detached' ){
                    event.preventDefault()
                    return
                }
                button.click(this,button)
            })
        })
    }



    // -----------------------------------------------------------------------------
    // @section Mouse up events
    // -----------------------------------------------------------------------------

    /**
     * Listen for mouseup events on the document
     */
    listenForMouseUpEvents(){
        document.addEventListener('mouseup', event => {
            // Get the active element in the document
            const active = document.activeElement
            if ( this.options.debug ){
                console.log('mouseup on',event.target)
                console.log( 'active element', document.activeElement)
            }
            // Clicked a modal button?
            if ( this.modal.active() ){
                return
            // Clicked in the editor (but not a custom element which returns a
            // different active element)
            } else if ( active == this.editorNode ){
                this.handleMouseUp() 
            // Clicked in toolbar?
            } else if ( this.nodeInToolbar( event.target) ) {
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
    resetRange(){
        this.range = false
        this.toolbar.forEach( button => {
            this.setState( button )
        })
    }

    /**
     * Check if the node is within the editor section of the dom tree
     * @param {HTMLElement} node 
     * @returns {boolean} true if the node is in the editor
     */
    nodeInEditor(node){
        while ( node.nodeType == 3 || node.tagName != 'HTML' || node.contentEditable != false ){
            if ( node == this.editorNode ){
                return true
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
    nodeInToolbar(node){
        while ( node.nodeType == 3 || node.tagName != 'HTML' ){
            if ( node == this.toolbarNode ){
                return true
            }
            node = node.parentNode
        }
        return false
    }

    /**
     * Set the states of all toolbar buttons
     */
    setToolbarStates(){
        if ( this.range === false ){
            this.toolbar.forEach( button => {
                button.element.classList.remove('active')
            })
            return
        }
        this.toolbar.forEach( button => {
            this.setState( button )
        })
    }

    /**
     * Handle the mouse up event in order to potentially insert a paragraph in
     * an empty editor, highlight a custom node if selected
     */
    handleMouseUp(){
        if ( this.options.debug ){
            console.log('Handle mouse up')
            console.log('handleMouseUp range=',this.range)
        }
        this.updateRange()
        // let formats = []
        if ( this.range !== false ){
            this.bufferIgnore = false
            // If enter cursor in an empty editor then make this a paragraph
            // rather than raw text
            if ( this.range.blockParent == this.editorNode && 
                 this.editorNode.innerText == ''){
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
    insertParagraph(){
        let p = document.createElement('P')
        // Create a placeholder to ensure set cursor works
        p.innerText = '\n'
        p = this.editorNode.appendChild(p)
        Helpers.setCursor( p, 0)
        this.updateRange()
        this.setToolbarStates()
    }


    // -----------------------------------------------------------------------------
    // @section Keydown events
    // -----------------------------------------------------------------------------
    
    /**
     * List for keydown events on the editor node
     */
    listenForKeydownEvents(){
        this.lastKey = ''
        this.editorNode.addEventListener('keydown', event => {
            let handled = false
            if ( this.options.debug ){
                console.log('control key?',event.ctrlKey)
                console.log('key',event.key)
            }
            // Check if a modal dialogue is shown - ignore key entry?
            if ( document.querySelectorAll('.show').length > 0 ){
                event.preventDefault()
                handled = true
            }
            // Override normal browser enter key action
            if ( !handled && event.key == 'Enter' ) {
                if ( this.handleEnter() ){
                    event.preventDefault()
                }
                handled = true
            }
            // Prevent deletion of customised blocks
            if ( !handled && (event.key == 'Backspace' || event.key == 'Delete' || 
                        (event.ctrlKey && event.key == 'd')) ){
                if ( this.handleDelete(event.key) ){
                    event.preventDefault()
                }
                handled = true
            } 
            // Check shortcuts
            if ( !handled ) { 
                this.shortcuts.forEach( item => {
                    if ( this.lastKey === item.shortcut && event.key === item.trigger ){
                        // Prevent default so key not echo'd to the screen
                        event.preventDefault()
                        // Stop propagation to prevent other event handlers responding
                        event.stopPropagation()
                        // Trigger the dialogue with the then current range
                        item.button.click( this, item.button )
                        handled = true
                    }
                })
            }
            // Undo/redo events
            if ( !handled && this.bufferSize>0){
                if ( (event.ctrlKey || event.metaKey) && event.key == 'z' ){
                    event.preventDefault()
                    // Redo
                    let button
                    if ( event.shiftKey  ){
                        button = this.toolbar.find( b => b.tag == 'REDO')
                    // Undo
                    } else {
                        button = this.toolbar.find( b => b.tag == 'UNDO')
                    }
                    this.buffer.click(button)
                    this.updateEventHandlers()
                    handled = true
                }
            }
            this.lastKey = event.key
        })
    }

    /**
     * Handle enter key pressed in editor node
     */
    handleEnter(){
        this.updateRange()
        if ( this.range === false ){
            return
        }
        const endNormal = this.range.endContainer.textContent.trim().length == this.range.endOffset
        let handled = false
        if ( this.range.custom || endNormal ) {
            // console.log(`Creating a ${this.range.blockParent.tagName} node`)
            let n = document.createElement(this.range.blockParent.tagName)
            n.innerText = '\n'
            n = Helpers.insertAfter( n, this.range.blockParent )
            Helpers.setCursor( n, 0 )
            handled = true
        }
        if ( this.range.custom ){
            this.highlightCustomNode(false)
        }
        // Reset the range which must be done after a delay since this
        // method was triggered on keydown before added to dom
        setTimeout( () => this.updateRange(), 10 )
        return handled
    }

    /**
     * Handle delete key
     * @param {string} key
     * @returns {boolean} true if need to prevent default action
     */
    handleDelete(key){
        if ( key == 'd' ){
            key = 'Delete'
        }
        this.updateRange()
        if ( this.range ){
            const feedback = new Modal({
                type:'overlay', 
                severity:'info',
                title: 'Information',
                html: `
                    <p>Your selection contains one or more active elements, such as comments or links.</p>
                    <p>To delete active elements you need to edit them individually and choose Delete.</p>
                    `,
                escape:true,
                buttons: {cancel:{label:'Close'}}
            })
            // Single selection
            if ( this.range.collapsed ){
                // Check for back spacing from a single selection point
                if ( key == 'Backspace' && this.range.startOffset == 0 ){
                    // Back spacing into a block containing a non-editable block?
                    const previous = this.range.blockParent.previousElementSibling
                    if ( previous && previous.querySelector( '[contenteditable="false"]') ){
                        feedback.show()
                        return true
                    }
                // Forward delete in a none-editable block?
                } else if ( key == 'Delete' && this.range.endContainer.textContent.trim().length == this.range.endOffset ){
                    const next = this.range.endContainer.nextElementSibling
                    if ( next && next.getAttribute("contenteditable") == 'false' ){
                        feedback.show()
                        return true
                    }
                }
            // Back spacing or deleting in a multiple selection
            } else {
                // Loop from start container to end container checking for a non-editable block
                let parent = Helpers.getParentBlockNode(this.range.startContainer)
                const endParent = Helpers.getParentBlockNode(this.range.endContainer)
                while ( parent !== endParent ){
                    if ( parent.innerHTML.includes('contenteditable="false"') ){
                        feedback.show()
                        return true
                    }
                    parent = parent.nextElementSibling
                }
            }
        }
        // Reset the range which must be done after a delay since this
        // method was triggered on keydown before added to dom
        // Must invoke with arrow function so that the instance context is retained
        setTimeout( () => this.updateRange(), 10 )
        return false
    }

    // -----------------------------------------------------------------------------
    // @section Keyup events
    // -----------------------------------------------------------------------------
    
    /**
     * Listen for key up events on the editor node
     */
    listenForKeyupEvents(){
        // Set the handleKeyup method to be the debounced method handleKeyupDelayed
        this.handleKeyup = Helpers.debounce(this.handleKeyupDelayed,500)
        this.editorNode.addEventListener( 'keyup', event => {
            const ignore = ['Shift']
            // console.log('handle key up event',event)
            if ( ignore.includes(event.key) == false ){
                this.bufferIgnore = true
                this.handleKeyup(event.key,this)
            }
        })
    }

    /**
     * Handle keyup events (after being debounced)
     * @param  {...any} args Handle keyup events
     */
    handleKeyupDelayed(...args){
        // Nav keys that just need to set new toolbar states
        const navigation = ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','End','Home']
        let key = args[0]
        //console.log('key',key)
        const editor = args[1]
        // Check if navigating in the editor
        if ( navigation.includes(key) ){
            editor.range = Helpers.getRange()
            editor.setToolbarStates()
        // Update the buffer?
        } else {
            // Check if a modal dialogue is shown - do not buffer if so
            if ( document.querySelectorAll('.show').length == 0 ){
                editor.bufferUpdate(editor)
            }
        }
    }

    // -----------------------------------------------------------------------------
    // @section Custom event handlers
    // -----------------------------------------------------------------------------
    
    /**
     * Active custom elements are likely to require their event handlers to be reset
     * after updates to the dom
     */
    updateEventHandlers(){
        // console.log('Updating event handlers')
        this.toolbar.forEach( button => {
            if ( 'addEventHandlers' in button ){
                // console.log('Updating event handlers for button',button.tag)
                button.addEventHandlers(this)
            }

        })
    }

    // -----------------------------------------------------------------------------
    // @section Cut, Copy and Paste events
    // -----------------------------------------------------------------------------
    
    /**
     * List for cut, copy and paste events in the editor node
     */
    listenForPasteEvents(){
        const events = ['cut', 'copy','paste']
        events.forEach( evt =>
            this.editorNode.addEventListener(evt, event=>{
                if ( this.handleCutCopyPaste() ){
                    event.preventDefault()
                }
            })
        )
    }

    /**
     * Handle cut, copy paste events. Prevent any that would involve custom elements
     * @returns {boolean} true if should be blocked
     */
    handleCutCopyPaste(){
        // console.log('Detected cut-copy-paste event')
        this.updateRange()
        // Ensure have a range that is not collapsed
        if ( this.range==false || this.range.collapsed ){
            return false
        }
        // Loop from start container to end container checking for a non-editable block
        let parent = Helpers.getParentBlockNode(this.range.startContainer)
        const endParent = Helpers.getParentBlockNode(this.range.endContainer)
        let done = false
        while ( !done ){
            if ( parent.innerHTML.includes('contenteditable="false"') ){
                const feedback = new Modal({
                    type:'overlay', 
                    severity:'info',
                    title: 'Information',
                    html: `<p>Cut, copy and paste (of or over) selections with custom block elements is not supported.</p>
                           <p>Please modify your selection and try again.</p>`,
                    escape:true,
                    buttons: {cancel:{label:'Close'}}
                })
                feedback.show()
                return true
            }
            parent = parent.nextElementSibling
            if ( parent === endParent ){
                done = true
            }
        }
        return false
    }

    // -----------------------------------------------------------------------------
    // @section Testing
    // -----------------------------------------------------------------------------
    
    testModals( type ){

        // Warning modal
        if ( type == 'overlay' ){
            const modal = new Modal({
                type: 'overlay',
                title:'Example feedback modal', 
                html:`
                    <p>This is an example of an overlay modal.</p>
                    <p>It can be dismissed by selecting the "escape" option and/or by adding a "cancel" button.</p>
                    <p>It also demonstrates the display of a graphic icon which is configured by setting the severity option.</p>`, 
                severity:'warning',
                escape:true,
                buttons:{ cancel: {label:'OK'} }
            })
            modal.show()

        // Edit modal with buttons and callbacks
        } else if ( type == 'drawer' ){
            const modal = new Modal({
                type:'drawer',
                title:'Example of an edit modal', 
                html:`
                    <p>This modal type provides a placeholder for custom content, such as a form with values that can be edited.</p>
                    <p>It is typically used by specifying a number of standard buttons, such as "cancel", "delete" or "confirm".</p>
                    <p>Each button may have an associated callback function assigned. If none is assigned the default action is to close the modal.</p>`,
                buttons: {
                    cancel : { label:'Cancel' }, 
                    delete : { label:'Delete', callback:()=>alert('delete')},
                    confirm : {label:'Confirm', callback:()=>alert('confirm')}
                }
            })
            modal.show()

        // Positioned modal
        } else if ( type == 'positioned' ){
            this.editorNode.addEventListener( 'click', ()=> {
                this.updateRange()
                const modal = new Modal({
                    type:'positioned',
                    escape:true,
                    backgroundColour:'palegreen',
                    borderRadius:'10px',
                    html:`
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
    // @section Other methods
    // -----------------------------------------------------------------------------
    
    /**
     * Clean the editor node contents
     * @returns {string} The cleaned html data
     */
    getCleanData(){
        let node = this.editorNode.cloneNode(true)
        const customButtons = this.toolbar.filter( button => button.type==='custom' )
        Helpers.cleanForSaving(node, customButtons)
        // Remove new lines and spaces before opening tags
        node.innerHTML = node.innerHTML.replace(/[\n ]*?</gm, '<')
        return node.innerHTML
    }

    /**
     * UPdate the editor node with the supplied content
     * @param {string} content 
     */
    updateEditor(content){
        this.editorNode.innerHTML = content
    }

    /**
     * Get the new range in the editor node and when debugging display this
     */
    updateRange(){
        // Check for empty editor - in which case insert a new paragraph
        if ( this.editorNode.innerHTML.trim() == '' ){
            this.insertParagraph()
            // Return as insertParagraph reinvokes this method
            return
        }
        //console.log('modal active',this.modal.active())
        if ( this.modal.active() == false ){
            this.range = Helpers.getRange()
            if ( this.options.debug ){
                Templates.debugRange( this.debugTarget, this.range )
            }
        }
    }
 
    /**
     * Remove "custom-selected" class from all custom elements and then add to 
     * any child of the parentNode if it is a custom.
     * @param {HTMLElement|false} node Either a custom node or false
     */
    highlightCustomNode(node){
        //console.log('node',node)
        const customs = this.editorNode.querySelectorAll('[contenteditable=false]')
        customs.forEach(custom => {
            custom.classList.remove('custom-selected')
        })
        if ( node ){
            node.classList.add('custom-selected')
        }
    }

} // End of class definition

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export default Editor
