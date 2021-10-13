import React from 'react';
import ReactDOM from 'react-dom';
import { EditorState,convertToRaw } from 'draft-js';
import { Editor } from "react-draft-wysiwyg";
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

class KEditor extends React.Component {
  constructor(props) {
    super(props);

	this.state = {
      editorState: EditorState.createEmpty(),
    };
  }

onEditorStateChange: Function = (editorState) => {

    this.setState({
      editorState,
    });
  };

  render() {
const { editorState } = this.state;
    return (
	<div>
<Editor
  editorState={editorState}
  toolbarClassName="richEditorToolbar"
  wrapperClassName="richEditorWrapper"
  editorClassName="richEditor border border-gray-300 p-4"
  onEditorStateChange={this.onEditorStateChange}
/>
<div class="flex justify-end">
<button 
	class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
	onClick={() => console.log(draftToHtml(convertToRaw(editorState.getCurrentContent())))}>
  Post
  </button>
  </div>
</div>
    );
  }
}

export default KEditor
