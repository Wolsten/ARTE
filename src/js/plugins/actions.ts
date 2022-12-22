/** 
 * 
 * File format (optional due date):
 * <ARTE-ACTION 
 *      id="id" 
 *      data-status="0" 
 *      data-todo="todo" 
 *      data-owners="owners" 
 *      data-due="due" 
 *      data-created="date" 
 *      data-updated="date" 
 *      data-notes="Some notes">
 * </ARTE-ACTION>
 * 
 * Editor format (optional due date):
 * <ARTE-ACTION 
 *      id="id" 
 *      data-status="0" 
 *      data-todo="todo" 
 *      data-owners="owners" 
 *      data-due="due" 
 *      data-created="date" 
 *      data-updated="date" 
 *      data-notes="Some notes"
 *      contenteditable="false" >
 *    <button type="button" title="Click to edit action">
 *        <label class="status-open|status-closed-incomplete|status-closed-complete"><i>icon</i></label>
 *        <span class="todo">todo</span>
 *        <label>Owners:</label>
 *        <span class="owners">owners</span>
 *        [<label>Due:</label>
 *        <span class="due">date</span>]
 *    </button>
 * </ARTE-ACTION>
 * 
 * Sidebar format (optional due date):
 * <article class="action">
 *      <a href="#id">todo</a>
 *      <p>Owned by: owners}[,<br/>Due: date]</p>
 * </article>`
 */

import * as Icons from '../icons'
import * as Helpers from '../helpers'
import Modal from '../Modal'
import SidebarButton from '../SidebarButton'
import Editor from '../Editor'
import { EditButtons } from './interfaces'
import CustomBlock from './CustomBlock'


export default class Actions extends CustomBlock {

    static readonly TAG = 'ARTE-ACTION'        // The HTMLElement tag as inserted in the dom for this custom node


    constructor(editor: Editor, group: number) {
        super(editor, 'custom', Actions.TAG, Icons.action, group)
    }


    // -----------------------------------------------------------------------------
    // @section Action specific methods
    // -----------------------------------------------------------------------------


    /**
     * Show the custom dialogue for new creation or editing
     */
    show(editFlag: boolean): void {
        let buttons: EditButtons = {
            cancel: { label: 'Cancel', callback: this.handleCancel },
            confirm: { label: 'Save', callback: this.save },
        }
        let title = 'Add action'
        if (editFlag) {
            title = 'Edit action'
            buttons.delete = { label: 'Delete', callback: this.handleDelete }
        } else {
            // Initialise an action as saved to file
            this.node = document.createElement(this.tag)
            if (!this.node) {
                console.error('Failed to create new action')
                return
            }
            this.node.id = Helpers.generateUid()
            this.setAttribute('contenteditable', 'false')
            this.setAttribute('data-status', '0')
            this.setAttribute('data-todo', '')
            this.setAttribute('data-owners', '')
            this.setAttribute('data-due', '')
            this.setAttribute('data-created', '')
            this.setAttribute('data-updated', '')
            this.setAttribute('data-notes', '')
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
        const inputs = this.drawer.selectAll('form input, form textarea, form select')
        inputs.forEach(input => input.addEventListener('change', () => this.dirty = true))
        // Focus the todo
        const todo = this.drawer.selectOne('#todo')
        if (todo) {
            const input = <HTMLInputElement>todo
            input.focus()
            input.setSelectionRange(input.value.length, input.value.length)
        }
    }


    /**
     * Form template - returns generated html
     */
    form(): string {
        const todo = this.getAttribute('data-todo')
        const owners = this.getAttribute('data-owners')
        const status = this.getAttribute('data-status')
        const due = this.getAttribute('data-due')
        const notes = this.getAttribute('data-notes')
        return `
           <form class="comment">
               <div class="form-input">
                   <label for="todo">What needs to be done</label>
                   <textarea id="todo" class="form-control" required>${todo}</textarea>
               </div>
               <div class="form-input">
                   <label for="owners">Owners</label>
                   <input type="text" id="owners" class="form-control" value="${owners}" required />
               </div>
               <div class="form-input">
                   <label for="due">Due by</label>
                   <input type="text" id="due" class="form-control" value="${due}"/>
               </div>
               <div class="form-input">
                   <label for="status">Status</label>
                   <select id="status" class="form-control">
                       <option value="0" ${status == '0' ? 'selected' : ''}>Open</option>
                       <option value="1" ${status == '1' ? 'selected' : ''}>Closed - Incomplete</option>
                       <option value="2" ${status == '2' ? 'selected' : ''}>Closed - Complete</option>
                   </select>
               </div>
               <div class="form-input">
                   <label for="notes">Notes</label>
                   <textarea id="notes" class="form-control">${notes}</textarea>
               </div>
           </form>`
    }


    /**
     * Save the new or edited custom element
     */
    save(): void {
        if (!this.drawer) {
            console.error('No drawer is displayed')
            return
        }
        // console.log('Save changes')
        this.setAttribute('data-todo', this.drawer.getInputValue('#todo'))
        this.setAttribute('data-owners', this.drawer.getInputValue('#owners'))
        this.setAttribute('data-due', this.drawer.getInputValue('#due'))
        this.setAttribute('data-status', this.drawer.getInputValue('#status'))
        this.setAttribute('data-notes', this.drawer.getInputValue('#notes'))
        // Timestamp
        const timestamp = new Date()
        const localstring = timestamp.toLocaleString().slice(0, -3)
        //console.log('local timestamp', localstring)
        if (this.getAttribute('created') == '') {
            this.setAttribute('created', localstring)
            this.insert()
        }
        this.setAttribute('updated', localstring)
        this.drawer.hide()
        // Format node and add event handler
        this.format(this.template)
        // Update state
        if (this.node) {
            this.editor.range = Helpers.setCursor(this.node, 0)
            this.setState()
            this.editor?.buffer?.update()
        }
    }


    /**
     * Display custom html in the sidebar
     */
    sidebar(): SidebarButton {
        const actions = this.editor?.editorNode?.querySelectorAll(this.tag)
        let content = ''
        if (actions) {
            actions.forEach((action: Element) => {
                const todo = action.getAttribute('data-todo')
                if (!todo) {
                    console.error('Action is missing a todo field')
                    return
                }
                const owners = action.getAttribute('data-owners')
                if (!owners) {
                    console.error('Action is missing an owners field')
                    return
                }
                const optionalDue = action.getAttribute('data-due')
                let due = ''
                if (optionalDue) {
                    due = `,<br/>Due: ${optionalDue.trim()}`
                }
                content += `
                    <article class="action">
                        <a href="#${action.id}">${todo.trim()}</a>
                        <p>Owned by: ${owners.trim()}${due}</p>
                    </article>`
            })
        }
        return new SidebarButton(this.icon, 'actions', `${content}`)
    }


    /**
     * Create a template for how the action is presented in the editor
     */
    template(element: Element): string {
        const todo = this.getAttribute('data-todo', element)
        const owners = this.getAttribute('data-owners', element)
        const status = this.getAttribute('data-status', element)
        const statusClass = this.getStatusClass(status)
        let due = this.getAttribute('data-due', element)
        if (due) {
            due = `<label>Due:</label>
                   <span class="due">${due}</span>`
        }
        return `
            <button type="button" title="Edit this action">
                <label class="${statusClass}">${Icons.action}</label>
                <span class="todo">${todo}</span>
                <label>Owners:</label>
                <span class="owners">${owners}</span>
                ${due}
            </button>`
    }


    /**
     * Return the status class for the current action status
     */
    private getStatusClass(status: string): string {
        switch (parseInt(status)) {
            case 0: return 'status-open'
            case 1: return 'status-closed-incomplete'
            case 2: return 'status-closed-complete'
        }
        return 'status-unknown'
    }

}