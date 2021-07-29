import * as Helpers from '../helpers.js'
import * as Phase from '../phase.js'
import * as Icons from './icons.js'
import ToolbarButton from './ToolbarButton.js'

// Global variables reset on each click
let editorNode
let range

let formatType = ''
let formatAction = ''
let newFormat = ''
let previousFormats = []
let lastNodeAdded = false
let fragmentNode


function getListAndBlockFormats( node, formats ){
    // Always set old formats to the original
    const oldFormats = [...formats.oldFormats, node.tagName]
    let newFormats = []
    // Pre and post phases set the new format to be the 
    // same as the old format
    if ( Phase.pre() || Phase.post() ){
        console.log(`1. Pushing ${node.tagName} to formats`)
        newFormats = [...formats.newFormats, node.tagName]
        return {newFormats,oldFormats}
    }
    // During phase
    //
    // New block formatting (not list) - apply new format
    if ( formatType == 'block' ){
        console.log(`Format type = ${formatType}`)
        console.log(`2. new block format ${newFormat}`)
        newFormats = [ newFormat ]
        return {newFormats,oldFormats}
    }
    //
    // New list formatting
    if ( Phase.first() ){
        console.log(`3. First node with new list format ${newFormat}`)
        // Reformatting a list item?
        if ( node.tagName == 'LI' ){
            console.log('3.1 Processing LI')
            const parentListContainer = node.parentNode
            // First in list - in which case modify list type
            if ( parentListContainer.firstElementChild == node ){
                console.log( '3.1.1 First item in a list - replace existing list')
                // Pop off the old list format and replace with the new one plus the LI
                newFormats.pop()
                newFormats.push(newFormat)
                newFormats.push('LI')
                console.log('3.1.2 new list formats', formats.newFormats.join(' '))
            // Else create a new indented list
            } else {
                console.log( '3.1.3 Subsequent item in a list - indent a new list')
                // Start with the old formats
                newFormats = formats.oldFormats.slice()
                // Add the new list format and an LI
                newFormats.push(newFormat)
                newFormats.push('LI')
                console.log('3.1.4 new list formats', formats.newFormats.join(' '))
            }
        // This is a different block node (e. H1, P) or a list container node - therefore start a new list
        } else {
            console.log( 'Converting a block node')
            newFormats.push(newFormat)
            newFormats.push('LI')
            console.log('3.2 new list formats', formats.newFormats.join(' '))
        }
        return {newFormats,oldFormats}
    }
    // During but not first node phase - reuse previously defined list formats
    // Slice produces a shallow copy (in this case of all elements)
    newFormats = previousFormats.slice()
    console.log(`4. Reusing initial list formatting ${formats.newFormats.join(' ')}`)
    return {newFormats,oldFormats}
}
    
/**
 * Returns the html content of a node including its child nodes
 * @param node node 
 * @returns string html content
 */
function getBlockHTML(node){
    let html = ''
    // Extract all text, inline formats and protected node content from the node
    node.childNodes.forEach( child => {
        // Plain text node
        if ( child.nodeType === 3 ) {
            let text = child.textContent
            // Trim text nodes with CR's
            if ( text.includes('\n') ){
                text = text.trim()
            }
            html += text
        // Inline, custom node or line break
        } else if ( Helpers.isInline(child) || Helpers.isCustom(child) || child.tagName==='BR'){
            html += child.outerHTML 
        }
    })
    return html
}
    
function saveBlockContent( node, formats ){
    let n
    let target = fragmentNode
    let html = getBlockHTML(node)
    let currentFormats = []
    if ( Phase.during() ){
        currentFormats = formats.newFormats
    } else {
        currentFormats = formats.oldFormats
    }
    let lastFormat = currentFormats.slice(-1)[0]
    console.log('html',html)
    // Skip "blocks" where the html returned is empty but the node contains one or more tags
    if ( html == '' && node.innerHTML.includes('<') ){
        console.log('saveBlockContent: Found a block node - return', node)
        return
    }
    // First time - apply all formats
    if ( previousFormats.length == 0 ){
        // console.log('0. Original target',target.outerHTML)
        currentFormats.forEach( format => {
            n = document.createElement( format )
            target = target.appendChild( n )
            console.log('saveBlockContent: 1. First content - moving target to',target.outerHTML)
        })
    // New tree larger and the previous formats are a subset?
    // Compare formatting and add to appropriate end of tree
    } else if ( currentFormats.length > previousFormats.length ){
        console.log('saveBlockContent: 2. Current formats longer than previous formats')
        if ( Helpers.arraySubset( previousFormats, currentFormats ) ){
            console.log('saveBlockContent: 2.1 Current formats are a superset of previous formats')
            for( let i=0; i<previousFormats.length; i++){
                target = target.lastElementChild
                console.log('saveBlockContent: 2.2 New formats superset - moving target to',target.outerHTML)
            }
            for( let i=previousFormats.length; i < currentFormats.length; i++ ){
                n = document.createElement( currentFormats[i] )
                target = target.appendChild( n )
                console.log('saveBlockContent: 2.3 New formats superset - moving target to',target.outerHTML)
            }
        }
    // Formatting is the same as previously
    } else if ( Helpers.arraysEqual(currentFormats,previousFormats) ){
        if ( lastNodeAdded && lastNodeAdded != fragmentNode ){
            target = lastNodeAdded.parentNode
        }
        n = document.createElement( lastFormat )
        target = target.appendChild( n )
        console.log('saveBlockContent: 3. Formats equal - moving target to',target.outerHTML)
    }
    // New formatting smaller or different - find where in tree to append
    if ( target == fragmentNode ){
        console.log('saveBlockContent: 4. New formatting smaller or different')
        let startIndex = 0
        currentFormats.forEach( (format,index) => {
            if ( format == previousFormats[index] ){
                // Exclude the last format if it is an LI as we need 
                // to add the LI to the previous list parent
                if ( (index==(currentFormats.length-1) && format=='LI') == false ){
                    target = target.lastElementChild
                    // console.log('4.1 Move target node to', target.outerHTML)
                    startIndex ++
                }
            }
        })
        for( let i=startIndex; i<currentFormats.length; i++ ){
            n = document.createElement( currentFormats[i] )
            target = target.appendChild( n )
            console.log('saveBlockContent: 4.2 Starting new formats - moving target to',target.outerHTML)
        }
    }
    lastNodeAdded = target
    previousFormats = currentFormats.slice()
    // Add the content
    if ( html != '' ){
        target.innerHTML = html
        console.log('saveBlockContent: target with new content', target.outerHTML)
        console.log('saveBlockContent: fragmentNode',fragmentNode.innerHTML)
    }
}
    
function parseListsAndBlocks( node, formats ){
    console.log( `%cparseListsAndBlocks ${node.tagName}`,'background:green;color:white;padding:0.5rem')
    console.log( `Inner HTML [${node.innerHTML.trim()}]`)
    console.log( `node formats on entry`,formats.oldFormats)
    // Define the formats for this node only
    let nodeFormats = {
        oldFormats:[],
        newFormats:[]
    }
    if ( node != editorNode ){
        Phase.set( node )
        // Get the old and new formats
        nodeFormats = getListAndBlockFormats( node, formats )
        console.log( `old node formats`,nodeFormats.oldFormats)
        console.log( `new node formats`,nodeFormats.newFormats)
        // Save content of text nodes and protected nodes
        saveBlockContent( node, nodeFormats )
    }
    // Loop through all child blocks 
    node.childNodes.forEach( child => {
        if ( Helpers.isBlock(child) ){
            console.log(`Moving to child ${child.tagName}`)
            parseListsAndBlocks( child, nodeFormats  ) 
        }
    })
    console.log(`Finished this branch - processed children`, node.childNodes)
}

const click = function( editor ){
    editorNode = editor.editorNode
    range = editor.range
    console.warn('range',range)
    // const offset = range.endOffset
    // Initialisation
    formatType = this.type
    formatAction = 'apply'
    if ( this.tag == 'CLEAR' || this.element.getAttribute('data-active') ){
        formatAction = 'remove'
    }
    // console.log('Format action', formatAction)
    newFormat = this.tag
    if ( this.type == 'block' && formatAction == 'remove' ){
        newFormat = 'P'
    }
    previousFormats = []
    lastNodeAdded = false
    // Ensure start from a block node
    range.rootNode = Helpers.getTopParentNode( range.rootNode, editorNode )
    const firstParentNode = Helpers.getTopParentNode( range.startContainer, editorNode )
    const endParentNode = Helpers.getTopParentNode( range.endContainer, editorNode )
    // Set the end target to be the next node following the last in the selection
    // Use this at the end to reset the selection
    let endTarget = editorNode
    if ( endParentNode != editorNode.lastElementChild ){
        endTarget = endParentNode.nextElementSibling
    }
    console.log('End target node =',endTarget)
    // Init phase for block formatting
    Phase.init(range, true)
    console.log(`%creFormatBlock with new format ${this.tag}`,'background-color:red;color:white;padding:0.5rem')
    // Just parse the root node if the start and end belong to the same parent
    if ( firstParentNode == endParentNode ){
        fragmentNode = document.createElement('DIV')
        parseListsAndBlocks( range.rootNode, {oldFormats:[], newFormats:[]} )
        console.log( 'fragment', fragmentNode.innerHTML)
        if ( range.rootNode == editorNode ){
            range.rootNode.innerHTML = fragmentNode.innerHTML
        } else {
            range.rootNode.outerHTML = fragmentNode.innerHTML
        }
    } else {
        let startNodeFound = false
        let endNodeFound = false
        fragmentNode = document.createElement('DIV')
        range.rootNode.childNodes.forEach( node => {
            if ( node.nodeType === 3 ){
                return
            }
            if ( node == firstParentNode ){
                startNodeFound = true
            } 
            // Start processing once start node found
            if ( startNodeFound && endNodeFound==false ) {
                console.log( `%cparse top level node ${node.tagName}`,'background:orange;color:white;padding:0.5rem')
                // Check for block (as opposed to list formatting) and start a new fragment
                if ( formatType == 'block' ){
                    previousFormats = []
                    lastNodeAdded = false
                    fragmentNode = document.createElement('DIV')
                }
                parseListsAndBlocks( node, {oldFormats:[], newFormats:[]} )
                if ( this.type == 'block' ){
                    console.log( 'fragment', this.fragmentNode.innerHTML)
                    node.outerHTML = fragmentNode.innerHTML
                } else {
                    node.setAttribute('data-remove',true)
                }

            }
            // Stop processing when end node found. If formatting a list write out the 
            // fragment
            if ( node == endParentNode ){
                endNodeFound = true 
                if ( formatType == 'list' ){
                    console.log( 'fragment', fragmentNode.innerHTML)
                    node.outerHTML = fragmentNode.innerHTML 
                }
                let removeNodes = editorNode.querySelectorAll('[data-remove=true]')
                removeNodes.forEach( removeNode => removeNode.remove() )
            }
        })
    }
    // Reset the selection
    Helpers.setCursorToTargetNode(editorNode, endTarget)
}

const H1 = new ToolbarButton( 'block', 'H1', 'Heading 1', Icons.h1, click )
const H2 = new ToolbarButton( 'block', 'H2', 'Heading 2', Icons.h2, click )
const P  = new ToolbarButton( 'block', 'P',  'Paragraph', Icons.p,  click )
const OL = new ToolbarButton( 'list',  'OL', 'Ordered list',   Icons.ol, click )
const UL = new ToolbarButton( 'list',  'UL', 'Unordered list', Icons.ul, click )

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const buttons = [ H1, H2, P, OL, UL ]