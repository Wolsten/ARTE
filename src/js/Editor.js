"use strict"

import * as Templates from './templates.js'
import * as Helpers from './helpers.js'
// import * as Blocks from './plugins/blocks.js'
// import * as Inline from './plugins/inline.js'
// import * as Styles from './plugins/styles.js'
import * as Buffer from './plugins/buffer.js'

class Editor {

    // -----------------------------------------------------------------------------
    // @section Initialisation
    // -----------------------------------------------------------------------------

    /**
     * 
     * @param node target The dom node to populate with the toolbar and editor
     * @param string content The initial HTML content for the editor
     * @param array groups 2-d array of buttons
     * @param false|{*} buffer instance 
     * @param {*} options Options, such as the buffer size for undo/redo operations
     */
    constructor( target, content, groups, options ){
        // Initialise options
        this.options = this.initOptions(options)
        // initialise buffering
        this.initBuffering(content)
        // Initialise the toolbar
        this.toolbar = this.initToolbar(groups)
        // Initialise the editor
        target.innerHTML = Templates.editor(this.toolbar, this.options)
        // Grab dom elements
        this.editorNode = target.querySelector('.editor-body')
        this.toolbarNode = target.querySelector('.editor-toolbar')
        // Add the content
        this.editorNode.innerHTML = content
        // // Initialise plugins
        // this.initialisePlugins()
        // Reset global range
        this.range = false
        // Set up event handling
        this.listenForMouseUpEvents()
        this.listenForKeydownEvents()
        this.listenForPasteEvents()
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
     * 
     */
    handleMutation() {
        if ( this.bufferIgnoreMutation(this) === false ){
            console.log('MUTATED')
            this.bufferUpdate(this)
            this.updateEventHandlers()
        }
    }

    initBuffering(){
        this.bufferIndex = -1
        this.buffer = []
        // if ( this.options.bufferSize > 0 ){
        //     this.bufferIndex = 0
        //     this.buffer = [content]
        // }
        this.bufferIgnore = false
        this.bufferUpdate = Buffer.update
        this.bufferIgnoreMutation = Buffer.ignore
        console.log('buffer',this.buffer)
        console.log('buffer index', this.bufferIndex)
    }

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

    initToolbar(groups){
        let toolbar = []
        toolbar = toolbar.sort( (a,b) => a.group - b.group )
        groups.forEach( (group,index) => {
            group.forEach( button => {
                button.group = index
                Helpers.registerTag(button.type, button.tag)
                toolbar.push(button)
            })
        })
        return toolbar
    }

    // initialisePlugins(){
    //     // Initialise any plugins that require this, passing in the editor instance
    //     this.options.plugins.forEach( plugin => {
    //         if ( "init" in plugin ){
    //             plugin.init( this )
    //         }
    //     })
    // }

    initialiseButtons(){
        // Do any custom setup required
        this.toolbar.forEach( button => {
            // Add dom element to the button
            button.element = this.toolbarNode.querySelector(`#${button.tag}`)
            // Init formatting etc?
            if ( "init" in button ){
                button.init( this, button )
            }
            // Set initial button state
            if ( "setState" in button ){
                button.setState( this, button )
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
                        button.click( this, button )
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
                button.click(this,button)
            })
        })
    }



    // -----------------------------------------------------------------------------
    // @section Mouse up events
    // -----------------------------------------------------------------------------

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

    handleEditorBlur( event ){
        console.log('editor blurred')
        this.toolbar.forEach( button => {
            // if ( button.type === 'buffer' ){
            //     this.buffer.disabled(button)
            // } else {
                this.range = false
                button.setState( this, button )
            // }
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

    setToolbarStates(){
        if ( this.range === false ){
            this.toolbar.forEach( button => {
                button.element.classList.remove('active')
            })
            return
        }
        // Get the applied formats for the range selected (all way up to the highest parent 
        // inside the editor)
        //const formats = Helpers.appliedFormats(this.range.startContainer, this.editorNode, this.range.rootNode, '')
        this.toolbar.forEach( button => button.setState( this, button ) )
    }

    handleMouseUp(){
        // // console.log('Handle mouse up')
        // this.range = Helpers.getRange()
        // // console.log('handleMouseUp range=',this.range)
        // Templates.debugRange(this.range)
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
            this.highlightCustomNode(false)
            const custom =  Helpers.getCustomParent(this.range)
            if ( custom ){
                this.highlightCustomNode(custom)
            }
        }
        this.setToolbarStates()
    }

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
        // this.range = Helpers.getRange()
        // Templates.debugRange(this.range)
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
        // const range = Helpers.getRange()
        // Templates.debugRange(range)
        this.updateRange()
        if ( this.range ){
            const example = this.toolbar.find(button => button.type==='custom')
            const title = 'Information'
            const message = `To delete a custom element (such as an ${example.tag}) you need to edit it by clicking it and choosing Delete.`
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
    
    listenForKeyupEvents(){
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

    handleKeyupDelayed(...args){
        const navigation = ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','End','Home']
        let key = args[0]
        //console.log('key',key)
        const editor = args[1]
        if ( navigation.includes(key) ){
            editor.range = Helpers.getRange()
            editor.setToolbarStates()
        } else {
            editor.bufferUpdate(editor)
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
        this.updateRange()
        // const range = Helpers.getRange()
        // Templates.debugRange(range)
        // Ensure have a range that is not collapsed
        if ( this.range==false || this.range.collapsed ){
            return false
        }
        // Loop from start container to end container checking for a non-editable block
        let parent = Helpers.getParentBlockNode(this.range.startContainer)
        const endParent = Helpers.getParentBlockNode(this.range.endContainer)
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

    updateRange(){
        this.range = Helpers.getRange()
        Templates.debugRange( this.range )
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
