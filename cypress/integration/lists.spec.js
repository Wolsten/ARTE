describe('Tests list formatting', function () {

    before('Open editor url and start editing', function(){
        cy.arte_visit()
        cy.arte_edit()
    })

    it('tests creating numbered list', function(){
        cy.arte_type('{enter}Numbered list')
        cy.arte_click_id('H1')
        cy.arte_type('{enter}Numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_type('{enter}Numbered bullet B')
        cy.arte_type('{enter}Numbered bullet C')
    })

    it('test creating unordered lists',function(){
        cy.arte_type('{enter}{enter}Unordered list')
        cy.arte_click_id('H1')
        cy.arte_type('{enter}Unordered bullet A')
        cy.arte_click_id('UL')
        cy.arte_type('{enter}Unordered bullet B')
        cy.arte_type('{enter}Unordered bullet C')
    })

    it('tests creating and changing list type from ordered to unordered', function(){
        cy.arte_type('{enter}Numbered to unordered list')
        cy.arte_click_id('H1')
        cy.arte_type('{enter}Was numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_type('{enter}Was numbered bullet B')
        cy.arte_type('{enter}Was numbered bullet C')
        cy.arte_set_selection('Was numbered bullet A','Was numbered bullet C')
        cy.arte_click_id('UL')
    })

    it('tests creating and changing list type from unordered to numbered', function(){
        cy.arte_type('{enter}Unordered to numbered list')
        cy.arte_click_id('H1')
        cy.arte_type('{enter}Was unordered bullet A')
        cy.arte_click_id('UL')
        cy.arte_type('{enter}Was unordered bullet B')
        cy.arte_type('{enter}Was unordered bullet C')
        cy.arte_set_selection('Was unordered bullet A','Was unordered bullet C')
        cy.arte_click_id('OL')
    })

    it('tests creating and indenting lists', function(){
        cy.arte_type('{enter}{enter}3-level indented list')
        cy.arte_click_id('H1')
        cy.arte_type('{enter}Numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_type('{enter}Numbered bullet B')
        cy.arte_type('{enter}Numbered bullet C')
        cy.arte_type('{enter}Indented unordered bullet C.A')
        cy.arte_click_id('UL')
        cy.arte_type('{enter}Indented unordered bullet C.B')
        cy.arte_type('{enter}Indented unordered bullet C.C')
        cy.arte_type('{enter}Numbered bullet C.C.A')
        cy.arte_click_id('OL')
        cy.arte_type('{enter}Numbered bullet C.C.B')
        cy.arte_type('{enter}Numbered bullet C.C.C')
    })



    it('tests indented existing lists', function(){
        cy.arte_type('{enter}{enter}Indented existing list')
        cy.arte_click_id('H1')
        cy.arte_type('{enter}Numbered bullet A')
        cy.arte_click_id('OL')
        cy.arte_type('{enter}Numbered bullet B')
        cy.arte_type('{enter}Numbered bullet C')
        cy.arte_type('{enter}Numbered sub-bullet C.A')
        cy.arte_type('{enter}Numbered sub-bullet C.B')
        cy.arte_type('{enter}Numbered sub-bullet C.C')
        cy.arte_type('{enter}Numbered bullet D')
        cy.arte_type('{enter}Numbered bullet E')
        cy.arte_set_selection('Numbered sub-bullet C.A','Numbered sub-bullet C.C')
        cy.arte_click_id('UL')
    })


})