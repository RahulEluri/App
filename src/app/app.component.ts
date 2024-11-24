import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './map/map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MapComponent],
  template: `<app-map></app-map>`,
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'App';
}
