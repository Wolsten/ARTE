import * as Helpers from './helpers.js'
import * as Icons from './icons.js'

/**
 * Return HTML for a toolbar button
 * @param {object} button 
 * @returns {string}
 */
function editorToolbarButton(button){
    const {type, tag, label, icon} = button
    return `
        <button id="${tag}" type="button" class="btn btn-light ${type}" title="${label}">
            ${icon}
        </button>`
}

/**
 * Return HTML for a toolbar group of buttons
 * @param {string} title 
 * @param {string} html 
 * @returns {string}
 */
function editorToolBarGroup(title,html){
    return `<div class="editor-toolbar-group block" role="group" title="${title}">${html}</div>`
}

/**
 * Return HTML for the toolbar
 * @param {object[]} buttons 
 * @returns {string}
 */
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

/**
 * Return the HTML for the editor container including toolbar, editor body
 * and an optional sidebar
 * @param {object[]} buttons 
 * @param {object} options 
 * @returns {string}
 */
export const editor = function(buttons,options){
    const toolbar = editorToolbar(buttons)
    let classes = ''
    if ( options.headingNumbers ){
        classes += 'heading-numbers'
    }
    return `
        <div class="editor-container">
            <div class="editor-toolbar">
                ${toolbar}
            </div>
            <div class="editor-main">
                <div class="editor-sidebar dont-break-out">
                    <a href="#" class="editor-sidebar-open" title="Click to open/close explorer">Explore ${Icons.sidebarOpen}</a>
                    <div class="editor-sidebar-content">
                        <ul class="tab-menu"></ul>
                        <div class="tab-content"></div>
                    </div>
                </div>
                <div class="editor-body ${classes}" contenteditable="true"></div>
            </div>
        </div>`
}


export const sidebar = function(tabList){
    let menu = ''
    let content = ''
    tabList.forEach( (item,index) => {
        const active = index==0 ? 'active' : ''
        const show = index==0 ? 'show' : ''
        menu += `<li><a href="#" class="tab-menu ${active}" data-tab-target="tab-${index}" title="${item.label}">${item.icon}</a></li>`
        content += `<div class="tab-item ${show}" data-tab-id="tab-${index}"></div>`
    })
    return {menu, content}
}


/**
 * Debugging function to display the current selected range
 * @param {HTMLElement|false} target where to display debug info
 * @param {object} range Augmented range object
 */
 export const debugRange = function(target, range){
    if ( target == false ){
        return
    }
    // console.warn('debugRange',range)
    if ( range === false ){
        target.innerHTML = '<p>No range selected</p>'
    } else {
        target.innerHTML = `
                <h5>Selection info:</h5>
                <div class="col">
                    <label>Block parent</label><span>${range.blockParent.tagName}</span>
                    <label>commonAncestorC</label><span>${range.commonAncestorContainer.tagName ? range.commonAncestorContainer.tagName : range.commonAncestorContainer.textContent}</span>
                    <label>rootNode</label><span>${range.rootNode.tagName}</span>
                    <label>collapsed</label><span>${range.collapsed}</span>
                    <label>custom</label><span>${range.custom ? range.custom.tagName : 'false'}</span>
                </div>
                <div class="col">
                    <label>startC</label><span>${range.startContainer.tagName ? range.startContainer.tagName : range.startContainer.textContent}</span>
                    <label>startOffset</label><span>${range.startOffset}</span>
                    <label>endC</label><span>${range.endContainer.tagName ? range.endContainer.tagName : range.endContainer.textContent}</span>
                    <label>endOffset</label><span>${range.endOffset}</span>
                </div>`
    }
}
