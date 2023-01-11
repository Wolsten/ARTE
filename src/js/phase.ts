import * as Helpers from './helpers.js'
import EditRange from '../EditRange'


export default class Phase {


    startContainer: Node
    endContainer: Node
    phase = 'pre'
    status = false


    constructor(range: EditRange, block: boolean) {
        this.startContainer = range.startContainer
        this.endContainer = range.endContainer
        this.status = true
        if (block) {
            const startContainer = Helpers.getParentBlockNode(this.startContainer)
            const endContainer = Helpers.getParentBlockNode(this.startContainer)
            if (startContainer && endContainer) {
                this.startContainer = startContainer
                this.endContainer = endContainer
            } else {
                this.status = false
            }
        }
    }


    /**
     * Test the supplied node to see whether it matches the start or end container
     * in order to set the phase for block or inline parsing
     * @param {HTMLElement} node 
     */
    set(node: Node) {
        // Adjust phase
        if (node == this.startContainer) {
            this.phase = 'first'
            if (node == this.endContainer) {
                this.phase = 'both'
            }
        } else if (node == this.endContainer) {
            this.phase = 'last'
        } else if (this.phase == 'first') {
            this.phase = 'during'
        } else if (this.phase == 'both' || this.phase == 'last') {
            this.phase = 'post-first'
        } else if (this.phase == 'post-first') {
            this.phase = 'post'
        }
        // console.log('Node',node, 'New phase =',phase)
    }


    // /**
    //  * Return the current phase
    //  * @returns {string}
    //  */
    // get():string {
    //     return this.phase
    // }



    /**
     * Returns true if this is the pre phase, i.e. before the startContainer found
     */
    pre(): boolean {
        return this.phase == 'pre'
    }

    /**
     * Returns true if this is the first or both phase, i.e. when the startContainer just found
     * @returns {boolean}
     */
    first(): boolean {
        return this.phase == 'first' || this.phase == 'both'
    }

    /**
     * Returns true if this is the both phase, i.e. both start and end containers found
     * and match
     */
    both(): boolean {
        return this.phase == 'both'
    }

    /**
     * Returns true if this is the last phase, i.e. the end container just found
     */
    last(): boolean {
        return this.phase == 'last'
    }

    /**
     * Returns true if this is the during phase, i.e. the start container found
     * but not yet the end container
     */
    during(): boolean {
        return this.phase == 'during' || this.phase == 'first' || this.phase == 'last' || this.phase == 'both'
    }

    /**
     * Returns true if this is the post-first or post phase, i.e. the end container found
     * previously and this is the first or later node after the end container
     */
    post(): boolean {
        return this.phase == 'post-first' || this.phase == 'post'
    }


}


