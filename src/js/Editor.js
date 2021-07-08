"use strict"

import * as Templates from './templates.js'
import * as Feedback from './feedback.js'
import * as Helpers from './helpers.js'
import * as Block from './block.js'
import * as Inline from './inline.js'
import * as Icons from './icons.js'
import Buffer from './buffer.js'

class Editor {

    // -----------------------------------------------------------------------------
    // @section Initialisation
    // -----------------------------------------------------------------------------

    constructor( target, content, options ){
        // Initialise options & toolbar
        this.options = this.initOptions(options)
        this.initToolbar()
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
        this.listenForKeyupEvents()
        this.listenForToolbarButtonClicks()
        this.listenForCustomEvents()
        // Initialise paste buffer
        setTimeout( () => this.buffer = new Buffer(this.options.bufferSize, this.editorNode), 100)
    }

    initOptions(options){   
        const elements = ['H1','H2','P', 'OL','UL', 'B', 'I', 'U']
        const plugins = []
        const headingNumbers = 'off'
        const bufferSize = 10     
        if ( options ){
            options.elements = options.elements !== undefined ? options.elements : elements
            options.plugins = options.plugins !== undefined ? options.plugins : plugins
            options.headingNumbers = options.headingNumbers !== undefined ? options.headingNumbers : headingNumbers
            options.bufferSize = options.bufferSize !== undefined ? Math.max(parseInt(options.bufferSize),bufferSize) : bufferSize
        } else {
            options = {
                elements,
                plugins,
                headingNumbers,
                bufferSize
            }
        }
        // Make sure all upper case
        for( let i=0; i<options.elements.length; i++){
            options.elements[i] = options.elements[i].toUpperCase()
        }
        console.log('options',options)
        return options
    }

    initToolbar(){
        // Default toolbar
        const toolbar = [
            {type:'block',  id:'b-h1',   tag:'H1',    label:'Heading 1',      icon:Icons.h1},
            {type:'block',  id:'b-h2',   tag:'H2',    label:'Heading 2',      icon:Icons.h2},
            {type:'block',  id:'b-p',    tag:'P',     label:'Paragraph',      icon:Icons.p},
            {type:'list',   id:'b-ol',   tag:'OL',    label:'Ordered list',   icon:Icons.ol},
            {type:'list',   id:'b-ul',   tag:'UL',    label:'Unordered list', icon:Icons.ul},
            {type:'inline', id:'b-b',    tag:'B',     label:'Bold',           icon:Icons.b},
            {type:'inline', id:'b-i',    tag:'I',     label:'Italic',         icon:Icons.i},
            {type:'inline', id:'b-u',    tag:'U',     label:'Underline',      icon:Icons.u},
            {type:'inline', id:'b-§',    tag:'CLEAR', label:'Clear',          icon:Icons.clear},
            {type:'edit',   id:'b-undo', tag:'UNDO',  label:'Undo',           icon:Icons.undo},
            {type:'edit',   id:'b-redo', tag:'REDO',  label:'Redo',           icon:Icons.redo},
        ]
        this.toolbar = toolbar.filter( item => options.elements.includes(item.tag))
        this.options.plugins.forEach( plugin => {
            this.toolbar.push(plugin.button)
        })
        console.log('toolbar',this.toolbar)
    }


    // -----------------------------------------------------------------------------
    // @section Mouse up events
    // -----------------------------------------------------------------------------
    listenForMouseUpEvents(){
        this.editorNode.addEventListener('mouseup', () => this.handleMouseUp(true))
        // Use timeout on blur so buttons still active when first clicked from editor
        this.editorNode.addEventListener('blur', () => {
            setTimeout( ()=>this.handleMouseUp(false), 500)
        })
    }


    // -----------------------------------------------------------------------------
    // @section Toolbar button events
    // -----------------------------------------------------------------------------
    
    listenForToolbarButtonClicks(){
        this.toolbar.forEach( button => {
            button.element = this.toolbarNode.querySelector(`#${button.id}`)
            button.element.disabled = true
            if ( "disable" in button ){
                button.disable(button.element)
            }
            button.element.addEventListener('click', event => {
                // @todo This does not work for custom buttons where bootstrap gets in first
                //       Therefore need to add relevant attributes on selection taking place
                if ( this.range === false ){
                    event.preventDefault()
                    return
                }
                this.clickToolbarButton(event.currentTarget)
            })
        })
    }

    clickToolbarButton(element){
        const clicked = this.toolbar.find( button => button.id==element.id )
        if ( clicked.type == 'block' ){
            Block.click(clicked, this.range, this.editorNode )
            this.updateEventHandlers()
        } else if ( clicked.type == 'list' ){
            Block.click(clicked, this.range, this.editorNode )
            this.updateEventHandlers()
        } else if ( clicked.type == 'inline' ){
            Inline.click(clicked, this.range, this.editorNode )
            this.updateEventHandlers()
        } else if ( clicked.type == 'edit' ){
            if ( this.buffer.click(clicked) ){
                this.updateEventHandlers()
            }
        } else if ( clicked.type == 'custom' ){
            console.log('clicked custom button', clicked.id,'with range',this.range)
            clicked.click(this.range)
        }
        this.range == false
    }


    // -----------------------------------------------------------------------------
    // @section Keydown events
    // -----------------------------------------------------------------------------
    
    listenForKeydownEvents(){
        this.editorNode.addEventListener('keydown', event => {
            console.log('control key?',event.ctrlKey)
            console.log('key',event.key)
            // Custom panel shown - ignore key entry?
            if ( document.querySelector('.custom-panel') != null ){
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
            // Capture undo/redo events
            } else if ( (event.ctrlKey || event.metaKey) && event.key == 'z' ){
                event.preventDefault()
                // Redo
                if ( event.shiftKey  ){
                    if ( this.buffer.redo() ){
                        this.updateEventHandlers()
                    }
                // Undo
                } else {
                    if ( this.buffer.undo() ){
                        this.updateEventHandlers()
                    }
                }
            }
        })
    }

    handleEnter(){
        const range = Helpers.getRange()
        if ( range === false ){
            return
        }
        const custom = Helpers.isCustom(range.blockParent) 
        const endNormal = range.endContainer.textContent.trim().length == range.endOffset
        let handled = false
        if ( custom || endNormal ) {
            let p = document.createElement('P')
            p.innerText = '\n'
            p = Helpers.insertAfter( p, range.blockParent )
            Helpers.setCursor( p, 0 )
            handled = true
        }
        if ( custom ){
            this.highlightCustomNode(false)
        }
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
        this.editorNode.addEventListener( 'keyup', () => this.handleKeyup(this) )
    }

    handleKeyupDelayed(...args){
        //console.log('Updating buffer with arg[0]',args[0])
        const editor = args[0]
        editor.buffer.update()
    }


    // -----------------------------------------------------------------------------
    // @section Custom events
    // -----------------------------------------------------------------------------
    
    listenForCustomEvents(){
        // Do any custom setup required
        this.toolbar.forEach( button => {
            if ( button.type === 'custom' ){
                if ( "setup" in button ){
                    button.setup(this.editorNode, true)
                }
                if ( "shortcut" in button && "click" in button){
                    this.editorNode.addEventListener('keydown', event =>{
                        if ( event.key === button.shortcut ){
                            // Prevent default so key not echo'd to the screen
                            event.preventDefault()
                            // Stop propagation to prevent other event handlers responding
                            event.stopPropagation()
                            // Trigger the dialogue
                            button.click(this.range)
                        }
                    })
                }
            }
        })
    }

    updateEventHandlers(){
        this.toolbar.forEach( button => {
            if ( 'addEventHandlers' in button ){
                button.addEventHandlers(this.editorNode)
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
    // @section Mouseup events
    // -----------------------------------------------------------------------------
    
    handleMouseUp(focus){
        console.log('Handle mouse up with focus = ', focus)
        this.range = false
        if ( focus ){
            this.range = Helpers.getRange()
        }
        let formats
        if ( this.range !== false ){
            // If enter cursor in an empty editor then make this a paragraph
            // rather than raw text
            if ( this.range.blockParent == this.editorNode && this.editorNode.innerText == ''){
                this.insertParagraph()
            }
            // Highlight custom blocks
            if ( Helpers.isCustom(this.range.blockParent) ){
                this.highlightCustomNode(this.range.blockParent)
            }
            console.log('handleMouseUp range=',this.range)
            formats = Helpers.appliedFormats(this.range.startContainer, this.editorNode, this.range.rootNode, '')
            console.log('Applied formats',formats)
        }
        this.toolbar.forEach( button => {
            const element = button.element
            // Ignore none ranges
            if ( this.range === false ){
                element.disabled = true
            } else {
                element.disabled = false
                switch (button.type){
                    case 'block':
                        formats.push(this.range.blockParent.tagName)
                    case 'list':
                        element.removeAttribute('disabled')
                        break
                    case 'inline':
                        if ( this.range.blockParent == this.editorNode ){
                            console.log('setting element to be disabled', element.title)
                            element.disabled = true
                        } else {
                            element.removeAttribute('disabled')
                        }
                        break
                    case 'custom':
                        element.removeAttribute('disabled')
                        break
                }
                // Check whether selection means button should be shown as active or not
                if ( formats.includes(button.tag) ){
                    element.classList.add('active')
                    element.setAttribute('data-active',true)
                    element.setAttribute('aria-pressed','true')
                } else {
                    element.classList.remove('active')
                    element.removeAttribute('data-active')
                    element.removeAttribute('aria-pressed')
                }
                if ( element.disabled ){
                    console.log('setting element to be inactive', element.title)
                } else {
                    console.log('setting element to be active', element.title)
                }
            }
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
        const customs = this.editorNode.querySelectorAll('[contenteditable=false]')
        customs.forEach(custom=>custom.classList.remove('selected'))
        if ( node ){
            node.classList.add('selected')
        }
    }

}


export default Editor
