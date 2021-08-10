import * as Helpers from './helpers.js'

let startContainer
let endContainer
let phase = ''

/**
 * Initialise phase detection for block and inline styling
 * @param {Range} range 
 * @param {boolean} block For block formatting start with block (not text nodes)
 */
export const init = function(range, block){
    startContainer = range.startContainer 
    endContainer = range.endContainer 
    if ( block ){
        startContainer = Helpers.getParentBlockNode(startContainer)
        endContainer = Helpers.getParentBlockNode(endContainer)
    }
    phase = 'pre'
}

/**
 * Return the current phase
 * @returns {string}
 */
export const get = function(){
    return phase
}

/**
 * Test the supplied node to see whether it matches the start or end container
 * in order to set the phase for block or inline parsing
 * @param {HTMLElement} node 
 */
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

/**
 * Returns true if this is the pre phase, i.e. before the startContainer found
 * @returns {boolean}
 */
export const pre = function(){
    return phase == 'pre'
}

/**
 * Returns true if this is the first or both phase, i.e. when the startContainer just found
 * @returns {boolean}
 */
export const first = function(){
    return phase == 'first' || phase == 'both' 
}

/**
 * Returns true if this is the both phase, i.e. both start and end containers found
 * and match
 * @returns {boolean}
 */
export const both = function(){
    return phase == 'both' 
}

/**
 * Returns true if this is the last phase, i.e. the end container just found
 * @returns {boolean}
 */
export const last = function(){
    return phase == 'last'
}

/**
 * Returns true if this is the during phase, i.e. the start container found
 * but not yet the end container
 * @returns {boolean}
 */
export const during = function(){
    return phase == 'during' || phase == 'first' || phase == 'last' || phase == 'both' 
}

/**
 * Returns true if this is the post-first or post phase, i.e. the end container found
 * previously and this is the first or later node after the end container
 * @returns {boolean}
 */
export const post = function(){
    return phase == 'post-first' || phase == 'post' 
}
