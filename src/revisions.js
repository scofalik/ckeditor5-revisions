/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module revisions/revisions
 */

import RevisionsEngine from './revisionsengine';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import saveIcon from '../theme/icons/save-icon.svg';
import lowVisionIcon from '@ckeditor/ckeditor5-core/theme/icons/low-vision.svg';

/**
 * Revisions feature.
 *
 * @extends module:core/plugin~Plugin
 */
export default class Revisions extends Plugin {
	static get requires() {
		return [ RevisionsEngine ];
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

		editor.ui.componentFactory.add( 'saveRevision', locale => {
			const buttonView = new ButtonView( locale );

			buttonView.set( {
				label: 'Save revision',
				icon: saveIcon,
				tooltip: true
			} );

			// Bind button model to command.
			buttonView.bind( 'isEnabled' ).to( editor.commands.get( 'saveRevision' ), 'isEnabled' );

			setTimeout( function() { buttonView.iconView.set( 'viewBox', '0 0 710 710' ); }, 0 );

			// Execute command.
			this.listenTo( buttonView, 'execute', () => editor.execute( 'saveRevision' ) );

			return buttonView;
		} );

		editor.ui.componentFactory.add( 'showDiff', locale => {
			const buttonView = new ButtonView( locale );

			buttonView.set( {
				label: 'Show diff',
				icon: lowVisionIcon,
				tooltip: true
			} );

			// Bind button model to command.
			buttonView.bind( 'isEnabled' ).to( editor.commands.get( 'saveRevision' ), 'value' );
			buttonView.bind( 'isOn' ).to( editor.commands.get( 'showDiff' ), 'value' );

			// Execute command.
			this.listenTo( buttonView, 'execute', () => editor.execute( 'showDiff' ) );

			return buttonView;
		} );
	}
}