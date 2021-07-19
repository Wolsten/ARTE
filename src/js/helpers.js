// -----------------------------------------------------------------------------
// @section Arrays
// -----------------------------------------------------------------------------

export const arraysEqual = function( a, b ){
    if ( a.length != 0 && b.length!= 0 && a.length != b.length ){
        return false
    }
    return a.every( (item, index) => b[index] == item )
}

export const arraySubset = function( a, b ){
    return a.every( (item, index) => b[index] == item )
}


// -----------------------------------------------------------------------------
// @section Dom manipulation
// -----------------------------------------------------------------------------

export const insertAfter = function(newNode, existingNode) {
    return existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

let tags = { block: ['DIV','P','LI'], list: ['LI'], inline: []}

export const registerTag = function(type,tag){
    if ( tags[type].includes(tag) == false && tag!='CLEAR'){
        tags[type].push(tag)
        console.log('registered tag', tag)
    }
}

export const debugTags = function(){
    console.warn('blocks',tags.block.join(', '))
    console.warn('lists',tags.list.join(', '))
    console.warn('inline',tags.inline.join(', '))
}

export const isInline = function( node ){
    if ( node.tagName == undefined ){
        return false
    }
    return tags.inline.includes(node.tagName)
}

export const isList = function( node ){
    if ( node.tagName == undefined ){
        return false
    }
    return tags.list.includes(node.tagName)
}

export const isBlock = function( node ){
    if ( node.tagName == undefined ){
        return false
    }
    return tags.block.includes(node.tagName)
}

export const isCustom = function( node ){
    // @todo Check this is the correct test - i.e. quotes required
    // console.warn(`Checking isCustom node.contenteditable =[${node.contenteditable}]`)
    return node.contenteditable === 'false'
 }

 export const getParentBlockNode = function(node){
    // Keep going up the tree while the node is not a block node
    // (the editor is a block node - a DIV)
    while ( isBlock(node)==false ){
        node = node.parentNode
    }
    return node
}

/**
 * Get the top parent node for a child node 
 * @param {*} node A child node
 * @param {*} stopNode A parent node defining when to stop going back up the dom tree
 * @returns {*} first node below the stop node (if there is one) otherwise the stopNode
 */
export const getTopParentNode = function( node, stopNode ){
    let saved = node
    while ( node != stopNode ){
        saved = node
        node = node.parentNode
    }
    return saved
}

export const cleanForSaving = function( node, buttons ){
    // if ( node.nodeType === 1 && node.tagName == 'BLOCKQUOTE' ){
    //     debugger
    // }
    // Trim text nodes with CR's
    if ( node.nodeType === 3 ){
        if ( node.textContent.includes('\n') ){
            node.textContent = node.textContent.trim()
        }
        return
    }
    // Now strip anything other than a normal node
    if ( node.nodeType !== 1 ){
        node.remove()
        return
    }
    // Remove anything we don't recognise
    if ( isBlock(node) === false && 
         isList(node) === false && 
         isInline(node) === false && 
         isCustom(node) === false ){
        node.remove()
        return
    }
    // Handle custom nodes
    if ( buttons.length>0 && isCustom(node)  ){
        // Does it require cleaning?
        const match = buttons.find( 
            button => button.tag.toUpperCase()===node.tagName
        )
        if ( match && "clean" in match ){
            const newNode = match.clean(node)
            node.parentNode.replaceChild(newNode, node)
        }
        return
    } 
    // Handle child nodes
    node.childNodes.forEach( child => {
        cleanForSaving( child, buttons )
    })
    return 
}


// -----------------------------------------------------------------------------
// @section Selection and keyboard methods
// -----------------------------------------------------------------------------

export const getRange = function(){
    // The selector is looking for a class used with modals so selections
    // are ignored when modals are active
    if ( document.querySelector('.no-range-if-shown.show') === null ){
        let sel = window.getSelection()
        if ( sel.rangeCount==1 ){
            let range =  sel.getRangeAt(0)
            // First parent node that is a block tag
            range.blockParent = getParentBlockNode(range.commonAncestorContainer)
            // First parent node
            range.rootNode = range.commonAncestorContainer
            if ( range.commonAncestorContainer.nodeType === 3 ) {
                range.rootNode = range.commonAncestorContainer.parentNode
            } 
            return range
        }
    }
    return false
}

export const setCursorToTargetNode = function(editor, target){
    // If the target node isn't the editor make it the one before
    if ( target != editor ){
        target = target.previousElementSibling
    }
    // Look for the last child - cannot use lastElementChild because that ignores text nodes
    while ( target.lastChild != null ){
        target = target.lastChild
    }
    // If found and it is a text node set the cursor to the end
    if ( target.nodeType === 3 ){
        console.warn('Found target',target)
        console.warn('Found length',target.textContent.length)
        setCursor(target,target.textContent.length)
    // Else set to the start
    } else {
        setCursor(target,0)
    }
}


export const setCursor = function( node, offset ){
    const range = document.createRange()
    const selection = window.getSelection()
    // Check the offset is in range
    // if ( offset > node.textContent.length - 1 ){
    if ( offset > node.textContent.length ){
        offset = 0
    }
    range.setStart(node, offset)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    return range
}

// Mark text with "unusual" none-keyboard characters
// https://www.w3schools.com/charsets/ref_utf_math.asp
// const START_MARKER = '&isin;' // Is in (i.e. from here)
// const END_MARKER = '&ni;'     // Not in (i.e. from here)

export const START_MARKER = '§'
export const END_MARKER = '±'
const END_MARKER_CLASS = 'end-marker'


export const blockEndMarker = function(){
    const span = document.createElement('span')
    span.classList.add(END_MARKER_CLASS)
    span.contentEditable = 'false'
    span.innerHTML = END_MARKER
    return span
}

let startNode = null
let startOffset = 0
let endNode = null
let endOffset = 0



export const addStartMarker = function( text, offset ){
    return text.substring(0,offset) + 
            START_MARKER + 
            text.substring(offset)
}

export const addEndMarker = function( text, offset ){
    return text.substring(0,offset-1) + 
           END_MARKER +
           text.substring(offset)
}

export const getStartNode = function(parent){
    return findMarkerNode( parent, START_MARKER)
}

export const getEndNode = function(parent){
    return findMarkerNode( parent, END_MARKER)
}

/**
 * Find a text node containing the given marker text
 * @param node parent The node to end searching from
 * @param node marker The marker text to locate
 * @returns {node,offset}|false 
 */
function findMarkerNode( parent, marker ){
    for( let i=0; i<parent.childNodes.length; i++ ){
        const child = parent.childNodes[i]
        if ( child.nodeType === 1 ){
            if ( findMarkerNode( child, marker ) ){
                return true
            }
        } else if ( child.nodeType === 3 ){
            const index = child.textContent.indexOf(marker)
            if ( index != -1 ){
                console.log('Found node with marker', marker)
                child.textContent = child.textContent.replace(marker,'')
                if ( marker == START_MARKER ){
                    startNode = child
                    startOffset = index
                } else {
                    endNode = child
                    endOffset = index
                }
                return true
            }
        }
    }
    return false
}

export const resetSelection = function( editorNode ){
    if ( getStartNode( editorNode ) && getEndNode( editorNode ) ){
        console.log('startNode',startNode)
        console.log('endNode',endNode)
        const range = document.createRange()
        const selection = window.getSelection()
        range.setStart(startNode, startOffset)
        if ( startNode==endNode && startOffset==endOffset){
            range.collapse(true)
        } else {
            range.setEnd(endNode, endOffset)
        }
        selection.removeAllRanges()
        selection.addRange(range)
        return range
    }
    return false
}

export const debounce = function(fn, delay) {
    let timeOutId
    return function(...args) {
        // Clear previous timeout if not expired
        if( timeOutId ) {
            clearTimeout(timeOutId)
        }
        // Set new timeout
        timeOutId = setTimeout(() => {
            fn(...args)
        }, delay)
    }
}

export const appliedFormats = function( node, editorNode, rootNode , formatType){
    let formats = []
    // Collect tags of appropriate type
    while ( node != editorNode && node != null ){
        if ( node.nodeType === 1 ){   
            if ( formatType == '' ){
                formats.unshift( node.tagName )
            } else if ( formatType == 'inline' ){
                if ( isInline(node) ){
                    formats.unshift( node.tagName )
                }
            } else if ( formatType == 'block' ){
                if ( isBlock(node)){
                    formats.unshift( node.tagName )
                }
            } else if ( formatType == 'enter' ){
                formats.unshift( node )
                if ( node == rootNode ){
                    break
                }
            }
        }
        node = node.parentNode
    }
    //console.log(`Applied formats = [${formats.join(' => ')}]`)
    return formats
}


