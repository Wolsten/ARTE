describe('Tests comments plugin', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    it('1. tests inserting a comment', function(){

        cy.arte_type_format('h1','This is a first level heading A',true)
        cy.arte_print('This is a paragraph with a comment')

        cy.arte_set_selection('comment')
        cy.arte_click_id('ARTE-COMMENT')

        cy.get('button').contains('Delete').should('not.exist')
        cy.get('button').contains('Resolve').should('not.exist')
        cy.arte_modal_element_type('#comment', 'An interesting comment')
        cy.arte_modal_element_click('button.confirm')

        cy.get('arte-comment')
        cy.get('arte-comment button')
        cy.get('arte-comment button i')
    })

    it('2. tests editing a comment', function(){

        cy.get('arte-comment').click()

        cy.get('button').contains('Delete').should('exist')
        cy.arte_modal_element_type('#comment', '{moveToEnd} UPDATED')
        cy.get('button').contains('Resolve').click()

        cy.arte_modal_element_click('button.confirm')

        cy.get('arte-comment').click()
        cy.get('textarea#comment').contains('An interesting comment UPDATED')
        cy.get('button#resolve').contains('Unresolve')

        cy.arte_modal_element_click('button.confirm')
    })

    it('3. tests deleting a comment', function(){

        cy.get('arte-comment').click()

        cy.get('button').contains('Delete').click()
        cy.get('button').contains('Yes').click()

        cy.get('arte-comment').should('not.exist')
    })
})