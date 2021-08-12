let panel = null

/**
 * Generate feedback panel
 * @param {string} title 
 * @param {string} message 
 * @returns {string}
 */
function template(title, message){
    return `
        <div class="modal-panel-container">
            <header class="modal-panel-header">
                <h3 class="modal-panel-title">${title}</h3>
            </header>
            <div class="modal-panel-message">${message}</div>
            <div class="modal-panel-buttons">
                <button type="button" class="btn btn-success close">Close</button>
            </div>
        </div>`
}

/**
 * Hide current panel by removing transition class "show" and then removing from
 * the dom.
 */
const hide = function(){
    panel.classList.remove('show')
    setTimeout( ()=>{
        panel.remove()
        panel = null
    }, 500 )
}

// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

/**
 * Show the modal panel using transition class "show"
 * @param {string} title 
 * @param {string} message
 */
export const show = function(title, message){
    panel = document.createElement('DIV')
    panel.classList.add('modal-panel')
    panel.innerHTML = template(title, message)
    panel.querySelector('button').addEventListener('click', event => {
        event.stopPropagation()
        hide()
    })
    document.querySelector('body').appendChild(panel)
    setTimeout( () => {
        panel.classList.add('show')
    }, 10 )
}
