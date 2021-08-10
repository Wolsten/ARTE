"use strict"

let panel = null

/**
 * Create modal panel
 * @param {string} title 
 * @param {string} message 
 * @param {string} cancel 
 * @param {string} confirm 
 * @returns {string}
 */
function form(title,message,cancel,confirm){
    if ( cancel == undefined ){
        cancel = 'No - stay here'
    }
    if ( confirm == undefined ){
        confirm = 'Yes - lose changes'
    }
    return `
        <div class="modal-panel-container">
            <header class="modal-panel-header">
                <h3 class="modal-panel-title">${title}</h3>
            </header>
            <div class="modal-panel-message">${message}</div>
            <div class="modal-panel-buttons">
                <button type="button" class="cancel">${cancel}</button>
                <button type="button" class="confirm">${confirm}</button>
            </div>
        </div>`
}


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
 * @param {string} message 
 * @param {string} cancel 
 * @param {string} confirm 
 * @returns {HTMLElement} the confirmation button
 */
export const show = function( title, message, cancel, confirm){
    if ( cancel == undefined ){
        cancel = 'No - stay here'
    }
    if ( confirm == undefined ){
        confirm = 'Yes - lose changes'
    }
    panel = document.createElement('DIV')
    panel.classList.add('modal-panel')
    panel.innerHTML = form(title,message, cancel, confirm)
    panel.querySelector('button.cancel').addEventListener('click', event => {
        event.stopPropagation()
        hide()
    })
    document.querySelector('body').appendChild(panel)
    // Invoke with arrow function, otherwise this will be the current window
    setTimeout( () => {
        panel.classList.add('show')
    }, 10 )
    return panel.querySelector('button.confirm')
}
