import * as Helpers from './helpers.js'
import * as Phase from './phase.js'
import * as Icons from './plugins/icons.js'
import ToolbarButton from './plugins/ToolbarButton.js'

let editorNode
let formatAction = ''
let newFormat = ''
let categorisedTextNodes = []
let range
let fragmentNode


function categoriseProtectedNode( node ){
    const formats = Helpers.appliedFormats(node, editorNode, range.rootNode, 'inline' )
    categorisedTextNodes.push({
        node: node.cloneNode(true),
        text:'',
        formats
    })
}

function categoriseTextNode( node ){
    console.log( `Categorise text node [${node.textContent}]`)
    // Get the [0] pre, [1]selected and [2]post text
    const texts = getTextNodes( node )
    // console.log(`texts = [${texts.join(', ')}]`)
    let formats = Helpers.appliedFormats(node, editorNode, range.rootNode, 'inline' )
    // console.log(`current formats = [${formats.join(' ')}]`)
    // Pre text
    if ( texts[0] ){
        console.log(`Adding pre text [${texts[0]}]`)
        categorisedTextNodes.push({
            node: false,
            text: texts[0],
            formats
        })
    }
    // Selected text
    if ( texts[1] ){
        let newFormats = formats.slice()
        if ( formatAction == 'apply'  ){
            if ( newFormats.includes(newFormat) == false ){
                // console.log( `Adding new format [${newFormat}] in phase [${Phase.get()}]`)
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
        // console.log(`Adding post text [${texts[2]}]`)
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
                // Bring formats forwad in case current text was a space (with no formats)
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
    let texts = []
    if ( Phase.both() ) {
        texts.push( node.textContent.substring(0,range.startOffset) )
        texts.push( node.textContent.substring(range.startOffset,range.endOffset) )
        texts.push( node.textContent.substring(range.endOffset) )
    } else if ( Phase.first() ){
        texts.push( node.textContent.substring(0,range.startOffset) )
        texts.push( node.textContent.substring(range.startOffset) )
        texts.push( '' )
    } else if ( Phase.last() ){
        texts.push( '' )
        texts.push( node.textContent.substring(0,range.endOffset) )
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
    // Check for trailing spaces
    if ( texts[2] == ' ' ){
        texts[2] = ''
        texts[1] += ' '
    }
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

const init = function(editor){
    if ( editorNode == undefined ){
        editorNode = editor
    }
}

const click = function( rng ){
    range = rng
    formatAction = 'apply'
    if ( this.tag == 'CLEAR' || this.element.getAttribute('data-active') ){
        formatAction = 'remove'
    }
    // console.log('Format action', formatAction)
    newFormat = this.tag
    range.rootNode = Helpers.getTopParentNode( range.rootNode, editorNode )
    // The root node must be a block node (including list item LI) or an inline node
    if ( Helpers.isBlock(range.rootNode) == false &&
         Helpers.isInline(range.rootNode) == false ){
       return
    }
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
    // Write out changes
    if ( Helpers.isInline(range.rootNode) ){
        range.rootNode.outerHTML = fragmentNode.innerHTML
    } else {
        range.rootNode.innerHTML = fragmentNode.innerHTML
    }
    // updateEventHandlers()
    // console.log('fragmentNode', fragmentNode)
}

const options = {init}
const B = new ToolbarButton( 'inline', 'B', 'Bold', Icons.b, click, options)
const I = new ToolbarButton( 'inline', 'I', 'Italic', Icons.i, click, options)
const U = new ToolbarButton( 'inline', 'U',  'Underline', Icons.u, click, options)
const CLEAR = new ToolbarButton( 'inline', 'CLEAR', 'Clear', Icons.clear, click, options)

export const buttons = [ B, I, U, CLEAR ]