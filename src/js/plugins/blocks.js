"use strict"

import * as Helpers from '../helpers.js'
import * as Phase from '../phase.js'
import * as Icons from '../icons.js'
import ToolbarButton from '../ToolbarButton.js'

let editorNode
let previousFormats = []
let lastNodeAdded = false
let fragmentNode

/**
 * Get the old and new formats for the node, depending on the phase
 * @param {HTMLElement} node 
 * @param {object} formats object with two arrays of old and new format strings
 * @param {object} button
 * @returns {object} Two arrays of old and new format strings
 */
function getFormats( node, formats, button ){
    // Always set old formats to the original
    const oldFormats = [...formats.oldFormats, node.tagName]
    let newFormats = []
    // Pre and post phases set the new format to be the 
    // same as the old format
    if ( Phase.pre() || Phase.post() ){
        // console.log(`1. Pushing ${node.tagName} to formats`)
        newFormats = [...oldFormats]
        return {newFormats,oldFormats}
    }
    // During phase
    //
    // New block formatting (not list) - apply new format
    if ( button.type === 'block' ){
        // console.log(`Format type = ${formatType}`)
        // console.log(`2. new block format ${button.newFormat}`)
        newFormats = [ button.newFormat ]
        return {newFormats,oldFormats}
    }
    //
    // New list formatting
    if ( Phase.first() ){
        // console.log(`3. First node with new list format ${button.newFormat}`)
        // Reformatting a list item?
        if ( node.tagName == 'LI' ){
            // console.log('3.1 Processing LI')
            const parentListContainer = node.parentNode
            // First in list - in which case modify list type
            if ( parentListContainer.firstElementChild == node ){
                // console.log( '3.1.1 First item in a list - replace existing list')
                // Pop off the old list format and replace with the new one plus the LI
                newFormats.pop()
                newFormats.push(button.newFormat)
                newFormats.push('LI')
                console.log('3.1.2 new list formats', formats.newFormats.join(' '))
            // Else create a new indented list
            } else {
                // console.log( '3.1.3 Subsequent item in a list - indent a new list')
                // Start with the old formats
                newFormats = formats.oldFormats.slice()
                // Add the new list format and an LI
                newFormats.push(button.newFormat)
                newFormats.push('LI')
                console.log('3.1.4 new list formats', formats.newFormats.join(' '))
            }
        // This is a different block node (e.g. H1, P) or a list container node - therefore start a new list
        } else {
            // console.log( 'Converting a block node')
            newFormats.push(button.newFormat)
            newFormats.push('LI')
            // console.log('3.2 new list formats', formats.newFormats.join(' '))
        }
        return {newFormats,oldFormats}
    }
    // During but not first node phase - reuse previously defined list formats
    // Slice produces a shallow copy (in this case of all elements)
    newFormats = previousFormats.slice()
    // console.log(`4. Reusing initial list formatting ${formats.newFormats.join(' ')}`)
    return {newFormats,oldFormats}
}
    
/**
 * Returns the html content of a node including its child nodes
 * @param {HTMLElement} node 
 * @returns {string} html content
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
        } else if ( Helpers.isStyle(child) || Helpers.isCustom(child) || child.tagName==='BR'){
            html += child.outerHTML 
        }
    })
    return html
}
    
/**
 * Save the content of text nodes and protected nodes against the current target node
 * which defaults to be the fragmentNode
 * @param {HTMLElement} node 
 * @param {string[],string[]} formats Two arrays of old and new format strings
 */
function saveContent( node, formats ){
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
    // console.log('html',html)
    // Skip unsupported node types and "blocks" where the html returned is empty but the node 
    // contains one or more tags
    const allowed = node.nodeType === 1
    if ( node.nodeType !== 1 || (html == '' && node.innerHTML.includes('<')) ){
        // console.log('saveContent: Found a block node - return', node)
        return
    }
    // First time - apply all formats
    if ( previousFormats.length == 0 ){
        // console.log('0. Original target',target.outerHTML)
        currentFormats.forEach( format => {
            n = document.createElement( format )
            target = target.appendChild( n )
            // console.log('saveContent: 1. First content - moving target to',target.outerHTML)
        })
    // New tree larger and the previous formats are a subset?
    // Compare formatting and add to appropriate end of tree
    } else if ( currentFormats.length > previousFormats.length ){
        console.log('saveContent: 2. Current formats longer than previous formats')
        if ( Helpers.arraySubset( previousFormats, currentFormats ) ){
            // console.log('saveContent: 2.1 Current formats are a superset of previous formats')
            for( let i=0; i<previousFormats.length; i++){
                target = target.lastElementChild
                // console.log('saveContent: 2.2 New formats superset - moving target to',target.outerHTML)
            }
            for( let i=previousFormats.length; i < currentFormats.length; i++ ){
                n = document.createElement( currentFormats[i] )
                target = target.appendChild( n )
                // console.log('saveContent: 2.3 New formats superset - moving target to',target.outerHTML)
            }
        }
    // Formatting is the same as previously
    } else if ( Helpers.arraysEqual(currentFormats,previousFormats) ){
        if ( lastNodeAdded && lastNodeAdded != fragmentNode ){
            target = lastNodeAdded.parentNode
        }
        n = document.createElement( lastFormat )
        target = target.appendChild( n )
        // console.log('saveContent: 3. Formats equal - moving target to',target.outerHTML)
    }
    // New formatting smaller or different - find where in tree to append
    if ( target == fragmentNode ){
        // console.log('saveContent: 4. New formatting smaller or different')
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
            // console.log('saveContent: 4.2 Starting new formats - moving target to',target.outerHTML)
        }
    }
    lastNodeAdded = target
    previousFormats = currentFormats.slice()
    // Add the content
    if ( html != '' ){
        target.innerHTML = html
        // console.log('saveContent: target with new content', target.outerHTML)
        // console.log('saveContent: fragmentNode',fragmentNode.innerHTML)
    }
}
    
/**
 * 
 * @param {HTMLElement} node 
 * @param {object} formats Old and new arrays of format strings
 * @param {object} button
 */
function parseNode( node, formats, button ){
    // console.log( `%cparseNode ${node.tagName}`,'background:green;color:white;padding:0.5rem')
    // console.log( `Inner HTML [${node.innerHTML.trim()}]`)
    // console.log( `node formats on entry`,formats.oldFormats)
    // Define the formats for this node only
    let nodeFormats = {
        oldFormats:[],
        newFormats:[]
    }
    if ( node != editorNode ){
        Phase.set( node )
        // Get the old and new formats
        nodeFormats = getFormats( node, formats, button )
        // console.log( `old node formats`,nodeFormats.oldFormats)
        // console.log( `new node formats`,nodeFormats.newFormats)
        // Save content of text nodes and protected nodes against the current targetNode
        saveContent( node, nodeFormats )
    }
    // Loop through all child blocks 
    node.childNodes.forEach( child => {
        if ( Helpers.isBlock(child) || Helpers.isList(child) ){
            // console.log(`Moving to child ${child.tagName}`)
            parseNode( child, nodeFormats, button  ) 
        }
    })
    // console.log(`Finished this branch - processed children`, node.childNodes)
}


/**
 * Split the style stype property into newStyle:newValue parts and set the action
 * @param {object} button
 */
 const setStyleProps = function(button){
    button.action = 'apply'
    if ( button.tag == 'CLEAR' || button.element.getAttribute('data-active') ){
        button.action = 'remove'
    }
    button.newFormat = button.tag
    if ( button.type == 'block' && button.action == 'remove' ){
        button.newFormat = 'P'
    }
}



/**
 * Mandatory button click function
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
 const click = function( editor, button ){
    const range = editor.range
    editorNode = editor.editorNode
    previousFormats = []
    lastNodeAdded = false
    setStyleProps(button)
    // Ensure start from a block node
    range.rootNode = Helpers.getTopParentNode( range.rootNode, editorNode )
    const firstParentNode = Helpers.getTopParentNode( range.startContainer, editorNode )
    const endParentNode = Helpers.getTopParentNode( range.endContainer, editorNode )
    // console.warn('root node', editor.range.rootNode)
    // console.log('first parent node', firstParentNode)
    // console.log('end parent node', endParentNode)
    // Mark the start and end selection points
    Helpers.addMarkers(range)
    // Init phase for block formatting
    Phase.init(range, true)
    // console.warn(`reFormatBlock with new format ${button.tag}`)
    // Just parse the parent node if the start and end belong to the same parent
    if ( firstParentNode == endParentNode ){
        fragmentNode = document.createElement('DIV')
        parseNode( firstParentNode, {oldFormats:[], newFormats:[]}, button )
        // console.log( 'fragment', fragmentNode.innerHTML)
        if ( firstParentNode == editorNode ){
            firstParentNode.innerHTML = fragmentNode.innerHTML
        } else {
            firstParentNode.outerHTML = fragmentNode.innerHTML
        }
    } else {
        let startNodeFound = false
        let endNodeFound = false
        fragmentNode = document.createElement('DIV')
        range.rootNode.childNodes.forEach( node => {
            // If find a none-block node then terminate this cycle of the loop
            // ie. ignore text and comments
            if ( node.nodeType !== 1){
                return
            }
            if ( node == firstParentNode ){
                startNodeFound = true
            } 
            // Start processing once start node found
            if ( startNodeFound && endNodeFound==false ) {
                // console.log( `%cparse top level node ${node.tagName}`,'background:orange;color:white;padding:0.5rem')
                // Check for block (as opposed to list formatting) and start a new fragment
                if ( button.type === 'block' ){
                    previousFormats = []
                    lastNodeAdded = false
                    fragmentNode = document.createElement('DIV')
                }
                parseNode( node, {oldFormats:[], newFormats:[]}, button )
                if ( button.type === 'block' ){
                    // console.log( 'fragment', fragmentNode.innerHTML)
                    node.outerHTML = fragmentNode.innerHTML
                } else {
                    node.setAttribute('data-remove',true)
                }
            }
            // Stop processing when end node found. If formatting a list write out the 
            // fragment
            if ( node == endParentNode ){
                endNodeFound = true 
                if ( button.type === 'list' ){
                    console.log( 'fragment', fragmentNode.innerHTML)
                    node.outerHTML = fragmentNode.innerHTML 
                }
                let removeNodes = editorNode.querySelectorAll('[data-remove=true]')
                removeNodes.forEach( removeNode => removeNode.remove() )
            }
        })
    }
    // Reset the selection
    Helpers.resetSelection(editor.editorNode)
    editor.updateRange()
    button.setState( editor, button )
}

/**
 * Set the disabled and active states of a button
 * @param {object} editor A unique editor instance
 * @param {object} button The button to act on
 */
const setState = function(editor, button){
    // console.log('setting block state')
    if ( editor.range === false ){
        button.element.disabled = true
        button.element.classList.remove('active')
    } else if ( button.tag == 'CLEAR' ){
        button.element.disabled = false
        button.element.classList.remove('active')
    } else {
        // Use the first parent node to set disabled state
        let firstParentNode = Helpers.getParentBlockNode( editor.range.startContainer, editor.editorNode )
        //console.log('firstParentNode',firstParentNode)
        // The firstParentNode should not be a DIV (the editor) or a custom element
        button.element.disabled = firstParentNode.tagName === 'DIV' || Helpers.isCustom(firstParentNode)
        //console.log('disabled',btn.element.disabled)
        // If this is a list type get the list parent
        if ( button.type === 'list' && firstParentNode.tagName === 'LI'){
            firstParentNode = firstParentNode.parentNode
        }
        // Do the tag names match?
        if ( firstParentNode.tagName === button.tag ){
            button.element.classList.add('active')
        } else {
            button.element.classList.remove('active')
        }
    }
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

const options = {setState}
export const H1 = new ToolbarButton( 'block', 'H1', 'Heading 1', Icons.h1, click, options )
export const H2 = new ToolbarButton( 'block', 'H2', 'Heading 2', Icons.h2, click, options )
export const H3 = new ToolbarButton( 'block', 'H3', 'Heading 3', Icons.h3, click, options )
export const P  = new ToolbarButton( 'block', 'P',  'Paragraph', Icons.p,  click, options )
export const BQ = new ToolbarButton( 'block', 'BLOCKQUOTE', 'Blockquote', Icons.bq, click, options )
export const OL = new ToolbarButton( 'list',  'OL', 'Ordered list',   Icons.ol, click, options )
export const UL = new ToolbarButton( 'list',  'UL', 'Unordered list', Icons.ul, click, options )
