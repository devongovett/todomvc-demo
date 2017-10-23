import { tracked } from "@glimmer/component";

let _idSequence = 0;

export default class Todo {
  _id = _idSequence++;

  constructor(title, completed = false) {
    this.title = title;
    this.completed = completed;
  }

  toggle() {
    this.completed = !this.completed;
  }
}
