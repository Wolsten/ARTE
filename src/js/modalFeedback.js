"use strict"

let panel = null

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
