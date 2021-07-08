function editorToolbarButton(button){
    const {type, id, label, icon} = button
    if ( button.attr === undefined ){
        button.attr = ''
    }
    // e.g. icon "bi-eye"
    // data-bs-toggle="button" allows the active state to be shown by adding
    // the class "active" and aria-pressed="true"(for assistive tech)
    return `
        <button id="${id}" type="button" class="btn btn-light ${type}" 
            ${button.attr} aria-label="${label}" title=${label}>
            ${icon}
        </button>`
}

function editorToolbar(buttons){
    let htmlButtons = {
        block:'',
        list:'',
        inline:'',
        edit:'',
        custom:''
    }
    buttons.forEach( button => {
        switch (button.type){
            case 'block':
                htmlButtons.block += editorToolbarButton(button)
                break
            case 'list':
                htmlButtons.list += editorToolbarButton(button)
                break
            case 'inline':
                htmlButtons.inline += editorToolbarButton(button)
                break
            case 'edit':
                htmlButtons.edit += editorToolbarButton(button)
                break
            case 'custom':
                htmlButtons.custom += editorToolbarButton(button)
                break
        }
    })
    return htmlButtons
}

export const editor = function(buttons,preferences){
    const buttonsHTML = editorToolbar(buttons)
    let html = []
    if ( buttonsHTML.block ){
        html.push(`<div class="editor-toolbar-group block" role="group" aria-label="Block format buttons">${buttonsHTML.block}</div>`)
    }
    if ( buttonsHTML.list ){
        html.push(`<div class="editor-toolbar-group list" role="group" aria-label="List format buttons">${buttonsHTML.list}</div>`)
    }
    if ( buttonsHTML.inline ){
        html.push(`<div class="editor-toolbar-group inline" role="group" aria-label="Inline format buttons">${buttonsHTML.inline}</div>`)
    }
    if ( buttonsHTML.edit ){
        html.push(`<div class="editor-toolbar-group edit" role="group" aria-label="Edit buttons">${buttonsHTML.edit}</div>`)
    }
    if ( buttonsHTML.custom ){
        html.push(`<div class="editor-toolbar-group custom" role="group" aria-label="Custom buttons">${buttonsHTML.custom}</div>`)
    }
    let classes = ''
    if ( preferences.headingNumbers == 'on' ){
        classes += 'heading-numbers'
    }
    return `
        <div class="editor-container">
            <div class="editor-toolbar">
                ${html.join('<span class="editor-toolbar-group-separator">|</span>')}
            </div>
            <div class="editor-body ${classes}" contenteditable="true">
                ...
            </div>
        </div>`
}