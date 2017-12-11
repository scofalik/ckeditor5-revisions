/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module revisions/revisionsengine
 */

import RevisionsCommand from './revisionscommand';
import ShowDiffCommand from './showdiffcommand';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import buildModelConverter from '@ckeditor/ckeditor5-engine/src/conversion/buildmodelconverter';

export default class RevisionsEngine extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ RevisionsCommand, ShowDiffCommand ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		const revisionsCommand = new RevisionsCommand( editor );
		editor.commands.add( 'saveRevision', revisionsCommand );

		const showDiffCommand = new ShowDiffCommand( editor );
		editor.commands.add( 'showDiff', showDiffCommand );

		buildModelConverter().for( editor.editing.modelToView, editor.data.modelToView )
			.fromMarker( 'revisions:insert' )
			.toHighlight( { class: 'revisions-insert' } );

		buildModelConverter().for( editor.editing.modelToView, editor.data.modelToView )
			.fromMarker( 'revisions:attribute' )
			.toHighlight( { class: 'revisions-attribute' } );

		buildModelConverter().for( editor.editing.modelToView, editor.data.modelToView )
			.fromMarker( 'revisions:remove' )
			.toHighlight( { class: 'revisions-remove' } );
	}
}