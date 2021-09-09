// -----------------------------------------------------------------------------
// @section Arrays
// -----------------------------------------------------------------------------

/**
 * Tests whether two arrays are equal - neither can be empty
 * @param {*[]} a 
 * @param {*[]} b 
 * @returns {boolean} true if niether mepty and all values equal
 */
export const arraysEqual = function( a, b ){
    if ( a.length != 0 && b.length!= 0 && a.length != b.length ){
        return false
    }
    return a.every( (item, index) => b[index] == item )
}

/**
 * Check whether array item in a is also a member of b
 * @param {*[]} a 
 * @param {*[]} b 
 * @returns 
 */
export const arraySubset = function( a, b ){
    return a.every( (item, index) => b[index] == item )
}


// -----------------------------------------------------------------------------
// @section Dom manipulation
// -----------------------------------------------------------------------------

let tags = { block: ['DIV','H1','H2','H3','P','LI', 'BLOCKQUOTE'], list: ['LI'], custom:[]}


/**
 * Register a new button type with tag to allow future checking/cleaning
 * @param {string} type 
 * @param {string} tag 
 */
export const registerTag = function(type,tag){
    if ( tags[type]!=undefined && tags[type].includes(tag) == false && tag!='CLEAR'){
        tags[type].push(tag)
        //console.log('registered tag', tag, 'in type', type)
    }
}

/**
 * Debug function to print out the tags array
 */
 export const debugTags = function(){
    console.log('blocks',tags.block.join(', '))
    console.log('lists',tags.list.join(', '))
    console.log('inline',tags.inline.join(', '))
    console.log('customs',tags.custom.join(', '))
}

/**
 * Insert newNode after existingNode
 * @param {HTMLElement} newNode 
 * @param {HTMLElement} existingNode 
 * @returns {HTMLElement} the new node inserted
 */
export const insertAfter = function(newNode, existingNode) {
    if ( newNode == null || existingNode == null){
        console.warn('Error.  Found when inserting a new node after an existing node')
    }
    return existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

/**
 * Insert newNode before existingNode
 * @param {HTMLElement} newNode 
 * @param {HTMLElement} existingNode 
 * @returns {HTMLElement} the new node inserted
 */
export const insertBefore = function(newNode, existingNode) {
    if ( newNode == null || existingNode == null ){
        console.warn('Error.  Found when inserting a new node before an existing node')
    }
    return existingNode.parentNode.insertBefore(newNode, existingNode);
}

/**
 * 
 * @param {HTMLElement} existingNode 
 * @param {string} tag The html tag of the new node
 * @param {string} html The new innerHTML string to use for the replacement node
 * @returns 
 */
export const replaceNode = function(existingNode, tag, html){
    if ( existingNode == null || existingNode.parentNode == null ){
        console.warn('Error.  Found when replacing an existing node with a new node')
        console.warn({existingNode})
        console.warn(existingNode.parentNode)
    }
    const replacementNode = document.createElement(tag)
    replacementNode.innerHTML = html
    const node = existingNode.parentNode.insertBefore(replacementNode, existingNode)
    existingNode.parentNode.removeChild(existingNode)
    return node
}

/**
 * Check whether the node is an inline style span
 * @param {HTMLElement} node 
 * @returns {boolean}
 */
export const isStyle = function( node ){
    if ( node.nodeType != 1 ){
        return false
    }
    return node.tagName === 'SPAN'
}

/**
 * Check whether the node is a list container
 * @param {HTMLElement} node 
 * @returns {boolean}
 */
export const isList = function( node ){
    if ( node.nodeType != 1 ){
        return false
    }
    return node.tagName === 'OL' || node.tagName === 'UL' 
}

/**
 * Check whether the node is a block container
 * @param {HTMLElement} node 
 * @returns {boolean}
 */
export const isBlock = function( node ){
    if ( node.nodeType != 1 ){
        return false
    }
    const result = tags.block.includes(node.tagName)
    return result
}

/**
 * Checks whether the element is a custom element
 * @param {HTMLElement} node 
 * @returns {boolean}
 */
export const isCustom = function( node ){
    if ( node.tagName == undefined ){
        return false
    }
    return node.getAttribute('contenteditable') != null && node.getAttribute('contenteditable') == "false"
}

/**
 * Check whether the selected range is completely within a custom element
 * Cannot start a selection in a custom block and then select outside of it
 * so do not need to check the end range
 * @param {Range} range 
 * @returns {boolean|HTMLElement} The custom element containing the range or false if not
 */
const rangeStartContainerInCustom = function( range ){
    if ( range === false ){
        console.warn('Error.  Passed missing range when looking for a custom node')
    }
    let node = range.startContainer
    while ( isCustom(node)==false && 
            node.parentNode != null && node.parentNode && 
            node.parentNode.tagName != 'DIV'){
        node = node.parentNode
    }
    return isCustom(node) ? node : false
}

/**
 * Return an array of custom blocks contained within the active range
 * @param {Range} range Active range
 * @returns {HTMLElement[]} Array of custom blocks, empty if none found
 */
export const rangeContainsCustoms = function( range ){
    let customs = []
    // Loop from start container to end container checking for a non-editable block
    let parent = getParentBlockNode(range.startContainer)
    const endParent = getParentBlockNode(range.endContainer)
    let done = false
    while ( !done ){
        const custom = parent.querySelector('[contenteditable="false"]')
        if ( custom !== null ){
            customs.push(custom)
        }
        if ( parent === endParent ){
            done = true
        }
        parent = parent.nextElementSibling
    }
    return customs
}

 /**
 * Get the inline styles for all nodes in the tree from the lowest to the highest that
 * isn;t a block node. In practice these are attached only to SPANs
 * @param {HTMLElement} node 
 * @returns {string} of styles separated by semi-colons
 */
export const getInlineStyles = function(node){
    if ( node == null ){
        console.warn('Found null node when getting inline styles')
    }
    let styles = ''
    while ( isBlock(node) == false ){
        if ( node.nodeType === 1 ){
            const inlineStyles = node.getAttribute('style')
            if ( inlineStyles != null && inlineStyles != '' ){
                styles += ';' + inlineStyles
            }
        }
        if ( node.parentNode == null ){
            console.warn('Error.  Found missing parent node when getting inline styles')
        }
        node = node.parentNode
    }
    return styles
}

/**
 * Get the parent block node or return the block if the node itself is a block
 * @param {HTMLElement} node 
 * @returns {HTMLElement} parent block node
 */
export const getParentBlockNode = function(node){
    if ( node == null ){
        console.warn('Error. Passed null node to getParentBlockNode')
    }
    // console.log('getParentBlockNode',node)
    // Keep going up the tree while the node is not a block node
    // (the editor is a block node - a DIV)
    while ( isBlock(node)==false ){
        if ( node.parentNode == null ){
            console.warn('Error. Found missing parent node when getting parent block node')
            return false
        }
        node = node.parentNode
        // console.log('node',node)
    }
    return node
}

/**
 * Get the parent editor node of a node
 * @param {HTMLElement} node 
 * @returns {HTMLElement} 
 */
export const getEditorNode = function( node ){
    while ( node.getAttribute('contenteditable') !== "true" ) {
        if ( node.parentNode == null ){
            console.warn('Error.  Found missing parent node when getting editor node')
        }
        node = node.parentNode
    }
    return node
}

/**
 * Get the top parent node for a child node 
 * @param {HTMLElement} node A child node
 * @param {HTMLElement} stopNode A parent node defining when to stop going back up the dom tree
 * @returns {HTMLElement} first node below the stop node (if there is one) otherwise the stopNode
 */
export const getTopParentNode = function( node, stopNode ){
    if ( node == null || stopNode == null ){
        console.warn('Error. Passed null node or stopNode to getTopParentNode')
    }
    let saved = node
    while ( node != stopNode ){
        saved = node
        if ( node == null ){
            console.warn('Error.  Found missing node traversing tree in getTopParentNode')
            return saved
        }
        if ( node.parentNode == null ){
            console.warn('Error.  Found missing parent node when getting top parent node')
            return saved
        }
        node = node.parentNode
    }
    return saved
}

/**
 * Cleans the node, removing any non-supported tags/styles
 * Invokes custom plugin cleaning if defined
 * @param {HTMLElement} node 
 * @param {object[]} buttons array of button objects which have clean methods
 */
export const cleanForSaving = function( node, buttons ){
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
         isStyle(node) === false && 
         isCustom(node) === false ){
        node.remove()
        return
    }
    // clean styled spans
    if ( node.tagName == 'SPAN' ){
        cleanStyledSpan(node)
        return
    }
    // Handle custom cleaning - not just for custom nodes
    if ( buttons.length>0 ){
        // Does it require cleaning?
        const match = buttons.find( 
            button => button.tag.toUpperCase()===node.tagName
        )
        if ( match ){
            const newNode = match.clean(node)
            if ( node.parentNode == null ){
                console.warn('Error.  Found missing parent node when cleaning for saving')
            }
            node.parentNode.replaceChild(newNode, node)
        }
    } 

    // Only stop processing if this is a custom node
    if ( isCustom(node) ){
        return
    }

    // Handle child nodes
    node.childNodes.forEach( child => {
        cleanForSaving( child, buttons )
    })
}

/**
 * Remove none-standard styling from the span
 * @param {HTMLElement} span The span which should have at least one style
 */
function cleanStyledSpan(span){
    const style = span.getAttribute('style')
    let newStyle = ''
    // console.log({style})
    if ( style ){
        const parts = style.split(';')
        parts.forEach( part => {
            if ( part ){
                if ( part.includes('var(--') == false ){
                    newStyle += `${part};` 
                }
            }
        })
    }
    if ( newStyle ){
        span.setAttribute('style',newStyle)
    } else if ( style ) {
        const text = document.createTextNode(span.textContent.trim())
        insertBefore( text, span )
        span.remove()
    }
}


// -----------------------------------------------------------------------------
// @section Selection and keyboard methods
// -----------------------------------------------------------------------------

// Mark text with "unusual" none-keyboard characters
export const START_MARKER = '§§'
export const END_MARKER = '±±'

// Global variables in conjuction with finding marker nodes and resetting 
// selections
let startNode = null
let startOffset = 0
let endNode = null
let endOffset = 0


/**
 * Add start and end marks to the selected text in order to allow reselection at
 * the end of the editing operation
 * @param {Range} range 
 */
export const addMarkers = function( range ){
    // console.log('range',range)
    if ( range.startContainer == range.endContainer ){
        // console.log('start container matches end container')
        range.startContainer.textContent = 
            range.startContainer.textContent.substring(0, range.startOffset) +
            START_MARKER +
            range.startContainer.textContent.substring(range.startOffset,range.endOffset) +
            END_MARKER +
            range.startContainer.textContent.substring(range.endOffset)
    } else {
        // console.log('start container does NOT match end container')
        range.startContainer.textContent = 
            range.startContainer.textContent.substring(0, range.startOffset) +
            START_MARKER +
            range.startContainer.textContent.substring(range.startOffset)
        range.endContainer.textContent = 
            range.endContainer.textContent.substring(0, range.endOffset) +
            END_MARKER +
            range.endContainer.textContent.substring(range.endOffset)
    }
}

/**
 * Add additional properties to the range
 * @param {Range} range 
 * @returns {object} The original range object with additional props
 */
function augmentRange(range){
    if ( range === false ){
        console.warn('Found missing range when augmenting range')
    }
    // console.log('augmentRange',range)
    // First parent node that is a block tag
    range.blockParent = getParentBlockNode(range.commonAncestorContainer)
    // First parent node
    range.rootNode = range.commonAncestorContainer
    if ( range.commonAncestorContainer.nodeType === 3 ) {
        if ( range.commonAncestorContainer.parentNode == null ){
            console.warn('Error.  Found missing parent node when augmenting range')
        }
        range.rootNode = range.commonAncestorContainer.parentNode
    }
    // Set flag to indicate whether the range is in a custom node
    range.custom = rangeStartContainerInCustom(range)
    return range
}


/**
 * Get the document range or return false if not set
 * @returns {Range|false}
 */
export const getRange = function(){
    let sel = window.getSelection()
    // console.log('new selection',sel)
    if ( sel.rangeCount==1 ){
        let range =  sel.getRangeAt(0)
        // console.log('New range found')
        range = augmentRange(range)
        return range
    }
    return false
}

/**
 * Set the cursor in the target node
 * @param {HTMLElement} editor The editor node
 * @param {HTMLElement} target The target node for the cursor
 */
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
        // console.log('Found target',target)
        // console.log('Found length',target.textContent.length)
        setCursor(target,target.textContent.length)
    // Else set to the start
    } else {
        setCursor(target,0)
    }
}

/**
 * Set the cursor in a text node at the specified offset and
 * return the new range
 * @param {HTMLElement} node 
 * @param {number} offset 
 * @returns {Range}
 */
export const setCursor = function( node, offset ){
    let range = document.createRange()
    const selection = window.getSelection()
    // Check the offset is in range
    if ( offset > node.textContent.length ){
        offset = 0
    }
    range.setStart(node, offset)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    range = augmentRange(range)
    return range
}

/**
 * Find the node containing the start marker
 * @param {HTMLElement} parent 
 * @returns {HTMLElement}
 */
const getStartNode = function(parent){
    return findMarkerNode( parent, START_MARKER)
}

/**
 * Find the node containing the end marker
 * @param {HTMLElement} parent 
 * @returns {HTMLElement}
 */
const getEndNode = function(parent){
    return findMarkerNode( parent, END_MARKER)
}

/**
 * Find a text node containing the given marker text. As a side effect, sets 
 * the value of startNode, endNode, startOffset and endOffset
 * @param {HTMLElement} parent The node to end searching from
 * @param {HTMLElement} marker The marker text to locate
 * @returns {boolean} true if finds marker node, false otherwise
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
                // console.log('Found node with marker', marker)
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

/**
 * Reset the selection using the start and end markers
 * @param {HTMLElement} editorNode 
 * @returns {Range|false}
 */
export const resetSelection = function( editorNode ){
    if ( getStartNode( editorNode ) && getEndNode( editorNode ) ){
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

// -----------------------------------------------------------------------------
// @section Miscellaneous
// -----------------------------------------------------------------------------

/**
 * Generate a randon uid based on the current time
 * @returns {string}
 */
export const generateUid = function(){
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Smooth out key entry
 * @param {function} fn a callback function
 * @param {number} delay delay in ms before callback triggered
 * @returns 
 */
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

