/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module revisions/showdiffcommand
 */

import Command from '@ckeditor/ckeditor5-core/src/command';
import Differ from '@ckeditor/ckeditor5-engine/src/model/differ';
import Range from '@ckeditor/ckeditor5-engine/src/model/range';
import Position from '@ckeditor/ckeditor5-engine/src/model/position';
import ModelDocumentFragment from '@ckeditor/ckeditor5-engine/src/model/documentfragment';
import ViewDocumentFragment from '@ckeditor/ckeditor5-engine/src/view/documentfragment';

import viewWriter from '@ckeditor/ckeditor5-engine/src/view/writer';

import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';

/**
 * Show diff command.
 *
 * @extends module:core/command~Command
 */
export default class ShowDiffCommand extends Command {
	constructor( editor ) {
		super( editor );
		this.diffOn = false;
		this.diffChanges = [];

		this.on( 'change:isEnabled', evt => evt.stop(), { priority: 'low' } );
	}

	refresh() {
		this.value = this._getValue();
		this.isEnabled = this._checkEnabled();
	}

	execute( options = {} ) {
		if ( this.diffOn ) {
			this._off();
		} else {
			this._on();
		}

		this.diffOn = !this.diffOn;

		this.refresh();
	}

	_on() {
		this.editor.isReadOnly = true;

		const command = this.editor.commands.get( 'saveRevision' );
		const fakeRoot = copyRoot( command.savedRoot );

		const origRoot = command.originalRoot;

		const deltas = this.editor.document.history.getDeltas( command.savedVersion );
		const operations = [];

		for ( const delta of deltas ) {
			for ( const operation of delta.operations ) {
				const newOperation = castToOtherRoot( operation, fakeRoot, origRoot );

				operations.push( newOperation );
			}
		}

		const differ = new Differ();

		for ( const operation of operations ) {
			differ.bufferOperation( operation );

			operation._execute();
		}

		const changes = differ.getChanges();

		let parent = null;
		let removed = 0;
		let inserted = 0;

		for ( const change of changes ) {
			if ( change.type == 'insert' ) {
				this._handleInsert( change, origRoot );
			}

			if ( change.type == 'attribute' ) {
				this._handleAttribute( change, origRoot );
			}
		}

		for ( const change of changes ) {
			if ( parent != change.position.parent ) {
				inserted = 0;
				removed = 0;
			}

			if ( change.type == 'insert' ) {
				inserted += change.length;
			}

			if ( change.type == 'attribute' ) {
				parent = change.position.parent;
			}

			if ( change.type == 'remove' ) {
				this._handleRemove( change, origRoot, inserted, removed, command.savedRoot );

				removed += change.length;
			}

			parent = change.position.parent;
		}
	}

	_off() {
		const doc = this.editor.document;

		doc.enqueueChanges( () => {
			for ( const change of this.diffChanges ) {
				if ( change.type == 'marker' ) {
					doc.markers.remove( change.name );
				} else {
					viewWriter.remove( change.range );
					// doc.markers.remove( change.name );
					// doc.batch( 'transparent' ).remove( Range.createFromPositionAndShift( change.position, change.length ) );
				}
			}
		} );

		this.editor.isReadOnly = false;

		this.diffChanges = [];
	}

	_getValue() {
		return this.diffOn;
	}

	_checkEnabled() {
		const command = this.editor.commands.get( 'saveRevision' );

		return command.savedVersion !== null;
	}

	_handleInsert( change, origRoot ) {
		if ( change.position.root.rootName == '$graveyard' ) {
			return;
		}

		const doc = this.editor.document;

		const position = Position.createFromPosition( change.position );
		position.root = origRoot;

		const range = Range.createFromPositionAndShift( position, change.length );
		const markerName = 'revisions:insert:' + elCounterinho++;

		doc.enqueueChanges( () => {
			doc.markers.set( markerName, range );
		} );

		this.diffChanges.push( { type: 'marker', name: markerName } );
	}

	_handleRemove( change, origRoot, inserted, removed, oldRoot ) {
		if ( change.position.root.rootName == '$graveyard' ) {
			return;
		}

		const positionInOldRoot = Position.createFromPosition( change.position );
		positionInOldRoot.root = oldRoot;
		positionInOldRoot.offset = positionInOldRoot.offset + removed - inserted;
		const rangeInOldRoot = Range.createFromPositionAndShift( positionInOldRoot, change.length );

		const modelFrag = new ModelDocumentFragment(
			Array.from( rangeInOldRoot.getItems( { shallow: true } ) ).map( item => item.clone ? item.clone( true ) : item )
		);

		const position  = Position.createFromPosition( change.position );
		position.root = origRoot;

		const mapper = this.editor.editing.mapper;
		const viewContainer = mapper.toViewElement( position.parent );
		const viewPosition = mapper._findPositionIn( viewContainer, position.offset + removed );

		const doc = this.editor.document;
		const markerName = 'revisions:remove:' + elCounterinho++;

		modelFrag.markers.set( markerName, Range.createFromParentsAndOffsets( modelFrag, 0, modelFrag, modelFrag.maxOffset ) );

		// const viewFrag = this.editor.data.toView( modelFrag );

		const modelRange = Range.createIn( modelFrag );

		const viewFrag = new ViewDocumentFragment();
		mapper.bindElements( modelFrag, viewFrag );

		this.editor.editing.modelToView.convertInsert( modelRange );

		if ( modelFrag.markers ) {
			for ( const [ markerName, markerRange ] of modelFrag.markers ) {
				this.editor.editing.modelToView.convertMarker( 'addMarker', markerName, markerRange );
			}
		}

		let viewRange;

		doc.enqueueChanges( () => {
			viewRange = viewWriter.insert( viewPosition, viewFrag );
		} );

		this.diffChanges.unshift( { type: 'content', range: viewRange } );
	}

	// _handleRemove( change, origRoot, inserted, removed, oldRoot ) {
	// 	if ( change.position.root.rootName == '$graveyard' ) {
	// 		return;
	// 	}
	//
	// 	const positionInOldRoot = Position.createFromPosition( change.position );
	// 	positionInOldRoot.root = oldRoot;
	// 	positionInOldRoot.offset = positionInOldRoot.offset + removed - inserted;
	// 	const rangeInOldRoot = Range.createFromPositionAndShift( positionInOldRoot, change.length );
	//
	// 	const modelFrag = new ModelDocumentFragment(
	// 		Array.from( rangeInOldRoot.getItems( { shallow: true } ) ).map( item => item.clone ? item.clone( true ) : item )
	// 	);
	//
	// 	const position  = Position.createFromPosition( change.position );
	// 	position.root = origRoot;
	// 	position.offset += removed;
	//
	// 	const doc = this.editor.document;
	// 	const offset = modelFrag.maxOffset;
	// 	const markerName = 'revisions:remove:' + elCounterinho++;
	//
	// 	doc.enqueueChanges( () => {
	// 		doc.batch( 'transparent' ).insert( modelFrag, position );
	//
	// 		debugger;
	//
	// 		doc.markers.set( markerName, Range.createFromPositionAndShift( position, offset ) );
	// 	} );
	//
	// 	this.diffChanges.unshift( { type: 'content', position: position, length: offset, name: markerName } );
	// }

	_handleAttribute( change, origRoot ) {
		if ( change.position.root.rootName == '$graveyard' ) {
			return;
		}

		const doc = this.editor.document;

		const range = Range.createFromRange( change.range );
		range.start.root = origRoot;
		range.end.root = origRoot;

		if ( range.end.parent == range.start.nodeAfter ) {
			range.end = range.start.getShiftedBy( 1 );
		}

		const markerName = 'revisions:attribute:' + elCounterinho++;

		doc.enqueueChanges( () => {
			doc.markers.set( markerName, range );
		} );

		this.diffChanges.unshift( { type: 'marker', name: markerName } );
	}
}

function castToOtherRoot( opToCast, otherRoot, origRoot ) {
	const op = opToCast.clone();

	if ( op.position && op.position.root == origRoot ) {
		op.position.root = otherRoot;
	}

	if ( op.sourcePosition && op.sourcePosition.root == origRoot ) {
		op.sourcePosition.root = otherRoot;
	}

	if ( op.targetPosition && op.targetPosition.root == origRoot ) {
		op.targetPosition.root = otherRoot;
	}

	if ( op.range && op.range.start.root == origRoot ) {
		op.range.start.root = otherRoot;
		op.range.end.root = otherRoot;
	}

	if ( op.oldRange && op.oldRange.start.root == origRoot ) {
		op.oldRange.start.root = otherRoot;
		op.oldRange.end.root = otherRoot;
	}

	if ( op.newRange && op.newRange.start.root == origRoot ) {
		op.newRange.start.root = otherRoot;
		op.newRange.end.root = otherRoot;
	}

	if ( op.root && op.root == origRoot ) {
		op.root = otherRoot;
	}

	return op;
}

let elCounterinho = 0;

function copyRoot( rootElement ) {
	const newRoot = new RootElement( rootElement.document, rootElement.name, rootElement.rootName );

	newRoot.setAttributesTo( rootElement.getAttributes() );
	newRoot.appendChildren( Array.from( rootElement.getChildren() ).map( node => node.clone( true ) ) );

	return newRoot;
}