describe('Tests actions plug', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    it('1. tests inserting an action', function(){

        cy.arte_type_format('h1','This is a first level heading A',true)
        cy.arte_print('This is a paragraph with an action')

        cy.arte_set_selection('action')
        cy.arte_click_id('ARTE-ACTION')

        cy.get('button').contains('Delete').should('not.exist')
        cy.arte_modal_element_type('#todo', 'An interesting action')
        cy.arte_modal_element_type('#owners', 'Action owners')
        cy.arte_modal_element_type('#notes', 'Added action')

        cy.arte_modal_element_click('button.confirm')

        cy.get('arte-action button label.status-open')
        cy.get('arte-action button span.todo').contains('An interesting action')
        cy.get('arte-action button span.owners').contains('Action owners')
        cy.get('arte-action button span.due').should('not.exist')
    })

    it('2. tests editing an action', function(){

        cy.get('arte-action').click()
        cy.get('button').contains('Delete')

        // Edit todo and owners and add due date
        cy.arte_modal_element_type('#todo', '{moveToEnd} UPDATED')
        cy.arte_modal_element_type('#owners', '{moveToEnd} UPDATED')
        cy.arte_modal_element_type('#due', '21st Dec 2022')
        cy.get('select#status').select("1")

        cy.arte_modal_element_click('button.confirm')

        // Mark incomplete
        cy.get('arte-action button label.status-closed-incomplete')
        cy.get('arte-action button span.todo').contains('An interesting action UPDATED')
        cy.get('arte-action button span.owners').contains('Action owners UPDATED')
        cy.get('arte-action button span.due').contains('21st Dec 2022')

        // Mark it complete
        cy.get('arte-action').click()
        cy.get('select#status').select("2")
        cy.arte_modal_element_click('button.confirm')
        cy.get('arte-action button label.status-closed-complete')
    })

    it('3. tests deleting an action', function(){

        cy.get('arte-action').click()

        cy.arte_modal_element_click('button.delete')
        cy.get('button').contains('Yes').click()

        cy.get('arte-action').should('not.exist')
    })
})