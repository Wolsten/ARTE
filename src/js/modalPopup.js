let panel = null

/**
 * Get the position for the input dialogue base don current range
 * @param {object} editor
 * @param {HTMLElement} dialogue 
 * @returns {number,number} position as x,y coordinates
 */
function getPosition(editor, dialogue){
    let pos
    // If this is not a text node then get the first text node
    // Can happen at the start of a line when backspace to the start
    if ( editor.range.startContainer.nodeType !== 3 ){
        if ( editor.range.startContainer.childNodes.length>0 ){
            let node = editor.range.startContainer.childNodes[0]
            pos = node.getBoundingClientRect()
        } else {
            pos = {x:editor.editorNode.offsetLeft, y:editor.editorNode.offsetTop}
        }
    // Text node
    } else {
        pos = editor.range.getBoundingClientRect()
        //console.log('text node const ',pos)
    }
    if ( (pos.x + dialogue.outerWidth) > window.innerWidth ){
        pos.x = window.innerWidth - dialogue.outerWidth - 20;
    }
    if ( (pos.y + dialogue.outerHeight) > window.innerHeight ){
        pos.y = window.innerHeight - dialogue.outerHeight - 40;
    }
    return pos
} 


// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

/**
 * Hide current panel immediately
 */
 export const hide = function(){
    panel.remove()
    panel = null
}


/**
 * Show the modal popup panel. 
 * @param {string} html - the inner html for the popup
 * @return {HTMLElement} dialogue added to the dom
 */
 export const show = function( editor, html ){
    panel = document.createElement('DIV')
    panel.classList.add('modal-popup')
    panel.setAttribute('data-modal-active', true)
    const popup = document.createElement('DIV')
    popup.classList.add('modal-popup-content')
    popup.innerHTML = html
    panel.appendChild(popup)
    // Add to dom
    document.querySelector('body').appendChild(panel)
    // Invoke with arrow function, otherwise this will be the current window
    setTimeout( () => {
        panel.classList.add('show')
    }, 10 )
    // Position
    const position = getPosition(editor, popup)
    popup.style.top = `${position.y}px`
    popup.style.left = `${position.x}px`
    // Set cancel event
    document.addEventListener('keyup', event => {
        if ( event.key === 'Escape' ){
            hide()
        }
    })
    return panel
}


