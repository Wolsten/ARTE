function remove(){
    const panel = document.querySelector('.custom-panel').remove()
}

function hide(){
    const form = document.querySelector('.custom-form').classList.remove('show')
}

function delayed(){
    const form = document.querySelector('.custom-form')
    form.classList.add('show')
    form.querySelector('button').focus()
}

function template(title, message){
    return `
        <div class="custom-form w-75 bg-white p-3 rounded">
            <div class="header">
                <h5 class="title">${title}</h5>
            </div>
            <div class="message border-top border-bottom pt-3 pb-3">${message}</div>
            <div class="mt-3">
                <button type="button" class="btn btn-success close">Close</button>
            </div>
        </div>`
}

export const show = function(title, message){
    const panel = document.createElement('DIV')
    panel.classList.add('custom-panel')
    panel.innerHTML = template(title, message)
    const button = panel.querySelector('button')
    panel.addEventListener('click', ()=>{
        hide()
        setTimeout( remove, 100 )
    })
    document.body.appendChild(panel)
    setTimeout( delayed, 1)
}
