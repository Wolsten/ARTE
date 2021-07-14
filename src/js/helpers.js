// -----------------------------------------------------------------------------
// @section Arrays
// -----------------------------------------------------------------------------

// import { i } from "./plugins/icons"

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

/**
 * Find a text node containing the given marker text
 * @param node parent The node to start searching from
 * @param node marker The marker text to locate
 * @returns node|false 
 */
export const findMarkerNode = function( parent, marker ){
    for( let i=0; i<parent.childNodes.length; i++ ){
        const child = parent.childNodes[i]
        if ( child.nodeType === 1 ){
            const node = findMarkerNode( child, marker )
            if ( node !== false ){
                node.textContent = node.textContent.replace(marker,'')
                return node
            }
        } else if ( child.nodeType === 3 ){
            if ( child.textContent.includes(marker) ){
                return child
            }
        }
    }
    return false
}



export const isInline = function( node ){
    if ( node.tagName == undefined ){
        return false
    }
    const tags = ['B','I','U']
    return tags.includes(node.tagName)
}

export const isList = function( node ){
    if ( node.tagName == undefined ){
        return false
    }
    const tags = ['UL','OL','LI']
    return tags.includes(node.tagName)
}

// @todo These need to be dynamically registered
// Note the addition of LI in both sets and DIV in blocks

export const isBlock = function( node ){
    if ( node.tagName == undefined ){
        return false
    }
    // const tags = ['DIV','H1','H2','H3','H4','H5','H6','P','LI']
    const tags = ['DIV','H1','H2','P','LI']
    return tags.includes(node.tagName)
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



// let positions = []
// export const getChildNodePosition = function( node, parent, firstTime ){
//     if ( firstTime ) {
//         positions = []
//     }
//     for( let i=0; i<parent.childNodes.length; i++ ){
//         let child = parent.childNodes[i]
//         if ( node == child ){
//             positions = [i]
//             break
//         } else {
//             const oldPositions = [...positions]
//             getChildNodePosition( node, child, false )
//             if ( positions.length > oldPositions.length ){
//                 positions = [i, ...positions]
//             }
//         }
//     }
//     return positions
// }

/**
 * Find the position of a node in a parent hierarchy as set of child indices
 * @param {*} node The current node
 * @param {*} parent A (grand-)parent node 
 * @param {*} positions A list of indices moving down the tree of child positions
 * to get to the initial node within the initial parent 
 * @returns array of indices, may (but should not be) empty
 */
// export const getChildNodePosition = function( node, parent, positions ){
//     for( let i=0; i<parent.childNodes.length; i++ ){
//         let child = parent.childNodes[i]
//         if ( node == child ){
//             return [i]
//         } else {
//             const newPositions = getChildNodePosition( node, child, positions )
//             if ( newPositions.length > positions.length ){
//                 return [i, ...newPositions]
//             }
//         }
//     }
//     return positions
// }

export const getChildNode = function( node, marker ){
    found = false
    if ( node.nodeType === 3 ){
        if ( child.textContent.contains(marker) ){
            found = child
        }
    } else {
        node.childNodes.forEach( child => {
            found = getChildNode(child,marker)
        })
    }
    return found
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

export const setCursorWithPosition = function( node, positions, offset ){
    positions.forEach( position => {
        if ( node.childNodes[position] != undefined ){
            node = node.childNodes[position]
        }
    })
    return setCursor( node, offset )
}

export const setCursor = function( node, offset ){
    const range = document.createRange()
    const selection = window.getSelection()
    // Check the offset is in range
    if ( offset > node.textContent.length - 1 ){
        offset = 0
    }
    range.setStart(node, offset)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    return range
}

export const resetSelection = function( startNode, startOffset, endNode, endOffset ){
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


