function editorToolbarButton(button){
    const {type, tag, label, icon, input} = button
    // e.g. icon "bi-eye"
    // data-bs-toggle="button" allows the active state to be shown by adding
    // the class "active" and aria-pressed="true"(for assistive tech)
    if ( input == 'button' ){
        return `
            <button id="${tag}" type="button" class="btn btn-light ${type}" title="${label}">
                ${icon}
            </button>`
    } else {
        return `<input id="${tag}" type="${input}" class="btn btn-light ${type}" title="${label}"/>`
    }
}

function editorToolBarGroup(title,html){
    return `<div class="editor-toolbar-group block" role="group" title="${title}">${html}</div>`
}

function editorToolbar(buttons){
    let buttonsHtml = ''
    let groups = []
    // console.log('buttons.length',buttons.length)
    buttons.forEach((button,index)=>{
        buttonsHtml += editorToolbarButton(button)
        const nextGroup = index==buttons.length-1 ? '' : buttons[index+1].group
        // Found end of a group?
        if ( button.group != nextGroup ){
            // console.log('found new group at button',button.tag)
            const title = `${button.group} buttons`
            groups.push( editorToolBarGroup(title,buttonsHtml) )
            buttonsHtml = ''
        }
    })
    // console.log('groups',groups)
    return groups.join('<span class="editor-toolbar-group-separator">|</span>')
}

export const editor = function(buttons,options){
    const toolbar = editorToolbar(buttons)
    let classes = ''
    if ( options.headingNumbers == 'on' ){
        classes += 'heading-numbers'
    }
    return `
        <div class="editor-container">
            <div class="editor-toolbar">
                ${toolbar}
            </div>
            <div class="editor-body ${classes}" contenteditable="true">
                ...
            </div>
        </div>`
}