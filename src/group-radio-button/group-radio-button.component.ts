import {
    ChangeDetectionStrategy,
    Component,
    DoCheck,
    ElementRef, EventEmitter, HostBinding,
    Inject,
    Input, OnDestroy,
    Optional, Output, Self
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MAT_FORM_FIELD, MatFormField, MatFormFieldControl } from '@angular/material/form-field';
import { MatRadioChange } from '@angular/material/radio';
import { FocusMonitor } from '@angular/cdk/a11y';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GroupRadioButtonItem<T> {
    key: T;
    label: string;
}
interface GroupRadioButtonOption<T> extends GroupRadioButtonItem<T> {
    selected: boolean;
    disabled: boolean;
}
  
@Component({
    selector: 'app-group-radio-button',
    template: `
        <mat-radio-group (change)="selectionChange($event.value)"
                        [disabled]="disabled"
                        class="app-radio-group">
        <mat-radio-button *ngFor="let option of options"
                            [value]="option"
                            [checked]="option.selected"
                            [disabled]="option.disabled || disabled">
            {{option.label}}
        </mat-radio-button>
        </mat-radio-group>
    `,
    styles: [`
        .app-radio-group {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
    `],
    templateUrl: './group-radio-button.component.html',
    styleUrls: ['./group-radio-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatRadioModule],
    providers: [{provide: MatFormFieldControl, useExisting: GroupRadioButtonComponent}]
})
export class GroupRadioButtonComponent
    implements DoCheck, ControlValueAccessor, MatFormFieldControl<GroupRadioButtonItem<any>>, OnDestroy {
    @Input()
    set options(options: GroupRadioButtonItem<any>[]) {
        this.availableSubject.next(options || []);
    }
    private availableSubject = new BehaviorSubject<GroupRadioButtonItem<any>[]>([]);
    private selectionSubject = new BehaviorSubject<GroupRadioButtonItem<any> | null>(null);
    options$: Observable<GroupRadioButtonOption<any>[]>;
  
    @Input()
    get compareWith() {
        return this._compareWith;
    }
    set compareWith(fn: (o1: any, o2: any) => boolean) {
        this._compareWith = fn;
    }
    // Comparison function to specify which option is displayed. Defaults to object's keys equality
    private _compareWith = (o1: GroupRadioButtonItem<any> | null, o2: GroupRadioButtonItem<any>) => o1 != null && o1.key === o2?.key;
  
    constructor(
        private _elementRef: ElementRef<HTMLElement>,
        private fm: FocusMonitor,
        @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
        @Optional() @Self() public ngControl: NgControl
    ) {
        if (this.ngControl != null) {
            this.ngControl.valueAccessor = this;
        }
  
        this.fm.monitor(_elementRef.nativeElement, true).subscribe(origin => {
            this.focused = !!origin;
            this.stateChanges.next();
        });
  
        const available = this.availableSubject.asObservable();
        const selection = this.selectionSubject.asObservable();
        this.options$ = combineLatest([
            selection,
            available
        ]).pipe(
            map(([selection, available]) => this.buildOptions(selection, available))
        );
    }
  
    ngDoCheck(): void {
        if(this.ngControl) {
            this.errorState = (this.ngControl.invalid && this.ngControl.touched) || false;
            this.stateChanges.next();
        }
    }
  
    ngOnDestroy() {
        this.fm.stopMonitoring(this._elementRef.nativeElement);
        this.stateChanges.complete();
    }
  
    selectionChange(event: MatRadioChange) {
        this.value = event.value;
    }
  
    /** MatFormFieldControl **/
    get value(): GroupRadioButtonItem<any> | null {
        return this._value;
    }
    set value(value: GroupRadioButtonItem<any>) {
        this._value = value;
        this.onChange(this._value);
        this.stateChanges.next();
    }
    private _value: GroupRadioButtonItem<any> | null = null;
  
    @Input()
    get placeholder(): string {
        return this._placeholder;
    }
    set placeholder(value: string) {
        this._placeholder = value;
        this.stateChanges.next();
    }
    private _placeholder: string = '';
  
    get empty() {
        return this.value == null;
    }
  
    @Input()
    get required(): boolean {
        return this._required;
    }
    set required(req) {
        this._required = coerceBooleanProperty(req);
        this.stateChanges.next();
    }
    public _required = false;
  
    @Input()
    get disabled(): boolean {
        return this._disabled;
    }
    set disabled(value: BooleanInput) {
        this._disabled = coerceBooleanProperty(value);
        this.stateChanges.next();
    }
    public _disabled = false;
  
    errorState = false;
  
    @HostBinding() id = `app-group-radio-button-${GroupRadioButtonComponent.nextId++}`;
    static nextId = 0;
    @HostBinding('class.floating')
    get shouldLabelFloat() {
        return this.focused || !this.empty;
    }
    focused = false;
    stateChanges = new Subject<void>();
  
    controlType = 'app-group-radio-button';
    @HostBinding('attr.aria-describedby') describedBy = '';
    setDescribedByIds(ids: string[]) {
        this.describedBy = ids.join(' ');
    }
  
    @Output()
    containerClick = new EventEmitter<void>();
    onContainerClick() {
        if (!this.disabled) {
            this.containerClick.emit();
        }
    }
  
    /** ControlValueAccessor **/
    writeValue(value: GroupRadioButtonItem<any>) {
        this.value = value;
        this.selectionSubject.next(value);
    }
    onChange = (_: any) => {};
    registerOnChange(fn: any): void {
        this.onChange = (_: any) => fn(this.value);
    }
    onTouched = () => {};
    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled: boolean) {
        this._disabled = coerceBooleanProperty(isDisabled);
        this.stateChanges.next();
    }
  
    /** Private functions **/
    private buildOptions(selection: GroupRadioButtonItem<any> | null, available: GroupRadioButtonItem<any>[]): GroupRadioButtonOption<any>[] {
        // Mix all the active Options and those already selected (some are probably inactive)
        // Distinct all the values to remove the duplicates
        return this.distinct(
            [...available, ...(selection != null ? [selection] : [])],
            (a, b) => this._compareWith(a, b)
        ).map((option) => ({
            ...option,
            selected: this._compareWith(selection, option),
            disabled: !available?.some((o) => this._compareWith(o, option)) ?? false
        }));
    }

    private distinct<T>(collection: T[], comparerFn?: (a: T, b: T) => boolean): T[] {
        return collection.reduce<T[]>((previousValue, curentValue) =>
            previousValue.findIndex((item) =>
              comparerFn
               ? comparerFn(item, curentValue)
               : item === curentValue
            ) >= 0
              ? previousValue
              : [...previousValue, curentValue]
        , [])
    }
}
  