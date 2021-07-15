"use strict"

import * as Templates from './templates.js'
// import * as ModalFeedback from './plugins/modalFeedback.js'
import * as Helpers from './helpers.js'
import * as Blocks from './blocks.js'
import * as Inline from './inline.js'
import * as Buffer from './plugins/buffer.js'

class Editor {

    // -----------------------------------------------------------------------------
    // @section Initialisation
    // -----------------------------------------------------------------------------

    constructor( target, content, options ){
        // Initialise options & toolbar
        this.options = this.initOptions(options)
        this.toolbar = this.initToolbar()
        // this.clicked = false
        // Initialise the editor
        target.innerHTML = Templates.editor(this.toolbar, this.options)
        this.editorNode = target.querySelector('.editor-body')
        this.toolbarNode = target.querySelector('.editor-toolbar')
        // Reset global range
        this.range = false
        // Add the content
        const clean = this.getCleanData(content)
        this.editorNode.innerHTML = clean
        // Events
        this.listenForMouseUpEvents()
        this.listenForKeydownEvents()
        this.listenForPasteEvents()
        // Initialise buttons for standard and custom plugins
        this.initialiseButtons()
        // Initialise buffer handling
        if ( this.options.bufferSize > 0 ){
            this.listenForKeyupEvents()
            setTimeout( () => Buffer.init({size:options.bufferSize, target:this.editorNode}), 100)
        }
    }

    initOptions(options){   
        // All standard supported tags
        const tags = ['H1','H2','P', 'OL','UL', 'B', 'I', 'U']
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
        console.log('options',options)
        return options
    }

    initToolbar(){
        let toolbar = []
        // Add (filtered) standard buttons
        Blocks.buttons.forEach( button => {
            if ( options.tags.includes(button.tag) ){
                toolbar.push(button)
            }
        })
        Inline.buttons.forEach( button => {
            if ( options.tags.includes(button.tag) ){
                toolbar.push(button)
            }
        })
        // Add optional copy-paste buffering
        if ( this.options.bufferSize > 0 ){
            toolbar = [...toolbar, ...Buffer.buttons]
        }
        // Add custom plugins
        this.options.plugins.forEach( plugin => {
            plugin.buttons.forEach( button => {
                button.type = 'custom'
                toolbar = [...toolbar, button]
            })
        })
        console.log('toolbar',toolbar)
        return toolbar
    }

    initialiseButtons(){
        // Do any custom setup required
        this.toolbar.forEach( button => {
            // Add dom element to the button
            button.element = this.toolbarNode.querySelector(`#${button.tag}`)
            // Set disabled flag on element. Requires range and button to be passed in
            // The toolbarButton class defaults has default method which can be overridden
            // by adding a disabled method in the button options
            button.disabled(false)
            // Perform any button initialisation by passing in the editorNode
            if ( "init" in button ){
                button.init(this.editorNode)
            }
            // Some button have shortcuts in which case listen for
            if ( "shortcut" in button && "click" in button){
                this.editorNode.addEventListener('keydown', event =>{
                    if ( event.key === button.shortcut ){
                        // Prevent default so key not echo'd to the screen
                        event.preventDefault()
                        // Stop propagation to prevent other event handlers responding
                        event.stopPropagation()
                        // Trigger the dialogue witht he then current range
                        button.click(this.range)
                    }
                })
            }
            // All button have a click method
            if ( "click" in button ){
                button.element.addEventListener('click', event => {
                    // Prevent default action for all buttons when have no range 
                    // and not the undo-redo buffer buttons
                    if ( this.range === false && button.type !== 'buffer' ){
                        event.preventDefault()
                        return
                    }
                    this.debugRange(this.range)
                    this.clickToolbarButton(button)
                })
            } else {
                console.debug(`The ${button.tag} button is missing a mandatory click handler`)
            }
        })
    }

    // -----------------------------------------------------------------------------
    // @section Mouse up events
    // -----------------------------------------------------------------------------
   
    

    listenForMouseUpEvents(){
        this.editorNode.addEventListener('mouseup', event => {
            if ( this.editorOrtoolbar( event.target ) ){
                this.handleMouseUp() 
            } else {
                this.handleEditorBlur()
            }
        })
        // this.editorNode.addEventListener('mouseup', () => this.handleMouseUp(true))
        // Use timeout on blur so buttons still active when first clicked from editor
        // this.editorNode.addEventListener('blur', () => {
        //     setTimeout( ()=>this.handleEditorBlur(), 200 )
        // })
        // this.editorNode.addEventListener('blur', event => {
        //     console.log('target', event.target)
        //     if ( editorOrtoolbarButtonParent( event.target ){
        //     this.handleEditorBlur()
        // })

        // document.body.addEventListener('mouseup', event => {
        //     console.log('moused up with target', event.target)
        // })
    }

    handleEditorBlur( event ){
        // if ( this.clicked == false ) {
            console.log('editor blurred')
            this.toolbar.forEach( button => {
                button.disabled( false )
                button.element.classList.remove('active')
            })
        // }
        // this.clicked = false
    }

    editorOrtoolbar(node){
        while ( node != document.body ){
            if ( node == this.editorNode || node == this.toolbarNode ){
                return true
            }
            node = node.parentNode
        }
        return false
    }

    handleMouseUp(){

        // this.clicked = true
        console.log('Handle mouse up')
        this.range = Helpers.getRange()
        console.log('handleMouseUp range=',this.range)
        this.debugRange(this.range)
        let formats = []
        if ( this.range !== false ){
            // If enter cursor in an empty editor then make this a paragraph
            // rather than raw text
            if ( this.range.blockParent == this.editorNode && this.editorNode.innerText == ''){
                this.insertParagraph()
            }
            // Highlight "selected" custom blocks - in practice this won't be triggered
            // since the custom click functions will intervene
            if ( Helpers.isCustom(this.range.blockParent) ){
                this.highlightCustomNode(this.range.blockParent)
            }
            // Get the applied formats for the range selected (all way up to the highest parent 
            // inside the editor)
            formats = Helpers.appliedFormats(this.range.startContainer, this.editorNode, this.range.rootNode, '')
            console.log('Applied formats',formats)
        }
        this.toolbar.forEach( button => {
            // Trigger disabled method on each button
            button.disabled( this.range )
            // Set active state of button
            if ( formats.includes(button.tag) ){
                button.element.classList.add('active')
            } else {
                button.element.classList.remove('active')
            }


            // // Buffering is handled separately
            // if ( button.type !== 'buffer' ){
            //     // Reset flags
            //     if ( this.range === false ){
            //         button.element.disabled = true
            //         button.element.classList.remove('active')
            //     } else {
            //         button.element.disabled = button.disabled(this.range)

                    
            //         // false
            //         // if ( "disabled")
            //         // Check whether selection means button should be shown as active or not
            //         if ( formats.includes(button.tag) ){
            //             button.element.classList.add('active')
            //         } else {
            //             button.element.classList.remove('active')
            //         }
            //     }
            // }
        })
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
    
    clickToolbarButton(button){
        //const button = this.toolbar.find( button => button.tag==element.id )
        console.log('clicked button',button.tag)
        // All buttons must have a click method so invoke
        this.range = button.click(this.range)
        // Reset event handlers for any buttons that require it
        this.updateEventHandlers()
        if ( this.range == undefined ){
            this.range = false
        }
        console.log('range',this.range)
        this.handleMouseUp()
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
                    if ( event.shiftKey  ){
                        const button = this.toolbar.find( b => b.tag == 'REDO')
                        if ( button.click() ){
                            this.updateEventHandlers()
                        }
                    // Undo
                    } else {
                        const button = this.toolbar.find( b => b.tag == 'UNDO')
                        if ( button.click() ){
                            this.updateEventHandlers()
                        }
                    }
                }
            }
        })
    }

    handleEnter(){
        this.range = Helpers.getRange()
        this.debugRange(this.range)
        if ( this.range === false ){
            return
        }
        const custom = Helpers.isCustom(this.range.blockParent) 
        const endNormal = this.range.endContainer.textContent.trim().length == this.range.endOffset
        let handled = false
        if ( custom || endNormal ) {
            let p = document.createElement('P')
            p.innerText = '\n'
            p = Helpers.insertAfter( p, this.range.blockParent )
            Helpers.setCursor( p, 0 )
            handled = true
        }
        if ( custom ){
            this.highlightCustomNode(false)
        }
        // Get the new range
        this.range = Helpers.getRange()
        this.debugRange(this.range)
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
        this.debugRange(range)
        console.log('range=',range)
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
            console.log('event',event)
            const ignore = ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','End','Home']
            if ( ignore.includes(event.key) === false ){
                this.handleKeyup() 
            }
        })
    }

    handleKeyupDelayed(...args){
        console.log('args',args)
        Buffer.update()
    }


    // -----------------------------------------------------------------------------
    // @section Custom events
    // -----------------------------------------------------------------------------
    


    updateEventHandlers(){
        this.toolbar.forEach( button => {
            if ( 'addEventHandlers' in button ){
                button.addEventHandlers()
            }
        })
    }


    // -----------------------------------------------------------------------------
    // @section Paste events
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
        this.debugRange(range)
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
    
    getCleanData(content){
        let node
        if ( content !== undefined ){
            node = document.createElement('div')
            node.innerHTML = content
        } else {
            node = this.editorNode.cloneNode(true)
        }
        const customButtons = this.toolbar.filter( button => button.type==='custom')
        Helpers.cleanForSaving(node, customButtons)
        return node.innerHTML
    }
 
    highlightCustomNode(node){
        // Remove "selected" class from all custom elements and then add back into this one
        const customs = this.editorNode.querySelectorAll('[contenteditable=false]')
        customs.forEach(custom=>custom.classList.remove('selected'))
        if ( node ){
            node.classList.add('selected')
        }
    }

    debugRange(range){
        const debug = document.getElementById('debug')
        if ( debug == null ){
            return
        }
        console.warn('debugRange',range)
        if ( range === false ){
            debug.innerHTML = 'No range selected'
        } else {
            debug.innerHTML = `
                <p>Block parent: ${range.blockParent.tagName}</p>
                <p>commonAncestorContainer: ${range.commonAncestorContainer.tagName ? range.commonAncestorContainer.tagName : range.commonAncestorContainer.textContent}</p>
                <p>rootNode: ${range.rootNode.tagName}</p>
                <p>collapsed: ${range.collapsed}</p>
                <p>startContainer: ${range.startContainer.tagName ? range.startContainer.tagName : range.startContainer.textContent}</p>
                <p>startOffset: ${range.startOffset}</p>
                <p>endContainer: ${range.endContainer.tagName ? range.endContainer.tagName : range.endContainer.textContent}</p>
                <p>endOffset: ${range.endOffset}</p>`
        }
    }

}


export default Editor
