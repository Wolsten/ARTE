
describe('Tests block formatting', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
    })

    // after('Screenshot', function(){
    //     cy.screenshot()
    // })

    it('1. tests block formatting', function(){

        cy.arte_type('This is a first level heading A')
        cy.arte_click_id('H1')

        cy.arte_print('This is a second level heading B')
        cy.arte_click_id('H2')

        cy.arte_print('This is a third level heading C')
        cy.arte_click_id('H3')

        cy.arte_print('This is a paragraph')

        cy.arte_print('This is a block quote')
        cy.arte_click_id('BLOCKQUOTE')

        // Check have the correct block styles
        cy.arte_count('h1',1)
        cy.arte_count('h2',1)
        cy.arte_count('h3',1)
        cy.arte_count('p',1)
        cy.arte_count('blockquote',1)
    })
})