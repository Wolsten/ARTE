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

export const isBlock = function( node ){
    if ( node.tagName == undefined ){
        return false
    }
    // const tags = ['DIV','H1','H2','H3','H4','H5','H6','P','LI']
    const tags = ['DIV','H1','H2','P','LI']
    return tags.includes(node.tagName)
}

export const isCustom = function( node ){
    // if ( node.tagName == undefined ){
    //     return false
    // }
    // if ( isInline(node) || isBlock(node) || isList(node) ){
    //     return false
    // }
    // if ( node.contenteditable == false ){
    //     return false
    // }
    // return true
    // @todo Check this is the correct test - i.e. quotes required
    return node.contenteditable == 'false'
 }

 export const getParentBlockNode = function(node){
    // Keep going up the tree while the node is not a block node
    // (the editor is a block node - a DIV)
    while ( isBlock(node)==false ){
        node = node.parentNode
    }
    return node
}

export const getTopParentNode = function( node, stopNode ){
    // Return the stopNode if that is the first found
    // Otherwise return the immediately below the stop node
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

export const setCursor = function( node, offset ){
    let range = document.createRange()
    let selection = window.getSelection()
    range.setStart(node, offset)
    range.collapse(true)
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
        }, delay);
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


