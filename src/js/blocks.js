import * as Helpers from './helpers.js'
import * as Phase from './phase.js'
import * as Icons from './plugins/icons.js'
import ToolbarButton from './plugins/ToolbarButton.js'

let editorNode
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
        // console.log(`1. Pushing ${node.tagName} to formats`)
        newFormats = [...formats.newFormats, node.tagName]
        return {newFormats,oldFormats}
    }
    // During phase
    //
    // New block formatting (not list) - apply new format
    if ( formatType == 'block' ){
        // console.log(`Format type = ${this.formatType}`)
        // console.log(`2. new block format ${this.newFormat}`)
        newFormats = [ newFormat ]
        return {newFormats,oldFormats}
    }
    //
    // New list formatting
    if ( Phase.first() ){
        // console.log(`3. First node with new list format ${newFormat}`)
        // Reformatting a list item?
        if ( node.tagName == 'LI' ){
            // console.log('3.1 Processing LI')
            const parentListContainer = node.parentNode
            // First in list - in which case modify list type
            if ( parentListContainer.firstElementChild == node ){
                // console.log( '3.1.1 First item in a list - replace existing list')
                // Pop off the old list format and replace with the new one plus the LI
                newFormats.pop()
                newFormats.push(newFormat)
                newFormats.push('LI')
                // console.log('3.1.2 new list formats', formats.newFormats.join(' '))
            // Else create a new indented list
            } else {
                // console.log( '3.1.3 Subsequent item in a list - indent a new list')
                newFormats.push('LI')
                newFormats.push(newFormat)
                newFormats.push('LI')
                // console.log('3.1.4 new list formats', formats.newFormats.join(' '))
            }
        // This is a different block node (e. H1, P) or a list container node - therefore start a new list
        } else {
            // console.log( 'Converting a block node')
            newFormats.push(newFormat)
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
 * @todo Could go into Helpers but not used elsewhere yet
 * @param {*} node 
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
    // console.log('html',html)
    // Don't include what? @todo rest of comment!
    if ( html == '' && node.innerHTML.includes('<') ){
        return
    }
    // First time - apply all formats
    if ( previousFormats.length == 0 ){
        // console.log('0. Original target',target.outerHTML)
        currentFormats.forEach( format => {
            n = document.createElement( format )
            target = target.appendChild( n )
            console.log('1. First content - moving target to',target.outerHTML)
        })
    // New tree larger and the previous formats are a subset?
    // Compare formatting and add to appropriate end of tree
    } else if ( currentFormats.length > previousFormats.length ){
        // console.log('2. Current formats longer than previous formats')
        if ( Helpers.arraySubset( previousFormats, currentFormats ) ){
            // console.log('2.1 Current formats are a superset of previous formats')
            for( let i=0; i<previousFormats.length; i++){
                target = target.lastElementChild
                console.log('2.2 New formats superset - moving target to',target.outerHTML)
            }
            for( let i=previousFormats.length; i < currentFormats.length; i++ ){
                n = document.createElement( currentFormats[i] )
                target = target.appendChild( n )
                console.log('2.3 New formats superset - moving target to',target.outerHTML)
            }
        }
    // Formatting is the same as previously
    } else if ( Helpers.arraysEqual(currentFormats,previousFormats) ){
        if ( lastNodeAdded && lastNodeAdded != fragmentNode ){
            target = lastNodeAdded.parentNode
        }
        n = document.createElement( lastFormat )
        target = target.appendChild( n )
        // console.log('3. Formats equal - moving target to',target.outerHTML)
    }
    // New formatting smaller or different - find where in tree to append
    if ( target == fragmentNode ){
        // console.log('4. New formatting smaller or different')
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
            // console.log('4.2 Starting new formats - moving target to',target.outerHTML)
        }
    }
    lastNodeAdded = target
    previousFormats = currentFormats.slice()
    // Add the content
    if ( html != '' ){
        target.innerHTML = html
        // console.log('target with new content', target.outerHTML)
        // console.log('fragmentNode',fragmentNode.innerHTML)
    }
}
    
function parseListsAndBlocks( node, formats ){
    // console.log( `%cparseListsAndBlocks ${node.tagName}`,'background:green;color:white;padding:0.5rem')
    // console.log( `HTML [${node.innerHTML.trim()}]`)
    // console.log( `node formats on entry`,formats.oldFormats)
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
    if ( node.childNodes.length == 0 ){
        //console.log('Finished parsing this branch')
        return
    }
    node.childNodes.forEach( child => {
        if ( child.nodeType !== 3 &&
                Helpers.isInline(child) == false &&
                Helpers.isCustom(child) == false ){
            // console.log(`Moving to child[${children}] ${child.tagName}`)
            parseListsAndBlocks( child, nodeFormats  ) 
        }
    })
    // console.log(`Finished this branch - processed ${children} children`)
}

const init = function(editor){
    if ( editorNode == undefined ){
        editorNode = editor
    }
}

const click = function( range ){
    console.warn('range',range)
    const offset = range.endOffset
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
    range.rootNode = Helpers.getTopParentNode( range.rootNode, editorNode )
    const firstParentNode = Helpers.getTopParentNode( range.startContainer, editorNode )
    const endParentNode = Helpers.getTopParentNode( range.endContainer, editorNode )
    // get the position of the end of the selection in the hierarchy so can reset the cursor
    // after formatting
    const positions = Helpers.getChildNodePosition(range.endContainer, endParentNode, [])
    console.warn('POSITIONS',positions)
    //console.warn('New root node',range.rootNode)
    // console.warn('firstParentNode',firstParentNode)
    // console.warn('endParentNode',endParentNode)
    // Init phase for block formatting
    Phase.init(range, true)
    // console.log(`%creFormatBlock with new format ${button.tag}`,'background-color:red;color:white;padding:0.5rem')
    //
    // Just parse the root node if the start and end belong to the same parent
    if ( firstParentNode == endParentNode ){
        fragmentNode = document.createElement('DIV')
        parseListsAndBlocks( range.rootNode, {oldFormats:[], newFormats:[]} )
        let newNode
        // console.log( 'fragment', fragmentNode.innerHTML)
        if ( range.rootNode == editorNode ){
            range.rootNode.innerHTML = fragmentNode.innerHTML
            newNode = range.rootNode
        } else {
            newNode = document.createElement(fragmentNode.childNodes[0].tagName)
            newNode.innerHTML = fragmentNode.childNodes[0].innerHTML
            newNode = Helpers.insertAfter( newNode, range.rootNode)
            range.rootNode.remove()
        }
        Helpers.setCursorWithPosition(newNode,positions,offset)
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
            if ( startNodeFound && endNodeFound==false ) {
                // console.log( `%cparse top level node ${node.tagName}`,'background:orange;color:white;padding:0.5rem')
                // Check for block (as opposed to list formatting)
                if ( formatType == 'block' ){
                    previousFormats = []
                    lastNodeAdded = false
                    fragmentNode = document.createElement('DIV')
                }
                parseListsAndBlocks( node, {oldFormats:[], newFormats:[]} )
                if ( button.type == 'block' ){
                    // console.log( 'fragment', this.fragmentNode.innerHTML)
                    node.outerHTML = fragmentNode.innerHTML   
                } else {
                    node.setAttribute('data-remove',true)
                }
            }
            if ( node == endParentNode ){
                endNodeFound = true 
                if ( button.type == 'list' ){
                    // console.log( 'fragment', this.fragmentNode.innerHTML)
                    node.outerHTML = fragmentNode.innerHTML
                }
                let removeNodes = editorNode.querySelectorAll('[data-remove=true]')
                removeNodes.forEach( removeNode => removeNode.remove() )
            }
        })
    }
}

const options = {init}
const H1 = new ToolbarButton( 'block', 'H1', 'Heading 1', Icons.h1, click, options )
const H2 = new ToolbarButton( 'block', 'H2', 'Heading 2', Icons.h2, click, options )
const P  = new ToolbarButton( 'block', 'P',  'Paragraph', Icons.p,  click, options )
const OL = new ToolbarButton( 'list',  'OL', 'Ordered list',   Icons.ol, click, options)
const UL = new ToolbarButton( 'list',  'UL', 'Unordered list', Icons.ul, click, options)

export const buttons = [ H1, H2, P, OL, UL ]