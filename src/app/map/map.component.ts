import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import * as d3 from 'd3';
import * as bootstrap from 'bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [GoogleMapsModule, NgxChartsModule, CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  @ViewChild('offcanvasElement', { static: false })
  offcanvasElement!: ElementRef;

  center: google.maps.LatLngLiteral = { lat: 37.7749, lng: -122.4194 }; // Default center
  zoom = 5;

  locations: any[] = [];
  selectedLocation: any;
  metrics: string[] = ['FM', 'cf1', 'TempC', 'RH'];
  selectedMetric: string = this.metrics[0];
  graphData: any[] = [];
  view: [number, number] = [700, 400];

  // Region to Coordinates Mapping
  regionCoordinates: { [region: string]: { lat: number; lng: number } } = {
    alaska: { lat: 64.2008, lng: -149.4937 },
    southeast: { lat: 32.7765, lng: -79.9311 },
    north: { lat: 47.6062, lng: -122.3321 },
    west: { lat: 34.0522, lng: -118.2437 },
  };

  ngOnInit() {
    this.loadData();
  }

  // Load CSV data and process it
  loadData(): void {
    d3.csv('/assets/Dataset123.csv').then((data) => {
      this.processLocations(data);
    });
  }

  processLocations(data: any): void {
    const groupedLocations = new Map<string, any>();

    data.forEach((row: any) => {
      const region = row.region?.toLowerCase();
      if (!region || !this.regionCoordinates[region]) {
        console.warn(`Unknown region: ${region}`);
        return;
      }

      const { lat, lng } = this.regionCoordinates[region];
      const key = `${lat},${lng}`;
      if (!groupedLocations.has(key)) {
        groupedLocations.set(key, {
          lat,
          lng,
          label: region.charAt(0).toUpperCase() + region.slice(1),
          metrics: [],
        });
      }

      const location = groupedLocations.get(key);
      location.metrics.push({
        date: new Date(row.Date),
        FM: +row.FM,
        cf1: +row.cf1,
        TempC: +row.TempC,
        RH: +row.RH,
      });
    });

    this.locations = Array.from(groupedLocations.values());
  }

  openOffCanvas(location: any): void {
    this.selectedLocation = location;
    this.updateGraphData();

    if (this.offcanvasElement) {
      const offCanvas = new bootstrap.Offcanvas(
        this.offcanvasElement.nativeElement
      );
      offCanvas.show();
    }
  }

  updateGraphData(): void {
    if (!this.selectedLocation || !this.selectedMetric) {
      this.graphData = [];
      return;
    }

    this.graphData = [
      {
        name: this.selectedMetric,
        series: this.selectedLocation.metrics.map((metric: any) => ({
          name: metric.date.toLocaleDateString(),
          value: metric[this.selectedMetric],
        })),
      },
    ];
  }

  getMarkerIcon(location: any): google.maps.Icon {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 40;
    canvas.height = 40;

    if (context) {
      // Draw a circle
      context.beginPath();
      context.arc(20, 20, 10, 0, 2 * Math.PI);
      context.fillStyle = '#007BFF'; // Fill color for the circle
      context.fill();

      // Add a border
      context.strokeStyle = '#FFFFFF';
      context.lineWidth = 2;
      context.stroke();
    }

    // Return the canvas as a data URL
    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(40, 40), // Set marker size
    };
  }
}
