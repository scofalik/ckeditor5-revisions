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
	constructor( editor, type ) {
		super( editor );

		this.savedVersions = new Map();
	}

	refresh() {
		this.value = this._getValue();
		this.isEnabled = this._checkEnabled();
	}

	execute( options = {} ) {
		const doc = this.editor.document;

		if ( !this.savedVersions.has( doc.version ) ) {
			const copiedRoot = copyRoot( doc.getRoot() );

			this.savedVersions.set( doc.version, copiedRoot );
		}
	}

	_getValue() {
		return true;
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