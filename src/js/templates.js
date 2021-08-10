"use strict"


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
 * Return the HTML for the editor container including toolbar and editor body
 * @param {object[]} buttons 
 * @param {object} options 
 * @returns {string}
 */
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

/**
 * Debugging function to display the current selected range
 * @param {Range} range 
 * @returns {string} empty if no container found for the output
 */
export const debugRange = function(range){
    const debug = document.getElementById('debug')
    if ( debug == null ){
        return ''
    }
    // console.warn('debugRange',range)
    if ( range === false ){
        debug.innerHTML = 'No range selected'
    } else {
        debug.innerHTML = `
            <h5>Selection info:</h5>
            <div class="debug">
                <div class="col">
                    <label>Block parent</label><span>${range.blockParent.tagName}</span>
                    <label>commonAncestorC</label><span>${range.commonAncestorContainer.tagName ? range.commonAncestorContainer.tagName : range.commonAncestorContainer.textContent}</span>
                    <label>rootNode</label><span>${range.rootNode.tagName}</span>
                    <label>collapsed</label><span>${range.collapsed}</span>
                </div>
                <div class="col">
                    <label>startC</label><span>${range.startContainer.tagName ? range.startContainer.tagName : range.startContainer.textContent}</span>
                    <label>startOffset</label><span>${range.startOffset}</span>
                    <label>endC</label><span>${range.endContainer.tagName ? range.endContainer.tagName : range.endContainer.textContent}</span>
                    <label>endOffset</label><span>${range.endOffset}</span>
                </div>
            </div>`
    }
}