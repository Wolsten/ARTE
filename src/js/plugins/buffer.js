import * as Icons from './icons.js'
import ToolbarButton from './ToolbarButton.js'

let size = 10
let bufferIndex = 0
let target = null
let buffer = []

function setButtonState(){
    UNDO.disabled()
    REDO.disabled()
}

function undo(){
    let status = false
    if ( bufferIndex > 0 ){
        bufferIndex --
        target.innerHTML = buffer[bufferIndex]
        status = true
    }
    setButtonState()
    return status
}

function redo(){
    if ( bufferIndex + 1 < buffer.length ){
        bufferIndex ++
        target.innerHTML = buffer[bufferIndex]
        return true
    }
    setButtonState()
    return false
}

const undoDisabled = function(){
    this.element.disabled = buffer.length==0 || bufferIndex==0
}

const redoDisabled = function(){
    this.element.disabled = bufferIndex >= buffer.length - 1
}


// -----------------------------------------------------------------------------
// @section Exports
// -----------------------------------------------------------------------------

export const init = function( options ){
    size = options.size
    target = options.target
    buffer = [target.innerHTML]
}

export const update = function(){
    if ( buffer.length > size ){
        // Remove first element
        buffer.shift()
    }
    // Check buffer index in case need to reset buffer when the user had
    // undone and then made new changes
    if ( (bufferIndex + 1) < buffer.length ){
        const items = buffer.length - (bufferIndex + 1)
        for( let i=0; i<items; i++){
            buffer.pop()
        }
    }
    // Add the new one
    buffer.push(target.innerHTML)
    bufferIndex = buffer.length - 1
    console.log('buffer', buffer)
    // Update buttons
    setButtonState()
}

const uOptions = {disabled:undoDisabled}
const rOptions = {disabled:redoDisabled}
const UNDO = new ToolbarButton('buffer','UNDO','Undo', Icons.undo, undo, uOptions)
const REDO = new ToolbarButton('buffer','REDO','Redo', Icons.redo, redo, rOptions)

export const buttons = [UNDO, REDO]


