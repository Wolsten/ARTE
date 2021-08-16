let panel = null


// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

/**
 * Hide current panel by removing transition class "show" and then removing from
 * the dom.
 */
 export const hide = function(){
    panel.classList.remove('show')
    setTimeout( ()=>{
        panel.remove()
        panel = null
    }, 500 )
}

/**
 * Show the modal panel using transition class "show"
 * @param {string} title 
 * @param {string} html 
 */
export const show = function( title, html ){
    panel = document.createElement('DIV')
    panel.classList.add('edit-panel')
    panel.setAttribute('data-modal-active',true)
    panel.innerHTML = `
        <div class="edit-panel-container">
            <header class="modal-panel-header">
                <h3 class="modal-panel-title">${title}</h3>
            </header>
            <div class="edit-panel-body">
                ${html}
            </div>
        </div>`
    document.querySelector('body').appendChild(panel)
    // Invoke with arrow function, otherwise this will be the current window
    setTimeout( () => {
        panel.classList.add('show')
    }, 10 )
    return panel
}

