import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';
import { TestFormComponent } from './test-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TestFormComponent],
  template: `
    <h1>Hello from {{ name }}!</h1>
  `,
})
export class App {
  name = 'Angular';
}

bootstrapApplication(App);
