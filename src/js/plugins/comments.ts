/**
 * Add comments to paragraphs
 * 
 * File format:
 *   <ARTE-COMMENT id ="id" data-comment="comment" data-created="date" data-updated="date" data-resolved="true|false"></arte-comment>
 * 
 * Editor format:
 *   <ARTE-COMMENT id ="id" data-comment="comment" data-created="date" data-updated="date" data-resolved="true|false" contenteditable="false">
 *      <button type="button" title="edit this comment"><i>icon</i></button>
 *   </ARTE-COMMENT>
 * 
 * Sidebar format:
 * <article>
 *      <a href="#id" title="Click to view comment">
 *          <span class="comment-bubble comment-resolved|comment-unresolved"><i>icon</i></span> comment
 *      </a>
 *      <p class="sub-title">Added: $date</p>
 * </article>
 * 
 */

import * as Icons from '../icons'
import * as Helpers from '../helpers'
import ToolbarButton from '../ToolbarButton'
import Modal from '../Modal'
import SidebarButton from '../SidebarButton'
import Editor from '../Editor'
import { EditButtons } from './interfaces'



export default class Comments extends ToolbarButton {

    static readonly TAG = 'ARTE-COMMENT'        // The HTMLElement tag as inserted in the dom for this custom node

    private drawer: null | Modal = null         // The modal container for the edit dialogue
    private node: null | Element = null         // The actively edited node
    private dirty: boolean = false              // Flag whether input data changed
    private confirm: null | Modal = null        // The modal container for the modal confirm dialogue



    constructor(editor: Editor, type: string, group: number) {
        super(editor, 'custom', type, Comments.TAG, Icons.comment, group)
    }


    /**
     * On first load of editor, convert the minimal custom HTML into the full
     * editable version
     */
    init(): void {
        const comments = this.editor.editorNode?.querySelectorAll(this.tag)
        if (comments) {
            comments.forEach(comment => this.format(comment))
        }
    }


    /**
     * Mandatory button click function
     */
    click() {
        // Ignore if a modal is active
        if (this.drawer && this.drawer.active()) {
            return
        }
        const custom = this.editor?.range?.blockParent?.querySelector(this.tag)
        if (custom) {
            this.edit(custom)
        } else {
            this.show(false)
        }
    }


    /**
     * Set the disabled and active states of a button
     */
    setState() {
        const element = <HTMLInputElement>this.element
        //console.warn('custom setState edt.range',edt.range)
        if (!this.editor.range ||
            this.editor.range.rootNode == this.editor.editorNode ||
            Helpers.isBlock(this.editor.range.rootNode) == false) {
            //console.log('Disabling button')
            element.disabled = true
            element.classList.remove('active')
        } else {
            //console.log('Enabling button')
            element.disabled = false
            const custom = this.editor.range?.blockParent?.querySelector(Comments.TAG)
            if (custom != null) {
                element.classList.add('active')
            } else {
                element.classList.remove('active')
            }
        }
    }



    /**
     * Add event handlers to all custom node edit buttons
     * @param {object} edt An editor instance
     */
    addEventHandlers() {
        const buttons = this.editor.editorNode?.querySelectorAll(Comments.TAG + ' button')
        if (buttons) {
            buttons.forEach(button => button.addEventListener('click', event => {
                event.preventDefault()
                event.stopPropagation()
                if (!button.parentNode) {
                    console.error('Could not find comment node')
                } else {
                    this.edit(<HTMLElement>button.parentNode)
                }
            }))
        }
    }

    /**
     * Display custom html in the sidebar
     */
    sidebar(): SidebarButton {
        const comments = this.editor.editorNode?.querySelectorAll(Comments.TAG)
        let content = ''
        if (comments) {
            comments.forEach(comment => {
                const created = comment.getAttribute('data-created')
                const commentText = comment.getAttribute('data-comment')
                const resolved = comment.getAttribute('data-resolved') === 'true' ? 'comment-resolved' : 'comment-unresolved'
                content += `
                    <article>
                        <a href="#${comment.id}" title="Click to view comment in context">
                            <span class="comment-bubble ${resolved}">${Icons.commentEdit}</span> ${commentText}
                        </a>
                        <p class="sub-title">Added: ${created}</p>
                    </article>`
            })
        }
        return new SidebarButton(Icons.comment, 'comments', content)
    }


    // -----------------------------------------------------------------------------
    // @section Private methods
    // -----------------------------------------------------------------------------


    /**
     * Edit an existing comment node by extracting the data from the node and displaying
     * the edit form. Sets the comment node to be edited
     */
    private edit(element: Element): void {
        // If we already have an active panel - ignore edit clicks
        if (this.drawer && this.drawer.active()) {
            return
        }
        this.node = element
        this.show(true)
    }


    /**
     * Show the custom dialogue.
     */
    private show(editFlag: boolean) {
        let title = 'Add comment'
        let buttons: EditButtons = {
            cancel: { label: 'Cancel', callback: this.handleCancel },
            confirm: { label: 'Save', callback: this.save },
        }
        if (editFlag) {
            title = 'Edit comment'
            buttons.delete = { label: 'Delete', callback: this.handleDelete }
        } else {
            this.node = document.createElement(Comments.TAG)
            this.node.id = Helpers.generateUid()
            this.node.setAttribute('contenteditable', 'false')
            this.node.setAttribute('data-comment', '')
            this.node.setAttribute('data-created', '')
            this.node.setAttribute('data-updated', '')
            this.node.setAttribute('data-resolved', 'false')
        }
        // Create and display the modal panel
        this.drawer = new Modal({
            type: 'drawer',
            title,
            html: this.form(),
            buttons
        })
        this.drawer.show()
        // Initialise confirmation module and dirty data detection
        this.dirty = false
        const comment = this.drawer.panel?.querySelector('form textarea#comment')
        if (!this.drawer.panel || !comment) {
            console.error('Could not find comment text area')
            return
        }
        const input = <HTMLInputElement>comment
        input.addEventListener('change', () => this.dirty = true)
        // Handle resolution toggling
        const resolve = this.drawer.panel.querySelector('form button#resolve')
        if (resolve != null) {
            resolve.addEventListener('click', this.handleResolve)
        }
        // Focus the comment textarea
        input.focus()
        input.setSelectionRange(input.value.length, input.value.length)
    }



    /**
     * Format the given custom element and add click event handler
     */
    private format(element: Element): void {
        // Generate new id if required
        if (!element.id) {
            element.id = Helpers.generateUid()
        }
        element.innerHTML = ''
        element.setAttribute('contenteditable', 'false')
        // Add edit button and listener'
        const editButton = document.createElement('button')
        editButton.type = 'button'
        editButton.title = 'Edit this comment'
        editButton.innerHTML = Icons.commentEdit
        editButton.addEventListener('click', event => {
            event.preventDefault()
            event.stopPropagation()
            this.edit(element)
        })
        element.appendChild(editButton)
        // Add set state listener
        element.addEventListener('click', () => {
            this.setState()
        })
    }


    private handleConfirmCancel(): void {
        this.confirm?.hide()
        this.drawer?.hide()
    }

    private handleConfirmDelete(): void {
        this.confirm?.hide()
        this.drawer?.hide()
        this.deleteItem()
    }

    private handleCancel(): void {
        if (this.dirty) {
            this.confirm = Helpers.modalRequestCancel(this.handleConfirmCancel)
        } else {
            this.drawer?.hide()
        }
    }


    private handleDelete(): void {
        this.confirm = Helpers.modalRequestDelete('comment', this.handleConfirmDelete)
    }


    private handleResolve(event: Event): void {
        if (!this.node || !event.target) {
            console.error('Trying to resolve a missing comment')
            return
        }
        if (this.node.getAttribute('data-resolved') == 'false') {
            this.node.setAttribute('data-resolved', 'true')
        } else {
            this.node.setAttribute('data-resolved', 'false')
        }
        (<Element>event.target).innerHTML = this.resolveLabel()
    }


    /**
     * Save the new or edited custom element
     */
    private save(): void {
        // console.log('Save changes')
        if (!this.node || !this?.drawer?.panel) {
            console.error('Could not find comment to save')
            return
        }
        if (this.drawer.panel) {
            const comment = this.drawer.panel.querySelector('form #comment')
            if (!comment) {
                console.error('Could not find comment entry in form')
                return
            }
            this.node.setAttribute('data-comment', (<HTMLInputElement>comment).value.trim())
            const timestamp = new Date()
            const localString = timestamp.toLocaleString().slice(0, -3)
            // console.log('local timestamp', localString)
            if (this.node.getAttribute('data-created') == '') {
                this.node.setAttribute('data-created', localString)
                this.insert()
            }
            this.node.setAttribute('data-updated', localString)

        }
        this.drawer.hide()
        // Format this.node and add event handler
        this.format(this.node)
        // Update state
        this.editor.range = Helpers.setCursor(this.node, 0)
        this.setState()
        this.editor?.buffer?.update()
    }

    /**
     * Insert a new custom element in the editor at the end of the current 
     * range's startContainer
     */
    private insert(): void {
        if (this.editor?.range?.startContainer.parentNode) {
            this.node = this.editor.range.startContainer.parentNode.appendChild(<Element>this.node)
        }
    }

    /**
     * Delete the custom element in the dom
     */
    private deleteItem(): void {
        this.node?.remove()
        // Update state
        this.editor.range = null
        this.setState()
        this.editor.buffer?.update()
    }

    /**
     * Optional method to reformat/clean the custom element as it should be saved in a file or database
     * @param {HTMLElement} node
     * @returns HTMLElement as cleaned
     */
    private clean(node: HTMLElement): HTMLElement {
        // console.log('clean custom element',node)
        node.removeAttribute('contenteditable')
        node.innerHTML = ''
        return node
    }



    /**
     * Returns inner html for resolve button
     */
    private resolveLabel(): string {
        return this.node?.getAttribute('data-resolved') == 'true'
            ? Icons.commentUnresolve + ' Unresolve'
            : Icons.commentResolve + ' Resolve'
    }


    /**
     * Form template returns generated html
     */
    private form(): string {
        if (!this.node) {
            console.error('Error: Comment node is missing')
            return 'Error: Comment node is missing'
        }
        const created = this.node.getAttribute('data-created')
        const updated = this.node.getAttribute('data-updated')
        const comment = this.node.getAttribute('data-comment')
        let timestamps = ''
        let resolve = ''
        if (created != '') {
            timestamps = `<span><label>Created</label> ${created}</span>`
        }
        if (updated != '') {
            timestamps += `<span><label>Updated</label> ${updated}</span>`
        }
        if (timestamps != '') {
            timestamps = `<div class="timestamps">${timestamps}</div>`
            const title = this.resolveLabel()
            resolve = `<button type="button" id="resolve">${title}</button>`
        }
        return `
                <form class="comment">
                    <div class="form-input">
                        <textarea id="comment" class="form-control" placeholder="Enter your comment" required>${comment}</textarea>
                    </div>
                    ${timestamps}
                    ${resolve}
                </form>`
    }
}