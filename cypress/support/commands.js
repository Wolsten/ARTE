// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('upload_file', (fileName, fileType = ' ', selector, submit=false) => {
  return cy.get(selector).then(subject => {
    cy.fixture(fileName, 'base64')

      .then(Cypress.Blob.base64StringToBlob)

      .then(blob => {

        const el = subject[0];
        const testFile = new File([blob], fileName, { type: fileType })
        const dataTransfer = new DataTransfer()

        dataTransfer.items.add(testFile)

        el.files = dataTransfer.files

        if ( submit ){
          el.closest('form').submit()
        }
      })
  })
})

// Cypress.Commands.add('arte_visit', ()=> {
//   cy.visit('http://localhost:5501/index.html')
//   cy.get('.editor-body').clear()
// })

Cypress.Commands.add('arte_visit', () => {
  cy.visit('http://localhost:5501/index.html')
  cy.get('.editor-body').clear().click().wait(500)
})

Cypress.Commands.add('arte_edit', ()=> {
  cy.get('.editor-body').click()
})

Cypress.Commands.add('arte_type', txt => {
  // Tried several things to fix odd text entry but this is the only
  // one that seems to work at all consistently
  // For example waitForAnimations didn't do the job
  // presumably because there is a lot going on for key down
  cy.get('.editor-body').type(txt, {delay:100})
})

Cypress.Commands.add('arte_click_id', tag => {
  cy.get(`button#${tag}`).click().wait(500)
})

Cypress.Commands.add('arte_set_selection', (text1, text2) => {
  // Make sure editor is selected before setting the selection to 
  // ensure the correct states of the toolbar buttons.
  cy.arte_edit()
  cy.get('.editor-body').setSelection(text1,text2).wait(500)
})

Cypress.Commands.add('arte_modal_click', selector => {
  cy.get(`.modal-panel-container button.${selector}`).click()
  cy.arte_edit()
})



// Handling selection
// https://github.com/cypress-io/cypress/issues/2839
// https://github.com/netlify/netlify-cms/blob/a4b7481a99f58b9abe85ab5712d27593cde20096/cypress/support/commands.js#L180

function getTextNode(el, match) {
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  if (!match) {
    return walk.nextNode();
  }

  let node;
  while ((node = walk.nextNode())) {
    if (node.wholeText.includes(match)) {
      return node;
    }
  }
}

function setBaseAndExtent(...args) {
  const document = args[0].ownerDocument;
  document.getSelection().removeAllRanges();
  document.getSelection().setBaseAndExtent(...args);
}

Cypress.Commands.add('selection', { prevSubject: true }, (subject, fn) => {
  cy.wrap(subject)
    .trigger('mousedown')
    .then(fn)
    .trigger('mouseup');

  cy.document().trigger('selectionchange');
  return cy.wrap(subject);
});

Cypress.Commands.add('setSelection', { prevSubject: true }, (subject, query, endQuery) => {
  // cy.log('subject',subject)
  // cy.log('query',query)
  // cy.log('endQuery',endQuery)
  return cy.wrap(subject).selection($el => {
    if (typeof query === 'string') {
      const anchorNode = getTextNode($el[0], query);
      const focusNode = endQuery ? getTextNode($el[0], endQuery) : anchorNode;
      const anchorOffset = anchorNode.wholeText.indexOf(query);
      const focusOffset = endQuery
        ? focusNode.wholeText.indexOf(endQuery) + endQuery.length
        : anchorOffset + query.length;
      setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    } else if (typeof query === 'object') {
      const el = $el[0];
      const anchorNode = getTextNode(el.querySelector(query.anchorQuery));
      const anchorOffset = query.anchorOffset || 0;
      const focusNode = query.focusQuery
        ? getTextNode(el.querySelector(query.focusQuery))
        : anchorNode;
      const focusOffset = query.focusOffset || 0;
      setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    }
  });
});

Cypress.Commands.add('setCursor', { prevSubject: true }, (subject, query, atStart) => {
  // cy.log('subject',subject)
  // cy.log('query',query)
  // cy.log('atStart',atStart)
  return cy.wrap(subject).selection($el => {
    const node = getTextNode($el[0], query);
    const offset = node.wholeText.indexOf(query) + (atStart ? 0 : query.length);
    const document = node.ownerDocument;
    document.getSelection().removeAllRanges();
    document.getSelection().collapse(node, offset);
  });
});

Cypress.Commands.add('setCursorBefore', { prevSubject: true }, (subject, query) => {
  cy.wrap(subject).setCursor(query, true);
});

Cypress.Commands.add('setCursorAfter', { prevSubject: true }, (subject, query) => {
  cy.wrap(subject).setCursor(query);
});