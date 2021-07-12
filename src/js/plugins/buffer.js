import * as Icons from './icons.js'

let size = 10
let bufferIndex = 0
let target = null
let buffer = []

export const init = function( options ){
    size = options.size
    target = options.target
    buffer = [target.innerHTML]
}

export const disabled = function( action ){
    if ( action == 'UNDO' ){
        return buffer.length==0 || bufferIndex==0
    }
    if ( action == 'REDO' ){
        return bufferIndex >= buffer.length - 1
    }
    return true
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
}

function undo(){
    console.log('handle undo with buffer index', bufferIndex)
    if ( bufferIndex > 0 ){
        bufferIndex --
        target.innerHTML = buffer[bufferIndex]
        return true
    }
    return false
}

function redo(){
    console.log('handle redo with buffer index', bufferIndex)
    if ( bufferIndex + 1 < buffer.length ){
        bufferIndex ++
        target.innerHTML = buffer[bufferIndex]
        return true
    }
    return false
}

// export const click = function( tag ){
//     console.log('Handling edit with button id', tag)
//     switch ( tag ){
//         case 'UNDO':
//             return undo()
//         case 'REDO':
//             return redo()
//     }
//     return false
// }

export const buttons = [
    {
        type:'buffer', 
        tag:'UNDO', 
        label:'Undo', 
        icon:Icons.undo,
        click: undo
    },
    {
        type:'buffer', 
        tag:'REDO',
        label:'Redo', 
        icon:Icons.redo,
        click: redo
    }
]

