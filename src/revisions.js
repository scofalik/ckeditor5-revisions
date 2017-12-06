/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module revisions/revisions
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import RevisionsCommand from './revisionscommand';
import icon from '../54178.svg';

/**
 * Revisions feature.
 *
 * @extends module:core/plugin~Plugin
 */
export default class Revisions extends Plugin {
	static get requires() {
		return [ RevisionsCommand ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'Revisions';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		const command = new RevisionsCommand( editor );
		editor.commands.add( 'saveRevision', command );

		editor.ui.componentFactory.add( 'saveRevision', locale => {
			const buttonView = new ButtonView( locale );

			buttonView.set( {
				label: 'Save revision',
				icon,
				tooltip: true
			} );

			// Bind button model to command.
			buttonView.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			// Execute command.
			this.listenTo( buttonView, 'execute', () => editor.execute( 'saveRevision' ) );

			return buttonView;
		} );
	}
}