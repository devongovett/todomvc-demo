import Component, { tracked } from "@glimmer/component";
import Todo from '../../../utils/todo';
import { ENTER, ESCAPE } from '../../../utils/keys';

export default class TodoItem extends Component {
  @tracked editing = false;
  @tracked newTitle;

  beginEdit() {
    this.editing = true;
    this.newTitle = this.args.todo.title;

    requestAnimationFrame(() => {
      let input = this.element.querySelector('.js-edit');
      input.focus();
    });
  }

  commitEdit() {
    if (this.editing) {
      this.editing = false;
      this.args.onEdit(this.args.todo, this.newTitle);
    }
  }

  abortEdit() {
    this.editing = false;
    this.newTitle = null;
  }

  handleEditKeyUp(event) {
    this.newTitle = event.target.value.trim();

    if (event.which === ENTER) {
      this.commitEdit();
    } else if (event.which === ESCAPE) {
      this.abortEdit();
    }
  }
}
