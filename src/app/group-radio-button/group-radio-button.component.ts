import {
  ChangeDetectionStrategy,
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Optional,
  Output,
  Self,
} from "@angular/core";
import { NgForOf } from "@angular/common";
import { ControlValueAccessor, NgControl } from "@angular/forms";
import { FocusMonitor } from "@angular/cdk/a11y";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatRadioChange, MatRadioModule } from "@angular/material/radio";
import { Subject } from "rxjs";
import {defaultDisplay} from "../framework/default-display";
import {defaultCompare} from "../framework/default-compare";

@Component({
  selector: "app-group-radio-button",
  template: `
    <mat-radio-group (change)="selectionChange($event)" [disabled]="disabled" class="app-radio-group">
      <mat-radio-button *ngFor="let option of options" [value]="option" [checked]="compareWith(option, value)">
        {{ displayWith(option) }}
      </mat-radio-button>
    </mat-radio-group>
  `,
  styles: [
    `
      .app-radio-group {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MatFormFieldControl, useExisting: GroupRadioButtonComponent }],
  standalone: true,
  imports: [MatRadioModule, NgForOf],
})
export class GroupRadioButtonComponent
  implements DoCheck, ControlValueAccessor, MatFormFieldControl<unknown>, OnDestroy
{
  @Input({ required: true })
  options: unknown[] | undefined;

  @Input()
  set displayWith(fn: (o: any) => string) {
    this.#displayWith = fn ?? defaultDisplay;
  }
  get displayWith() {
    return this.#displayWith;
  }
  #displayWith = defaultDisplay;

  @Input()
  set compareWith(fn: (o1: unknown, o2: unknown) => boolean) {
    this.#compareWith = fn ?? defaultCompare;
  }
  get compareWith() {
    return this.#compareWith;
  }
  #compareWith = defaultCompare;

  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    private fm: FocusMonitor,
    @Optional() @Self() public ngControl: NgControl,
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    this.fm.monitor(_elementRef.nativeElement, true).subscribe((origin) => {
      this.focused = !!origin;
      this.stateChanges.next();
    });
  }

  ngDoCheck(): void {
    if (this.ngControl) {
      this.errorState = !!this.ngControl.invalid && !!this.ngControl.touched;
      this.stateChanges.next();
    }
  }

  ngOnDestroy() {
    this.fm.stopMonitoring(this._elementRef.nativeElement);
    this.stateChanges.complete();
  }

  selectionChange(event: MatRadioChange) {
    this.setValue(event.value, true);
  }

  /** MatFormFieldControl **/
  controlType = "app-group-radio-button";
  static nextId = 0;
  @HostBinding() id = `${this.controlType}-${GroupRadioButtonComponent.nextId++}`;
  stateChanges = new Subject<void>();
  placeholder: string = "";
  errorState = false;

  get value(): unknown {
    return this.#value;
  }
  protected setValue(value: unknown, emitEvent: boolean) {
    this.#value = value;
    if (emitEvent) {
      if (this.onChange) {
        this.onChange(value);
      }
      if (this.onTouched) {
        this.onTouched();
      }
      this.stateChanges.next();
    }
  }
  #value: unknown;

  get empty() {
    return this.value == null;
  }

  @Input()
  set required(req: BooleanInput) {
    this.#required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  get required(): boolean {
    return this.#required;
  }
  #required = false;

  @Input()
  set disabled(value: boolean) {
    this.setDisabledState(value);
  }
  get disabled(): boolean {
    return this.#disabled;
  }
  #disabled = false;

  @HostBinding("class.floating")
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }
  focused = false;

  @HostBinding("attr.aria-describedby") describedBy = "";
  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(" ");
  }

  @Output()
  containerClick = new EventEmitter<void>();
  onContainerClick() {
    if (!this.disabled) {
      this.containerClick.emit();
    }
  }

  /** ControlValueAccessor **/
  protected onChange: ((value: unknown) => void) | undefined;
  protected onTouched: (() => void) | undefined;

  writeValue(value: unknown) {
    this.setValue(value, false);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = () => fn(this.value);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(value: BooleanInput) {
    this.#disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
}
