"use strict"

import * as Templates from './templates.js'
import * as Helpers from './helpers.js'
import * as Blocks from './plugins/blocks.js'
import * as Inline from './plugins/inline.js'
import * as Styles from './plugins/styles.js'
import Buffer from './plugins/buffer.js'

class Editor {

    // -----------------------------------------------------------------------------
    // @section Initialisation
    // -----------------------------------------------------------------------------

    /**
     * 
     * @param node target The dom node to populate with the toolbar and editor
     * @param string content The initial HTML content for the editor
     * @param {*} options Options, such as the buffer size for undo/redo operations
     */
    constructor( target, content, options ){
        // Initialise options
        this.options = this.initOptions(options)
        // initialise buffering
        this.buffer = new Buffer(options.bufferSize, this.updateEventHandlers)
        // Initialise the toolbar
        this.toolbar = this.initToolbar()
        // Initialise the editor
        target.innerHTML = Templates.editor(this.toolbar, this.options)
        // Grab dom elements
        this.editorNode = target.querySelector('.editor-body')
        this.toolbarNode = target.querySelector('.editor-toolbar')
        // Save this instance against the editor node
        // this.editorNode.dataset.editor = this
        // Add the content
        this.editorNode.innerHTML = content
        // Initialise plugins
        this.initialisePlugins()
        // Reset global range
        this.range = false
        // Set up event handling
        this.listenForMouseUpEvents()
        this.listenForKeydownEvents()
        this.listenForPasteEvents()
        this.initialiseButtons()
        if ( this.options.bufferSize > 0 ){
            this.buffer.init(this.editorNode)
            this.listenForKeyupEvents()
        }
        // Public methods to support saving and updating hte editor content
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
     * 
     */
    handleMutation() {
        if ( this.buffer.ignoreMutation() === false ){
            console.log('MUTATED')
            this.buffer.update()
            this.updateEventHandlers()
        }
    }

    initOptions(options){   
        // All standard supported tags - use these if not set in options
        const tags = ['H1','H2','P','OL','UL','B','I','U','CLEAR']
        const plugins = []
        const headingNumbers = 'off'
        const bufferSize = 10     
        if ( options ){
            options.tags = options.tags !== undefined ? options.tags : tags
            options.plugins = options.plugins !== undefined ? options.plugins : plugins
            options.headingNumbers = options.headingNumbers !== undefined ? options.headingNumbers : headingNumbers
            options.bufferSize = options.bufferSize !== undefined ? Math.max(parseInt(options.bufferSize),bufferSize) : bufferSize
        } else {
            options = {
                tags: tags,
                plugins,
                headingNumbers,
                bufferSize
            }
        }
        // Make sure all upper case
        for( let i=0; i<options.tags.length; i++){
            options.tags[i] = options.tags[i].toUpperCase()
        }
        return options
    }

    initToolbar(){
        const bufferCallback = this.options.bufferSize > 0 ? Buffer.update : false
        // Combine buttons so they can be sorted by grouping
        let toolbar = []
        // Add (filtered) standard buttons
        Blocks.buttons.forEach( button => {
            if ( this.options.tags.includes(button.tag) ){
                Helpers.registerTag(button.type, button.tag)
                toolbar.push(button)
            }
        })
        Styles.buttons.forEach( button => {
            if ( this.options.tags.includes(button.tag) ){
                toolbar.push(button)
            }
        })
        // Add optional copy-paste buffering
        if ( this.options.bufferSize > 0 ){
            toolbar.push(this.buffer.undoButton)
            toolbar.push(this.buffer.redoButton)
        }
        // Add custom plugin buttons
        this.options.plugins.forEach( plugin => {
            plugin.buttons.forEach( button => {
                Helpers.registerTag(button.type, button.tag)
                toolbar = [...toolbar, button]
            })
        })
        toolbar = toolbar.sort( (a,b) => a.group - b.group )
        return toolbar
    }

    initialisePlugins(){
        this.options.plugins.forEach( plugin => {
            if ( "init" in plugin ){
                plugin.init( this )
            }
        })
    }

    initialiseButtons(){
        // Do any custom setup required
        this.toolbar.forEach( button => {
            // Add dom element to the button
            button.element = this.toolbarNode.querySelector(`#${button.tag}`)
            // Set disabled flag on element. Requires range and button to be passed in
            // The toolbarButton class has default method which can be overridden
            // by adding a disabled method in the button options
            if ( button.type === 'buffer' ){
                this.buffer.disabled(button)
            }
            // Some button have shortcuts in which case listen for
            if ( "shortcut" in button ){
                this.editorNode.addEventListener('keydown', event =>{
                    if ( event.key === button.shortcut ){
                        // Prevent default so key not echo'd to the screen
                        event.preventDefault()
                        // Stop propagation to prevent other event handlers responding
                        event.stopPropagation()
                        // Trigger the dialogue with the then current range
                        button.click(this)
                    }
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
                Templates.debugRange(this.range)
                // this.clickToolbarButton(button)
                if ( button.type == 'buffer' ){
                    this.buffer.click(button)
                } else {
                    this.range = Helpers.getRange()
                    button.click(this)
                }
                // if ( "setState" in button ){
                //     this.range = Helpers.getRange()
                //     if ( this.range !== false ) { 
                //         Templates.debugRange( this.range )
                //         button.setState( this.range )
                //     }
                // }
            })
            // if ( "changed" in button ){
            //     button.element.addEventListener('input', () => button.changed() )
            //     button.element.addEventListener('cancel', () => console.log('cancelled') )
            // }
        })
    }

    // -----------------------------------------------------------------------------
    // @section Mouse up events
    // -----------------------------------------------------------------------------

    listenForMouseUpEvents(){
        document.addEventListener('mouseup', event => {
            console.warn('mouseup on',event.target)
            if ( this.nodeInEditor( event.target ) ){
                this.handleMouseUp() 
            } else if ( this.nodeInToolbar( event.target) ) {
                return   
            } else {
                this.handleEditorBlur()
            }
        })
    }

    handleEditorBlur( event ){
        console.log('editor blurred')
        this.toolbar.forEach( button => {
            if ( button.type === 'buffer' ){
                this.buffer.disabled(button)
            } else {
                button.setState( false )
            }
            button.element.classList.remove('active')
        })
    }

    nodeInEditor(node){
        while ( node.nodeType == 3 || node.tagName != 'HTML' ){
            if ( node == this.editorNode ){
                return true
            }
            node = node.parentNode
        }
        return false
    }

    nodeInToolbar(node){
        while ( node.nodeType == 3 || node.tagName != 'HTML' ){
            if ( node == this.toolbarNode ){
                return true
            }
            node = node.parentNode
        }
        return false
    }

    setToolbarStates(range){
        if ( range === false ){
            this.toolbar.forEach( button => {
                button.element.classList.remove('active')
            })
            return
        }
        // Get the applied formats for the range selected (all way up to the highest parent 
        // inside the editor)
        //const formats = Helpers.appliedFormats(this.range.startContainer, this.editorNode, this.range.rootNode, '')
        this.toolbar.forEach( button => {
            // Trigger disabled method on each button
            if ( button.type === 'buffer' ){
                this.buffer.disabled( button )
            } else {
                button.setState( range )
            }
        })
    }

    handleMouseUp(){
        console.log('Handle mouse up')
        this.range = Helpers.getRange()
        // console.log('handleMouseUp range=',this.range)
        Templates.debugRange(this.range)
        // let formats = []
        if ( this.range !== false ){
            this.buffer.ignore = false
            // If enter cursor in an empty editor then make this a paragraph
            // rather than raw text
            if ( this.range.blockParent == this.editorNode && this.editorNode.innerText == ''){
                this.insertParagraph()
            }
            // Unselect custom blocks and highlight this one if custom 
            this.highlightCustomNode(false)
            const custom =  Helpers.getCustomParent(this.range)
            if ( custom ){
                this.highlightCustomNode(custom)
            }
        }
        this.setToolbarStates(this.range)
    }

    insertParagraph(){
        let p = document.createElement('P')
        // Create a placeholder to ensure set cursor works
        p.innerText = '\n'
        p = this.editorNode.appendChild(p)
        Helpers.setCursor( p, 0)
    }

    // -----------------------------------------------------------------------------
    // @section Toolbar button clicks
    // -----------------------------------------------------------------------------
    
    // clickToolbarButton(button){
    //     console.log('clicked button',button.tag)
    //     // All buttons must have a click method so invoke
    //     if ( button.type == 'buffer' ){
    //         this.buffer.click(button)
    //     } else {
    //         this.range = Helpers.getRange()
    //         button.click(this)
    //     }
    //     // @todo - is it right to comment this out? Some clicks are completed immediately
    //     // i.e. block, inline formatting but not links, mentions and custom plugins
    //     // // Reset event handlers for any buttons that require it. As now pass in the editor this
    //     // can ve done selectively so presumably ok
    //     // this.updateEventHandlers()
    //     // if ( this.range == undefined ){
    //     //     this.range = false
    //     // }
    //     // console.log('range',this.range)
    //     // this.handleMouseUp()
    // }


    // -----------------------------------------------------------------------------
    // @section Keydown events
    // -----------------------------------------------------------------------------
    
    listenForKeydownEvents(){
        this.editorNode.addEventListener('keydown', event => {
            console.log('control key?',event.ctrlKey)
            console.log('key',event.key)
            // CCheck if a modal dialogue is shown - ignore key entry?
            if ( document.querySelectorAll('.show').length > 0 ){
                event.preventDefault()
            // Override normal browser enter key action
            } else if ( event.key == 'Enter' ) {
                if ( this.handleEnter() ){
                    event.preventDefault()
                }
            // Prevent deletion of customised blocks
            } else if ( event.key == 'Backspace' || event.key == 'Delete' || 
                        (event.ctrlKey && event.key == 'd') ){
                if ( this.handleDelete(event.key) ){
                    event.preventDefault()
                }
            // Undo/redo events
           } else if (this.bufferSize>0){
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
                }
            }
        })
    }

    handleEnter(){
        this.range = Helpers.getRange()
        Templates.debugRange(this.range)
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
        this.range = Helpers.getRange()
        Templates.debugRange(this.range)
        return handled
    }

    /**
     * 
     * @returns boolean true if need to prevent default action
     */
    handleDelete(key){
        if ( key == 'd' ){
            key = 'Delete'
        }
        const range = Helpers.getRange()
        Templates.debugRange(range)
        if ( range ){
            const example = this.toolbar.find(button => button.type==='custom')
            const title = 'Information'
            const message = `To delete a custom element (such as an ${example.tag}) you need to edit it by clicking it and choosing Delete.`
            // Single selection
            if ( range.collapsed ){
                console.log('Single selection')
                console.log('range length', range.endContainer.textContent.trim().length)
                console.log('range endOffset', range.endOffset)
                // Check for back spacing from a single selection point
                if ( key == 'Backspace' && range.startOffset == 0 ){
                    // Back spacing into a non-editable block?
                    const previous = range.blockParent.previousElementSibling
                    if ( previous && previous.innerHTML.includes('contenteditable="false"') ){
                        Feedback.show(title, message)
                        return true
                    }
                // Forward delete in a none-editable block?
                } else if ( key == 'Delete' && range.endContainer.textContent.trim().length == range.endOffset ){
                    console.log('Deleting from end container')
                    const next = range.endContainer.nextElementSibling
                    console.log('next',next)
                    if ( next && next.getAttribute("contenteditable") == 'false' ){
                        Feedback.show(title, message)
                        return true
                    }
                }
            // Back spacing or deleting in a multiple selection
            } else {
                // Loop from start container to end container checking for a non-editable block
                let parent = Helpers.getParentBlockNode(range.startContainer)
                const endParent = Helpers.getParentBlockNode(range.endContainer)
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
    
    listenForKeyupEvents(){
        this.handleKeyup = Helpers.debounce(this.handleKeyupDelayed,500)
        this.editorNode.addEventListener( 'keyup', event => {
            console.log('handle key up event',event)
            this.handleKeyup(event.key,this) 
        })
    }

    handleKeyupDelayed(...args){
        const ignore = ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','End','Home']
        let key = args[0]
        const editor = args[1]
        // If arrow key just refresh the range and button states (active or inactive)
        if ( ignore.includes(key) ){
            editor.range = Helpers.getRange()
            editor.setToolbarStates(editor.range)
        } else {
            editor.buffer.update()
        }
    }

    // -----------------------------------------------------------------------------
    // @section Custom event handlers
    // -----------------------------------------------------------------------------
    
    /**
     * Active custom elements may require their click event handles to be reset
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
    
    listenForPasteEvents(){
        const events = ['cut', 'copy','paste']
        events.forEach( evt =>
            this.editorNode.addEventListener(evt, event=>{
                if ( this.handleCutCopyPaste() ){
                    event.preventDefault()
                }
                // Update buffer
                setTimeout( ()=>this.handleKeyup(this), 1)
            })
        )
    }

    handleCutCopyPaste(){
        console.log('Detected cut-copy-paste event')
        const range = Helpers.getRange()
        Templates.debugRange(range)
        // Ensure have a range that is not collapsed
        if ( range==false || range.collapsed ){
            return false
        }
        // Loop from start container to end container checking for a non-editable block
        let parent = Helpers.getParentBlockNode(range.startContainer)
        const endParent = Helpers.getParentBlockNode(range.endContainer)
        while ( parent !== endParent ){
            if ( parent.innerHTML.includes('contenteditable="false"') ){
                const example = this.toolbar.find(button => button.type==='custom')
                const title = 'Information'
                const message = `Cut, copy and paste (of/over) selections with custom elements (such as ${example.tag}s) is not supported. Please modify your selection and try again.`
                Feedback.show(title, message)
                return true
            }
            parent = parent.nextElementSibling
        }
        return false
    }


    // -----------------------------------------------------------------------------
    // @section Other methods
    // -----------------------------------------------------------------------------
    
    getCleanData(){
        let node = this.editorNode.cloneNode(true)
        const customButtons = this.toolbar.filter( button => button.type==='custom')
        Helpers.cleanForSaving(node, customButtons)
        node.innerHTML = node.innerHTML.replace(/\n[\n ]*?</gm, '<')
        return node.innerHTML
    }

    updateEditor(content){
        this.editorNode.innerHTML = content
    }
 
    /**
     * 
     * @param node|false node 
     */
    highlightCustomNode(node){
        // Remove "selected" class from all custom elements and then add back into this one
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
