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

      // Safely parse and add metrics
      const parsedMetrics = {
        date: new Date(row.Date),
        FM: this.safeParseNumber(row.FM),
        cf1: this.safeParseNumber(row.cf1),
        TempC: this.safeParseNumber(row.TempC),
        RH: this.safeParseNumber(row.RH),
      };

      location.metrics.push(parsedMetrics);
    });

    this.locations = Array.from(groupedLocations.values());
  }

  // Utility to safely parse numbers
  safeParseNumber(value: any): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed; // Default to 0 if parsing fails
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

  openOffCanvasByRegion(region: string): void {
    const location = this.locations.find(
      (loc) => loc.label.toLowerCase() === region.toLowerCase()
    );
    if (location) {
      this.openOffCanvas(location);
    } else {
      console.warn(`Region ${region} not found.`);
    }
  }

  updateGraphData(): void {
    if (!this.selectedLocation || !this.selectedMetric) {
      this.graphData = [];
      return;
    }

    // Group metrics by month
    const monthlyData = this.selectedLocation.metrics.reduce(
      (acc: any, metric: any) => {
        const monthKey = `${metric.date.getFullYear()}-${
          metric.date.getMonth() + 1
        }`;
        if (!acc[monthKey]) {
          acc[monthKey] = { total: 0, count: 0 };
        }

        const value = metric[this.selectedMetric];

        // Only include valid numbers
        if (value !== undefined && !isNaN(value)) {
          acc[monthKey].total += value;
          acc[monthKey].count += 1;
        }

        return acc;
      },
      {}
    );

    // Calculate the average for each month
    const averagedData = Object.entries(monthlyData).map(
      ([key, value]: [string, any]) => {
        const [year, month] = key.split('-');
        return {
          name: `${year}-${month.padStart(2, '0')}`, // Format as YYYY-MM
          value: value.count > 0 ? value.total / value.count : 0, // Avoid division by zero
        };
      }
    );

    // Sort data by date (optional)
    averagedData.sort(
      (a: any, b: any) =>
        new Date(a.name).getTime() - new Date(b.name).getTime()
    );

    // Update graph data
    this.graphData = [
      {
        name: this.selectedMetric,
        series: averagedData,
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
