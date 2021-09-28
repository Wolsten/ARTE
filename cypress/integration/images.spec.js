describe('Tests images plugin', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    it('1. tests inserting an image', function(){

        cy.arte_type_format('h1','This is a first level heading A',true)
        cy.arte_print('This is a paragraph with an image')

        cy.arte_set_selection('image')
        cy.arte_click_id('ARTE-IMAGE')

        cy.arte_modal_element_type('#src', './src/img/logo-medium.png')
        cy.arte_modal_element_type('#caption', 'ARTE logo')
        cy.arte_modal_element_type('#alt', 'Alt text for ARTE logo')

        cy.arte_modal_element_click('button.confirm')

        cy.get('arte-image[data-src="./src/img/logo-medium.png"]')
        cy.get('arte-image img[src="./src/img/logo-medium.png"]')
        cy.get('arte-image caption').contains('ARTE logo')
        cy.get('arte-image[data-alt="Alt text for ARTE logo"]')
        cy.get('arte-image img[alt="Alt text for ARTE logo"]')

    })

    it('2. tests editing an image', function(){

        cy.get('arte-image').click()

        cy.arte_modal_element_type('#caption', '{moveToEnd} UPDATED')
        cy.arte_modal_element_type('#alt', '{moveToEnd} UPDATED')

        cy.arte_modal_element_click('button.confirm')

        cy.get('arte-image[data-src="./src/img/logo-medium.png"]')
        cy.get('arte-image img[src="./src/img/logo-medium.png"]')
        cy.get('arte-image caption').contains('ARTE logo UPDATED')
        cy.get('arte-image[data-alt="Alt text for ARTE logo UPDATED"]')
        cy.get('arte-image img[alt="Alt text for ARTE logo UPDATED"]')
    })

    it('3. tests deleting an image', function(){

        cy.get('arte-image').click()

        cy.arte_modal_element_click('button.delete')
        cy.get('button').contains('Yes').click()

        cy.get('arte-image').should('not.exist')
    })
})