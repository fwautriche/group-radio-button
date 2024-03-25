import { Component } from '@angular/core';
import {GroupRadioButtonComponent} from "./group-radio-button/group-radio-button.component";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import {JsonPipe} from "@angular/common";

enum GroupOption {
  A = "a",
  B = "b",
  C = "c",
}

interface TestFormGroup {
  title: FormControl<string | null>;
  option: FormControl<GroupOption | null>;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GroupRadioButtonComponent, MatFormField, ReactiveFormsModule, MatButton, MatInput, MatLabel, JsonPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'group-radio-button';
  protected readonly groupOptions = [GroupOption.A, GroupOption.B, GroupOption.C];
  protected readonly form = new FormGroup<TestFormGroup>({
    title: new FormControl("", [Validators.required, Validators.minLength(3)]),
    option: new FormControl(this.groupOptions[0], Validators.required),
  });
  protected readonly simulatedData = {
    title: "test",
    option: GroupOption.B
  };

  getData() {
    this.form.patchValue(this.simulatedData);
  }

  protected displayOption(option: GroupOption): string {
    switch (option) {
      case GroupOption.A:
        return `Option A`;
      case GroupOption.B:
        return `Option B`;
      case GroupOption.C:
        return `Option C`;
      default:
        return `<undefined>`;
    }
  }

  onSave() {
    console.log(`Save: ${JSON.stringify(this.form.value)}`);
  }
}
