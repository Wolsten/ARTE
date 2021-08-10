import * as Helpers from './helpers.js'


let startContainer
let endContainer
let phase = ''

export const init = function(range, block){
    startContainer = range.startContainer 
    endContainer = range.endContainer 
    // For block formatting start with block (not text nodes)
    if ( block ){
        startContainer = Helpers.getParentBlockNode(startContainer)
        endContainer = Helpers.getParentBlockNode(endContainer)
    }
    phase = 'pre'
}

export const get = function(){
    return phase
}

// @todo This needs to move into helpes but need to pass in the range 
// or start and end containers (which could lose the block_or_inline param)
// Would also need to pass in the current phase and return the new phase
export const set = function( node ){
    // Adjust phase
    if ( node == startContainer ){
        phase = 'first'
        if ( node == endContainer ){
            phase = 'both'
        }
    } else if ( node == endContainer ){
        phase = 'last'
    } else if ( phase == 'first') {
        phase = 'during'
    } else if ( phase == 'both' || phase == 'last' ){
        phase = 'post-first'
    } else if ( phase == 'post-first' ){
        phase = 'post'
    }
    // console.log('Node',node, 'New phase =',phase)
}

export const pre = function(){
    return phase == 'pre'
}

export const first = function(){
    return phase == 'first' || phase == 'both' 
}

export const both = function(){
    return phase == 'both' 
}

export const last = function(){
    return phase == 'last'
}

export const during = function(){
    return phase == 'during' || phase == 'first' || phase == 'last' || phase == 'both' 
}

export const post = function(){
    return phase == 'post-first' || phase == 'post' 
}
