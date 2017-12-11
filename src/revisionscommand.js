/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module revisions/revisionscommand
 */

import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';

import Command from '@ckeditor/ckeditor5-core/src/command';

/**
 * Revisions command.
 *
 * @extends module:core/command~Command
 */
export default class RevisionsCommand extends Command {
	constructor( editor ) {
		super( editor );

		this.savedRoot = null;
		this.savedVersion = null;
		this.originalRoot = null;
	}

	refresh() {
		this.value = this._getValue();
		this.isEnabled = this._checkEnabled();
	}

	execute( options = {} ) {
		const doc = this.editor.document;

		this.originalRoot = doc.getRoot();
		this.savedRoot = copyRoot( doc.getRoot() );
		this.savedVersion = doc.version;

		this.refresh();
	}

	_getValue() {
		return this.savedVersion !== null;
	}

	_checkEnabled() {
		return true;
	}
}

function copyRoot( rootElement ) {
	const newRoot = new RootElement( rootElement.document, rootElement.name, rootElement.rootName );

	newRoot.setAttributesTo( rootElement.getAttributes() );
	newRoot.appendChildren( Array.from( rootElement.getChildren() ).map( node => node.clone( true ) ) );

	return newRoot;
}