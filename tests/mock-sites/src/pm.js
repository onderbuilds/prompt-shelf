import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
export function mountPM(mount, attrs) {
  const view = new EditorView(mount, {
    state: EditorState.create({ schema }),
    attributes: attrs || {},
    dispatchTransaction(tr) { view.updateState(view.state.apply(tr)); window.__onChange && window.__onChange(); },
  });
  window.__registered = () => view.state.doc.textBetween(0, view.state.doc.content.size, '\n');
  return view;
}
window.mountPM = mountPM;
