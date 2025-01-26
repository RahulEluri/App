import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map/map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'App';

  // List of places
  places: { name: string; region: string }[] = [
    { name: 'Alaska', region: 'alaska' },
    { name: 'Southeast', region: 'southeast' },
    { name: 'North', region: 'north' },
    { name: 'West', region: 'west' },
  ];

  @ViewChild(MapComponent) mapComponent!: MapComponent;
  selectedPlace: string | null = null;

  // Function to handle place selection
  selectPlace(place: { name: string; region: string }): void {
    this.selectedPlace = place.region;
    if (this.mapComponent) {
      this.mapComponent.openOffCanvasByRegion(place.region);
    }
  }
}
