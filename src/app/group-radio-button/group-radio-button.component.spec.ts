import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupRadioButtonComponent } from './group-radio-button.component';

describe('GroupRadioButtonComponent', () => {
  let component: GroupRadioButtonComponent;
  let fixture: ComponentFixture<GroupRadioButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupRadioButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GroupRadioButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
