"use strict"

import * as Helpers from '../helpers.js'
import * as Phase from '../phase.js'
import * as Icons from './icons.js'
import ToolbarButton from './ToolbarButton.js'

// Global variables reset on each click
let editorNode
let formatAction = ''
let newFormat = ''
let categorisedTextNodes = []
let range
let fragmentNode

function categoriseProtectedNode( node ){
    const formats = Helpers.appliedFormats(node, range.rootNode, 'inline' )
    categorisedTextNodes.push({
        node: node.cloneNode(true),
        text:'',
        formats
    })
}

function categoriseTextNode( node ){
    console.log( `Categorise text node`,node)
    // Get the [0] pre, [1]selected and [2]post text
    const texts = getTextNodes( node )
    //console.log(`texts = [${texts.join(', ')}]`)
    const formats = Helpers.appliedFormats(node, editorNode, range.rootNode, 'inline' )
    //console.log(`current formats = [${formats.join(' ')}]`)
    // Pre text
    if ( texts[0] ){
        //console.log(`Adding pre text [${texts[0]}]`)
        categorisedTextNodes.push({
            node: false,
            text: texts[0],
            formats
        })
    }
    // Selected text
    if ( texts[1] ){
        let newFormats = formats.slice()
        let newStyles = styles.slice()
        if ( formatAction == 'apply'  ){
            if ( newFormats.includes(newFormat) == false ){
                //console.log( `Adding new format [${newFormat}] in phase [${Phase.get()}]`)
                newFormats.push(newFormat)

            }
        } else if ( formatAction == 'remove' ){
            if ( newFormat == 'CLEAR' ){
                newFormats = []
            } else {
                newFormats = formats.filter( format => format != newFormat )
            }
        }
        // console.log(`Adding selected text [${texts[1]}]`)
        categorisedTextNodes.push({
            node:false,
            text:texts[1],
            formats: newFormats
        })
    }
    // Post text
    if ( texts[2] ){
        //console.log(`Adding post text [${texts[2]}]`)
        categorisedTextNodes.push({
            node:false,
            text:texts[2],
            formats
        })
    }
}

function parseInlineNode( node ){
    let n = false
    let t = false
    Phase.set( node )
    // Parent node
    if ( node.nodeType === 1 ){
        console.log(`Parsing parent node`, node.outerHTML )
        if ( node.getAttribute('contenteditable') == 'false' ){
            categoriseProtectedNode( node )
        } else {
            node.childNodes.forEach( child => {
                parseInlineNode( child )
            })
        }
    } else if ( node.nodeType === 3 ){
        categoriseTextNode( node )
    }
}

function processCategorisedNodes(){
    // Node list is as follows
    // [i] = {node, text, formats, sorted}
    // where node present for custom nodes like actions
    // and sorted is the list of formats ordered
    //
    // Combine nodes with same formats or spaces (and no formats)
    for( let i=1; i<categorisedTextNodes.length; i++ ){
        let current = categorisedTextNodes[i]
        let previous = categorisedTextNodes[i-1]
        if ( previous.node == false && current.node == false ){
            if ( previous.sorted == current.sorted /* || current.text == ' ' */) {
                // Combine texts in current node
                current.text = previous.text + current.text
                // Bring formats forward in case current text was a space (with no formats)
                current.formats = previous.formats
                // Clear previous text
                previous.text = ''
            }
        }
    }
    // Join remaining nodes with required formatting
    categorisedTextNodes.forEach( node => {
        // Just add custom nodes
        if ( node.node ){
            fragmentNode.appendChild(node.node)
        // If have any text then add with formats
        } else if ( node.text != '' ){
            let n
            // Build up format nodes
            node.formats.forEach( format => {
                const temp = document.createElement(format)

                if ( n ){
                    n = n.appendChild(temp)
                } else {
                    n = temp
                }
            })
            // Add the text node
            const t = document.createTextNode(node.text)
            if ( n ){
                n.appendChild(t)
            } else {
                n = t
            }
            // Come back up the tree
            while ( n.parentNode !== null ){
                n = n.parentNode
            }    
            // Add to the node to the fragment            
            fragmentNode.appendChild(n)
        }
    })
}

function getTextNodes( node ){
    // Before, during and after texts
    let text
    let texts = []
    if ( Phase.both() ) {
        texts.push( node.textContent.substring(0,range.startOffset) )
        text = Helpers.START_MARKER + node.textContent.substring(range.startOffset,range.endOffset) + Helpers.END_MARKER
        texts.push( text )
        // endOffset = text.length - 2
        texts.push( node.textContent.substring(range.endOffset) )
    } else if ( Phase.first() ){
        texts.push( node.textContent.substring(0,range.startOffset) )
        texts.push( Helpers.START_MARKER + node.textContent.substring(range.startOffset))
        texts.push( '' )
    } else if ( Phase.last() ){
        texts.push( '' )
        text = node.textContent.substring(0,range.endOffset) + Helpers.END_MARKER
        texts.push( text )
        // endOffset = range.endOffset
        texts.push( node.textContent.substring(range.endOffset) )
    } else if ( Phase.during() ){
        texts.push( '' )
        texts.push( node.textContent )
        texts.push( '' )   
    } else if ( Phase.pre() ){
        texts.push( node.textContent )
        texts.push( '' )
        texts.push( '' )
    } else if ( Phase.post() ){
        texts.push( '' )
        texts.push( '' )
        texts.push( node.textContent )
    }
    // // Check for trailing spaces
    // if ( texts[2] == ' ' ){
    //     texts[2] = ''
    //     texts[1] += ' '
    // }
    return texts
}

function logCategorisedNodes(debug){
    let c = []
    categorisedTextNodes.forEach( n => {
        // Sort the formats - for later comparison
        n.formats.sort()
        n.sorted = n.formats.join(' ')
        // List the nodes
        let f = n.formats.join(' ')
        c.push( {
            html: n.node ? n.node.outerHTML : '',
            text: n.text,
            formats: f,
            sorted: n.sorted
        })
    })
    if ( debug ){
        console.table(c)
    }
}

// Method attached to a button in the toolbar
const setState = function(range){
    if ( range === false ){
        this.element.disabled = true
        this.element.classList.remove('active')
    } else if ( this.tag == 'CLEAR' ){
        this.element.disabled = false
        this.element.classList.remove('active')
    // Inline formatting only applies to single blocks
    } else {
        // The rootNode (the common ancestor or it's parent if text) should not be a 
        // DIV (the editor) and must be a block or inline node
        // console.log('rootNode', range.rootNode.tagName)
        this.element.disabled = range.rootNode.tagName == 'DIV' || 
                                (Helpers.isBlock(range.rootNode) === false &&  
                                 Helpers.isInline(range.rootNode) === false)
        // console.log('disabled', this.element.disabled)
    }
}


export const inline = function(editor){
    range = editor.range
    editorNode = editor.editorNode
    // @todo check whether this is still required to filter out custom blocks
    // // Get the top parent node which cannot be a custom node
    // const topParent = Helpers.getTopParentNode( range.rootNode, editorNode )
    // if ( Helpers.isCustom(topParent) ){
    //     console.log('skipping custom node', topParent)
    //     return
    // }
    // Look for inline parent nodes that only have one child
    // to ensure can clear all formats from selected text
    while ( Helpers.isInline(range.rootNode.parentNode) && 
    range.rootNode.parentNode.childNodes.length === 1){
        range.rootNode = range.rootNode.parentNode
    }
    // Reset fragment and categorised nodes
    fragmentNode = document.createElement('DIV')
    categorisedTextNodes = []
    // Init phase for list formatting
    Phase.init(range, false)
    // Parse
    console.log('%cStarting inline parsing ...', 'background-color:red; color:white; padding:0.5rem;')
    parseInlineNode( range.rootNode )
    // true = debugging
    logCategorisedNodes(true)
    // Process saved nodes
    processCategorisedNodes()
    // Check for text only content being applied to the editor,
    // in which case wrap with a paragraph
    if ( range.rootNode == editorNode && 
         fragmentNode.childNodes.length == 1 && fragmentNode.childNodes[0].nodeType === 3 ){
        const paragraph = document.createElement('P')
        paragraph.innerHTML = fragmentNode.innerHTML.trim()
        fragmentNode.innerHTML = paragraph.outerHTML
    }
    // Write out changes
    if ( Helpers.isInline(range.rootNode) ){
        range.rootNode.outerHTML = fragmentNode.innerHTML
    } else {
        range.rootNode.innerHTML = fragmentNode.innerHTML
    }
    // Reset the selection (and return the range in case needed)
    return Helpers.resetSelection(editorNode)
}


/**
 * The native button click handle belonging to the button
 * @param Editor editor 
 */
const click = function( editor ){
    formatAction = 'apply'
    if ( this.tag == 'CLEAR' || this.element.classList.contains('active') ){
        formatAction = 'remove'
    }
    // console.log('Format action', formatAction)
    newFormat = this.tag
    inline( editor )
}

let options = {setState}
const B = new ToolbarButton( 'inline', 'B', 'Bold', Icons.b, click, options)
const I = new ToolbarButton( 'inline', 'I', 'Italic', Icons.i, click, options)
const U = new ToolbarButton( 'inline', 'U',  'Underline', Icons.u, click, options)
const CLEAR = new ToolbarButton( 'inline', 'CLEAR', 'Clear', Icons.clear, click, options)



// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const buttons = [ B, I, U, CLEAR ]