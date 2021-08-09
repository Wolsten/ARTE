"use strict"

import * as Templates from './templates.js'
import * as Helpers from './helpers.js'
import * as Buffer from './plugins/buffer.js'
import * as Feedback from './modalFeedback.js'

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
    constructor( target, content, toolbar, options ){
        // Initialise options
        this.options = this.initOptions(options)
        // initialise buffering
        this.initBuffering(content)
        // Initialise the toolbar
        this.toolbar = this.initToolbar(toolbar)
        // Initialise the editor
        target.innerHTML = Templates.editor(this.toolbar, this.options)
        // Grab dom elements
        this.editorNode = target.querySelector('.editor-body')
        this.toolbarNode = target.querySelector('.editor-toolbar')
        // Add the content
        this.editorNode.innerHTML = content
        // Reset range
        this.range = false
        // Set up event handling
        this.listenForMouseUpEvents()
        this.listenForPasteEvents()
        this.listenForKeydownEvents()
        this.initialiseButtons()
        // Optional buffering setup
        if ( this.options.bufferSize > 0 ){
            this.bufferIndex = 0
            this.buffer = [this.editorNode.innerHTML]
            this.listenForKeyupEvents()
        }
        // Public methods to support saving and updating the editor content
        this.save = this.getCleanData
        this.update = this.updateEditor
        // Observe changes in the editor
        const config = { attributes: false, childList: true, subtree: true }
        const observer = new MutationObserver(()=>this.handleMutation())
        observer.observe(this.editorNode,config)
    }

    /**
     * Handle mutations to the editor node as a result of dom insertions or removals
     * Keyboard entry is handled separately
     */
    handleMutation() {
        if ( this.bufferIgnoreMutation(this) === false ){
            console.log('MUTATED')
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
        // console.log('buffer',this.buffer)
        // console.log('buffer index', this.bufferIndex)
    }

    /**
     * Initialise the optional editor parameters
     * @param {object} options 
     * @returns 
     */
    initOptions(options){   
        const headingNumbers = 'off'
        const bufferSize = 10     
        if ( options ){
            options.headingNumbers = options.headingNumbers !== undefined ? options.headingNumbers : headingNumbers
            options.bufferSize = options.bufferSize !== undefined ? Math.max(parseInt(options.bufferSize),bufferSize) : bufferSize
        } else {
            options = {
                headingNumbers,
                bufferSize
            }
        }
        return options
    }

    /**
     * Initialiase the toolbar with the grouped buttons
     * @param {object[][]} groups 
     * @returns 
     */
    initToolbar(groups){
        let toolbar = []
        groups.forEach( (group,index) => {
            group.forEach( button => {
                button.group = index
                Helpers.registerTag(button.type, button.tag)
                toolbar.push(button)
            })
        })
        return toolbar
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
            button.setState( this, button )
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
            // All buttons have a click method (but undefined for buffer buttons)
            button.element.addEventListener('click', event => {
                // Prevent default action for all buttons when have no range 
                // and not the undo-redo buffer buttons
                if ( this.range === false && button.type !== 'buffer' ){
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
     * Listen for mouseup events on the whole document and blur
     * events on the editor
     */
    listenForMouseUpEvents(){
        document.addEventListener('mouseup', event => {
            // console.warn('mouseup on',event.target)
            if ( this.nodeInEditor( event.target ) ){
                this.handleMouseUp() 
            } else if ( this.nodeInToolbar( event.target) ) {
                return   
            } else {
                this.handleEditorBlur()
            }
        })
    }

    /**
     * Handle blur event in the editor
     * @param {Event} event 
     */
    handleEditorBlur( event ){
        console.log('editor blurred')
        this.toolbar.forEach( button => {
            this.range = false
            button.setState( this, button )
            button.element.classList.remove('active')
        })
    }

    /**
     * Check if the node is within the editor section of the dom tree
     * @param {HTMLElement} node 
     * @returns {boolean} true if the node is in the editor
     */
    nodeInEditor(node){
        while ( node.nodeType == 3 || node.tagName != 'HTML' ){
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
            if ( "setState" in button ){
                button.setState( this, button )
            }
        })
    }

    /**
     * Handle the mouse up event in order to potentially insert a paragraph in
     * an empty editor, highlight a custom node if selected
     */
    handleMouseUp(){
        // console.log('Handle mouse up')
        // console.log('handleMouseUp range=',this.range)
        this.updateRange()
        // let formats = []
        if ( this.range !== false ){
            this.bufferIgnore = false
            // If enter cursor in an empty editor then make this a paragraph
            // rather than raw text
            if ( this.range.blockParent == this.editorNode && this.editorNode.innerText == ''){
                this.insertParagraph()
            }
            // Unselect custom blocks and highlight this one if custom 
            const custom =  Helpers.getCustomParent(this.range)
            this.highlightCustomNode(custom)
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
            console.log('control key?',event.ctrlKey)
            console.log('key',event.key)
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
        // this.range = Helpers.getRange()
        // Templates.debugRange(this.range)
        this.updateRange()
        if ( this.range === false ){
            return
        }
        const custom =  Helpers.getCustomParent(this.range)
        const endNormal = this.range.endContainer.textContent.trim().length == this.range.endOffset
        let handled = false
        if ( custom || endNormal ) {
            console.log(`Creating a ${this.range.blockParent.tagName} node`)
            let n = document.createElement(this.range.blockParent.tagName)
            n.innerText = '\n'
            n = Helpers.insertAfter( n, this.range.blockParent )
            Helpers.setCursor( n, 0 )
            handled = true
        }
        if ( custom ){
            this.highlightCustomNode(false)
        }
        // Get the new range
        this.updateRange()
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
            const title = 'Information'
            const message = `To delete a custom element you need to edit it by clicking it and choosing Delete.`
            // Single selection
            if ( this.range.collapsed ){
                console.log('Single selection')
                console.log('range length', this.range.endContainer.textContent.trim().length)
                console.log('range endOffset', this.range.endOffset)
                // Check for back spacing from a single selection point
                if ( key == 'Backspace' && this.range.startOffset == 0 ){
                    // Back spacing into a non-editable block?
                    const previous = this.range.blockParent.previousElementSibling
                    if ( previous && previous.innerHTML.includes('contenteditable="false"') ){
                        Feedback.show(title, message)
                        return true
                    }
                // Forward delete in a none-editable block?
                } else if ( key == 'Delete' && this.range.endContainer.textContent.trim().length == this.range.endOffset ){
                    console.log('Deleting from end container')
                    const next = this.range.endContainer.nextElementSibling
                    console.log('next',next)
                    if ( next && next.getAttribute("contenteditable") == 'false' ){
                        Feedback.show(title, message)
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
                        Feedback.show(title, message)
                        return true
                    }
                    parent = parent.nextElementSibling
                }
            }
        }
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
            console.log('handle key up event',event)
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
        //console.log('Updating event handlers')
        this.toolbar.forEach( button => {
            if ( 'addEventHandlers' in button ){
                console.log('Updating event handlers for button',button.tag)
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
                // } else {
                //     // Update buffer
                //     setTimeout( ()=>this.handleKeyup(this), 1)
                }
            })
        )
    }

    /**
     * Handle cut, copy paste events. Prevent any that would involve custom elements
     * @returns {boolean} true if should be blocked
     */
    handleCutCopyPaste(){
        console.log('Detected cut-copy-paste event')
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
                const title = 'Information'
                const message = `Cut, copy and paste (of/over) selections with custom elements is not supported. Please modify your selection and try again.`
                Feedback.show(title, message)
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
        this.range = Helpers.getRange()
        Templates.debugRange( this.range )
    }
 
    /**
     * Remove "selected" class from all custom elements and then add to node 
     * (if not false)
     * @param {HTMLElement|false} node 
     */
    highlightCustomNode(node){
        const customs = this.editorNode.querySelectorAll('[contenteditable=false]')
        customs.forEach(custom=>custom.classList.remove('selected'))
        if ( node ){
            node.classList.add('selected')
        }
    }

}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export default Editor
